#!/usr/bin/env python3
"""
TESTE 5 — A REGRA DOS ALERTAS, CORRIDA SOBRE OS LOTES QUE EXISTEM
=================================================================
Escrito a 18/09/2026 (sessão 16). Lê `trends_calibrados` com a chave pública do `.env`
(a mesma do site), NÃO escreve nada, NÃO pede nada ao Google.

A regra está em `docs/metodo/2026-09-18-alertas-regra.md`. Os parâmetros abaixo foram
FIXADOS nesse dia, depois de dois ensaios sobre o lote de 5 anos (a primeira versão, sem
elegibilidade, disparava 538 vezes em 253 semanas — o registo está no documento). Logo isto
NÃO é um teste cego da regra: é a regra calibrada nestes dados. O teste cego é o que as
semanas seguintes fizerem, e é para isso que o script fica: correr de novo em cada lote.

COMO CORRER
  python3 scripts/testes/teste_5_alertas.py            # resumo + lista de disparos (lote de 5 anos)
  python3 scripts/testes/teste_5_alertas.py ultima     # a última semana completa, nos dois lotes
  python3 scripts/testes/teste_5_alertas.py varre      # a sensibilidade aos parâmetros
"""
import collections, json, os, statistics as st, sys, urllib.request

# ---- parâmetros da regra (fixados a 18/09/2026) ------------------------------------
N_REF         = 8      # semanas completas de referência, antes da semana avaliada
MIN_COM_DADOS = 6      # das N_REF, quantas têm de ser > 0 para o termo ser elegível (subida)
PISO_ABS      = 2.0    # pontos na régua do PEDIDO (a diferença pytrends vs manual foi 1,9)
PISO_REL      = 0.10   # ou 10% da referência, o que for maior
Z_MIN         = 3.0    # (x − referência) / ruído
RAZAO_MIN     = 1.5    # x / referência
TOL_SAZONAL   = 1.25   # se x ≤ esperado sazonal × 1,25, é sazonal, não alerta
RAW_MIN       = 20.0   # aparecimento: valor na régua do pedido acima do "piscar" do Google (10–19)
MULT_APAREC   = 2.0    # aparecimento: contra o máximo das 52 semanas anteriores
# --------------------------------------------------------------------------------------

def env():
    d = {}
    for l in open(os.path.join(os.path.dirname(__file__), '..', '..', '.env')):
        if '=' in l and not l.startswith('#'):
            k, v = l.strip().split('=', 1); d[k] = v.strip().strip('"').strip("'")
    return d['VITE_SUPABASE_URL'], d['VITE_SUPABASE_PUBLISHABLE_KEY']

def get(url, key, path, pagesize=1000):
    out, start = [], 0
    while True:
        req = urllib.request.Request(f"{url}/rest/v1/{path}", headers={
            "apikey": key, "Authorization": f"Bearer {key}",
            "Range": f"{start}-{start+pagesize-1}", "Range-Unit": "items"})
        chunk = json.load(urllib.request.urlopen(req)); out += chunk
        if len(chunk) < pagesize: return out
        start += pagesize

def carrega():
    url, key = env()
    lotes = {l['id']: l for l in get(url, key, "trends_lotes?select=*")}
    parciais = {(p['pedido_id'], p['termo'], p['data'][:10])
                for p in get(url, key, "trends_pontos?select=pedido_id,termo,data&is_partial=eq.true")}
    cal = get(url, key, "trends_calibrados?select=lote_id,eixo,termo,data,valor_eixo,factor,pedido_id&order=lote_id,eixo,termo,data")
    series, factor, n_parc = collections.defaultdict(dict), {}, 0
    for c in cal:
        d = c['data'][:10]
        if (c['pedido_id'], c['termo'], d) in parciais: n_parc += 1; continue   # a semana parcial nunca entra
        k = (c['lote_id'], c['eixo'], c['termo']); series[k][d] = float(c['valor_eixo']); factor[k] = float(c['factor'])
    return lotes, series, factor, n_parc

def mad(xs, m): return st.median(abs(x - m) for x in xs)

def avalia(vals, i, fac, historico=None):
    """vals: [(data, valor)] ordenado; i: a semana avaliada; historico: a série de 5 anos do termo."""
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
    raw = x / fac; prev = [v for _, v in vals[max(0, i-52):i]]
    aparecimento = (not elegivel) and raw >= RAW_MIN and x >= MULT_APAREC * max(max(prev), 1e-9)
    return dict(x=x, ref=ref, ruido=ruido, z=z, razao=razao, fator=fator, sazonal=sazonal,
                elegivel=elegivel, subida=subida, aparecimento=aparecimento, raw=raw, max52=max(prev))

