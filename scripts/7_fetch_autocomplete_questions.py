"""
7_fetch_autocomplete_questions.py
==================================
Reportagem Viva — recolhe perguntas reais de saúde via Google Autocomplete
para cada keyword activa e guarda na tabela health_questions do Supabase.

FONTE: Google Autocomplete (suggestqueries.google.com) — queries reais
pesadas por frequência histórica. NÃO inclui growth_percent. Campo
source="autocomplete" distingue estes registos dos do script 6 (pytrends).

COMPLEMENTARIDADE COM SCRIPT 6:
  Script 6 (pytrends)      → o que está a CRESCER recentemente
  Script 7 (autocomplete)  → o que as pessoas PERGUNTAM mais (baseline)
  Quando uma query aparece nas duas fontes → sinal forte de relevância

UPSERT: chave única (question, axis, source).
Requer constraint health_questions_question_axis_source_key na tabela.

Como correr manualmente:
  python3 7_fetch_autocomplete_questions.py
"""

import json
import time
import requests
from datetime import datetime, timezone

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHhqcGJqdWRhZGRmYXRpYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzEzODUsImV4cCI6MjA4ODU0NzM4NX0.SfOLBTYyIhk-CxzvtlvFu1E-GqBNXN3CbFqz8qx-BoM"

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
            params={"q": seed, "hl": "pt", "gl": "pt", "client": "firefox"},
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


def buscar_perguntas_keyword(keyword: str, axis: str) -> list[dict]:
    agora = datetime.now(timezone.utc).isoformat()
    vistas: set[str] = set()
    resultados: list[dict] = []

    for template in SEEDS_TEMPLATES:
        seed = template.replace("{keyword}", keyword)
        sugestoes = buscar_autocomplete(seed)

        for sugestao in sugestoes:
            chave = sugestao.lower().strip()
            if chave in vistas:
                continue
            vistas.add(chave)

            pos = len(resultados)
            relative_volume = max(10, 100 - pos * 5)

            resultados.append({
                "question": sugestao,
                "growth_percent": 0,
                "relative_volume": relative_volume,
                "axis": axis,
                "axis_label": AXIS_LABELS.get(axis, axis),
                "cluster": keyword,
                "is_question": True,
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
