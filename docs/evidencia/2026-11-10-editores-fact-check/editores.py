"""Só leitura: que editores de fact-check em português estão na Google Fact Check Tools API,
e o que cada editor português tem nos últimos 12 meses. 10/11/2026, Claude Code, pedido da
Marta. Não grava nada na base e não toca no script 11.

A chave (GOOGLE_FACTCHECK_API_KEY) lê-se do ambiente ou de ~/.config/health-pulse/env, só
dentro deste script; nunca é impressa nem gravada (os erros passam por tapa()).

FASES
  descobrir  pesquisa com languageCode=pt, sem filtro de editor, com os TERMOS_LARGOS abaixo
             e as 100 keywords activas (keywords_activas.json); até PAGINAS_DESCOBRIR páginas
             de 100 por termo. Mais pedidos sem query, com reviewPublisherSiteFilter, para os
             SITES_A_TESTAR. Junta os editores (nome + site) com o número de urls distintos.
  periodo    para cada site dado: tudo o que a API tem dele com maxAgeDays=365, sem query.
  script11   para cada site dado: o que o script 11 actual apanharia — uma pesquisa por
             keyword, query=<keyword>, languageCode=pt, reviewPublisherSiteFilter=<site>,
             todas as páginas, como scripts/11_fetch_fact_checks.py l.116-124.

CRITÉRIOS fixados antes de ver resultados:
  - Português: site do editor com domínio .pt (ou sapo.pt). Brasileiro: domínio .br ou editor
    brasileiro conhecido (listado à parte). Os outros ficam como "a ver", à mão, com a razão.
  - "Últimos 12 meses" = maxAgeDays=365 da API, contado a partir de 10/11/2026.
  - O que o script 11 apanharia = interseção dos urls da fase script11 com os da fase periodo.

USO   python3 editores.py descobrir SAIDA.json
      python3 editores.py periodo   SAIDA.json site1 [site2 ...]
      python3 editores.py script11  SAIDA.json site1 [site2 ...]
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from collections import defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
NOME = "GOOGLE_FACTCHECK_API_KEY"
PAUSA = 0.3
PAGINAS_DESCOBRIR = 5
TERMOS_LARGOS = ["saúde", "doença", "vacina", "cancro", "medicamento", "médico", "hospital",
                 "SNS", "vírus", "dieta", "alimentação", "depressão", "saúde mental",
                 "menopausa", "hormonas", "epidemia", "pandemia", "tratamento", "cura",
                 "sintomas"]
SITES_A_TESTAR = ["publico.pt", "poligrafo.sapo.pt", "poligrafo.pt", "sapo.pt", "observador.pt"]

def chave():
    v = os.environ.get(NOME)
    if v: return v
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith(NOME + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("ERRO: falta %s" % NOME)

K = chave()
def tapa(s): return str(s).replace(K, "***")

def pedir(params, max_paginas=None):
    p = dict(params, pageSize=100, key=K)
    out, token, n = [], None, 0
    while True:
        if token: p["pageToken"] = token
        try:
            d = json.load(urllib.request.urlopen(
                "https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p), timeout=30))
        except urllib.error.HTTPError as e:
            return out, "HTTP %d %s" % (e.code, tapa(e.read().decode()[:200]))
        except Exception as e:
            return out, tapa(e)[:200]
        out += d.get("claims", []); token = d.get("nextPageToken"); n += 1
        time.sleep(PAUSA)
        if not token or (max_paginas and n >= max_paginas): return out, None

def linhas(claims):
    for c in claims:
        for r in c.get("claimReview", []):
            pub = r.get("publisher") or {}
            yield dict(editor=pub.get("name"), site=pub.get("site"), url=r.get("url"),
                       reviewDate=(r.get("reviewDate") or "")[:10], claimDate=(c.get("claimDate") or "")[:10],
                       rating=r.get("textualRating"), title=r.get("title"), text=c.get("text"),
                       lang=r.get("languageCode"))

def descobrir(saida):
    kws = [k["term"] for k in json.load(open(os.path.join(AQUI, "keywords_activas.json")))]
    eds = defaultdict(lambda: dict(urls=set(), termos=set()))
    erros = []
    for t in TERMOS_LARGOS + kws:
        cl, err = pedir(dict(query=t, languageCode="pt"), PAGINAS_DESCOBRIR)
        if err: erros.append((t, err))
        for l in linhas(cl):
            e = eds[(l["editor"], l["site"])]; e["urls"].add(l["url"]); e["termos"].add(t)
    testes = {}
    for s in SITES_A_TESTAR:
        cl, err = pedir(dict(reviewPublisherSiteFilter=s), 20)
        ls = list(linhas(cl))
        testes[s] = dict(erro=err, claims=len(cl), urls=len({l["url"] for l in ls}),
                         editores=sorted({"%s | %s" % (l["editor"], l["site"]) for l in ls}),
                         datas=[min((l["reviewDate"] for l in ls if l["reviewDate"]), default=None),
                                max((l["reviewDate"] for l in ls if l["reviewDate"]), default=None)])
    out = dict(termos=len(TERMOS_LARGOS) + len(kws), erros=erros, testes_por_site=testes,
               editores=sorted([dict(editor=k[0], site=k[1], urls=len(v["urls"]), termos=len(v["termos"]))
                                for k, v in eds.items()], key=lambda x: -x["urls"]))
    json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)
    print("termos: %d | erros: %d | editores: %d" % (out["termos"], len(erros), len(out["editores"])))
    for e in out["editores"]: print("  %4d urls  %3d termos  %s | %s" % (e["urls"], e["termos"], e["editor"], e["site"]))
    for s, v in testes.items(): print("  site %s: %s" % (s, {k: v[k] for k in ("erro", "claims", "urls", "datas", "editores")}))

def periodo(saida, sites):
    out = {}
    for s in sites:
        cl, err = pedir(dict(reviewPublisherSiteFilter=s, maxAgeDays=365))
        ls = {l["url"]: l for l in linhas(cl) if s in (l["url"] or "") or s in (l["site"] or "")}
        out[s] = dict(erro=err, claims=len(cl), verificacoes=list(ls.values()))
        ds = sorted(l["reviewDate"] for l in ls.values() if l["reviewDate"])
        print("%s: erro=%s claims=%d urls=%d datas %s a %s" % (s, err, len(cl), len(ls), ds[0] if ds else "-", ds[-1] if ds else "-"))
    json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)

def script11(saida, sites):
    kws = json.load(open(os.path.join(AQUI, "keywords_activas.json")))
    out = {}
    for s in sites:
        por_url, erros = defaultdict(list), []
        for k in kws:
            cl, err = pedir(dict(query=k["term"], languageCode="pt", reviewPublisherSiteFilter=s))
            if err: erros.append((k["term"], err))
            for c in cl:
                u = c["claimReview"][0].get("url", "")   # como o script 11: só o 1.º claimReview
                if u: por_url[u].append(k["term"])
        out[s] = dict(erros=erros, urls={u: sorted(set(t)) for u, t in por_url.items()})
        print("%s: %d urls por keyword, %d pesquisas falhadas" % (s, len(por_url), len(erros)))
    json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    fase, saida = sys.argv[1], sys.argv[2]
    {"descobrir": lambda: descobrir(saida), "periodo": lambda: periodo(saida, sys.argv[3:]),
     "script11": lambda: script11(saida, sys.argv[3:])}[fase]()