def fmt(d, eixo, termo, r):
    tipo = ('APARECIMENTO' if r['aparecimento'] else 'sazonal     ' if r['sazonal']
            else 'SUBIDA      ' if r['subida'] else 'a observar  ')
    f = f"{r['fator']:.1f}" if r['fator'] else ' — '
    return (f"{d} {tipo} {eixo:13s} {termo:34s} x={r['x']:6.1f} ref={r['ref']:6.1f} "
            f"ruído={r['ruido']:5.1f} z={r['z']:5.1f} ×{r['razao']:4.1f} saz×{f}")

def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else 'resumo'
    lotes, series, factor, n_parc = carrega()
    # o lote de 5 anos: o que tem mais semanas
    por_lote = collections.Counter(k[0] for k in series)
    lote5 = max(series, key=lambda k: len(series[k]))[0]
    print(f"lotes: {len(lotes)} · pontos parciais excluídos: {n_parc} · lote de 5 anos: {lote5[:8]} "
          f"({len(next(s for k, s in series.items() if k[0] == lote5))} semanas completas)")
    def hist(eixo, termo): return sorted(series.get((lote5, eixo, termo), {}).items())

    if modo == 'varre':
        global N_REF, Z_MIN, RAZAO_MIN
        for nref in (8, 12):
            for z in (3.0, 4.0):
                for rz in (1.5, 2.0):
                    N_REF, Z_MIN, RAZAO_MIN = nref, z, rz
                    a = []; n = e = 0
                    for (l, eixo, termo), s in series.items():
                        if l != lote5: continue
                        vals = sorted(s.items())
                        for i in range(N_REF, len(vals)):
                            r = avalia(vals, i, factor[(l, eixo, termo)], hist(eixo, termo)); n += 1; e += r['elegivel']
                            if r['subida']: a.append((vals[i][0], r))
                    ns = [x for x in a if not x[1]['sazonal']]; sem = collections.Counter(x[0] for x in ns)
                    print(f"N_REF={nref} z≥{z} ×{rz}: elegíveis {e}/{n} · subidas {len(a)} · sazonais {len(a)-len(ns)} "
                          f"· alertas {len(ns)} · semanas com alerta {len(sem)} · máx numa semana {max(sem.values()) if sem else 0}")
        return

    if modo == 'ultima':
        for lote in sorted(por_lote, key=lambda l: lotes[l]['iniciado_em']):
            print(f"\n== lote {lote[:8]} ({lotes[lote]['notas'] or ''}) — última semana completa")
            for (l, eixo, termo), s in sorted(series.items()):
                if l != lote: continue
                vals = sorted(s.items()); r = avalia(vals, len(vals)-1, factor[(l, eixo, termo)], hist(eixo, termo))
                if r and (r['subida'] or r['aparecimento'] or (r['elegivel'] and r['z'] >= 2)):
                    print('  ' + fmt(vals[-1][0], eixo, termo, r))
            eleg = collections.Counter((k[1], avalia(sorted(s.items()), len(s)-1, factor[k])['elegivel'])
                                       for k, s in series.items() if k[0] == lote)
            print('  elegíveis para subida, por eixo:', {e: f"{eleg[(e, True)]}/{eleg[(e, True)]+eleg[(e, False)]}" for e in sorted({k[0] for k in eleg})})
        return

    # resumo: a regra corrida em todas as semanas do lote de 5 anos
    disparos = []; n = e = 0
    for (l, eixo, termo), s in series.items():
        if l != lote5: continue
        vals = sorted(s.items())
        for i in range(N_REF, len(vals)):
            r = avalia(vals, i, factor[(l, eixo, termo)], vals); n += 1; e += r['elegivel']
            if r['subida'] or r['aparecimento']: disparos.append((vals[i][0], eixo, termo, r))
    sub = [d for d in disparos if d[3]['subida'] and not d[3]['sazonal']]
    saz = [d for d in disparos if d[3]['subida'] and d[3]['sazonal']]
    apa = [d for d in disparos if d[3]['aparecimento']]
    sem = collections.Counter(d[0] for d in sub + apa)
    print(f"avaliações {n} · elegíveis {e} ({e/n:.0%}) · subidas {len(sub)} · sazonais descontadas {len(saz)} · aparecimentos {len(apa)}")
    print(f"semanas com alerta {len(sem)} de {n//len({k for k in series if k[0]==lote5})} · máx numa semana {max(sem.values())} · por ano {sorted(collections.Counter(d[0][:4] for d in sub+apa).items())}")
    print("\npor termo (subidas não sazonais):")
    for (ex, t), c in sorted(collections.Counter((d[1], d[2]) for d in sub).items(), key=lambda x: (-x[1], x[0])): print(f"  {c:3d}  {ex:13s} {t}")
    print("\ntodos os disparos, por data:")
    for d, ex, t, r in sorted(disparos, key=lambda x: x[0]): print('  ' + fmt(d, ex, t, r))

if __name__ == '__main__':
    main()
