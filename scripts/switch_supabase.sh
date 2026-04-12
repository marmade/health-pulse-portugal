#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# switch_supabase.sh
# Switch every Supabase reference in health-pulse-portugal from the
# old (Lovable) instance to a new one (e.g. Marta's).
#
# Usage:
#   ./scripts/switch_supabase.sh PROJECT_ID SUPABASE_URL ANON_KEY
#
# Example:
#   ./scripts/switch_supabase.sh ijpxjpbjudaddfatibfl \
#       https://ijpxjpbjudaddfatibfl.supabase.co \
#       "eyJ..."
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours (disabled when stdout is not a terminal) ─────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; RESET=''
fi

# ── Usage ────────────────────────────────────────────────────────────
usage() {
  echo "Usage: $0 <PROJECT_ID> <SUPABASE_URL> <ANON_KEY>"
  echo ""
  echo "  PROJECT_ID   The new Supabase project ID  (e.g. ijpxjpbjudaddfatibfl)"
  echo "  SUPABASE_URL The new Supabase URL          (e.g. https://ijpxjpbjudaddfatibfl.supabase.co)"
  echo "  ANON_KEY     The new anon/publishable key   (eyJ...)"
  echo ""
  echo "Switches all hardcoded references from the old Lovable instance"
  echo "to the new Supabase instance.  Does NOT commit; shows a diff summary."
  exit 1
}

if [[ $# -lt 3 ]]; then
  usage
fi

NEW_PROJECT_ID="$1"
NEW_URL="$2"
NEW_ANON_KEY="$3"

# ── Old values (Lovable instance) ────────────────────────────────────
OLD_PROJECT_ID="cyjwhmuakmiytypewwfw"
OLD_URL="https://cyjwhmuakmiytypewwfw.supabase.co"
OLD_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5andobXVha21peXR5cGV3d2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjc2MjksImV4cCI6MjA4ODQwMzYyOX0.bcAKG2nQdYG7Qf8Mm1e_eJR9Fueqw20jkwlqrTWyH4Q"

# ── Resolve repo root ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Quick sanity checks ─────────────────────────────────────────────
if [[ "$NEW_PROJECT_ID" == "$OLD_PROJECT_ID" ]]; then
  echo -e "${RED}ERROR: New project ID is the same as the old one. Nothing to do.${RESET}"
  exit 1
fi

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  echo -e "${RED}ERROR: Cannot find $REPO_ROOT/.env — are you in the right repo?${RESET}"
  exit 1
fi

# ── Backup directory ─────────────────────────────────────────────────
BACKUP_DIR="$REPO_ROOT/.supabase-switch-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}Backups will be saved to:${RESET} $BACKUP_DIR"
echo ""

# ── Helper: back up a file, then run sed replacements ────────────────
# Usage: replace_in_file <file>
# Performs all three substitutions (project ID, URL, anon key).
CHANGED_FILES=()

replace_in_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo -e "  ${YELLOW}SKIP${RESET} (not found): $file"
    return
  fi

  # Create backup preserving relative path
  local rel="${file#$REPO_ROOT/}"
  local backup_path="$BACKUP_DIR/$rel"
  mkdir -p "$(dirname "$backup_path")"
  cp "$file" "$backup_path"

  local before
  before=$(md5 -q "$file" 2>/dev/null || md5sum "$file" | cut -d' ' -f1)

  # Use pipe delimiter to avoid conflicts with URLs containing slashes
  sed -i '' "s|${OLD_URL}|${NEW_URL}|g" "$file"
  sed -i '' "s|${OLD_PROJECT_ID}|${NEW_PROJECT_ID}|g" "$file"
  sed -i '' "s|${OLD_ANON_KEY}|${NEW_ANON_KEY}|g" "$file"

  local after
  after=$(md5 -q "$file" 2>/dev/null || md5sum "$file" | cut -d' ' -f1)

  if [[ "$before" != "$after" ]]; then
    echo -e "  ${GREEN}UPDATED${RESET}: $rel"
    CHANGED_FILES+=("$file")
  else
    echo -e "  ${YELLOW}NO CHANGE${RESET}: $rel"
  fi
}

# ── 1. .env ──────────────────────────────────────────────────────────
echo -e "${GREEN}[1/5]${RESET} .env"
replace_in_file "$REPO_ROOT/.env"

# ── 2. src/integrations/supabase/client.ts ───────────────────────────
# This file reads from import.meta.env, so it has no hardcoded values.
# We still run it in case it changes in the future.
echo -e "${GREEN}[2/5]${RESET} src/integrations/supabase/client.ts"
replace_in_file "$REPO_ROOT/src/integrations/supabase/client.ts"

# ── 3. supabase/config.toml ─────────────────────────────────────────
echo -e "${GREEN}[3/5]${RESET} supabase/config.toml"
replace_in_file "$REPO_ROOT/supabase/config.toml"

# ── 4. .github/workflows/youtube-trends.yml ─────────────────────────
echo -e "${GREEN}[4/5]${RESET} .github/workflows/youtube-trends.yml"
replace_in_file "$REPO_ROOT/.github/workflows/youtube-trends.yml"

# ── 5. Python scripts in scripts/ (including nested copies) ─────────
echo -e "${GREEN}[5/5]${RESET} Python scripts in scripts/"
while IFS= read -r -d '' pyfile; do
  replace_in_file "$pyfile"
done < <(find "$REPO_ROOT/scripts" -name '*.py' -print0)

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}SWITCH COMPLETE${RESET}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  Old project ID : $OLD_PROJECT_ID"
echo "  New project ID : $NEW_PROJECT_ID"
echo ""
echo "  Old URL        : $OLD_URL"
echo "  New URL        : $NEW_URL"
echo ""
echo "  Old anon key   : ${OLD_ANON_KEY:0:30}..."
echo "  New anon key   : ${NEW_ANON_KEY:0:30}..."
echo ""
echo "  Files changed  : ${#CHANGED_FILES[@]}"
echo "  Backups in     : $BACKUP_DIR"
echo ""

# ── Diff summary (if inside a git repo) ──────────────────────────────
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree &>/dev/null; then
  echo "── git diff --stat ────────────────────────────────────────────"
  git -C "$REPO_ROOT" diff --stat
  echo ""
  echo "Run 'git diff' for the full diff.  Nothing has been committed."
else
  echo "(Not a git repository — skipping diff summary.)"
  echo ""
  echo "Changed files:"
  for f in "${CHANGED_FILES[@]}"; do
    echo "  $f"
  done
fi

echo ""
echo -e "${YELLOW}Review the changes, then commit when ready.${RESET}"
