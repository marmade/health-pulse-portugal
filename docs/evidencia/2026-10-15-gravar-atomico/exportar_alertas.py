"""exportar_alertas.py — exporta trends_alertas inteira, pela chave pública, depois do --gravar de 15/10.
Ordem lote_id,eixo,termo,semana (a chave da tabela); confere chaves repetidas e o count=exact.

    python3 docs/evidencia/2026-10-15-gravar-atomico/exportar_alertas.py <ficheiro.json>
"""
import importlib.util, json, os, sys, urllib.request
from collections import Counter
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
spec = importlib.util.spec_from_file_location("TA", os.path.join(RAIZ, "scripts", "trends_alertas.py"))
TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, anon = TA.env_publico()
linhas = TA.rest(url, anon, "trends_alertas?select=*&order=lote_id,eixo,termo,semana")
req = urllib.request.Request(url + "/rest/v1/trends_alertas?select=eixo&limit=1",
                             headers={"apikey": anon, "Authorization": "Bearer " + anon, "Prefer": "count=exact"})
with urllib.request.urlopen(req) as r: exacto = int(r.headers["Content-Range"].split("/")[1])
chaves = Counter((l["lote_id"], l["eixo"], l["termo"], l["semana"]) for l in linhas)
json.dump(linhas, open(sys.argv[1], "w"), ensure_ascii=False, indent=0)
print(json.dumps(dict(linhas=len(linhas), count_exact=exacto, repetidas=sum(1 for c in chaves.values() if c > 1),
                      por_lote=dict(sorted(Counter(l["lote_id"][:8] for l in linhas).items())))))
