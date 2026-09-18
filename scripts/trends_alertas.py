#!/usr/bin/env python3
"""
trends_alertas.py — a regra dos alertas (fase 3), calculada sobre um lote
=========================================================================
Regra e decisões: docs/metodo/2026-09-18-alertas-regra.md (18/09/2026). Os parâmetros
abaixo foram fixados nesse dia; mudam-se com registo e data, nunca à vista de uma semana.

Usado de duas maneiras:
  • pelo scripts/5_fetch_google_trends.py, no fim de cada lote gravado;
  • sozinho, sobre um lote que já existe:
      python3 scripts/trends_alertas.py --lote <id ou prefixo>            # calcula e mostra
      python3 scripts/trends_alertas.py --lote <id ou prefixo> --gravar   # e grava (service_role)

Lê com a chave pública; grava só com --gravar. Apaga e reescreve as linhas do lote
(o cálculo é determinístico a partir de trends_calibrados + is_partial).
"""
import argparse, json, os, statistics as st, sys, urllib.request
from collections import defaultdict
from datetime import date

# ---- parâmetros (docs/metodo/2026-09-18-alertas-regra.md, secções 3 e 7) ---------------
N_REF         = 8      # semanas completas de referência
MIN_COM_DADOS = 6      # das N_REF, quantas > 0 para o termo ter "procura regular"
PISO_ABS      = 2.0    # pontos na régua do PEDIDO (amostragem do Google: dif. média 1,9)
PISO_REL      = 0.10   # ou 10 % da referência
Z_MIN         = 3.0    # alerta
Z_OBS         = 2.0    # "a observar"
RAZAO_MIN     = 1.5
TOL_SAZONAL   = 1.25
RAW_MIN       = 20.0   # aparecimento: acima do piscar (10–19) na régua do pedido
MULT_APAREC   = 2.0    # aparecimento: contra o máximo das 52 semanas anteriores
# ----------------------------------------------------------------------------------------

def mad(xs, m): return st.median(abs(x - m) for x in xs)

def avalia(vals, i, fac, historico=None):
    """vals: [(data, valor_eixo)] ordenado, sem a semana parcial; i: a semana avaliada;
    fac: factor de calibração do termo (valor_eixo = valor * fac); historico: a série
    inteira do termo no lote (para a sazonalidade). Devolve um dicionário ou None."""
    if i < N_REF: return None
    x = vals[i][1]; ref_vals = [v for _, v in vals[i-N_REF:i]]
    com_dados = sum(1 for v in ref_vals if v > 0); ref = st.median(ref_vals)
    elegivel = com_dados >= MIN_COM_DADOS and ref > 0
    ruido = max(1.4826 * mad(ref_vals, ref), PISO_ABS * fac, PISO_REL * ref)
    z = (x - ref) / ruido if ref > 0 else 0.0
    razao = x / ref if ref > 0 else 0.0
    fator = None
    if historico and elegivel:
        d = vals[i][0]; datas = [h[0] for h in historico]; vh = [h[1] for h in historico]
        j = datas.index(d) if d in datas else -1; fatores = []
        for anos in (1, 2, 3, 4):
            k = j - 52 * anos
            if j < 0 or k - N_REF < 0: break
            base_vals = vh[k-N_REF:k]; base = st.median(base_vals)
            if base > 0 and sum(1 for v in base_vals if v > 0) >= MIN_COM_DADOS:
                fatores.append(max(vh[m] for m in (k-1, k, k+1)) / base)
        if fatores: fator = st.median(fatores)
    esperado = ref * fator if fator else None
    sazonal = esperado is not None and fator >= RAZAO_MIN and x <= esperado * TOL_SAZONAL
    subida = elegivel and z >= Z_MIN and razao >= RAZAO_MIN
    raw = x / fac; prev = [v for _, v in vals[max(0, i-52):i]]; max52 = max(prev)
    aparecimento = (not elegivel) and raw >= RAW_MIN and x >= MULT_APAREC * max(max52, 1e-9)
    return dict(x=x, ref=ref, ruido=ruido, z=z, razao=razao, fator=fator, sazonal=sazonal,
                elegivel=elegivel, subida=subida, aparecimento=aparecimento, raw=raw, max52=max52)

