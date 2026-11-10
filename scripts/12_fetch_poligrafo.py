#!/usr/bin/env python3
"""
12_fetch_poligrafo.py — fact-checks do Polígrafo nas quatro áreas, com veredicto
=================================================================================
10/11/2026 (docs/sessoes/2026-11-10.md §7–§9). Decisão da Marta: o Polígrafo entra na
recolha de fact-checks. Não está na Google Fact Check Tools API (mudou para poligrafo.iol.pt
e as páginas não têm ClaimReview — §7), por isso lê-se do próprio site.

ACESSO  robots.txt de poligrafo.iol.pt (lido a 10/11/2026, §8.1): permite o acesso, menos
        algumas pastas técnicas; não se usa /search. Termos de utilização: nada sobre recolha
        automática (§8.2). Recolhem-se só metadados, uma vez por semana.

COMO    1 pedido ao sitemap de notícias (sitemaps/news.xml, ~6 semanas) → ficam os endereços
        /fact-check/ e /fact-checks/ → regra das áreas (factchecks_comum.Regra: keywords
        activas + scripts/termos_por_area.json, v4), sobre o título, o endereço e as
        etiquetas do sitemap → tiram-se os pares (url, eixo) já na base → abre-se só cada
        verificação seleccionada, com PAUSA s entre pedidos e o nome do projecto na
        identificação, para ler o veredicto e a data de publicação → grava tudo ou nada.

        python3 scripts/12_fetch_poligrafo.py --dry-run --contexto FICHEIRO   # mostra, não grava
        SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/12_fetch_poligrafo.py --gravar --contexto FICHEIRO
        No GitHub: passo 6C, a seguir ao 6B (Observador) e antes do arquivo (7).

VEREDICTO  O do Polígrafo, TAL COMO VEM (decisão da Marta, 10/11/2026, §8.8): o texto
        alternativo da imagem do medidor, dentro da caixa `fact--check-container
        verdict--<valor>`. Tem de ser um dos 7 da escala publicada em "O nosso método"
        (§8.7); se não se ler, a verificação fica "sem veredicto" e, com --gravar, a corrida
        pára sem gravar nada (volta a tentar na semana seguinte: não fica na base).
        Que veredictos se mostram decide-o _shared/factchecks.ts, não este script.

O QUE GRAVA em `debunking` (as colunas que já existem, §9.2): source "Polígrafo", url, title
(o título do Polígrafo), classification (o veredicto), data_publicacao (datePublished da
página; se faltar, a do sitemap), eixo, term (o primeiro termo que casou), keyword_id (só se
casou uma keyword), explicacao vazia, covid (e_covid), contexto (--contexto). Uma linha por
(url, eixo).
"""
import argparse, re, sys, time, urllib.request, xml.etree.ElementTree as ET
from factchecks_comum import urls_contexto, env_publico, rest, existentes_por_eixo, Regra, finalizar

SITEMAP = "https://poligrafo.iol.pt/sitemaps/news.xml"
SOURCE = "Polígrafo"
PAUSA = 2.0
IDENTIFICACAO = ("health-pulse-portugal/1.0 (projecto de investigação académica, sem fins comerciais; "
                 "+https://github.com/marmade/health-pulse-portugal)")
ESCALA = ("Verdadeiro", "Verdadeiro, mas...", "Impreciso", "Descontextualizado", "Manipulado", "Falso",
          "Pimenta na Língua")
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "n": "http://www.google.com/schemas/sitemap-news/0.9"}

def pedir(u):
    if "/search" in u:
        sys.exit("ERRO: /search é proibido pelo robots.txt do Polígrafo; nada gravado.")
    req = urllib.request.Request(u, headers={"User-Agent": IDENTIFICACAO})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")

def do_sitemap(xml):
    """[{url, titulo, data, etiquetas}] dos fact-checks do sitemap de notícias."""
    out = []
    for u in ET.fromstring(xml).findall("s:url", NS):
        loc = (u.findtext("s:loc", namespaces=NS) or "").strip()
        if "/fact-check/" not in loc and "/fact-checks/" not in loc: continue
        out.append(dict(url=loc, titulo=(u.findtext("n:news/n:title", namespaces=NS) or "").strip(),
                        data=(u.findtext("n:news/n:publication_date", namespaces=NS) or "")[:10],
                        etiquetas=(u.findtext("n:news/n:keywords", namespaces=NS) or "").strip()))
    return out

