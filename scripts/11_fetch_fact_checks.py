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
       Dos editores portugueses testados, só o Observador (observador.pt) tem volume
       no índice. O Polígrafo deu 0 a 18/09 (poligrafo.sapo.pt, sapo.pt, poligrafo.pt)
       e 3 verificações, todas de Dezembro de 2024, a 28/09 (docs/sessoes/2026-09-28-c.md).
       A 10/11/2026 viu-se porquê: o Polígrafo mudou para poligrafo.iol.pt e as páginas
       não têm ClaimReview (docs/sessoes/2026-11-10.md §7). Este script nunca teve filtro
       do Polígrafo; o Polígrafo entra pelo scripts/12_fetch_poligrafo.py (passo 6C).
       Veredictos do Observador: Errado,
       Enganador, Esticado, Certo — guardam-se TAL COMO VÊM, sem traduzir para uma
       escala nossa.

COMO   python3 scripts/11_fetch_fact_checks.py --dry-run       # mostra, não grava
       SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/11_fetch_fact_checks.py --gravar
       No GitHub corre todas as segundas, antes do arquivo semanal (passo 6B, com --contexto
       docs/evidencia/2026-10-29-fact-checks/exclusoes.json desde 2/11/2026): pesquisa e
       grava o que for novo, sem revisão (princípio da Marta, 28/09: os dados entram
       automaticamente, as análises é que se revêem).

PRIMEIRA CARGA (29/10/2026) — grava a lista revista pela Marta, sem pesquisar outra vez
       (a API não devolve o mesmo entre corridas):
       python3 scripts/11_fetch_fact_checks.py --gravar \
         --de-lista docs/evidencia/2026-10-29-fact-checks/lista-dry-run.json \
         --excluir docs/evidencia/2026-10-29-fact-checks/exclusoes.json \
         --covid-decisoes docs/evidencia/2026-10-29-fact-checks/covid-decisoes.json

CONTEXTO (2/11/2026) — coluna `contexto`: true nas verificações laterais à saúde (decisão
       da Marta: não se apagam, ficam como indícios, fora do ecrã e do briefing). Marca-a o
       --contexto FICHEIRO, por url (o assunto do artigo, não a keyword com que casou). No
       passo 6B o ficheiro é docs/evidencia/2026-10-29-fact-checks/exclusoes.json: a 2/11 o
       6B corria sem --excluir e as 21 exclusões de 29/10 que a API voltou a devolver
       entraram sem marca (docs/sessoes/2026-11-02.md).

COVID-19 (29/10/2026) — coluna `covid`: true quando a covid é o assunto da afirmação
       (critério da Marta). Marca-a a regra e_covid(), abaixo; na primeira carga, mais as
       decisões da Marta sobre os casos duvidosos (--covid-decisoes).

REGRA DAS ÁREAS (10/11/2026, docs/sessoes/2026-11-10.md §9) — opção B, decidida pela Marta
       para os dois jornais: as keywords activas MAIS a lista de scripts/termos_por_area.json
       (v4), aplicadas localmente por factchecks_comum.Regra. Até aqui era uma pesquisa à API
       por keyword (query=<keyword>), que só apanhava o que o Google associava à palavra: em
       12 meses, 11 das 17 verificações de saúde do Observador (§6). Agora pede a lista do
       Observador dos últimos DIAS_OBSERVADOR dias, sem keyword, e aplica a regra ao texto
       da afirmação, ao título da verificação e ao endereço. O Polígrafo entra pela mesma
       regra, no scripts/12_fetch_poligrafo.py (passo 6C): mudou para poligrafo.iol.pt e as
       páginas não têm ClaimReview, por isso não está nesta API (§7). As regras comuns
       (covid, contexto, gravar) estão em scripts/factchecks_comum.py.

O QUE GRAVA em `debunking`: term (o primeiro termo que casou: keyword ou termo da lista),
title (a afirmação verificada), classification (o veredicto do editor), source (editor), url
(a verificação), data_publicacao, eixo, keyword_id (só quando casou uma keyword), explicacao
(o título da verificação), covid, contexto. Uma linha por (url, eixo); não repete o que já lá
está nesse eixo. Grava tudo num só pedido: entra tudo ou não entra nada.
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request
from factchecks_comum import (urls_contexto, env_publico, chave, rest, existentes_por_eixo,
                              Regra, finalizar)

EDITORES_PT = ["observador.pt"]        # o Polígrafo entra pelo scripts/12_fetch_poligrafo.py
DIAS_OBSERVADOR = 60                   # a corrida é semanal: 60 dias dão folga para semanas falhadas
PAUSA = 0.3