def alertas_do_termo(vals, fac):
    """Percorre a série completa de um termo e devolve as linhas de trends_alertas (sem
    lote/eixo/termo). O "em curso" sai daqui: um acontecimento começa num disparo e continua
    — subida: enquanto o valor se mantiver ≥ RAZAO_MIN × a referência de antes do 1.º disparo;
    — aparecimento: enquanto ficar ≥ RAW_MIN na régua do pedido E o termo ainda não tiver
      procura regular (quando passa a ter, deixou de ser "normalmente sem procura" e é a
      regra de subida que o julga daí em diante).
    A referência E o ruído ficam congelados nos de antes do 1.º disparo, para `z` gravado ser
    sempre (valor − referência) / ruído, como a coluna diz."""
    linhas = []; curso = None   # curso = dict(tipo, inicio, ref, ruido, n)
    for i in range(N_REF, len(vals)):
        r = avalia(vals, i, fac, vals); d = vals[i][0]; x = r['x']
        if curso:
            if curso['tipo'] == 'subida':
                continua = x >= RAZAO_MIN * curso['ref']
            else:
                continua = r['raw'] >= RAW_MIN and not r['elegivel']
            if continua:
                curso['n'] += 1
                linhas.append(dict(semana=d, tipo=curso['tipo'], valor=x, referencia=curso['ref'],
                                   razao=x / curso['ref'] if curso['ref'] > 0 else 0.0,
                                   z=(x - curso['ref']) / curso['ruido'] if curso['tipo'] == 'subida' else None,
                                   ruido=curso['ruido'],
                                   fator_sazonal=r['fator'], max_anterior=r['max52'] if curso['tipo'] == 'aparecimento' else None,
                                   semana_n=curso['n'], inicio=curso['inicio']))
                continue
            curso = None
        if r['subida'] and not r['sazonal']:
            curso = dict(tipo='subida', inicio=d, ref=r['ref'], ruido=r['ruido'], n=1)
            linhas.append(dict(semana=d, tipo='subida', valor=x, referencia=r['ref'], razao=r['razao'], z=r['z'],
                               ruido=r['ruido'], fator_sazonal=r['fator'], max_anterior=None, semana_n=1, inicio=d))
        elif r['aparecimento']:
            curso = dict(tipo='aparecimento', inicio=d, ref=r['ref'], ruido=r['ruido'], n=1)
            linhas.append(dict(semana=d, tipo='aparecimento', valor=x, referencia=r['ref'], razao=r['razao'], z=None,
                               ruido=r['ruido'], fator_sazonal=None, max_anterior=r['max52'], semana_n=1, inicio=d))
        elif r['subida'] and r['sazonal']:
            linhas.append(dict(semana=d, tipo='sazonal', valor=x, referencia=r['ref'], razao=r['razao'], z=r['z'],
                               ruido=r['ruido'], fator_sazonal=r['fator'], max_anterior=None, semana_n=1, inicio=d))
        elif r['elegivel'] and r['z'] >= Z_OBS:
            linhas.append(dict(semana=d, tipo='a_observar', valor=x, referencia=r['ref'], razao=r['razao'], z=r['z'],
                               ruido=r['ruido'], fator_sazonal=r['fator'], max_anterior=None, semana_n=1, inicio=d))
    return linhas

def calcula(series, factor):
    """series: {(eixo, termo): {data: valor_eixo}} SEM a semana parcial; factor: {(eixo, termo): f}.
    Devolve as linhas para trends_alertas (sem lote_id)."""
    out = []
    for (eixo, termo), s in series.items():
        vals = sorted(s.items())
        for l in alertas_do_termo(vals, factor[(eixo, termo)]):
            out.append(dict(eixo=eixo, termo=termo, **l))
    return out

# ---- ligação à base (para correr sozinho) ---------------------------------------------
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def env_publico():
    d = {}
    for l in open(os.path.join(RAIZ, '.env')):
        if '=' in l and not l.startswith('#'):
            k, v = l.strip().split('=', 1); d[k] = v.strip().strip('"').strip("'")
    return d['VITE_SUPABASE_URL'], d['VITE_SUPABASE_PUBLISHABLE_KEY']

def rest(url, key, path, method='GET', body=None, pagesize=1000):
    if method != 'GET':
        req = urllib.request.Request(url + '/rest/v1/' + path, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as r:
            txt = r.read().decode(); return json.loads(txt) if txt else None
    out, start = [], 0
    while True:
        req = urllib.request.Request(url + '/rest/v1/' + path, headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                                     'Range': f'{start}-{start+pagesize-1}', 'Range-Unit': 'items'})
        chunk = json.load(urllib.request.urlopen(req)); out += chunk
        if len(chunk) < pagesize: return out
        start += pagesize

