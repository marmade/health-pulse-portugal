"""
6_fetch_health_questions.py
===========================
Reportagem Viva — perguntas reais em crescimento via pytrends
related_queries() para cada keyword activa.

FONTE: pytrends related_queries() — queries que co-ocorrem na mesma
sessão de pesquisa que a keyword. Inclui growth_percent (% de crescimento
recente). Campo source="pytrends" distingue estes registos dos recolhidos
pelo script 7_fetch_autocomplete_questions.py.

UPSERT: chave única (question, axis, source).
Requer constraint health_questions_question_axis_source_key na tabela.

Como correr manualmente:
  python3 6_fetch_health_questions.py
"""

import re
import time
import requests
from datetime import datetime, timezone
from pytrends.request import TrendReq

SUPABASE_URL = "https://cyjwhmuakmiytypewwfw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5andobXVha21peXR5cGV3d2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjc2MjksImV4cCI6MjA4ODQwMzYyOX0.bcAKG2nQdYG7Qf8Mm1e_eJR9Fueqw20jkwlqrTWyH4Q"

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

SOURCE = "pytrends"
PAUSA_SEGUNDOS = 10

PREFIXOS_PERGUNTA = [
    "como", "o que", "o que é", "quais", "porque", "por que",
    "é normal", "posso", "sintomas", "quando", "quanto", "qual",
    "tenho", "pode", "devo", "ajuda", "tratamento", "cura",
    "diferença", "riscos", "causas", "efeitos", "o que fazer"
]

AXIS_LABELS = {
    "saude-mental": "Saúde Mental",
    "alimentacao": "Alimentação",
    "menopausa": "Menopausa",
    "emergentes": "Emergentes",
}

# ---------------------------------------------------------------------------
# FILTRO DE RUÍDO — 5 camadas
# ---------------------------------------------------------------------------

BLOCKLIST_MARCAS = {
    "lidl", "walmart", "continente", "pingo doce", "aldi", "mercadona",
    "ikea", "amazon", "fnac", "worten", "minipreço", "intermarché",
    "mcdonald", "burger king", "kfc", "subway", "starbucks",
    "uber eats", "glovo", "bolt food",
}

BLOCKLIST_ENTRETENIMENTO = {
    "filme", "movie", "cinema", "trailer", "estreia", "temporada",
    "episódio", "episodio", "série", "serie", "netflix", "hbo", "disney",
    "prime video", "streaming", "download", "torrent", "legendas",
    "game", "jogo", "games", "gameplay", "review", "update", "patch",
    "dlc", "xbox", "playstation", "nintendo", "steam", "epic games",
    "álbum", "album", "single", "tour", "concerto", "festival", "spotify",
    "transferência", "mercado", "benfica", "sporting", "porto", "liga",
    "premier league", "champions",
}

REGEX_METEOROLOGIA = re.compile(
    r"^(depressão|ciclone|tempestade|furacão|tufão|baixa pressão)\s+[A-Za-záéíóúàâêôãõüç]+$",
    re.IGNORECASE,
)

REGEX_LOCALIZACAO = re.compile(
    r"\b(near me|perto de mim|perto|onde fica|como chegar|morada|"
    r"horário de|aberto agora|delivery|entrega|encomenda)\b",
    re.IGNORECASE,
)

REGEX_ENTRETENIMENTO_NUMERADO = re.compile(
    r"^(todo mundo|scary movie|final destination|resident evil|saw|"
    r"john wick|fast and furious|velozes e furiosos)\s",
    re.IGNORECASE,
)

REGEX_NUMERO_FINAL = re.compile(r"\d+\s*$")


def e_ruido(query: str) -> tuple[bool, str]:
    q = query.lower().strip()
    for marca in BLOCKLIST_MARCAS:
        if marca in q:
            return True, f"marca:{marca}"
    for termo in BLOCKLIST_ENTRETENIMENTO:
        if termo in q:
            return True, f"entretenimento:{termo}"
    if REGEX_METEOROLOGIA.match(query.strip()):
        return True, "meteorologia"
    if REGEX_LOCALIZACAO.search(q):
        return True, "localizacao"
    if REGEX_NUMERO_FINAL.search(q) and len(q.split()) >= 3:
        if REGEX_ENTRETENIMENTO_NUMERADO.match(q):
            return True, "entretenimento_numerado"
    return False, ""


def e_pergunta(texto: str) -> bool:
    t = texto.lower().strip()
    return any(t.startswith(p) for p in PREFIXOS_PERGUNTA)


# ---------------------------------------------------------------------------
# SUPABASE
# ---------------------------------------------------------------------------

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
        f"{SUPABASE_URL}/rest/v1/health_questions",
        headers=HEADERS_UPSERT,
        json=perguntas,
    )
    if r.status_code not in (200, 201, 204):
        print(f"    ERRO upsert: {r.status_code} {r.text[:200]}")
        return False
    return True


# ---------------------------------------------------------------------------
# PYTRENDS
# ---------------------------------------------------------------------------

