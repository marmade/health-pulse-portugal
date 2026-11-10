"""Teste da lista de termos por área (opção B) nos dados de 10/11/2026. Só leitura de ficheiros
do repositório. Compara com a classificação (leitura do Claude Code) feita no §6 e no §7.

Regra testada: as 100 keywords activas + termos_v1.json; texto sem acentos, minúsculas,
palavra inteira. Observador: title + text (afirmação) + endereço. Polígrafo: título +
endereço + etiquetas do sitemap. 'depressão' meteorológica sai pela mesma ideia de
_shared/meteo.ts (aqui: palavras de tempo na mesma frase — aproximação, declarada).

Uso: python3 testar.py [--sem-area]   (--sem-area junta a lista '_sem_area_decide_a_Marta')
"""
import json, os, re, sys, unicodedata, xml.etree.ElementTree as ET
from collections import Counter, defaultdict

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
P = lambda *a: os.path.join(R, *a)
SEM_AREA = "--sem-area" in sys.argv

def n(s): return "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")
METEO = re.compile(r"tempestade|chuva|vento|ipma|meteorolog|alerta (amarelo|laranja|vermelho)|charles|kristin|bruna|nevao|atlantico")

regras = []   # (eixo, termo, origem, padrão)
for k in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/keywords_activas.json"))):
    regras.append((k["axis"], k["term"], "keyword", k["term"]))
lista = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "termos_v1.json")))
for eixo, grupos in lista.items():
    if eixo.startswith("_nota"): continue
    if eixo.startswith("_sem_area") and not SEM_AREA: continue
    for g in grupos:
        for t in g["termos"]:
            regras.append(("sem-area" if eixo.startswith("_sem") else eixo, t, "lista", t))
pad = [(e, t, o, re.compile(r"(?<![a-z0-9])" + re.escape(n(p)) + r"(?![a-z0-9])")) for e, t, o, p in regras]

def casa(texto):
    tx = n(texto); out = []
    for e, t, o, p in pad:
        if p.search(tx):
            if n(t) == "depressao" and METEO.search(tx): continue
            out.append((e, t, o))
    return out

AREAS = {"saude-mental", "alimentacao", "menopausa", "emergentes"}
def avaliar(nome, itens):
    res = dict(entra_areas=[], entra_sem_area=[], entra_contexto=[], falsos_positivos=[], escapa=[])
    for x in itens:
        m = casa(x["texto"]); a = x["area"]
        so_kw = any(o == "keyword" for _, _, o in m)
        r = dict(data=x["data"], area_leitura=a, termos=sorted({t for _, t, _ in m}), eixos=sorted({e for e, _, _ in m}),
                 so_pela_lista=bool(m) and not so_kw, titulo=x["titulo"][:110], url=x["url"])
        if m and a in AREAS: res["entra_areas"].append(r)
        elif m and a == "saude-sem-area": res["entra_sem_area"].append(r)
        elif m and a == "contexto": res["entra_contexto"].append(r)
        elif m: res["falsos_positivos"].append(r)
        elif a in AREAS or a == "saude-sem-area": res["escapa"].append(r)
    tot = Counter(x["area"] for x in itens)
    print("== %s: %d verificações; leitura: %s" % (nome, len(itens), dict(tot)))
    for k, v in res.items():
        print("  %-17s %3d   (só pela lista nova: %d)" % (k, len(v), sum(r["so_pela_lista"] for r in v)))
        for r in v: print("     %s [%s] %s ← %s" % (r["data"], r["area_leitura"], r["titulo"][:80], ", ".join(r["termos"])))
    # acerto do eixo
    errado = [r for r in res["entra_areas"] if r["area_leitura"] not in r["eixos"]]
    print("  eixo diferente da leitura: %d %s" % (len(errado), [(r["titulo"][:50], r["eixos"]) for r in errado]))
    return res

obs_txt = {x["url"]: x for x in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/4_observador_12meses.json")))}
obs = [dict(data=x["reviewDate"], area=x["area_leitura"], url=x["url"], titulo=x["title"] or "",
            texto=" ".join([x["title"] or "", obs_txt[x["url"]].get("text") or "", x["url"].rstrip("/").split("/")[-1].replace("-", " ")]))
       for x in json.load(open(P("docs/evidencia/2026-11-10-editores-fact-check/5_classificacao_observador.json")))["verificacoes"]]
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "n": "http://www.google.com/schemas/sitemap-news/0.9"}
tags = {u.findtext("s:loc", namespaces=ns).strip(): u.findtext("n:news/n:keywords", namespaces=ns) or ""
        for u in ET.parse(P("docs/evidencia/2026-11-10-poligrafo-acesso/sitemap_news_2026-11-10.xml")).getroot().findall("s:url", ns)}
pol = [dict(data=x["data"], area=x["area_leitura"], url=x["url"], titulo=x["titulo"] or x["url"].rstrip("/").split("/")[-1].replace("-", " "),
            texto=" ".join([x["titulo"] or "", x["url"].rstrip("/").split("/")[-1].replace("-", " "), tags.get(x["url"], "")]))
       for x in json.load(open(P("docs/evidencia/2026-11-10-cobertura-api/8_classificacao_poligrafo.json")))["verificacoes"]]

out = dict(sem_area_incluida=SEM_AREA, observador=avaliar("Observador (12 meses)", obs), poligrafo=avaliar("Polígrafo (18/08 a 10/11)", pol))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "resultado%s.json" % ("_com_sem_area" if SEM_AREA else "")), "w"), ensure_ascii=False, indent=1)
