"""Só leitura: quantas verificações a API tem de cada site, sem maxAgeDays e sem query.
10/11/2026, Claude Code. A chave lê-se do ambiente ou de ~/.config/health-pulse/env e nunca é
impressa nem gravada.  Uso: python3 api_por_site.py SAIDA.json site1 [site2 ...]"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
NOME = "GOOGLE_FACTCHECK_API_KEY"
def chave():
    v = os.environ.get(NOME)
    if v: return v
    for l in open(os.path.expanduser("~/.config/health-pulse/env")):
        if l.startswith(NOME + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("falta a chave")
K = chave()
res = {}
for s in sys.argv[2:]:
    p, out, token, err = dict(reviewPublisherSiteFilter=s, pageSize=100, key=K), [], None, None
    while True:
        if token: p["pageToken"] = token
        try:
            d = json.load(urllib.request.urlopen("https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p), timeout=30))
        except urllib.error.HTTPError as e:
            err = "HTTP %d" % e.code; break
        out += d.get("claims", []); token = d.get("nextPageToken"); time.sleep(0.3)
        if not token: break
    ls = [dict(url=r.get("url"), editor=(r.get("publisher") or {}).get("name"), site=(r.get("publisher") or {}).get("site"),
               reviewDate=(r.get("reviewDate") or "")[:10]) for c in out for r in c.get("claimReview", [])]
    res[s] = dict(erro=err, claims=len(out), verificacoes=ls)
    ds = sorted(l["reviewDate"] for l in ls if l["reviewDate"])
    print("%s: erro=%s claims=%d datas %s a %s" % (s, err, len(out), ds[0] if ds else "-", ds[-1] if ds else "-"))
json.dump(res, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
