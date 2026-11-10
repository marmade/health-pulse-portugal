"""Só leitura: as verificações do Observador na API com data de 10/11/2024 a 09/11/2025 (os
12 meses ANTES dos usados para desenhar a lista), para testar a lista v1 em dados que não a
inspiraram. A chave lê-se do ambiente ou de ~/.config/health-pulse/env; nunca é impressa nem
gravada.  Uso: python3 observador_ano_anterior.py SAIDA.json"""
import json, os, sys, time, urllib.parse, urllib.request
NOME = "GOOGLE_FACTCHECK_API_KEY"
def chave():
    v = os.environ.get(NOME)
    if v: return v
    for l in open(os.path.expanduser("~/.config/health-pulse/env")):
        if l.startswith(NOME + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("falta a chave")
K = chave()
p, out, token = dict(reviewPublisherSiteFilter="observador.pt", pageSize=100, key=K), [], None
while True:
    if token: p["pageToken"] = token
    d = json.load(urllib.request.urlopen("https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p), timeout=30))
    out += d.get("claims", []); token = d.get("nextPageToken"); time.sleep(0.3)
    if not token: break
vs = {}
for c in out:
    for r in c.get("claimReview", []):
        d = (r.get("reviewDate") or "")[:10]
        if "observador.pt" in (r.get("url") or "") and "2024-11-10" <= d <= "2025-11-09":
            vs[r["url"]] = dict(url=r["url"], reviewDate=d, rating=r.get("textualRating"), title=r.get("title"), text=c.get("text"))
json.dump(sorted(vs.values(), key=lambda x: x["reviewDate"]), open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
print("claims lidas: %d | do Observador entre 10/11/2024 e 09/11/2025: %d" % (len(out), len(vs)))
del K
