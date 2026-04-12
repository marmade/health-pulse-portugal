"""
8_link_debunking_keywords.py
============================
Preenche o campo keyword_id nos registos de debunking que ainda não o têm,
fazendo match pelo campo 'term' do debunking com 'term' da tabela keywords.

Como correr:
    python3 8_link_debunking_keywords.py
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
    print("Reportagem Viva — Linkar debunking → keywords")
    print("=" * 60)

    # 1. Buscar todas as keywords activas
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "id,term", "is_active": "eq.true"},
    )
    r.raise_for_status()
    keywords = r.json()
    # Mapa term (lowercase) → keyword id
    kw_map = {kw["term"].lower(): kw["id"] for kw in keywords}
    print(f"  {len(keywords)} keywords activas carregadas")

    # 2. Buscar debunking sem keyword_id
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/debunking",
        headers=HEADERS,
        params={"select": "id,term", "keyword_id": "is.null"},
    )
    r.raise_for_status()
    debunking = r.json()
    print(f"  {len(debunking)} registos de debunking sem keyword_id")

    if not debunking:
        print("\nTudo já está linkado. Nada a fazer.")
        return

    # 3. Fazer match e actualizar
    linked = 0
    not_found = 0
    for d in debunking:
        term_lower = d["term"].lower().strip()
        kw_id = kw_map.get(term_lower)

        if not kw_id:
            # Tentar match parcial (debunking term contido numa keyword ou vice-versa)
            for kw_term, kid in kw_map.items():
                if kw_term in term_lower or term_lower in kw_term:
                    kw_id = kid
                    break

        if kw_id:
            r = requests.patch(
                f"{SUPABASE_URL}/rest/v1/debunking?id=eq.{d['id']}",
                headers={**HEADERS, "Prefer": "return=minimal"},
                json={"keyword_id": kw_id},
            )
            status = "OK" if r.status_code in (200, 204) else f"ERRO {r.status_code}"
            print(f"  {status} — '{d['term']}' → keyword_id linkado")
            linked += 1
        else:
            print(f"  SKIP — '{d['term']}' (sem keyword correspondente)")
            not_found += 1

    print()
    print("=" * 60)
    print(f"Concluído — {linked} linkados, {not_found} sem correspondência")
    print("=" * 60)


if __name__ == "__main__":
    main()
