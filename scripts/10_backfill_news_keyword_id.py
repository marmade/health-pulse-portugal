"""
10_backfill_news_keyword_id.py
==============================
Preenche keyword_id nos registos de news_items que têm related_term mas keyword_id NULL.

Resolve via match com keywords.term (exact, case-insensitive).
Não toca em registos que já têm keyword_id preenchido.

Correr uma vez para backfill; seguro para re-executar (idempotente).

  python3 10_backfill_news_keyword_id.py
"""

import requests

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHhqcGJqdWRhZGRmYXRpYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzEzODUsImV4cCI6MjA4ODU0NzM4NX0.SfOLBTYyIhk-CxzvtlvFu1E-GqBNXN3CbFqz8qx-BoM"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def main():
    print("=== Backfill keyword_id em news_items ===\n")

    # 1. Buscar todas as keywords (term + synonyms + id)
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords?select=id,term,synonyms",
        headers=HEADERS,
    )
    r.raise_for_status()
    keywords = r.json()

    # Map term (lowercase) → keyword id
    term_to_id = {}
    for kw in keywords:
        term_to_id[kw["term"].lower()] = kw["id"]
        if kw.get("synonyms") and isinstance(kw["synonyms"], list):
            for syn in kw["synonyms"]:
                term_to_id[syn.lower()] = kw["id"]

    print(f"  {len(keywords)} keywords, {len(term_to_id)} termos/sinónimos mapeados\n")

    # 2. Buscar news_items com keyword_id NULL
    orphans = []
    offset = 0
    page_size = 1000
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/news_items",
            headers={**HEADERS, "Range": f"{offset}-{offset + page_size - 1}"},
            params={
                "select": "id,related_term",
                "keyword_id": "is.null",
                "related_term": "neq.",
            },
        )
        r.raise_for_status()
        batch = r.json()
        orphans.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    print(f"  {len(orphans)} notícias com keyword_id NULL e related_term preenchido\n")

    if not orphans:
        print("  Nada a fazer.")
        return

    # 3. Resolver e actualizar
    updated = 0
    not_found = 0

    for item in orphans:
        related = item.get("related_term", "")
        kw_id = term_to_id.get(related.lower())

        if not kw_id:
            not_found += 1
            continue

        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/news_items?id=eq.{item['id']}",
            headers=HEADERS,
            json={"keyword_id": kw_id},
        )
        r.raise_for_status()
        updated += 1

    print(f"  Actualizados: {updated}")
    if not_found:
        print(f"  Sem match na tabela keywords: {not_found}")
    print(f"\nBackfill concluído.")


if __name__ == "__main__":
    main()
