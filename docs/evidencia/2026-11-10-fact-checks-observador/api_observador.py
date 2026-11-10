"""Só leitura: o que a Google Fact Check Tools API tem do Observador, sem filtro de keyword.
A chave lê-se do ambiente ou de ~/.config/health-pulse/env e nunca é impressa nem gravada."""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from collections import Counter

NOME = "GOOGLE_FACTCHECK_API_KEY"
SAIDA = sys.argv[1]

def chave():
    v = os.environ.get(NOME)
    if v: return v
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    for l in open(cfg):
        if l.startswith(NOME + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("falta a chave")

k = chave()
def tapa(s): return s.replace(k, "***")

def todas(extra):
    p = dict(reviewPublisherSiteFilter="observador.pt", pageSize=100, key=k, **extra)
    out, token, n = [], None, 0
    while True:
        if token: p["pageToken"] = token
        try:
            d = json.load(urllib.request.urlopen(
                "https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p), timeout=30))
        except urllib.error.HTTPError as e:
            print("HTTP", e.code, tapa(e.read().decode()[:300])); break
        out += d.get("claims", []); token = d.get("nextPageToken"); n += 1
        if not token or n >= 20: break
        time.sleep(0.3)
    return out, n

res = {}
for nome, extra in [("pt_60d", dict(languageCode="pt", maxAgeDays=60)),
                    ("sem_lingua_60d", dict(maxAgeDays=60))]:
    cl, n = todas(extra)
    linhas = []
    for c in cl:
        for r in c.get("claimReview", []):
            if "observador.pt" in (r.get("url") or ""):
                linhas.append(dict(url=r.get("url"), reviewDate=(r.get("reviewDate") or "")[:10],
                                   claimDate=(c.get("claimDate") or "")[:10], rating=r.get("textualRating"),
                                   title=r.get("title"), text=c.get("text"), lang=r.get("languageCode")))
    urls = {l["url"] for l in linhas}
    datas = sorted({l["reviewDate"] for l in linhas if l["reviewDate"]})
    print("%s: %d páginas, %d claims, %d urls do Observador; reviewDate de %s a %s" % (
        nome, n, len(cl), len(urls), datas[0] if datas else "-", datas[-1] if datas else "-"))
    print("  por semana:", sorted(Counter(l["reviewDate"][:8] + ("1" if l["reviewDate"][8:] < "11" else "2" if l["reviewDate"][8:] < "21" else "3") for l in linhas if l["reviewDate"]).items())[-12:])
    res[nome] = linhas
json.dump(res, open(SAIDA, "w"), ensure_ascii=False, indent=1)
del k
