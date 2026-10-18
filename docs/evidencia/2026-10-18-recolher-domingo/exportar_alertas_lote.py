"""exportar_alertas_lote.py — exporta de trends_alertas só as linhas de UM lote, pela chave pública.
18/10/2026. Adaptado de docs/evidencia/2026-10-15-gravar-atomico/exportar_alertas.py (que exporta a
tabela inteira e fica como estava). Ordem eixo,termo,semana (a chave da tabela dentro do lote);
confere chaves repetidas e o count=exact do mesmo filtro, e mostra os instantes de calculado_em.

    python3 docs/evidencia/2026-10-18-recolher-domingo/exportar_alertas_lote.py <lote_id completo> <ficheiro.json>
"""
import importlib.util, json, os, sys, urllib.request
from collections import Counter
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
spec = importlib.util.spec_from_file_location("TA", os.path.join(RAIZ, "scripts", "trends_alertas.py"))
TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, anon = TA.env_publico(); lote = sys.argv[1]
linhas = TA.rest(url, anon, f"trends_alertas?select=*&lote_id=eq.{lote}&order=eixo,termo,semana")
req = urllib.request.Request(url + f"/rest/v1/trends_alertas?select=eixo&lote_id=eq.{lote}&limit=1",
                             headers={"apikey": anon, "Authorization": "Bearer " + anon, "Prefer": "count=exact"})
with urllib.request.urlopen(req) as r: exacto = int(r.headers["Content-Range"].split("/")[1])
chaves = Counter((l["eixo"], l["termo"], l["semana"]) for l in linhas)
json.dump(linhas, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(json.dumps(dict(lote=lote[:8], linhas=len(linhas), count_exact=exacto,
                      repetidas=sum(1 for c in chaves.values() if c > 1),
                      outros_lotes=sum(1 for l in linhas if l["lote_id"] != lote),
                      calculado_em=sorted(Counter(l["calculado_em"] for l in linhas).items())), ensure_ascii=False))
