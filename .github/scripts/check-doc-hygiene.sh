#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
errors=0

# Every .md file permitted in the repo must be listed here explicitly.
# Adding a new doc to main requires a deliberate entry below.
ALLOWLIST=(
  README.md
  CLAUDE.md
  docs/FRONTEND_PROPOSAL.md
  docs/NOTES.md
  docs/PROJECT_PLAN.md
  docs/PROPOSAL.md
  docs/UX_SPEC.md
  docs/design-system/DESIGN.md
)

# Block any files under specs/
if find "$ROOT/specs" -type f 2>/dev/null | grep -q .; then
  echo "ERROR: files found under specs/ — remove before merging to main"
  errors=$((errors + 1))
fi

# Block any .md not on the allowlist
while IFS= read -r -d '' mdfile; do
  relpath="${mdfile#"$ROOT"/}"
  allowed=false
  for entry in "${ALLOWLIST[@]}"; do
    [[ "$relpath" == "$entry" ]] && allowed=true && break
  done
  if [[ "$allowed" == false ]]; then
    echo "ERROR: $relpath is not on the allowlist — add it or remove it before merging"
    errors=$((errors + 1))
  fi
done < <(find "$ROOT" -name "*.md" -type f -not -path "$ROOT/.git/*" -print0)

[ "$errors" -eq 0 ]
