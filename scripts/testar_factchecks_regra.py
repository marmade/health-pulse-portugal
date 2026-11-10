#!/usr/bin/env python3
"""testar_factchecks_regra.py — a regra das áreas e a leitura do veredicto do Polígrafo (sem rede)
================================================================================================
10/11/2026 (docs/sessoes/2026-11-10.md §9). python3 scripts/testar_factchecks_regra.py

Casos tirados dos dados reais de hoje (§6, §7, §9.7, §9.8) e das decisões da Marta (v4).
Sai com 1 se algum falhar.
"""
import importlib.util, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
from factchecks_comum import Regra
spec = importlib.util.spec_from_file_location("p12", os.path.join(AQUI, "12_fetch_poligrafo.py"))
p12 = importlib.util.module_from_spec(spec); spec.loader.exec_module(p12)

KWS = [dict(id="k-dem", term="demência", axis="saude-mental"), dict(id="k-dep", term="depressão sintomas", axis="saude-mental"),
       dict(id="k-vac", term="vacinas", axis="emergentes"), dict(id="k-avc", term="avc", axis="emergentes"),
       dict(id="k-rep", term="reposição hormonal", axis="menopausa"), dict(id="k-ond", term="onda de calor", axis="emergentes")]
r = Regra(KWS)
falhas = []
def ok(nome, cond):
    print(("ok    " if cond else "FALHA ") + nome)
    if not cond: falhas.append(nome)

# a regra
ok("bolos da DGS → alimentação, por 'bolos'", r.por_eixo("Indicações da DGS proíbem os bolos de aniversário nas escolas?") == {"alimentacao": ("bolos", None)})
ok("demência → saúde mental, pela keyword (com keyword_id)", r.por_eixo("Portugal é o terceiro país da Europa com maior prevalência de demência?") == {"saude-mental": ("demência", "k-dem")})
ok("Oreo → alimentação, sem acentos nem maiúsculas", "alimentacao" in r.por_eixo("BOLACHAS Oreo têm petróleo?"))
ok("ivermectina e covid → emergentes", r.por_eixo("Ivermectina tem 70% de eficácia contra a Covid-19?")["emergentes"][0] in ("covid", "covid-19", "ivermectina"))
ok("vacina no singular → emergentes", "emergentes" in r.por_eixo("Pfizer está a desenvolver vacina contra o hantavírus?"))
ok("vírus e intoxicação (v4)", "emergentes" in r.por_eixo("Metapneumovirus é um novo vírus?") and "emergentes" in r.por_eixo("quadro de intoxicação por metanol"))
ok("perda de memória (v4) → saúde mental", "saude-mental" in r.por_eixo("spray nasal que cura a perda de memória"))
ok("DIU → menopausa (v4; decisão da Marta: conta)", "menopausa" in r.por_eixo("dispositivo hormonal intrauterino (DIU) para prevenir a gravidez"))
ok("'hormonal' sozinho não casa (saiu na v3)", r.por_eixo("um dispositivo hormonal") == {})
ok("'reposição hormonal' casa pela keyword", r.por_eixo("terapia de reposição hormonal")== {"menopausa": ("reposição hormonal", "k-rep")})
ok("'calores' e 'testosterona' não casam (cortados na v4)", r.por_eixo("calores e testosterona") == {})
ok("enfarte não casa (saiu na v3)", r.por_eixo("Juiz morre depois de sofrer enfarte") == {})
ok("palavra inteira: 'avc' não casa dentro de outra palavra", r.por_eixo("havcx") == {})
ok("depressão meteorológica fica de fora", r.por_eixo("Depressão Charles traz chuva e vento forte") == {})
ok("depressão clínica entra", r.por_eixo("A depressão é uma doença?") == {"saude-mental": ("depressão", None)})
ok("primeiro termo: keyword antes da lista", r.por_eixo("vacinas e vacina")["emergentes"] == ("vacinas", "k-vac"))
ok("um termo por eixo, dois eixos", set(r.por_eixo("vacinas e bolos")) == {"emergentes", "alimentacao"})

# o veredicto do Polígrafo
HTML = '''<div class="fact--check-container verdict--true" style="--bgcolor: var(--clr-true)">
  <div class="fact--check-meter">
      <img src="/img/meter/meter-03-true-dark.gif" alt="Verdadeiro" width="90" decoding="async">
  </div></div><script type="application/ld+json">{"datePublished":"2026-10-11T10:00:02.000+01:00"}</script>'''
ok("lê veredicto, classe e data", p12.da_pagina(HTML) == ("Verdadeiro", "true", "2026-10-11"))
ok("'Verdadeiro, mas…' com reticências de um carácter", p12.normaliza_veredicto("Verdadeiro, mas…") == "Verdadeiro, mas...")
ok("'PIMENTA NA LÍNGUA' → forma da escala", p12.normaliza_veredicto("PIMENTA NA LÍNGUA") == "Pimenta na Língua")
ok("veredicto fora da escala → None", p12.normaliza_veredicto("Enganador") is None)
ok("sem caixa → sem veredicto", p12.da_pagina("<html></html>")[0] is None)
ok("sitemap: só fact-checks", [i["url"] for i in p12.do_sitemap('''<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
 <url><loc >https://poligrafo.iol.pt/fact-check/a</loc><news:news><news:title>A?</news:title><news:publication_date>2026-11-01T09:00:00Z</news:publication_date></news:news></url>
 <url><loc>https://poligrafo.iol.pt/artigos/b</loc></url>
 <url><loc>https://poligrafo.iol.pt/fact-checks/sociedade/c</loc></url></urlset>''')] == ["https://poligrafo.iol.pt/fact-check/a", "https://poligrafo.iol.pt/fact-checks/sociedade/c"])

print("\n%d falha(s)" % len(falhas)); sys.exit(1 if falhas else 0)
