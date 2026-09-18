#!/usr/bin/env python3
"""
11_fetch_fact_checks.py — fact-checks portugueses sobre as keywords, com veredicto
==================================================================================
18/09/2026, sessão 16. A tabela `debunking` nunca teve fonte: as 36 linhas foram semeadas
a 25/03/2026 sem classificação, e o único feed configurado devolvia o Observador inteiro.
A Marta: "era suposto ter as novidades de desinformação".

FONTE  Google Fact Check Tools API (ClaimReview), gratuita, chave em
       ~/.config/health-pulse/env (GOOGLE_FACTCHECK_API_KEY) ou no ambiente.
       SÓ EDITORES PORTUGUESES (decisão da Marta, 18/09): reviewPublisherSiteFilter.
       No índice, o único editor português com ClaimReview é o Observador
       (observador.pt); o Polígrafo não publica ClaimReview (testado: 0 em
       poligrafo.sapo.pt, sapo.pt, poligrafo.pt). Veredictos do Observador: Errado,
       Enganador, Esticado, Certo — guardam-se TAL COMO VÊM, sem traduzir para uma
       escala nossa.

COMO   python3 scripts/11_fetch_fact_checks.py --dry-run       # mostra, não grava
       SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/11_fetch_fact_checks.py --gravar

O QUE GRAVA em `debunking`: term (a keyword que casou), title (a afirmação verificada),
classification (o veredicto do editor), source (editor), url (a verificação),
data_publicacao, eixo, keyword_id, explicacao (o título da verificação). Uma linha por
(url, keyword); não repete o que já lá está.
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITORES_PT = ["observador.pt"]        # acrescentar quando outro editor português publicar ClaimReview
PAUSA = 0.3

def env_publico():
    env = {}
    for l in open(os.path.join(RAIZ, ".env")):
        if "=" in l and not l.startswith("#"):
            k, v = l.strip().split("=", 1); env[k] = v.strip('"')
    return env["VITE_SUPABASE_URL"], env["VITE_SUPABASE_PUBLISHABLE_KEY"]

def chave(nome):
    v = os.environ.get(nome)
    if v: return v
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith(nome + "="): return l.split("=", 1)[1].strip().strip('"')
    sys.exit("ERRO: falta %s — no ambiente ou em ~/.config/health-pulse/env." % nome)

def rest(url, key, path, method="GET", body=None, prefer=None):
    req = urllib.request.Request(url + "/rest/v1/" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
                 **({"Prefer": prefer} if prefer else {})})
    with urllib.request.urlopen(req) as r:
        t = r.read().decode(); return json.loads(t) if t else None

def claims(api_key, query, site):
    p = dict(query=query, languageCode="pt", pageSize=50, reviewPublisherSiteFilter=site, key=api_key)
    out, token = [], None
    while True:
        if token: p["pageToken"] = token
        d = json.load(urllib.request.urlopen("https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p)))
        out += d.get("claims", []); token = d.get("nextPageToken")
        if not token: break
    return out

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true"); g.add_argument("--gravar", action="store_true")
    args = ap.parse_args()
    api_key = chave("GOOGLE_FACTCHECK_API_KEY")
    url, anon = env_publico()
    kws = rest(url, anon, "keywords?select=id,term,axis&is_active=eq.true&order=axis,term")
    existentes = {r["url"] for r in rest(url, anon, "debunking?select=url") if r.get("url")}
    novos, vistos = [], set()
    for kw in kws:
        for site in EDITORES_PT:
            try: cl = claims(api_key, kw["term"], site)
            except Exception as e: print("  FALHOU %s @ %s: %s" % (kw["term"], site, str(e)[:120])); continue
            for c in cl:
                r = c["claimReview"][0]
                u = r.get("url", "")
                if not u or u in existentes or (u, kw["term"]) in vistos: continue
                vistos.add((u, kw["term"]))
                novos.append(dict(term=kw["term"], title=(c.get("text") or "")[:500],
                                  classification=(r.get("textualRating") or "sem veredicto").strip(),
                                  source=r["publisher"].get("name") or site, url=u,
                                  keyword_id=kw["id"], eixo=kw["axis"],
                                  explicacao=(r.get("title") or "")[:500],
                                  data_publicacao=(r.get("reviewDate") or None)))
            time.sleep(PAUSA)
    print("keywords: %d | verificações novas: %d | já existentes (url): %d" % (len(kws), len(novos), len(existentes)))
    from collections import Counter
    print("por veredicto:", Counter(n["classification"] for n in novos).most_common())
    print("por eixo:", Counter(n["eixo"] for n in novos).most_common())
    print("por keyword (top 10):", Counter(n["term"] for n in novos).most_common(10))
    for n in novos[:12]:
        print("  [%s] %s · %s · %s" % (n["classification"], (n["data_publicacao"] or "?")[:10], n["term"], n["title"][:80]))
    if args.gravar:
        key = chave("SUPABASE_SERVICE_ROLE_KEY")
        for i in range(0, len(novos), 200): rest(url, key, "debunking", "POST", novos[i:i + 200])
        print("GRAVADO: %d linhas em debunking" % len(novos))
    else:
        print("DRY-RUN: nada gravado.")

if __name__ == "__main__":
    main()
