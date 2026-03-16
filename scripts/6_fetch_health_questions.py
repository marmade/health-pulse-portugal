"""
6_fetch_health_questions.py
===========================
Reportagem Viva — busca perguntas reais em crescimento no Google PT
usando pytrends.related_queries() para cada keyword activa,
e guarda na tabela health_questions do Supabase.

Como correr manualmente:
  python3 6_fetch_health_questions.py
"""

import time
import requests
from datetime import datetime
from pytrends.request import TrendReq

SUPABASE_URL = "https://cyjwhmuakmiytypewwfw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5andobXVha21peXR5cGV3d2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjc2MjksImV4cCI6MjA4ODQwMzYyOX0.bcAKG2nQdYG7Qf8Mm1e_eJR9Fueqw20jkwlqrTWyH4Q"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# Pausa entre pedidos (evita rate limit Google)
PAUSA_SEGUNDOS = 10

# Prefixos de pergunta — filtra queries que soam a pergunta real
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


def buscar_keywords():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term,axis,category", "is_active": "eq.true"}
    )
    r.raise_for_status()
    return r.json()


def e_pergunta(texto):
    t = texto.lower().strip()
    return any(t.startswith(p) for p in PREFIXOS_PERGUNTA)


def buscar_queries_crescimento(pytrends, keyword, axis):
    """
    Devolve lista de dicts com perguntas reais em crescimento para esta keyword.
    Usa related_queries() — 'rising' são as pesquisas com maior crescimento.
    """
    try:
        pytrends.build_payload(
            [keyword],
            geo="PT",
            timeframe="today 3-m",
            gprop=""
        )
        resultado = pytrends.related_queries()

        if not resultado or keyword not in resultado:
            return []

        rising = resultado[keyword].get("rising")
        if rising is None or rising.empty:
            return []

        perguntas = []
        for _, row in rising.iterrows():
            query = str(row.get("query", "")).strip()
            value = row.get("value", 0)

            if not query:
                continue

            # Valor "Breakout" significa >5000% — normalizar para 5000
            if isinstance(value, str) and "breakout" in value.lower():
                growth = 5000
            else:
                try:
                    growth = int(value)
                except (ValueError, TypeError):
                    growth = 0

            # Calcular volume relativo (0-100) baseado no rank
            rank_idx = len(perguntas)
            relative_volume = max(10, 100 - (rank_idx * 8))

            # Incluir todas as queries (não só perguntas) — o painel filtra depois
            # mas marcar se é pergunta para o frontend poder filtrar
            perguntas.append({
                "question": query,
                "growth_percent": min(growth, 9999),
                "relative_volume": relative_volume,
                "axis": axis,
                "axis_label": AXIS_LABELS.get(axis, axis),
                "cluster": keyword,
                "is_question": e_pergunta(query),
                "updated_at": datetime.utcnow().isoformat(),
            })

        return perguntas

    except Exception as e:
        print(f"    Erro para '{keyword}': {e}")
        return []


def limpar_tabela():
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/health_questions",
        headers=HEADERS,
        params={"id": "not.is.null"}
    )
    return r.status_code in (200, 204)


def inserir_perguntas(perguntas):
    if not perguntas:
        return 0
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/health_questions",
        headers=HEADERS,
        json=perguntas
    )
    return r.status_code in (200, 201)


def main():
    print("Reportagem Viva — Perguntas de Saúde em Crescimento")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    pytrends = TrendReq(
        hl="pt-PT",
        tz=-60,
        timeout=(10, 25),
        retries=2,
        backoff_factor=0.5,
    )

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"  {len(keywords)} keywords activas\n")

    todas_perguntas = []

    for i, kw in enumerate(keywords):
        term = kw["term"]
        axis = kw["axis"]
        print(f"[{i+1}/{len(keywords)}] [{axis}] {term}")

        perguntas = buscar_queries_crescimento(pytrends, term, axis)

        if perguntas:
            todas_perguntas.extend(perguntas)
            n_perg = sum(1 for p in perguntas if p["is_question"])
            print(f"    {len(perguntas)} queries ({n_perg} perguntas)")
        else:
            print(f"    Sem dados")

        if i < len(keywords) - 1:
            time.sleep(PAUSA_SEGUNDOS)

    print(f"\nTotal recolhido: {len(todas_perguntas)} queries")

    # Ordenar por crescimento decrescente e eliminar duplicados
    vistas = set()
    unicas = []
    todas_perguntas.sort(key=lambda x: x["growth_percent"], reverse=True)
    for p in todas_perguntas:
        chave = p["question"].lower().strip()
        if chave not in vistas:
            vistas.add(chave)
            unicas.append(p)

    print(f"Após de-duplicação: {len(unicas)} queries únicas")
    n_perguntas = sum(1 for p in unicas if p["is_question"])
    print(f"Das quais {n_perguntas} são perguntas reais\n")

    print("A limpar tabela anterior...")
    ok_limpa = limpar_tabela()
    print(f"  {'OK' if ok_limpa else 'ERRO ao limpar'}")

    print(f"A inserir {len(unicas)} queries...")
    # Inserir em lotes de 50
    inseridas = 0
    for i in range(0, len(unicas), 50):
        lote = unicas[i:i+50]
        if inserir_perguntas(lote):
            inseridas += len(lote)

    print()
    print("=" * 60)
    print(f"Concluído — {inseridas} perguntas guardadas no Supabase")
    print("=" * 60)


if __name__ == "__main__":
    main()