def buscar_queries_crescimento(pytrends: TrendReq, keyword: str, axis: str) -> list[dict]:
    try:
        pytrends.build_payload([keyword], geo="PT", timeframe="today 3-m", gprop="")
        resultado = pytrends.related_queries()

        if not resultado or keyword not in resultado:
            return []

        rising = resultado[keyword].get("rising")
        if rising is None or rising.empty:
            return []

        agora = datetime.now(timezone.utc).isoformat()
        perguntas = []

        for _, row in rising.iterrows():
            query = str(row.get("query", "")).strip()
            value = row.get("value", 0)
            if not query:
                continue

            ruido, motivo = e_ruido(query)
            if ruido:
                print(f"    [RUÍDO:{motivo}] {query}")
                continue

            if isinstance(value, str) and "breakout" in value.lower():
                growth = 5000
            else:
                try:
                    growth = int(value)
                except (ValueError, TypeError):
                    growth = 0

            rank_idx = len(perguntas)
            relative_volume = max(10, 100 - (rank_idx * 8))

            perguntas.append({
                "question": query,
                "growth_percent": min(growth, 9999),
                "relative_volume": relative_volume,
                "axis": axis,
                "axis_label": AXIS_LABELS.get(axis, axis),
                "cluster": keyword,
                "is_question": e_pergunta(query),
                "source": SOURCE,
                "updated_at": agora,
                "last_seen_at": agora,
            })

        return perguntas

    except Exception as e:
        print(f"    Erro para '{keyword}': {e}")
        return []


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("Reportagem Viva — Queries em Crescimento (pytrends)")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    pytrends = TrendReq(hl="pt-PT", tz=-60, timeout=(10, 25), retries=2, backoff_factor=0.5)

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"  {len(keywords)} keywords activas\n")

    todas: list[dict] = []

    for i, kw in enumerate(keywords):
        term, axis = kw["term"], kw["axis"]
        print(f"[{i+1}/{len(keywords)}] [{axis}] {term}")

        perguntas = buscar_queries_crescimento(pytrends, term, axis)
        if perguntas:
            todas.extend(perguntas)
            n_perg = sum(1 for p in perguntas if p["is_question"])
            print(f"    {len(perguntas)} queries ({n_perg} perguntas)")
        else:
            print(f"    Sem dados")

        if i < len(keywords) - 1:
            time.sleep(PAUSA_SEGUNDOS)

    print(f"\nTotal recolhido: {len(todas)} queries")

    # De-duplicar por (question.lower(), axis, source)
    vistas: set[tuple] = set()
    unicas: list[dict] = []
    todas.sort(key=lambda x: x["growth_percent"], reverse=True)

    for p in todas:
        chave = (p["question"].lower().strip(), p["axis"], p["source"])
        if chave not in vistas:
            vistas.add(chave)
            unicas.append(p)

    n_perguntas = sum(1 for p in unicas if p["is_question"])
    print(f"Após de-duplicação: {len(unicas)} queries únicas ({n_perguntas} perguntas)\n")

    print(f"A fazer upsert de {len(unicas)} queries...")
    inseridas = 0
    for i in range(0, len(unicas), 50):
        lote = unicas[i:i+50]
        if upsert_perguntas(lote):
            inseridas += len(lote)

    print()
    print("=" * 60)
    print(f"Concluído — {inseridas} queries upserted (source=pytrends)")
    print("=" * 60)

    expandir_mural(unicas)


def expandir_mural(todas_perguntas: list[dict]):
    print("\nA expandir Mural com novos termos...")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term", "is_active": "eq.true"},
    )
    if not r.ok:
        print("  Erro ao buscar keywords existentes")
        return

    existentes = {row["term"].lower().strip() for row in r.json()}
    candidatos = [
        p for p in todas_perguntas
        if p["growth_percent"] >= 100
        and p["question"].lower().strip() not in existentes
        and not p["is_question"]
        and len(p["question"].split()) <= 4
    ]
    candidatos.sort(key=lambda x: x["growth_percent"], reverse=True)
    novos = candidatos[:20]

    if not novos:
        print("  Nenhum termo novo relevante encontrado")
        return

    agora = datetime.now(timezone.utc).isoformat()
    print(f"  {len(novos)} termos novos para o Mural:")
    payload = []
    for p in novos:
        print(f"    + [{p['axis']}] {p['question']} ({p['growth_percent']}%)")
        payload.append({
            "term": p["question"],
            "axis": p["axis"],
            "category": p.get("cluster", ""),
            "is_active": True,
            "is_emergent": p["growth_percent"] >= 500,
            "current_volume": p["relative_volume"],
            "previous_volume": 0,
            "change_percent": float(p["growth_percent"]),
            "trend": "up",
        })

    r2 = requests.post(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers={**HEADERS, "Prefer": "resolution=ignore-duplicates,return=minimal"},
        json=payload,
    )
    if r2.status_code in (200, 201, 204):
        print(f"  OK — {len(payload)} termos inseridos")
    else:
        print(f"  Erro: {r2.status_code} {r2.text[:100]}")


if __name__ == "__main__":
    main()
