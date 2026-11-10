"""Compara três regras nos três conjuntos de 10/11/2026: v1 (sem 'sem área'), v3 (decisões da
Marta) e v3 + termos novos de Menopausa (propostos depois do teste). Só leitura de ficheiros.

Regra: as 100 keywords activas + a lista; sem acentos, minúsculas, palavra inteira;
'depressão' meteorológica sai (aproximação de _shared/meteo.ts).
Conjuntos: Observador 12 meses (507, com leitura do §6); Polígrafo 18/08-10/11 (312, leitura
do §7); Observador 10/11/2024-09/11/2025 (565, sem leitura completa: mostram-se as que a regra
apanha e as diferenças entre regras, para ler à mão).
"""
import json, os, re, unicodedata, xml.etree.ElementTree as ET
AQUI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(os.path.dirname(AQUI)))
P = lambda *a: os.path.join(R, *a)
def n(s): return "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")
METEO = re.compile(r"tempestade|chuva|vento|ipma|meteorolog|alerta (amarelo|laranja|vermelho)|charles|kristin|bruna|nevao|atlantico")
KW = [(k["axis"], k["term"]) for k in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/keywords_activas.json")))]

def regra(ficheiro, grupos_extra=()):
    L = json.load(open(os.path.join(AQUI, ficheiro))); out = list(KW)
    for eixo, gs in L.items():
        if eixo.startswith("_") and eixo not in grupos_extra: continue
        e = "menopausa" if eixo.startswith("_menopausa") else eixo
        for g in gs:
            for t in g["termos"]: out.append((e, t))
    return [(e, t, re.compile(r"(?<![a-z0-9])" + re.escape(n(t)) + r"(?![a-z0-9])")) for e, t in out]

def casa(pads, texto):
    tx = n(texto); m = []
    for e, t, p in pads:
        if p.search(tx) and not (n(t) == "depressao" and METEO.search(tx)): m.append((e, t))
    return m

REGRAS = {"v1": regra("termos_v1.json"), "v3": regra("termos_v3.json"),
          "v3+novos": regra("termos_v3.json", ("_menopausa_novos_propostos_depois_do_teste",))}

o12 = {x["url"]: x for x in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/4_observador_12meses.json")))}
obs = [dict(d=x["reviewDate"], a=x["area_leitura"], t=x["title"] or "", u=x["url"],
            tx=" ".join([x["title"] or "", o12[x["url"]].get("text") or "", x["url"].rstrip("/").split("/")[-1].replace("-", " ")]))
       for x in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/5_classificacao_observador.json")))["verificacoes"]]
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "n": "http://www.google.com/schemas/sitemap-news/0.9"}
tags = {u.findtext("s:loc", namespaces=ns).strip(): u.findtext("n:news/n:keywords", namespaces=ns) or ""
        for u in ET.parse(P("docs/evidencia/2026-11-10-poligrafo-acesso/sitemap_news_2026-11-10.xml")).getroot().findall("s:url", ns)}
pol = [dict(d=x["data"], a=x["area_leitura"], u=x["url"], t=x["titulo"] or x["url"].rstrip("/").split("/")[-1].replace("-", " "),
            tx=" ".join([x["titulo"] or "", x["url"].rstrip("/").split("/")[-1].replace("-", " "), tags.get(x["url"], "")]))
       for x in json.load(open(P("docs/evidencia/2026-11-10-cobertura-api/8_classificacao_poligrafo.json")))["verificacoes"]]
ant = [dict(d=x["reviewDate"], a=None, u=x["url"], t=x["title"] or "",
            tx=" ".join([x["title"] or "", x.get("text") or "", x["url"].rstrip("/").split("/")[-1].replace("-", " ")]))
       for x in json.load(open(os.path.join(AQUI, "observador_2024-11_2025-11.json")))]

AREAS = {"saude-mental", "alimentacao", "menopausa", "emergentes"}
resumo = {}
for nome, ds in [("Observador 12 meses", obs), ("Polígrafo 18/08-10/11", pol), ("Observador 2024-25 (controlo)", ant)]:
    print("\n==", nome, len(ds))
    sets = {}
    for r, pads in REGRAS.items():
        hits = {x["u"]: (x, casa(pads, x["tx"])) for x in ds}
        hits = {u: v for u, v in hits.items() if v[1]}
        sets[r] = hits
        if ds is not ant:
            c = dict(areas=sum(v[0]["a"] in AREAS for v in hits.values()), contexto=sum(v[0]["a"] == "contexto" for v in hits.values()),
                     sem_area=sum(v[0]["a"] == "saude-sem-area" for v in hits.values()), fora=sum(v[0]["a"] == "fora" for v in hits.values()))
            print("  %-9s apanha %3d  → nas áreas %d, contexto %d, sem área %d, FORA (engano) %d" % (r, len(hits), c["areas"], c["contexto"], c["sem_area"], c["fora"]))
        else:
            print("  %-9s apanha %3d" % (r, len(hits)))
        resumo.setdefault(nome, {})[r] = sorted(hits)
    for a, b in [("v1", "v3"), ("v3", "v3+novos")]:
        sai = [sets[a][u] for u in sets[a] if u not in sets[b]]; entra = [sets[b][u] for u in sets[b] if u not in sets[a]]
        for rot, lst in [("sai em %s" % b, sai), ("entra em %s" % b, entra)]:
            for x, m in lst: print("    %-16s %s [%s] %s ← %s" % (rot, x["d"], x["a"] or "?", x["t"][:85], ", ".join(sorted({t for _, t in m}))))
    # eixo de cada uma com a v3+novos, para as que mudam de eixo face à v1
    for u in sets["v3"]:
        e1 = sorted({e for e, _ in sets["v1"].get(u, (None, []))[1]}); e3 = sorted({e for e, _ in sets["v3"][u][1]})
        if u in sets["v1"] and e1 != e3: print("    eixo muda      %s %s → %s  %s" % (sets["v3"][u][0]["d"], e1, e3, sets["v3"][u][0]["t"][:70]))
json.dump(resumo, open(os.path.join(AQUI, "comparar_v1_v3.json"), "w"), ensure_ascii=False, indent=1)
