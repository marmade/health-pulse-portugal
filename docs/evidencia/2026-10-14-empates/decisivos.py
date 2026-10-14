"""Só leitura: o número em vírgula flutuante que decidiu cada caso no código antigo."""
import sys, importlib.util, collections, urllib.parse
def mod(n, p):
    s = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
TA = mod('TA', sys.argv[1] + '/scripts/trends_alertas.py'); OLD = mod('OLD', sys.argv[2])
url, key = TA.env_publico()
casos = [('ec6cc6fc','saude-mental','depressão',['2025-03-09','2025-03-23']),
         ('11031356','alimentacao','hipertensão',['2025-02-23','2025-11-16']),
         ('11031356','saude-mental','antidepressivos',['2023-04-23']),
         ('3bbae660','emergentes','lipedema',['2025-06-22']),
         ('3bbae660','saude-mental','toc',['2022-09-25'])]
for lp, e, t, semanas in casos:
    lid = [l['id'] for l in TA.rest(url, key, 'trends_lotes?select=id') if l['id'].startswith(lp)][0]
    linhas = [l for l in TA.linhas_do_lote(url, key, lid) if (l['eixo'], l['termo']) == (e, t)]
    s, fac = TA.series_brutas(linhas); s = s[(e, t)]; f = fac[(e, t)]
    ve = {c['data'][:10]: float(c['valor_eixo']) for c in TA.rest(url, key,
          f"trends_calibrados?select=data,valor_eixo&lote_id=eq.{lid}&eixo=eq.{e}&termo=eq.{urllib.parse.quote(t)}&order=data")}
    datas = sorted(s)
    for nome, serie in (('base (valor_eixo a 3 casas)', {d: ve[d] for d in datas}), ('memória (bruto × factor)', {d: s[d] * f for d in datas})):
        vals = sorted(serie.items())
        for sem in semanas:
            i = datas.index(sem); r = OLD.avalia(vals, i, f, vals)
            print(f"{lp} {t:15s} {sem} {nome:28s} z={r['z']!r} razão={r['razao']!r} x={r['x']!r} 1,5×ref={1.5*r['ref']!r}")
    # lipedema 22/06: a continuação, contra a referência congelada do 1.º disparo (08/06)
    if t in ('lipedema', 'depressão'):
        ini = '2025-06-08' if t == 'lipedema' else '2025-03-09'; sem = semanas[0] if t == 'lipedema' else '2025-03-23'
        for nome, serie in (('base', {d: ve[d] for d in datas}), ('memória', {d: s[d] * f for d in datas})):
            vals = sorted(serie.items()); r0 = OLD.avalia(vals, datas.index(ini), f, vals)
            x = serie[sem]; print(f"   continuação {t} {sem} vs ref congelada de {ini} ({nome}): x={x!r} ≥ 1,5×ref={1.5*r0['ref']!r}? {x >= 1.5*r0['ref']}")
