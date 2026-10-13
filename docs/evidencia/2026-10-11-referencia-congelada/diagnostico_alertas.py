"""Diagnóstico: alertas gravados ≠ recalculados — docs/sessoes/2026-10-11.md §3.
Só SELECT com a chave pública. Corre da raiz do repositório:
  .venv-trends/bin/python <este ficheiro> <pasta de saída>
"""
import sys, os, json
from collections import Counter, defaultdict
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
    return Counter((l['eixo'], l['termo'], l['semana'][:10], l['tipo']) for l in linhas)

for c in LOTES:
    lid = ids[c]
    series, factor = TA.series_do_lote(url, key, lid)
    R = TA.calcula(series, factor)
    G = TA.rest(url, key, f'trends_alertas?select=eixo,termo,semana,tipo,valor,referencia,semana_n,inicio&lote_id=eq.{lid}&order=eixo,termo,semana')
    cR, cG = chaves(R), chaves(G)
    so_G = sorted((cG - cR).elements()); so_R = sorted((cR - cG).elements())
    dup_G = [k for k, n in cG.items() if n > 1]

    # (a) valores: o valor gravado no alerta contra o valor_eixo da série na base
    dif_valor = []
    for g in G:
        v = series.get((g['eixo'], g['termo']), {}).get(g['semana'][:10])
        if v is None: dif_valor.append((g['eixo'], g['termo'], g['semana'][:10], g['valor'], None)); continue
        if abs(float(g['valor']) - v) > 0.0015: dif_valor.append((g['eixo'], g['termo'], g['semana'][:10], g['valor'], v))

    # (b) pedidos por termo no lote, e passos
    pedidos = TA.rest(url, key, f'trends_pedidos?select=id,eixo,passo,termos&lote_id=eq.{lid}')
    passo = {q['id']: q['passo'] for q in pedidos}
    n_ped = defaultdict(list)
    for q in pedidos:
        for t in q['termos']: n_ped[(q['eixo'], t)].append(q['passo'])
    termos_dif = sorted({(k[0], k[1]) for k in so_G + so_R})
    multi = {k for k in series if len(n_ped.get(k, [])) > 1}
    tab = Counter((k in multi, k in set(termos_dif)) for k in series)

    # (c) a série reconstruída sem o arredondamento do valor_eixo: valor bruto × factor
    cal = TA.rest(url, key, f'trends_calibrados?select=eixo,termo,data,factor,pedido_id&lote_id=eq.{lid}&order=eixo,termo,data')
    brutos = {}
    pids = sorted({x['pedido_id'] for x in cal})
    for i in range(0, len(pids), 10):
        for pt in TA.rest(url, key, 'trends_pontos?select=pedido_id,termo,data,valor&pedido_id=in.(%s)&order=pedido_id,termo,data' % ','.join(pids[i:i+10])):
            brutos[(pt['pedido_id'], pt['termo'], pt['data'][:10])] = float(pt['valor'])
    series2 = defaultdict(dict)
    for x in cal:
        d = x['data'][:10]; k = (x['eixo'], x['termo'])
        if d in series.get(k, {}):   # as mesmas semanas (sem a parcial)
            series2[k][d] = brutos[(x['pedido_id'], x['termo'], d)] * float(x['factor'])
    R2 = TA.calcula(series2, factor)
    cR2 = chaves(R2)
    so_G2 = sorted((cG - cR2).elements()); so_R2 = sorted((cR2 - cG).elements())

    # (d) últimas 8 semanas completas do lote
    semanas = sorted({d for s in series.values() for d in s}); ult8 = set(semanas[-8:])
    ult_G = [k for k in so_G if k[2] in ult8]; ult_R = [k for k in so_R if k[2] in ult8]

    res = dict(gravadas=len(G), recalculadas=len(R), so_gravadas=so_G, so_recalculadas=so_R, duplicadas_gravadas=dup_G,
               valores_diferentes=dif_valor, termos_com_diferencas=[list(k) + [n_ped.get(k, [])] for k in termos_dif],
               tabela_multi_vs_diferenca={f'multi={a},dif={b}': n for (a, b), n in tab.items()},
               recalc_sem_arredondamento=dict(linhas=len(R2), so_gravadas=so_G2, so_recalculadas=so_R2),
               ultimas_8=sorted(ult8), ultimas_8_so_gravadas=ult_G, ultimas_8_so_recalculadas=ult_R)
    out[c] = res
    p(f'\n== lote {c}: gravadas {len(G)}, recalculadas {len(R)}; só gravadas {len(so_G)}, só recalculadas {len(so_R)}; '
      f'chaves gravadas repetidas {len(dup_G)}')
    p(f'  valores gravados ≠ valor_eixo da base (>0,0015): {len(dif_valor)}')
    p(f'  termos com diferenças: {len(termos_dif)}; tabela (pedido mais de uma vez, tem diferença): {dict(tab)}')
    for k in termos_dif:
        a = sum(1 for x in so_G if x[:2] == k); b = sum(1 for x in so_R if x[:2] == k)
        p(f'    {k[0]}/{k[1]}: só gravadas {a}, só recalculadas {b}; pedidos (passos) {n_ped.get(k, [])}')
    p(f'  recálculo com bruto × factor (sem arredondar o valor_eixo): {len(R2)} linhas; só gravadas {len(so_G2)}, só recalculadas {len(so_R2)}')
    p(f'  últimas 8 semanas ({min(ult8)} a {max(ult8)}): só gravadas {len(ult_G)}, só recalculadas {len(ult_R)}')
    for k in ult_G: p(f'    só gravada: {k}')
    for k in ult_R: p(f'    só recalculada: {k}')

json.dump(out, open(os.path.join(SAIDA, 'diagnostico.json'), 'w'), ensure_ascii=False, indent=1, default=str)
open(os.path.join(SAIDA, 'diagnostico.txt'), 'w').write('\n'.join(txt) + '\n')
