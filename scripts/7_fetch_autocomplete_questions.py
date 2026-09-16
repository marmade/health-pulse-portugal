"""
7_fetch_autocomplete_questions.py
==================================
Reportagem Viva — recolhe perguntas reais de saúde via Google Autocomplete
para cada keyword activa e guarda na tabela health_questions do Supabase.

FONTE: Google Autocomplete — as sugestões que aparecem enquanto se escreve.
Campo source="autocomplete" distingue estes registos dos do script 6 (pytrends).

O QUE ESTE SCRIPT NÃO MEDE, E POR ISSO NÃO INVENTA (reescrito 16/09/2026)
  O Autocomplete NÃO publica volumes de pesquisa nem crescimento. Até hoje o
  script gravava `relative_volume = max(10, 100 - pos*5)` — a posição na lista
  vestida de procura — e `growth_percent = 0` como se medisse crescimento. O
  dashboard desenhava esse número numa barra ao lado de cada pergunta.
  Agora grava NULL nos dois, e a posição REAL em `posicao`, com o molde que a
  produziu em `seed`. Ver a migração 20260916180000.

  A posição reinicia em cada molde. Antes acumulava ao longo dos 10, logo a
  19.ª sugestão de um tema recebia o valor de chão mesmo sendo a primeira do
  seu molde.

PAÍS: `client=chrome`, porque com `client=firefox` o parâmetro `gl` não tem
efeito nenhum (verificado 07/09/2026 e repetido 16/09). Com `chrome` tem efeito
residual — em três seeds testadas, duas deram resultados idênticos para PT e BR.
NÃO torna os dados portugueses; torna verdade que se pediu Portugal.

COMPLEMENTARIDADE COM SCRIPT 6:
  Script 6 (pytrends)      → o que está a CRESCER recentemente
  Script 7 (autocomplete)  → o que as pessoas PERGUNTAM mais (baseline)
  Quando uma query aparece nas duas fontes → sinal forte de relevância

UPSERT: chave única (question, axis, source).
Requer constraint health_questions_question_axis_source_key na tabela.

Como correr manualmente:
  python3 7_fetch_autocomplete_questions.py

Requer a variavel de ambiente SUPABASE_SERVICE_ROLE_KEY (GitHub Secret).
Sem ela o script para imediatamente, em vez de correr sem gravar nada.
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timezone

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
# A chave vem do ambiente — GitHub Secret SUPABASE_SERVICE_ROLE_KEY.
# SEM valor por defeito e SEM voltar à chave anon: desde 09/09/2026 a anon
# deixa de ter escrita, e um fallback silencioso faria o script correr até ao
# fim a não gravar nada. Se a variável faltar, pára aqui e em voz alta.
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_KEY:
    sys.exit(
        "ERRO: falta a variavel de ambiente SUPABASE_SERVICE_ROLE_KEY.\n"
        "      Definir como GitHub Secret e passa-la ao passo do workflow.\n"
        "      A chave NUNCA deve ser escrita no codigo."
    )

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

HEADERS_UPSERT = {
    **HEADERS,
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

SOURCE = "autocomplete"
PAUSA_ENTRE_SEEDS = 0.5

AXIS_LABELS = {
    "saude-mental": "Saúde Mental",
    "alimentacao": "Alimentação",
    "menopausa": "Menopausa",
    "emergentes": "Emergentes",
}

SEEDS_TEMPLATES = [
    "sintomas de {keyword}",
    "como tratar {keyword}",
    "o que é {keyword}",
    "causas de {keyword}",
    "tratamento para {keyword}",
    "como prevenir {keyword}",
    "é normal ter {keyword}",
    "{keyword} sintomas",
    "{keyword} tratamento",
    "{keyword} causas",
]

AUTOCOMPLETE_URL = "https://suggestqueries.google.com/complete/search"


def buscar_keywords() -> list[dict]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term,axis,category", "is_active": "eq.true"},
    )
    r.raise_for_status()
    return r.json()


def upsert_perguntas(perguntas: list[dict]) -> bool:
    if not perguntas:
        return True
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/health_questions?on_conflict=question,axis,source",
        headers=HEADERS_UPSERT,
        json=perguntas,
    )
    if r.status_code not in (200, 201, 204):
        print(f"    ERRO upsert: {r.status_code} {r.text[:200]}")
        return False
    return True


def buscar_autocomplete(seed: str) -> list[str]:
    try:
        r = requests.get(
            AUTOCOMPLETE_URL,
            params={"q": seed, "hl": "pt", "gl": "PT", "client": "chrome"},
            headers={"Accept-Language": "pt-PT,pt;q=0.9"},
            timeout=8,
        )
        if r.status_code != 200:
            return []
        data = json.loads(r.text)
        sugestoes = data[1] if len(data) > 1 else []
        return [s.strip() for s in sugestoes if isinstance(s, str) and s.strip()]
    except Exception as e:
        print(f"    Erro autocomplete '{seed}': {e}")
        return []


# Moldes que produzem uma pergunta, e marcas de pergunta no próprio texto.
# Até 16/09/2026 este campo era fixo a True para tudo o que viesse do
# autocomplete — o que tornava a coluna inútil para filtrar, e deixava passar
# para o dashboard coisas como "avc toy" ou "stress hídrico" vindas do script 6.
MOLDES_INTERROGATIVOS = {
    "sintomas de {keyword}",
    "como tratar {keyword}",
    "o que é {keyword}",
    "causas de {keyword}",
    "tratamento para {keyword}",
    "como prevenir {keyword}",
    "é normal ter {keyword}",
}

MARCAS_DE_PERGUNTA = (
    "o que", "o'que", "como ", "quais ", "qual ", "quando ", "onde ",
    "porque", "porquê", "para que", "sintomas", "causas", "tratamento",
    "é normal", "e normal", "tem cura", "faz mal", "serve para", "significa",
)


def e_pergunta(sugestao: str, molde: str) -> bool:
    """Se o molde pede uma pergunta, o que dele sai é pergunta.

    O Google devolve também continuações que já não são a pergunta do molde —
    por isso confirma-se no texto.

    ESPERA-SE QUE DÊ True QUASE SEMPRE, e isso não é defeito: os 10 moldes são
    todos em forma de pergunta, logo as continuações também o são. Medido a
    16/09/2026 sobre as 3634 linhas então guardadas: as 128 que não traziam
    marca no texto eram todas perguntas na mesma ("o que causa alergias
    alimentares"), e a lista de marcas foi alargada por causa delas.

    A diferença em relação ao que estava antes não é o valor — é ser OBSERVADO
    em vez de FIXO. Se um dia vier coisa que não seja pergunta, fica marcada.
    """
    if molde in MOLDES_INTERROGATIVOS:
        return True
    t = sugestao.lower().strip()
    return any(m in t for m in MARCAS_DE_PERGUNTA)


def buscar_perguntas_keyword(keyword: str, axis: str) -> list[dict]:
    agora = datetime.now(timezone.utc).isoformat()
    vistas: set[str] = set()
    resultados: list[dict] = []

    for template in SEEDS_TEMPLATES:
        seed = template.replace("{keyword}", keyword)
        sugestoes = buscar_autocomplete(seed)

        for posicao, sugestao in enumerate(sugestoes, start=1):
            chave = sugestao.lower().strip()
            if chave in vistas:
                continue
            vistas.add(chave)

            resultados.append({
                "question": sugestao,
                # NULL, não 0: esta fonte não mede crescimento nem volume.
                "growth_percent": None,
                "relative_volume": None,
                # A posição dentro DESTE molde, que é o que de facto se observa.
                "posicao": posicao,
                "seed": template,
                "axis": axis,
                "axis_label": AXIS_LABELS.get(axis, axis),
                "cluster": keyword,
                "is_question": e_pergunta(sugestao, template),
                "source": SOURCE,
                "updated_at": agora,
                "last_seen_at": agora,
            })

        time.sleep(PAUSA_ENTRE_SEEDS)

    return resultados


def main():
    print("Reportagem Viva — Perguntas de Saúde (Google Autocomplete)")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"Seeds por keyword: {len(SEEDS_TEMPLATES)}")
    print("=" * 60)

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    n_kw = len(keywords)
    print(f"  {n_kw} keywords activas")
    print(f"  Estimativa: ~{n_kw * len(SEEDS_TEMPLATES)} pedidos ao autocomplete\n")

    todas: list[dict] = []

    for i, kw in enumerate(keywords):
        term, axis = kw["term"], kw["axis"]
        print(f"[{i+1}/{n_kw}] [{axis}] {term}")

        perguntas = buscar_perguntas_keyword(term, axis)
        if perguntas:
            todas.extend(perguntas)
            print(f"    {len(perguntas)} sugestões")
        else:
            print(f"    Sem resultados")

    print(f"\nTotal recolhido: {len(todas)} sugestões")

    vistas_global: set[tuple] = set()
    unicas: list[dict] = []

    for p in todas:
        chave = (p["question"].lower().strip(), p["axis"], p["source"])
        if chave not in vistas_global:
            vistas_global.add(chave)
            unicas.append(p)

    print(f"Após de-duplicação: {len(unicas)} sugestões únicas\n")

    print(f"A fazer upsert de {len(unicas)} sugestões...")
    inseridas = 0
    for i in range(0, len(unicas), 50):
        lote = unicas[i:i+50]
        if upsert_perguntas(lote):
            inseridas += len(lote)

    print()
    print("=" * 60)
    print(f"Concluído — {inseridas} sugestões upserted (source=autocomplete)")
    print("=" * 60)


if __name__ == "__main__":
    main()
