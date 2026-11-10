"""
factchecks_comum.py — o que os dois scripts de fact-checks partilham
=====================================================================
10/11/2026 (docs/sessoes/2026-11-10.md §9). Usado por scripts/11_fetch_fact_checks.py
(Observador, Google Fact Check Tools API) e scripts/12_fetch_poligrafo.py (Polígrafo, sitemap
de notícias). Uma regra num só sítio, para que os dois jornais entrem pela mesma.

- e_covid(), urls_contexto(), env_publico(), chave(), rest() e gravar_debunking() saíram do
  script 11 sem mudar o que fazem (o gravar era o fim de finalizar()).
- Regra: a regra das áreas, opção B decidida pela Marta a 10/11/2026 para os dois jornais —
  as keywords activas MAIS a lista de scripts/termos_por_area.json (v4). Sem acentos nem
  maiúsculas, palavra inteira. "depressão" meteorológica fica de fora, pela mesma expressão
  de _shared/meteo.ts (TITULO_METEO), aplicada ao texto que casou.
- Uma linha por (endereço, eixo), com o primeiro termo que casou em `term`: primeiro as
  keywords (pela ordem eixo, termo da tabela), depois a lista, pela ordem do ficheiro.
"""
import json, os, re, sys, unicodedata, urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TERMOS = os.path.join(RAIZ, "scripts", "termos_por_area.json")

# ── covid-19 (Claude Code, 29/10/2026 — docs/evidencia/2026-10-29-fact-checks/covid-casos-duvidosos.md)
# Lê a afirmação, o título da verificação e o url, juntos.
#  1. termo forte, em qualquer data;
#  2. termo fraco, só entre 01/03/2020 e 31/12/2023 — fora dessa janela a Pfizer e o mRNA
#     aparecem noutras doenças (o hantavírus, em 2026).
COVID_FORTE = re.compile(r"covid|coronav|sars-?cov|[óo]micron|\bcorona\b|cov!d|\bc-?19\b|\bcv-?19\b", re.I)
COVID_FRACO = re.compile(r"pfizer|moderna|astrazeneca|janssen|biontech|\bm-?rna\b|spike|prote[íi]na s\b|grafeno|"
                         r"ivermectina|cloroquina|vacinad|refor[çc]o|\bdoses?\b", re.I)
JANELA_COVID = ("2020-03-01", "2023-12-31")

def e_covid(n):
    t = " ".join((n.get("title") or "", n.get("explicacao") or "", n.get("url") or ""))
    d = (n.get("data_publicacao") or "")[:10]
    return bool(COVID_FORTE.search(t)) or (bool(COVID_FRACO.search(t)) and JANELA_COVID[0] <= d <= JANELA_COVID[1])

def pares(lista):
    return {(e["url"], e["term"]) for e in lista}

def urls_contexto(caminho):
    """Os urls do ficheiro do --contexto. Falta o ficheiro, vem vazio ou sem url: pára."""
    if not os.path.exists(caminho):
        sys.exit("ERRO: não existe o ficheiro do --contexto: %s; nada gravado." % caminho)
    urls = {e["url"] for e in json.load(open(caminho)) if e.get("url")}
    if not urls:
        sys.exit("ERRO: o ficheiro do --contexto não tem urls: %s; nada gravado." % caminho)
    return urls

def env_publico():
    """URL e chave pública (só leitura). Primeiro do ambiente — no GitHub Actions são
    SUPABASE_URL e SUPABASE_ANON_KEY, definidos no topo do workflow; se não estiverem
    os dois, do .env (Mac, recolher_domingo.sh)."""
    url, anon = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY")
    if url and anon:
        return url, anon
    caminho = os.path.join(RAIZ, ".env")
    if not os.path.exists(caminho):
        sys.exit("ERRO: faltam SUPABASE_URL e SUPABASE_ANON_KEY no ambiente, e não há .env.")
    env = {}
    for l in open(caminho):
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

CAMPOS = ("term", "title", "classification", "source", "url", "keyword_id", "eixo",
          "explicacao", "data_publicacao", "covid", "contexto")

def gravar_debunking(url, novos):
    """Um só pedido = uma só instrução INSERT: entra tudo ou não entra nada (29/10/2026;
    antes eram pedidos de 200, e uma falha a meio deixava metade gravada)."""
    if not novos:
        print("GRAVADO: nada novo."); return
    key = chave("SUPABASE_SERVICE_ROLE_KEY")
    corpo = [{k: n.get(k) for k in CAMPOS} for n in novos]
    gravadas = rest(url, key, "debunking?select=id", "POST", corpo, prefer="return=representation")
    if len(gravadas or []) != len(corpo):
        sys.exit("ERRO: a base devolveu %d linhas de %d enviadas." % (len(gravadas or []), len(corpo)))
    print("GRAVADO: %d linhas em debunking (%d covid-19, %d contexto)"
          % (len(corpo), sum(n["covid"] for n in corpo), sum(n["contexto"] for n in corpo)))

def existentes_por_eixo(url, anon):
    """Os pares (url, eixo) já na base — uma verificação gravada num eixo não volta a entrar
    nesse eixo, seja qual for o termo com que casou da primeira vez."""
    return {(r["url"], r.get("eixo")) for r in rest(url, anon, "debunking?select=url,eixo") if r.get("url")}

