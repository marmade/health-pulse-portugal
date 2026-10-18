"""contar_lote.py — conta as linhas de um lote em trends_alertas, pela chave pública.
15/10/2026, sessão 31. Lê com order=eixo,termo,semana (a chave da tabela dentro do lote) em
páginas de 1000, confere que não há chaves repetidas e compara com o count=exact do PostgREST.
Mostra também os instantes de calculado_em (uma gravação tudo-ou-nada dá um só).

    python3 docs/evidencia/2026-10-15-gravar-atomico/contar_lote.py <lote_id completo>
"""
import importlib.util, json, os, sys, urllib.request
from collections import Counter
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
spec = importlib.util.spec_from_file_location("TA", os.path.join(RAIZ, "scripts", "trends_alertas.py"))
TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, anon = TA.env_publico(); lote = sys.argv[1]
linhas = TA.rest(url, anon, f"trends_alertas?select=eixo,termo,semana,tipo,calculado_em&lote_id=eq.{lote}&order=eixo,termo,semana")
req = urllib.request.Request(url + f"/rest/v1/trends_alertas?select=eixo&lote_id=eq.{lote}&limit=1",
                             headers={"apikey": anon, "Authorization": "Bearer " + anon, "Prefer": "count=exact"})
with urllib.request.urlopen(req) as r: exacto = int(r.headers["Content-Range"].split("/")[1])
chaves = Counter((l["eixo"], l["termo"], l["semana"]) for l in linhas)
print(json.dumps(dict(lote=lote[:8], lidas=len(linhas), count_exact=exacto,
                      repetidas=sum(1 for c in chaves.values() if c > 1),
                      tipos=dict(sorted(Counter(l["tipo"] for l in linhas).items())),
                      calculado_em=sorted(Counter(l["calculado_em"] for l in linhas).items())), ensure_ascii=False))
