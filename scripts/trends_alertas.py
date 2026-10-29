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
(o cálculo é determinístico a partir de trends_calibrados + trends_pontos) — desde 15/10/2026
numa só transacção, pela função gravar_alertas_lote: tudo ou nada.

EMPATES (14/10/2026, docs/sessoes/2026-10-11.md §3.5 e §4.1): as decisões correm sobre os
valores BRUTOS inteiros do pedido, em fracções exactas — "≥ 1,5" e "≥ 3" contam o igual, como
a regra diz. Antes corriam sobre o valor na régua do eixo em vírgula flutuante, e um empate
exacto (12 contra 8 = 1,5) decidia-se pelo último algarismo. A regra é invariante à escala
dentro de um termo, por isso decidir nos brutos dá a decisão da régua do eixo. O factor só
entra depois, nos números que se gravam e mostram.
"""
import argparse, json, os, statistics as st, sys, urllib.request
from collections import defaultdict
from datetime import date
from fractions import Fraction as F

# ---- parâmetros (docs/metodo/2026-09-18-alertas-regra.md, secções 3 e 7) ---------------
# Como fracções exactas desde 14/10/2026; os valores são os de 18/09.
N_REF         = 8      # semanas completas de referência
MIN_COM_DADOS = 6      # das N_REF, quantas > 0 para o termo ter "procura regular"
PISO_ABS      = F(2)          # pontos na régua do PEDIDO (amostragem do Google: dif. média 1,9)
PISO_REL      = F(1, 10)      # ou 10 % da referência
Z_MIN         = F(3)          # alerta
Z_OBS         = F(2)          # "a observar"
RAZAO_MIN     = F(3, 2)
TOL_SAZONAL   = F(5, 4)
RAW_MIN       = F(20)         # aparecimento: acima do piscar (10–19) na régua do pedido
MULT_APAREC   = F(2)          # aparecimento: contra o máximo das 52 semanas anteriores
K_MAD         = F('1.4826')
# 29/10/2026 (decisão da Marta, docs/sessoes/2026-10-29-cowork.md §16–§17; simulação em
# docs/evidencia/2026-10-29-creatina/simulacao.md): um acontecimento em curso há MAIS de
# N_TEND semanas deixa de ser alerta e passa a "tendência". Em 5 anos do lote 2d0a7be3, 148
# dos 151 acontecimentos duram ≤ 15 semanas; os outros 3 duram 31, 39 e 251.
N_TEND        = 26
# ----------------------------------------------------------------------------------------

class SerieAmbigua(Exception):
    """A série de um termo não tem um só pedido e um só factor nas semanas do lote. A função
    única aborta em vez de escolher (2026-10-11.md §4.1 b). É uma Exception, não um
    sys.exit: o passo 7 do script 5 apanha-a e o lote fica gravado."""

def mad(xs, m): return st.median(abs(x - m) for x in xs)

def avalia(vals, i, historico=None):
    """vals: [(data, bruto)] ordenado, sem a semana parcial, com os brutos INTEIROS do pedido
    (ou Fraction); i: a semana avaliada; historico: a série inteira do termo no lote (para a
    sazonalidade). Tudo na régua do pedido e em aritmética exacta. Devolve um dicionário ou None."""
    if i < N_REF: return None
    x = F(vals[i][1]); ref_vals = [F(v) for _, v in vals[i-N_REF:i]]
    com_dados = sum(1 for v in ref_vals if v > 0); ref = st.median(ref_vals)
    elegivel = com_dados >= MIN_COM_DADOS and ref > 0
    ruido = max(K_MAD * mad(ref_vals, ref), PISO_ABS, PISO_REL * ref)
    z = (x - ref) / ruido if ref > 0 else F(0)
    razao = x / ref if ref > 0 else F(0)
    fator = None
    if historico and elegivel:
        d = vals[i][0]; datas = [h[0] for h in historico]; vh = [h[1] for h in historico]
        j = datas.index(d) if d in datas else -1; fatores = []
        for anos in (1, 2, 3, 4):
            k = j - 52 * anos
            if j < 0 or k - N_REF < 0: break
            base_vals = [F(v) for v in vh[k-N_REF:k]]; base = st.median(base_vals)
            if base > 0 and sum(1 for v in base_vals if v > 0) >= MIN_COM_DADOS:
                fatores.append(F(max(vh[m] for m in (k-1, k, k+1))) / base)
        if fatores: fator = st.median(fatores)
    esperado = ref * fator if fator else None
    sazonal = esperado is not None and fator >= RAZAO_MIN and x <= esperado * TOL_SAZONAL
    subida = elegivel and z >= Z_MIN and razao >= RAZAO_MIN
    raw = x; prev = [F(v) for _, v in vals[max(0, i-52):i]]; max52 = max(prev)
    aparecimento = (not elegivel) and raw >= RAW_MIN and x >= MULT_APAREC * max(max52, F(1, 10**9))
    return dict(x=x, ref=ref, ruido=ruido, z=z, razao=razao, fator=fator, sazonal=sazonal,
                elegivel=elegivel, subida=subida, aparecimento=aparecimento, raw=raw, max52=max52)

def alertas_do_termo(vals, fac):
    """Percorre a série completa de um termo (brutos do pedido) e devolve as linhas de
    trends_alertas (sem lote/eixo/termo), com os números na régua do eixo (× fac) e em float.
    As decisões ficam todas na régua do pedido, exactas. O "em curso" sai daqui: um acontecimento começa num disparo e continua
    — subida: enquanto o valor se mantiver ≥ RAZAO_MIN × a referência de antes do 1.º disparo;
    — aparecimento: enquanto ficar ≥ RAW_MIN na régua do pedido E o termo ainda não tiver
      procura regular (quando passa a ter, deixou de ser "normalmente sem procura" e é a
      regra de subida que o julga daí em diante).
    A referência E o ruído ficam congelados nos de antes do 1.º disparo, para `z` gravado ser
    sempre (valor − referência) / ruído, como a coluna diz.

    TENDÊNCIA (29/10/2026): um acontecimento que continuaria para lá de N_TEND semanas passa a
    `tendencia` — "tendência de subida desde <início>", sem bandeira. Nessa semana o termo volta
    a ser avaliado pela regra normal, contra a mediana das 8 semanas anteriores, que já é o
    patamar novo: uma subida acima dele abre um alerta novo ("1.ª semana"). Uma linha por semana:
    o alerta (subida ou aparecimento) primeiro, depois a tendência, só depois sazonal e a
    observar. A tendência acaba quando o valor desce abaixo de RAZAO_MIN × a referência de
    antes (a congelada do acontecimento) — o termo voltou ao nível antigo. A linha da tendência
    grava essa referência antiga, a razão contra ela, a idade desde o início e z nulo (não é
    alerta)."""
    fe = F(fac)
    def eixo(v): return None if v is None else float(v * fe)      # régua do eixo, para gravar
    def num(v): return None if v is None else float(v)            # razão, z, factor sazonal
    linhas = []; curso = None   # curso = dict(tipo, inicio, ref, ruido, n)
    tend = None                 # tend = dict(inicio, ref, ruido, n), desde 29/10/2026
    for i in range(N_REF, len(vals)):
        r = avalia(vals, i, vals); d = vals[i][0]; x = r['x']
        if tend:
            if (x >= RAZAO_MIN * tend['ref']) if tend['ref'] > 0 else (r['raw'] >= RAW_MIN):
                tend['n'] += 1
            else:
                tend = None
        if curso:
            if curso['tipo'] == 'subida':
                continua = x >= RAZAO_MIN * curso['ref']
            else:
                continua = r['raw'] >= RAW_MIN and not r['elegivel']
            if continua and curso['n'] + 1 > N_TEND:
                # dura demais: deixa de ser alerta; esta semana avalia-se de novo, contra o patamar novo
                tend = dict(inicio=curso['inicio'], ref=curso['ref'], ruido=curso['ruido'], n=curso['n'] + 1)
                curso = None; continua = False
            if continua:
                curso['n'] += 1
                linhas.append(dict(semana=d, tipo=curso['tipo'], valor=eixo(x), referencia=eixo(curso['ref']),
                                   razao=num(x / curso['ref'] if curso['ref'] > 0 else F(0)),
                                   z=num((x - curso['ref']) / curso['ruido']) if curso['tipo'] == 'subida' else None,
                                   ruido=eixo(curso['ruido']),
                                   fator_sazonal=num(r['fator']), max_anterior=eixo(r['max52']) if curso['tipo'] == 'aparecimento' else None,
                                   semana_n=curso['n'], inicio=curso['inicio']))
                continue
            curso = None
        base = dict(semana=d, valor=eixo(x), referencia=eixo(r['ref']), razao=num(r['razao']),
                    ruido=eixo(r['ruido']), semana_n=1, inicio=d)
        if r['subida'] and not r['sazonal']:
            curso = dict(tipo='subida', inicio=d, ref=r['ref'], ruido=r['ruido'], n=1)
            linhas.append(dict(base, tipo='subida', z=num(r['z']), fator_sazonal=num(r['fator']), max_anterior=None))
        elif r['aparecimento']:
            curso = dict(tipo='aparecimento', inicio=d, ref=r['ref'], ruido=r['ruido'], n=1)
            linhas.append(dict(base, tipo='aparecimento', z=None, fator_sazonal=None, max_anterior=eixo(r['max52'])))
        elif tend:
            linhas.append(dict(semana=d, tipo='tendencia', valor=eixo(x), referencia=eixo(tend['ref']),
                               razao=num(x / tend['ref'] if tend['ref'] > 0 else F(0)), z=None,
                               ruido=eixo(tend['ruido']), fator_sazonal=num(r['fator']), max_anterior=None,
                               semana_n=tend['n'], inicio=tend['inicio']))
        elif r['subida'] and r['sazonal']:
            linhas.append(dict(base, tipo='sazonal', z=num(r['z']), fator_sazonal=num(r['fator']), max_anterior=None))
        elif r['elegivel'] and r['z'] >= Z_OBS:
            linhas.append(dict(base, tipo='a_observar', z=num(r['z']), fator_sazonal=num(r['fator']), max_anterior=None))
    return linhas

def series_brutas(linhas):
    """A FUNÇÃO ÚNICA da série (14/10/2026, 2026-10-11.md §4.1 b). O passo 7 do script 5 e o
    --lote daqui chamam-na com os mesmos dados — os brutos inteiros do pedido escolhido pela
    deduplicação: o passo 7 tira-os da memória, o --lote de trends_pontos pelo pedido_id de
    trends_calibrados.
    linhas: dicts com eixo, termo, data ('AAAA-MM-DD'), pedido_id, factor, valor (bruto inteiro)
    e parcial (o is_partial DESSE ponto, no pedido escolhido).
    Devolve ({(eixo, termo): {data: bruto}} sem as semanas parciais, {(eixo, termo): factor}).
    Aborta com SerieAmbigua se um (eixo, termo) tiver mais de um pedido_id ou mais de um
    factor, ou uma data repetida, ou um bruto que não seja inteiro."""
    series, factor, pedido, vistas = defaultdict(dict), {}, {}, set()
    for l in linhas:
        k, d, v = (l['eixo'], l['termo']), l['data'], l['valor']
        if pedido.setdefault(k, l['pedido_id']) != l['pedido_id']:
            raise SerieAmbigua('%s/%s: mais de um pedido_id nas semanas do lote (%s, %s)' % (k + (pedido[k], l['pedido_id'])))
        if factor.setdefault(k, l['factor']) != l['factor']:
            raise SerieAmbigua('%s/%s: mais de um factor nas semanas do lote (%s, %s)' % (k + (factor[k], l['factor'])))
        if isinstance(v, bool) or not isinstance(v, int):
            raise SerieAmbigua('%s/%s %s: bruto não inteiro (%r)' % (k + (d, v)))
        if (k, d) in vistas:
            raise SerieAmbigua('%s/%s: a data %s aparece duas vezes' % (k + (d,)))
        vistas.add((k, d))
        if not l['parcial']: series[k][d] = v
    return dict(series), factor

def calcula(series, factor):
    """series: {(eixo, termo): {data: bruto}} SEM a semana parcial (de series_brutas);
    factor: {(eixo, termo): f}. Devolve as linhas para trends_alertas (sem lote_id)."""
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

def linhas_do_lote(url, key, lote_id):
    """As linhas da series_brutas, pela base: trends_calibrados diz que pedido e que factor
    ficaram para cada (eixo, termo, data); o bruto e o is_partial vêm de trends_pontos desse
    pedido. Confere que bruto × factor dá o valor_eixo gravado (só o arredondamento a 3 casas
    os separa); se não der, a junção está errada e aborta."""
    cal = rest(url, key, f'trends_calibrados?select=eixo,termo,data,valor_eixo,factor,pedido_id&lote_id=eq.{lote_id}&order=eixo,termo,data')
    ids = sorted({c['pedido_id'] for c in cal})
    pontos = {}
    for i in range(0, len(ids), 20):
        for p in rest(url, key, 'trends_pontos?select=pedido_id,termo,data,valor,is_partial'
                                f'&pedido_id=in.({",".join(ids[i:i+20])})&order=pedido_id,termo,data'):
            pontos[(p['pedido_id'], p['termo'], p['data'][:10])] = p
    out = []
    for c in cal:
        d = c['data'][:10]; p = pontos.get((c['pedido_id'], c['termo'], d))
        if p is None:
            raise SerieAmbigua('%s/%s %s: sem ponto em trends_pontos para o pedido %s' % (c['eixo'], c['termo'], d, c['pedido_id']))
        if p['valor'] is not None and abs(p['valor'] * float(c['factor']) - float(c['valor_eixo'])) > 1e-3:
            raise SerieAmbigua('%s/%s %s: bruto %s × factor %s ≠ valor_eixo %s' % (
                c['eixo'], c['termo'], d, p['valor'], c['factor'], c['valor_eixo']))
        out.append(dict(eixo=c['eixo'], termo=c['termo'], data=d, pedido_id=c['pedido_id'],
                        factor=float(c['factor']), valor=p['valor'], parcial=p['is_partial']))
    return out

def series_do_lote(url, key, lote_id):
    """{(eixo, termo): {data: bruto}} sem a semana parcial, e os factores — pela função única."""
    return series_brutas(linhas_do_lote(url, key, lote_id))

def chave_service_role():
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if key: return key
    cfg = os.path.expanduser('~/.config/health-pulse/env')
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith('SUPABASE_SERVICE_ROLE_KEY='): return l.split('=', 1)[1].strip().strip('"')
    sys.exit('ERRO: falta SUPABASE_SERVICE_ROLE_KEY — no ambiente ou em ~/.config/health-pulse/env.')

def gravar(url, key, lote_id, linhas):
    """Substitui as linhas deste lote, TUDO OU NADA (15/10/2026, docs/sessoes/2026-10-15.md §1):
    um só pedido à função gravar_alertas_lote, que apaga e escreve numa transacção. Antes eram
    um DELETE e blocos de 500, cada um com o seu commit, e uma falha de rede a meio deixava o
    lote vazio ou parcial (14/10, 2026-10-14.md §10). Se este pedido falhar, o lote ficou como
    estava OU novo inteiro (se a resposta se perdeu depois do commit) — nunca a meio: ler a
    contagem e o calculado_em antes de repetir. A lista vazia é recusada (aqui e na função).
    Devolve o n.º de linhas."""
    if not linhas:
        raise ValueError('gravar: lista vazia recusada — não apaga os alertas do lote sem escrever nada')
    rows = [{k: (round(v, 3) if isinstance(v, float) else v) for k, v in l.items()} for l in linhas]
    n = rest(url, key, 'rpc/gravar_alertas_lote', 'POST', dict(p_lote_id=lote_id, p_linhas=rows))
    if n != len(rows):
        raise RuntimeError(f'gravar: a função devolveu {n!r}, esperado {len(rows)}')
    return n

def frase(l):
    """A linha do ecrã, na formulação da Marta (decisão 5)."""
    if l['tipo'] == 'tendencia':
        return (f"{l['termo']} — tendência de subida desde {l['inicio']} · {l['valor']:.1f} "
                f"(o valor normal antes era {l['referencia']:.1f})")
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
        try:
            n = gravar(url, chave_service_role(), lote['id'], linhas)
        except Exception as e:
            sys.exit(f'\nERRO NA GRAVAÇÃO ({type(e).__name__}: {str(e)[:200]}). O lote {lote["id"][:8]} ficou '
                     'como estava OU com as linhas novas inteiras, nunca a meio. Ler a contagem e o '
                     'calculado_em em trends_alertas ANTES de repetir.')
        print(f'\nGRAVADO: {n} linhas em trends_alertas para o lote {lote["id"][:8]}')

if __name__ == '__main__':
    main()