# ── a regra das áreas (opção B, 10/11/2026) ──────────────────────────────────────────────
# A mesma expressão de supabase/functions/_shared/meteo.ts (TITULO_METEO), sem mudar.
TITULO_METEO = re.compile(r"\b(chuvas?|trovoadas?|ipma|tempestades?|precipitação|ventos?|agitação marítima)\b"
                          r"|aviso (amarelo|laranja|vermelho)|meteorol", re.I)

def sem_acentos(s):
    return "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")

class Regra:
    """keywords: [{id, term, axis}] da tabela, pela ordem eixo, termo. termos: o JSON v4."""
    def __init__(self, keywords, caminho_termos=TERMOS):
        lista = json.load(open(caminho_termos))
        self.versao = lista.get("_versao", "")[:2]
        entradas = [(k["axis"], k["term"], k.get("id")) for k in keywords]
        for eixo, termos in lista.items():
            if eixo.startswith("_"): continue
            entradas += [(eixo, t, None) for t in termos]
        self.pads = [(e, t, kid, re.compile(r"(?<![a-z0-9])" + re.escape(sem_acentos(t)) + r"(?![a-z0-9])"))
                     for e, t, kid in entradas]

    def casa(self, texto):
        """[(eixo, termo, keyword_id)] pela ordem da regra."""
        tx = sem_acentos(texto)
        return [(e, t, kid) for e, t, kid, p in self.pads
                if p.search(tx) and not ("depress" in sem_acentos(t) and TITULO_METEO.search(texto or ""))]

    def por_eixo(self, texto):
        """{eixo: (termo, keyword_id)} — o primeiro termo que casou em cada eixo."""
        out = {}
        for e, t, kid in self.casa(texto):
            out.setdefault(e, (t, kid))
        return out

# ── o fim comum: exclusões, covid, contexto, a lista, e gravar ou ensaio ──────────────────
# Saiu do script 11 (finalizar), sem mudar o que faz; o gravar é gravar_debunking().
def finalizar(args, url, novos):
    from collections import Counter
    print("por veredicto:", Counter(n["classification"] for n in novos).most_common())
    print("por eixo:", Counter(n["eixo"] for n in novos).most_common())
    print("por termo (top 10):", Counter(n["term"] for n in novos).most_common(10))
    # a lista toda, para a revisão da Marta antes de gravar (29/10); o que ela excluir vai
    # para um ficheiro JSON [{"url": ..., "term": ...}] passado em --excluir
    if getattr(args, "excluir", None):
        fora = {(e["url"], e["term"]) for e in json.load(open(args.excluir))}
        antes = len(novos)
        novos = [n for n in novos if (n["url"], n["term"]) not in fora]
        print("excluídas pela revisão: %d (no ficheiro: %d)" % (antes - len(novos), len(fora)))
    for n in novos:
        if n.get("data_publicacao"): n["data_publicacao"] = n["data_publicacao"][:10]
        n["covid"] = e_covid(n)
    if getattr(args, "covid_decisoes", None):
        dec = json.load(open(args.covid_decisoes))
        marcar, desmarcar = pares(dec.get("marcar", [])), pares(dec.get("desmarcar", []))
        for n in novos:
            if (n["url"], n["term"]) in marcar: n["covid"] = True
            if (n["url"], n["term"]) in desmarcar: n["covid"] = False
        print("decisões da covid: %d a marcar, %d a desmarcar" % (len(marcar), len(desmarcar)))
    print("covid-19: %d de %d" % (sum(n["covid"] for n in novos), len(novos)))
    for n in novos:
        n["contexto"] = n["url"] in args.urls_contexto
    if args.contexto:
        print("contexto: %d de %d (ficheiro: %d urls)" % (sum(n["contexto"] for n in novos), len(novos),
                                                          len(args.urls_contexto)))
    novos.sort(key=lambda n: (n["data_publicacao"] or "", n["eixo"], n["term"]), reverse=True)
    for i, n in enumerate(novos, 1):
        print("%3d. %s · %s · %s · %s%s%s · [%s] %s\n     %s" % (i, (n["data_publicacao"] or "?")[:10], n["source"],
              n["term"], n["eixo"], " · COVID" if n.get("covid") else "", " · CONTEXTO" if n.get("contexto") else "",
              n["classification"], n["title"], n["url"]))
    if getattr(args, "lista", None):
        # .md: a lista legível, para a revisão, e ao lado o .json com os mesmos dados
        # (é dele que sai o ficheiro do --excluir)
        base, ext = os.path.splitext(args.lista)
        json.dump(novos, open(base + ".json", "w"), ensure_ascii=False, indent=1)
        if ext == ".md":
            with open(args.lista, "w") as f:
                for i, n in enumerate(novos, 1):
                    f.write("%d. %s · %s · **%s** · %s · %s%s%s\n   %s\n   <%s>\n\n" % (i, (n["data_publicacao"] or "?")[:10],
                            n["source"], n["term"], n["eixo"], n["classification"],
                            " · COVID" if n.get("covid") else "", " · CONTEXTO" if n.get("contexto") else "",
                            " ".join(n["title"].split()), n["url"]))
    if args.gravar:
        gravar_debunking(url, novos)
    else:
        print("DRY-RUN: nada gravado.")
