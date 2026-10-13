"""Diagnóstico, parte 2: na 1.ª semana em que cada termo diverge, a decisão está em cima de um
limiar? (razão = 1,5 ou z = 3, exactos na aritmética dos inteiros brutos.) Só SELECT.
  .venv-trends/bin/python <este ficheiro> <pasta de saída>
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts'))
import trends_alertas as TA

SAIDA = sys.argv[1]
diag = json.load(open(os.path.join(SAIDA, 'diagnostico.json')))
url, key = TA.env_publico()
ids = {l['id'][:8]: l['id'] for l in TA.rest(url, key, 'trends_lotes?select=id')}
txt = []; out = {}
def p(*a):
    s = ' '.join(str(x) for x in a); print(s); txt.append(s)

for c, d in diag.items():
    difs = [tuple(k) for k in d['so_gravadas']] + [tuple(k) for k in d['so_recalculadas']]
    if not difs: continue
    series, factor = TA.series_do_lote(url, key, ids[c])
    R = TA.calcula(series, factor)
    p(f'\n== lote {c}')
    out[c] = []
    for k in sorted({x[:2] for x in difs}):
        w0 = min(x[2] for x in difs if x[:2] == k)
        vals = sorted(series[k].items()); fac = factor[k]
        i = [w for w, _ in vals].index(w0)
        r = TA.avalia(vals, i, fac, vals)
        # o acontecimento de subida em curso na semana anterior, no recálculo
        ant = [l for l in R if (l['eixo'], l['termo']) == k and l['semana'] == vals[i-1][0] and l['tipo'] == 'subida']
        cont = None
        if ant:
            ref = ant[0]['referencia']; cont = vals[i][1] / ref
        lado = ['gravada' if x in [tuple(y) for y in d['so_gravadas']] else 'recalculada' for x in difs if x[:2] == k and x[2] == w0]
        reg = dict(eixo=k[0], termo=k[1], semana=w0, so_em=lado, factor=fac,
                   x_bruto=round(r['x'] / fac, 6), ref_bruta=round(r['ref'] / fac, 6), razao=r['razao'], z=r['z'],
                   ruido_bruto=round(r['ruido'] / fac, 6), elegivel=r['elegivel'],
                   em_curso_antes=bool(ant), x_sobre_ref_congelada=cont)
        out[c].append(reg)
        p(f"  {k[0]}/{k[1]} {w0} (só {', '.join(lado)}): bruto x={reg['x_bruto']} ref={reg['ref_bruta']} "
          f"ruído={reg['ruido_bruto']} → razão {r['razao']:.6f}, z {r['z']:.6f}"
          + (f"; em curso, x/ref congelada {cont:.6f}" if ant else ''))

json.dump(out, open(os.path.join(SAIDA, 'diagnostico_empates.json'), 'w'), ensure_ascii=False, indent=1, default=str)
open(os.path.join(SAIDA, 'diagnostico_empates.txt'), 'w').write('\n'.join(txt) + '\n')
