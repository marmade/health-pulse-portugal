#!/usr/bin/env python3
"""
migrate_data.py — Export data from Lovable Supabase and import into Marta's Supabase.

Usage:
    python migrate_data.py                          # full migration
    python migrate_data.py --dry-run                # export only, print counts
    python migrate_data.py --tables keywords,textos # migrate specific tables

Environment variables:
    SOURCE_URL   — Lovable Supabase URL  (default provided)
    SOURCE_KEY   — Lovable anon key      (required)
    TARGET_URL   — Marta's Supabase URL  (required unless --dry-run)
    TARGET_KEY   — Marta's service_role key (required unless --dry-run)
"""

import argparse
import logging
import os
import sys
import time

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_SOURCE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"

# Tables in dependency order (parent tables first).
TABLES_ORDERED = [
    "keywords",
    "trends_cache",
    "trend_data",
    "debunking",
    "news_items",
    "historical_snapshots",
    "app_settings",
    "textos",
    "briefings_archive",
    "guioes",
    "guioes_semanais",
    "plataforma_popups",
    "sobre_conteudo",
    "youtube_trends",
    "bookmarks",
    "health_questions",
    "eixos_archive",
    "revisao_pares",
    "contactos_projecto",
]

PAGE_SIZE = 1000        # PostgREST default max per request
UPSERT_BATCH_SIZE = 500

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("migrate")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _headers_read(api_key: str) -> dict:
    """Headers for reading from source (anon key, read-only via RLS)."""
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }


def _headers_write(api_key: str) -> dict:
    """Headers for upserting into target (service_role key, bypasses RLS)."""
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def fetch_all_rows(base_url: str, api_key: str, table: str) -> list[dict]:
    """
    Fetch every row from *table* using offset-based pagination.
    Returns a list of dicts (rows).
    """
    headers = _headers_read(api_key)
    all_rows: list[dict] = []
    offset = 0

    while True:
        url = (
            f"{base_url}/rest/v1/{table}"
            f"?select=*&order=id.asc&limit={PAGE_SIZE}&offset={offset}"
        )
        resp = requests.get(url, headers=headers, timeout=60)

        # If ordering by `id` fails (table may not have `id`), retry without order.
        if resp.status_code == 400 and "column" in resp.text.lower():
            url = (
                f"{base_url}/rest/v1/{table}"
                f"?select=*&limit={PAGE_SIZE}&offset={offset}"
            )
            resp = requests.get(url, headers=headers, timeout=60)

        resp.raise_for_status()
        batch = resp.json()

        if not isinstance(batch, list):
            raise ValueError(f"Unexpected response for {table}: {batch}")

        all_rows.extend(batch)

        if len(batch) < PAGE_SIZE:
            break  # last page

        offset += PAGE_SIZE

    return all_rows


def upsert_rows(
    base_url: str, api_key: str, table: str, rows: list[dict]
) -> int:
    """
    Upsert *rows* into *table* in batches.  Returns total rows sent.
    """
    if not rows:
        return 0

    headers = _headers_write(api_key)
    url = f"{base_url}/rest/v1/{table}"
    total_sent = 0

    for i in range(0, len(rows), UPSERT_BATCH_SIZE):
        batch = rows[i : i + UPSERT_BATCH_SIZE]
        resp = requests.post(url, json=batch, headers=headers, timeout=120)
        resp.raise_for_status()
        total_sent += len(batch)
        log.info(
            "  %-25s  upserted %d / %d rows",
            table,
            total_sent,
            len(rows),
        )

    return total_sent


# ---------------------------------------------------------------------------
# Main migration logic
# ---------------------------------------------------------------------------