def normaliza_veredicto(v):
    """O texto como o Polígrafo o escreve, se for um dos 7; senão None. Aceita reticências
    como um só carácter (…) e diferenças de maiúsculas, e devolve a forma da escala."""
    w = " ".join((v or "").replace("…", "...").split()).lower()
    return next((e for e in ESCALA if e.lower() == w), None)

def da_pagina(html):
    """(veredicto ou None, classe verdict--… ou None, datePublished AAAA-MM-DD ou None)."""
    m = re.search(r'class="fact--check-container verdict--([a-z0-9-]+)"', html)
    classe, ver = (m.group(1) if m else None), None
    if m:
        bloco = html[m.end():m.end() + 2000]
        alt = re.search(r'class="fact--check-meter"[^>]*>\s*<img[^>]+alt="([^"]+)"', bloco)
        ver = normaliza_veredicto(alt.group(1)) if alt else None
    d = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})', html)
    return ver, classe, (d.group(1) if d else None)

def endereco(u):
    return u.rstrip("/").split("/")[-1].replace("-", " ")

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true"); g.add_argument("--gravar", action="store_true")
    ap.add_argument("--contexto", help="JSON [{url, ...}]: as verificações destes urls gravam-se com contexto = true")
    ap.add_argument("--lista", help="grava a lista final neste ficheiro (.md legível + .json ao lado)")
    args = ap.parse_args()
    args.urls_contexto = urls_contexto(args.contexto) if args.contexto else set()
    url, anon = env_publico()
    kws = rest(url, anon, "keywords?select=id,term,axis&is_active=eq.true&order=axis,term")
    regra = Regra(kws)
    existentes = existentes_por_eixo(url, anon)

    try:
        itens = do_sitemap(pedir(SITEMAP))
    except Exception as e:
        sys.exit("ERRO: o sitemap do Polígrafo falhou (%s); nada gravado." % str(e)[:160])
    if not itens:
        sys.exit("ERRO: o sitemap do Polígrafo não trouxe nenhum fact-check; nada gravado.")
    datas = sorted(i["data"] for i in itens if i["data"])

    selec, casaram = [], 0
    for it in itens:
        areas = regra.por_eixo(" ".join([it["titulo"], endereco(it["url"]), it["etiquetas"]]))
        if areas: casaram += 1
        for eixo, (termo, kid) in areas.items():
            if (it["url"], eixo) not in existentes:
                selec.append((it, eixo, termo, kid))

    paginas, sem = {}, []
    for u in dict.fromkeys(it["url"] for it, _, _, _ in selec):
        time.sleep(PAUSA)
        try:
            ver, classe, dpub = da_pagina(pedir(u))
        except Exception as e:
            ver, classe, dpub = None, "erro: %s" % str(e)[:80], None
        paginas[u] = (ver, dpub)
        if not ver:
            sem.append((u, classe))

    novos = []
    for it, eixo, termo, kid in selec:
        ver, dpub = paginas[it["url"]]
        novos.append(dict(term=termo, title=it["titulo"][:500], classification=ver or "sem veredicto",
                          source=SOURCE, url=it["url"], keyword_id=kid, eixo=eixo, explicacao=None,
                          data_publicacao=dpub or it["data"] or None))

    print("regra %s | sitemap: %d fact-checks (%s a %s) | casaram com a regra: %d | novas (url, eixo): %d | "
          "páginas abertas: %d | veredictos lidos: %d | sem veredicto: %d"
          % (regra.versao, len(itens), datas[0] if datas else "?", datas[-1] if datas else "?", casaram,
             len(novos), len(paginas), len(paginas) - len(sem), len(sem)))
    for u, classe in sem:
        print("  SEM VEREDICTO: %s (%s)" % (u, classe))
    if sem and args.gravar:
        sys.exit("ERRO: %d verificação(ões) sem veredicto lido; nada gravado (voltam na próxima corrida)." % len(sem))
    finalizar(args, url, novos)

if __name__ == "__main__":
    main()
