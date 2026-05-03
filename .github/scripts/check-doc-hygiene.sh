#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
errors=0

# Check for any files under specs/
if find "$ROOT/specs" -type f 2>/dev/null | grep -q .; then
  echo "ERROR: files found under specs/ — remove before merging to main"
  errors=$((errors + 1))
fi

# Check for root-level .md files not on the allowlist
while IFS= read -r -d '' mdfile; do
  fname=$(basename "$mdfile")
  case "$fname" in
    README.md|CLAUDE.md) ;;
    *)
      echo "ERROR: root-level $fname is not on the allowlist — add it or remove it before merging"
      errors=$((errors + 1))
      ;;
  esac
done < <(find "$ROOT" -maxdepth 1 -name "*.md" -type f -print0)

[ "$errors" -eq 0 ]
