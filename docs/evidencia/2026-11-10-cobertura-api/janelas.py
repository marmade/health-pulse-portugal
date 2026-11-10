"""Só leitura: a API mostra mais de 40 por mês do Observador com janelas mais curtas?
10/11/2026, Claude Code. A chave lê-se do ambiente ou de ~/.config/health-pulse/env, só aqui
dentro; nunca é impressa nem gravada.

A API (claims:search v1alpha1) não tem intervalo de datas: só maxAgeDays. Por isso as
janelas são maxAgeDays = 7, 14, 30, 45, 60, 90, 180, 365, e também pageSize 10 contra 100
(o tamanho da página não deve mudar o total). Para cada pedido: páginas seguidas até ao fim,
total, urls distintos, e contagem por mês (reviewDate).

CRITÉRIO fixado antes: "janelas curtas devolvem mais" = algum mês com mais urls numa janela
curta do que no pedido de 365 dias.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from collections import Counter

NOME = "GOOGLE_FACTCHECK_API_KEY"
def chave():
    v = os.environ.get(NOME)
    if v: return v
    for l in open(os.path.expanduser("~/.config/health-pulse/env")):
        if l.startswith(NOME + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("falta a chave")
K = chave()
def tapa(s): return str(s).replace(K, "***")

def pedir(params):
    p = dict(params, key=K)
    out, token, paginas = [], None, 0
    while True:
        if token: p["pageToken"] = token
        try:
            d = json.load(urllib.request.urlopen(
                "https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p), timeout=30))
        except urllib.error.HTTPError as e:
            return out, paginas, "HTTP %d %s" % (e.code, tapa(e.read().decode()[:200]))
        out += d.get("claims", []); token = d.get("nextPageToken"); paginas += 1
        time.sleep(0.3)
        if not token: return out, paginas, None

res = {}
casos = [("365d_p100", dict(maxAgeDays=365, pageSize=100)), ("365d_p10", dict(maxAgeDays=365, pageSize=10))] + \
        [("%dd_p100" % n, dict(maxAgeDays=n, pageSize=100)) for n in (7, 14, 30, 45, 60, 90, 180)] + \
        [("sem_max_p100", dict(pageSize=100))]
for nome, extra in casos:
    cl, pg, err = pedir(dict(reviewPublisherSiteFilter="observador.pt", **extra))
    urls = {}
    for c in cl:
        for r in c.get("claimReview", []):
            if "observador.pt" in (r.get("url") or ""):
                urls[r["url"]] = dict(reviewDate=(r.get("reviewDate") or "")[:10], claimDate=(c.get("claimDate") or "")[:10])
    meses = Counter(v["reviewDate"][:7] for v in urls.values())
    res[nome] = dict(erro=err, paginas=pg, claims=len(cl), urls=len(urls),
                     por_mes=dict(sorted(meses.items())), itens=urls)
    ult = sorted(meses.items())[-6:]
    print("%-13s pág %3d claims %5d urls %5d erro %s | últimos meses %s" % (nome, pg, len(cl), len(urls), err, ult))
json.dump(res, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