def claims_do_editor(api_key, site, dias):
    """Tudo o que a API tem do editor nos últimos `dias` dias, sem keyword; todas as páginas."""
    p = dict(reviewPublisherSiteFilter=site, maxAgeDays=dias, pageSize=100, key=api_key)
    out, token = [], None
    while True:
        if token: p["pageToken"] = token
        d = json.load(urllib.request.urlopen("https://factchecktools.googleapis.com/v1alpha1/claims:search?" + urllib.parse.urlencode(p)))
        out += d.get("claims", []); token = d.get("nextPageToken")
        if not token: break
        time.sleep(PAUSA)
    return out

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true"); g.add_argument("--gravar", action="store_true")
    ap.add_argument("--excluir", help="JSON com os pares {url, term} que a revisão deixou de fora")
    ap.add_argument("--lista", help="grava a lista final (depois das exclusões) neste JSON")
    ap.add_argument("--de-lista", help="não pesquisa: lê a lista (JSON do --lista) revista à mão")
    ap.add_argument("--covid-decisoes", help='JSON {"marcar": [{url, term}], "desmarcar": [...]} que corrige a regra')
    ap.add_argument("--contexto", help="JSON [{url, ...}]: as verificações destes urls gravam-se com contexto = true")
    args = ap.parse_args()
    # lido antes de pesquisar: se o ficheiro faltar, pára sem gravar nada, em vez de gravar
    # sem a marca (2/11/2026)
    args.urls_contexto = urls_contexto(args.contexto) if args.contexto else set()
    url, anon = env_publico()
    # o par (url, keyword), como o dedup dentro da corrida — só por url, uma verificação
    # gravada para a keyword A nunca entrava para a B (achado da revisão de 18/09)
    existentes = {(r["url"], r.get("term")) for r in rest(url, anon, "debunking?select=url,term") if r.get("url")}
    if args.de_lista:
        lida = json.load(open(args.de_lista))
        novos = [n for n in lida if (n["url"], n["term"]) not in existentes]
        print("lista: %s — %d verificações, %d já na base" % (args.de_lista, len(lida), len(lida) - len(novos)))
    else:
        novos = pesquisar(url, anon, existentes_por_eixo(url, anon))
    finalizar(args, url, novos)

def pesquisar(url, anon, existentes):
    """A lista do Observador dos últimos DIAS_OBSERVADOR dias, e a regra das áreas aplicada
    localmente (10/11/2026). `existentes`: os pares (url, eixo) já na base."""
    api_key = chave("GOOGLE_FACTCHECK_API_KEY")
    kws = rest(url, anon, "keywords?select=id,term,axis&is_active=eq.true&order=axis,term")
    regra = Regra(kws)
    novos, vistos, lidas, casaram = [], set(), 0, 0
    for site in EDITORES_PT:
        try:
            cl = claims_do_editor(api_key, site, DIAS_OBSERVADOR)
        except Exception as e:
            # a falha da lista não é "semana sem verificações"; e a mensagem não leva a chave
            sys.exit("ERRO: a lista de %s falhou (%s); nada gravado." % (site, str(e).replace(api_key, "***")[:160]))
        if not cl:
            sys.exit("ERRO: a API não devolveu nenhuma verificação de %s em %d dias; nada gravado." % (site, DIAS_OBSERVADOR))
        for c in cl:
            r = c["claimReview"][0]
            u = r.get("url", "")
            if not u or site not in u: continue
            lidas += 1
            texto = " ".join([c.get("text") or "", r.get("title") or "", u.rstrip("/").split("/")[-1].replace("-", " ")])
            areas = regra.por_eixo(texto)
            if areas: casaram += 1
            for eixo, (termo, kid) in areas.items():
                if (u, eixo) in existentes or (u, eixo) in vistos: continue
                vistos.add((u, eixo))
                novos.append(dict(term=termo, title=(c.get("text") or "")[:500],
                                  classification=(r.get("textualRating") or "sem veredicto").strip(),
                                  source=r["publisher"].get("name") or site, url=u,
                                  keyword_id=kid, eixo=eixo,
                                  explicacao=(r.get("title") or "")[:500],
                                  data_publicacao=(r.get("reviewDate") or "")[:10] or None))
    print("regra %s | %s: %d verificações em %d dias | casaram com a regra: %d | novas (url, eixo): %d | já na base: %d"
          % (regra.versao, "+".join(EDITORES_PT), lidas, DIAS_OBSERVADOR, casaram, len(novos), len(existentes)))
    return novos

if __name__ == "__main__":
    main()
