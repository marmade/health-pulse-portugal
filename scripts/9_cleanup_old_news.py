"""
9_cleanup_old_news.py
=====================
Reportagem Viva — limpeza semanal de notícias antigas na tabela news_items.

Lógica por eixo (saude-mental, alimentacao, menopausa, emergentes):
  - Conta notícias novas (created_at nos últimos 7 dias)
  - Conta notícias antigas (created_at anterior a 7 dias)
  - Se novas >= antigas: apaga as antigas desse eixo
  - Se novas < antigas: não apaga nada (preserva cobertura)

Notícias sem keyword_id (sem eixo associado) são ignoradas.

Como correr manualmente:
  python3 9_cleanup_old_news.py

No GitHub Actions corre automaticamente após o fetch de RSS feeds.
"""

import requests
from datetime import datetime, timedelta, timezone

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHhqcGJqdWRhZGRmYXRpYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzEzODUsImV4cCI6MjA4ODU0NzM4NX0.SfOLBTYyIhk-CxzvtlvFu1E-GqBNXN3CbFqz8qx-BoM"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "count=exact",
}

EIXOS = ["saude-mental", "alimentacao", "menopausa", "emergentes"]
CUTOFF_DAYS = 7


def get_keyword_ids_por_eixo():
    """Busca keyword IDs agrupados por eixo."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords?select=id,axis",
        headers=HEADERS,
    )
    r.raise_for_status()
    keywords = r.json()

    por_eixo = {}
    for kw in keywords:
        axis = kw.get("axis")
        if axis in EIXOS:
            por_eixo.setdefault(axis, []).append(kw["id"])
    return por_eixo


def contar_noticias(keyword_ids, mais_recente_que_cutoff):
    """Conta notícias para um conjunto de keyword_ids, novas ou antigas."""
    if not keyword_ids:
        return 0

    cutoff = (datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)).isoformat()

    # Filtro: keyword_id in (ids) AND created_at <op> cutoff
    ids_filter = ",".join(keyword_ids)
    op = "gte" if mais_recente_que_cutoff else "lt"

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/news_items",
        headers=HEADERS,
        params={
            "select": "id",
            "keyword_id": f"in.({ids_filter})",
            "created_at": f"{op}.{cutoff}",
        },
    )
    r.raise_for_status()

    # Count from content-range header
    content_range = r.headers.get("content-range", "")
    if "/" in content_range:
        total = content_range.split("/")[-1]
        return int(total) if total != "*" else len(r.json())
    return len(r.json())


def apagar_antigas(keyword_ids):
    """Apaga notícias antigas (created_at < cutoff) para um conjunto de keyword_ids."""
    if not keyword_ids:
        return 0

    cutoff = (datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)).isoformat()
    ids_filter = ",".join(keyword_ids)

    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/news_items",
        headers={**HEADERS, "Prefer": "count=exact"},
        params={
            "keyword_id": f"in.({ids_filter})",
            "created_at": f"lt.{cutoff}",
        },
    )
    r.raise_for_status()

    content_range = r.headers.get("content-range", "")
    if "/" in content_range:
        total = content_range.split("/")[-1]
        return int(total) if total != "*" else 0
    return 0


def main():
    print("=== Limpeza semanal de notícias antigas ===\n")

    kw_por_eixo = get_keyword_ids_por_eixo()

    total_apagadas = 0

    for eixo in EIXOS:
        kw_ids = kw_por_eixo.get(eixo, [])
        if not kw_ids:
            print(f"  {eixo}: sem keywords — skip")
            continue

        novas = contar_noticias(kw_ids, mais_recente_que_cutoff=True)
        antigas = contar_noticias(kw_ids, mais_recente_que_cutoff=False)

        print(f"  {eixo}: {novas} novas, {antigas} antigas", end="")

        if antigas == 0:
            print(" → nada a apagar")
        elif novas >= antigas:
            apagadas = apagar_antigas(kw_ids)
            total_apagadas += apagadas
            print(f" → {apagadas} antigas apagadas")
        else:
            print(f" → preservadas (novas < antigas)")

    print(f"\nTotal apagadas: {total_apagadas}")


if __name__ == "__main__":
    main()
