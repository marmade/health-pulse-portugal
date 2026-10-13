"""Diagnóstico, parte 3: a regra corrida sobre os valores BRUTOS (inteiros, factor = 1).
A regra é invariante à escala (razão, z, pisos e sazonalidade escalam com o factor), por isso
isto dá as mesmas decisões que a régua do eixo, mas com os empates exactos: x = 1,5 × ref
e z = 3 dão "≥" verdadeiro, sem ruído de vírgula flutuante. Compara com o gravado e com o
recálculo pela base. Só SELECT.
  .venv-trends/bin/python <este ficheiro> <pasta de saída>
"""
import sys, os, json
from collections import Counter
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts'))
import trends_alertas as TA

SAIDA = sys.argv[1]
LOTES = ['ec6cc6fc', '11031356', '87b4fba4', 'fe58e0e5', '3bbae660']
url, key = TA.env_publico()
ids = {l['id'][:8]: l['id'] for l in TA.rest(url, key, 'trends_lotes?select=id')}
txt = []; out = {}
def p(*a):
    s = ' '.join(str(x) for x in a); print(s); txt.append(s)
def chaves(linhas):
    return Counter((l['eixo'], l['termo'], l['semana'][:10], l['tipo'], l['semana_n']) for l in linhas)

for c in LOTES:
    lid = ids[c]
    series, factor = TA.series_do_lote(url, key, lid)
    cal = TA.rest(url, key, f'trends_calibrados?select=eixo,termo,data,pedido_id&lote_id=eq.{lid}&order=eixo,termo,data')
    pids = sorted({x['pedido_id'] for x in cal}); brutos = {}
    for i in range(0, len(pids), 10):
        for pt in TA.rest(url, key, 'trends_pontos?select=pedido_id,termo,data,valor&pedido_id=in.(%s)&order=pedido_id,termo,data' % ','.join(pids[i:i+10])):
            brutos[(pt['pedido_id'], pt['termo'], pt['data'][:10])] = float(pt['valor'])
    sraw = {}
    for x in cal:
        d = x['data'][:10]; k = (x['eixo'], x['termo'])
        if d in series.get(k, {}): sraw.setdefault(k, {})[d] = brutos[(x['pedido_id'], x['termo'], d)]
    Rint = TA.calcula(sraw, {k: 1.0 for k in sraw})
    R = TA.calcula(series, factor)
    G = TA.rest(url, key, f'trends_alertas?select=eixo,termo,semana,tipo,semana_n&lote_id=eq.{lid}')
    cG, cR, cI = chaves(G), chaves(R), chaves(Rint)
    res = dict(gravadas=len(G), recalc_base=len(R), recalc_inteiros=len(Rint),
               base_vs_gravado=[sum((cR - cG).values()), sum((cG - cR).values())],
               inteiros_vs_gravado=[sum((cI - cG).values()), sum((cG - cI).values())],
               inteiros_vs_base=[sum((cI - cR).values()), sum((cR - cI).values())],
               inteiros_so=sorted((cI - cG).elements()), gravado_so=sorted((cG - cI).elements()))
    out[c] = res
    p(f"lote {c}: gravadas {len(G)} · base {len(R)} · inteiros {len(Rint)} | "
      f"diferenças (a mais, a menos) — base vs gravado {res['base_vs_gravado']}, "
      f"inteiros vs gravado {res['inteiros_vs_gravado']}, inteiros vs base {res['inteiros_vs_base']}")

json.dump(out, open(os.path.join(SAIDA, 'diagnostico_inteiros.json'), 'w'), ensure_ascii=False, indent=1, default=str)
open(os.path.join(SAIDA, 'diagnostico_inteiros.txt'), 'w').write('\n'.join(txt) + '\n')
