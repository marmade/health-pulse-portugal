"""Só leitura: as verificações que o Observador publicou, pelo "Mais notícias" da própria
página https://observador.pt/factchecks/ (o mesmo pedido que o browser faz ao carregar no
botão; sem login, sem cookies). 10/11/2026, Claude Code.

Endpoint lido em main.min.js do site: <newsApi>obs_api/v4/grids/filter/archive/obs_factcheck
?offset=<AAAAMMDD>&scroll=true; a resposta traz rendered.modules (HTML) e rendered.offset (o
seguinte). Começa no offset da página (20261011) e recua até antes de PARAR_EM. Pausa de 1 s.
Ao primeiro erro HTTP pára e regista-o: não se tenta contornar.

A página inicial (os 40 de 12/10 a 04/11) junta-se a partir de pagina_factchecks_2026-11-10.json
do §5.
"""
import json, re, sys, time, urllib.request, urllib.error, os

BASE = "https://observador.pt/wp-json/obs_api/v4/grids/filter/archive/obs_factcheck?offset=%s&scroll=true"
PARAR_EM = "20260301"
SAIDA = sys.argv[1]
INICIAL = sys.argv[2]   # pagina_factchecks_2026-11-10.json

tok = re.compile(r'(https://observador\.pt/factchecks/[a-z0-9-]+/?)|datetime="([0-9T:+-]+)')
def itens(html):
    out, last = {}, None
    for m in tok.finditer(html):
        if m.group(1): last = m.group(1).rstrip("/"); out.setdefault(last, None)
        elif last and out.get(last) is None: out[last] = m.group(2)
    return out

todos = {i["url"]: i["datetime"] for i in json.load(open(INICIAL))["itens"]}
pedidos, offset = [], "20261011"
while offset and offset >= PARAR_EM and len(pedidos) < 60:
    url = BASE % offset
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=30))
    except urllib.error.HTTPError as e:
        pedidos.append(dict(offset=offset, erro="HTTP %d" % e.code)); print("PAROU: HTTP", e.code, "no offset", offset); break
    r = d.get("rendered") or {}
    novos = itens(r.get("modules") or "")
    pedidos.append(dict(offset=offset, itens=len(novos), seguinte=r.get("offset")))
    print("offset %s: %d itens, seguinte %s" % (offset, len(novos), r.get("offset")))
    for u, dt in novos.items(): todos.setdefault(u, dt)
    if not novos or str(r.get("offset")) == offset: break
    offset = str(r.get("offset")); time.sleep(1)

json.dump(dict(pedidos=pedidos, itens=[dict(url=u, datetime=d) for u, d in sorted(todos.items(), key=lambda x: x[1] or "")]),
          open(SAIDA, "w"), ensure_ascii=False, indent=1)
print("total distintos:", len(todos))