def migrate(
    source_url: str,
    source_key: str,
    target_url: str | None,
    target_key: str | None,
    tables: list[str],
    dry_run: bool,
) -> list[dict]:
    """
    Run the migration.  Returns a list of result dicts for the summary.
    """
    results: list[dict] = []

    for table in tables:
        result = {
            "table": table,
            "rows_exported": 0,
            "rows_imported": 0,
            "status": "ok",
            "error": "",
        }

        try:
            # --- Export ---------------------------------------------------
            log.info("Exporting  %-25s ...", table)
            rows = fetch_all_rows(source_url, source_key, table)
            result["rows_exported"] = len(rows)
            log.info(
                "Exported   %-25s  %d rows", table, len(rows)
            )

            # --- Import ---------------------------------------------------
            if dry_run:
                log.info(
                    "Dry-run    %-25s  skipping import", table
                )
            else:
                if not target_url or not target_key:
                    raise RuntimeError(
                        "TARGET_URL and TARGET_KEY are required for import"
                    )
                log.info("Importing  %-25s ...", table)
                imported = upsert_rows(target_url, target_key, table, rows)
                result["rows_imported"] = imported
                log.info(
                    "Imported   %-25s  %d rows", table, imported
                )

        except Exception as exc:
            result["status"] = "ERROR"
            result["error"] = str(exc)
            log.error(
                "FAILED     %-25s  %s", table, exc
            )

        results.append(result)

    return results


def print_summary(results: list[dict]) -> None:
    """Print a neat summary table."""
    header = f"{'Table':<28} {'Exported':>10} {'Imported':>10} {'Status':<8} Error"
    sep = "-" * max(len(header), 90)

    print()
    print(sep)
    print("MIGRATION SUMMARY")
    print(sep)
    print(header)
    print(sep)

    for r in results:
        print(
            f"{r['table']:<28} {r['rows_exported']:>10} {r['rows_imported']:>10} "
            f"{r['status']:<8} {r['error']}"
        )

    print(sep)

    ok = sum(1 for r in results if r["status"] == "ok")
    fail = sum(1 for r in results if r["status"] != "ok")
    total_exported = sum(r["rows_exported"] for r in results)
    total_imported = sum(r["rows_imported"] for r in results)

    print(
        f"Tables: {ok} ok, {fail} failed  |  "
        f"Rows exported: {total_exported}  |  "
        f"Rows imported: {total_imported}"
    )
    print(sep)
    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate data between Supabase instances."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Export only — print row counts without importing.",
    )
    parser.add_argument(
        "--tables",
        type=str,
        default="",
        help="Comma-separated list of tables to migrate (default: all).",
    )
    args = parser.parse_args()

    # --- Environment variables -------------------------------------------
    source_url = os.environ.get("SOURCE_URL", DEFAULT_SOURCE_URL)
    source_key = os.environ.get("SOURCE_KEY", "")
    target_url = os.environ.get("TARGET_URL", "")
    target_key = os.environ.get("TARGET_KEY", "")

    if not source_key:
        log.error("SOURCE_KEY environment variable is required.")
        sys.exit(1)

    if not args.dry_run and (not target_url or not target_key):
        log.error(
            "TARGET_URL and TARGET_KEY environment variables are required "
            "(unless --dry-run is set)."
        )
        sys.exit(1)

    # --- Determine tables ------------------------------------------------
    if args.tables:
        requested = [t.strip() for t in args.tables.split(",") if t.strip()]
        unknown = [t for t in requested if t not in TABLES_ORDERED]
        if unknown:
            log.warning("Unknown tables (will attempt anyway): %s", unknown)
        tables = requested
    else:
        tables = list(TABLES_ORDERED)

    # --- Run -------------------------------------------------------------
    mode = "DRY-RUN" if args.dry_run else "LIVE"
    log.info("Migration mode : %s", mode)
    log.info("Source         : %s", source_url)
    log.info("Target         : %s", target_url or "(none — dry run)")
    log.info("Tables         : %s", ", ".join(tables))
    print()

    start = time.time()
    results = migrate(
        source_url=source_url,
        source_key=source_key,
        target_url=target_url if not args.dry_run else None,
        target_key=target_key if not args.dry_run else None,
        tables=tables,
        dry_run=args.dry_run,
    )
    elapsed = time.time() - start

    print_summary(results)
    log.info("Finished in %.1f seconds.", elapsed)

    # Exit with error code if any table failed.
    if any(r["status"] != "ok" for r in results):
        sys.exit(2)


if __name__ == "__main__":
    main()