def series_do_lote(url, key, lote_id):
    """{(eixo, termo): {data: valor_eixo}} sem a semana parcial, e os factores."""
    parciais = {(p['pedido_id'], p['termo'], p['data'][:10])
                for p in rest(url, key, 'trends_pontos?select=pedido_id,termo,data&is_partial=eq.true')}
    cal = rest(url, key, f'trends_calibrados?select=eixo,termo,data,valor_eixo,factor,pedido_id&lote_id=eq.{lote_id}&order=eixo,termo,data')
    series, factor = defaultdict(dict), {}
    for c in cal:
        d = c['data'][:10]
        if (c['pedido_id'], c['termo'], d) in parciais: continue
        k = (c['eixo'], c['termo']); series[k][d] = float(c['valor_eixo']); factor[k] = float(c['factor'])
    return series, factor

def chave_service_role():
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if key: return key
    cfg = os.path.expanduser('~/.config/health-pulse/env')
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith('SUPABASE_SERVICE_ROLE_KEY='): return l.split('=', 1)[1].strip().strip('"')
    sys.exit('ERRO: falta SUPABASE_SERVICE_ROLE_KEY — no ambiente ou em ~/.config/health-pulse/env.')

def gravar(url, key, lote_id, linhas):
    """Apaga o que houver deste lote e escreve de novo. Devolve o n.º de linhas."""
    rest(url, key, f'trends_alertas?lote_id=eq.{lote_id}', 'DELETE')
    rows = [dict(lote_id=lote_id, **{k: (round(v, 3) if isinstance(v, float) else v) for k, v in l.items()}) for l in linhas]
    for i in range(0, len(rows), 500): rest(url, key, 'trends_alertas', 'POST', rows[i:i+500])
    return len(rows)

def frase(l):
    """A linha do ecrã, na formulação da Marta (decisão 5)."""
    if l['tipo'] == 'aparecimento':
        s = f"{l['termo']} {l['valor']:.0f} — apareceu; normalmente sem procura (máx. anterior {l['max_anterior']:.0f})"
    else:
        s = f"{l['termo']} {l['valor']:.0f} — {l['razao']:.1f} vezes acima do valor normal ({l['referencia']:.0f})"
        if l['tipo'] == 'sazonal': s += f" — sazonal: nesta época é habitual (×{l['fator_sazonal']:.1f})"
        if l['tipo'] == 'a_observar': s += " (a observar)"
    if l['semana_n'] > 1: s += f" — em curso, {l['semana_n']}.ª semana"
    return s

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lote', required=True, help='id do lote (ou prefixo)')
    ap.add_argument('--gravar', action='store_true')
    ap.add_argument('--semana', help='mostrar só esta semana (AAAA-MM-DD); por omissão, a última completa')
    args = ap.parse_args()
    url, anon = env_publico()
    lotes = [l for l in rest(url, anon, 'trends_lotes?select=id,estado,iniciado_em,n_pedidos') if l['id'].startswith(args.lote)]
    if len(lotes) != 1: sys.exit(f'ERRO: {len(lotes)} lotes começam por {args.lote}')
    lote = lotes[0]; series, factor = series_do_lote(url, anon, lote['id'])
    linhas = calcula(series, factor)
    ultima = max(d for s in series.values() for d in s)
    semana = args.semana or ultima
    tipos = defaultdict(int)
    for l in linhas: tipos[l['tipo']] += 1
    print(f"lote {lote['id'][:8]} ({lote['estado']}, {lote['n_pedidos']} pedidos): {len(series)} termos, "
          f"última semana completa {ultima} · linhas: {dict(tipos)}")
    print(f"\n{semana}:")
    for l in sorted([l for l in linhas if l['semana'] == semana], key=lambda l: (l['eixo'], -l['razao'])):
        print(f"  {l['eixo']:13s} [{l['tipo']:12s}] {frase(l)}")
    if not any(l['semana'] == semana for l in linhas): print('  (nada)')
    if args.gravar:
        n = gravar(url, chave_service_role(), lote['id'], linhas)
        print(f'\nGRAVADO: {n} linhas em trends_alertas para o lote {lote["id"][:8]}')

if __name__ == '__main__':
    main()
