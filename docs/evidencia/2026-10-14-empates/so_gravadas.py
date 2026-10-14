"""Só leitura: as linhas só gravadas, com o termo à volta, código antigo vs corrigido."""
import collections, importlib.util, json, sys
def mod(n, p):
    s = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
TA = mod('TA', sys.argv[1] + '/scripts/trends_alertas.py'); OLD = mod('OLD', sys.argv[2])
url, key = TA.env_publico()
out = {}
for lp in ('ec6cc6fc', '11031356', '3bbae660'):
    lid = [l['id'] for l in TA.rest(url, key, 'trends_lotes?select=id') if l['id'].startswith(lp)][0]
    grav = TA.rest(url, key, f"trends_alertas?select=eixo,termo,semana,tipo,semana_n,inicio,valor,referencia,ruido,razao,z&lote_id=eq.{lid}&order=eixo,termo,semana")
    linhas = TA.linhas_do_lote(url, key, lid); series, factor = TA.series_brutas(linhas)
    novo = TA.calcula(series, factor)
    ch = lambda r: (r['eixo'], r['termo'], r['semana'][:10], r['tipo'], r['semana_n'])
    N = {ch(r) for r in novo}
    so = [r for r in grav if ch(r) not in N]
    # código antigo, pela base (valor_eixo arredondado) e pela memória aproximada (bruto × factor)
    ve = collections.defaultdict(dict)
    for c in TA.rest(url, key, f"trends_calibrados?select=eixo,termo,data,valor_eixo&lote_id=eq.{lid}&order=eixo,termo,data"):
        ve[(c['eixo'], c['termo'])][c['data'][:10]] = float(c['valor_eixo'])
    for r in sorted(so, key=ch):
        k = (r['eixo'], r['termo']); s = series[k]; f = factor[k]
        datas = sorted(s); j = datas.index(r['semana'][:10])
        old_base = OLD.calcula({k: {d: ve[k][d] for d in datas}}, {k: f})
        old_mem = OLD.calcula({k: {d: s[d] * f for d in datas}}, {k: f})
        tn = {l['semana']: l for l in novo if (l['eixo'], l['termo']) == k}
        tg = {l['semana'][:10]: l for l in grav if (l['eixo'], l['termo']) == k}
        tb = {l['semana']: l for l in old_base}; tm = {l['semana']: l for l in old_mem}
        print(f"\n=== {lp} {k[0]} / {k[1]} — só gravada: {r['semana'][:10]} {r['tipo']} semana_n={r['semana_n']} inicio={r['inicio']}  factor {f}")
        print("   semana       bruto   ref   ruído    z      razão  | gravado        | antigo-base    | antigo-mem     | corrigido")
        for i in range(max(8, j - 6), min(len(datas), j + 3)):
            d = datas[i]; a = TA.avalia([(x, s[x]) for x in datas], i, [(x, s[x]) for x in datas])
            fmt = lambda l: f"{l['tipo'][:10]:10s} n{l['semana_n']}" if l else "-"
            print(f"   {d} {s[d]:5d} {float(a['ref']):6.2f} {float(a['ruido']):6.3f} {float(a['z']):7.4f} {float(a['razao']):7.4f}"
                  f"  | {fmt(tg.get(d)):14s} | {fmt(tb.get(d)):14s} | {fmt(tm.get(d)):14s} | {fmt(tn.get(d))}"
                  + ("   <==" if i == j else ""))
