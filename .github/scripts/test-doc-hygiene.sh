#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK="$SCRIPT_DIR/check-doc-hygiene.sh"

pass=0
fail=0

assert_exit() {
  local desc="$1" expected="$2" actual
  shift 2
  set +e
  "$@" >/dev/null 2>&1
  actual=$?
  set -e
  if [ "$actual" -eq "$expected" ]; then
    echo "  PASS: $desc"
    pass=$((pass + 1))
  else
    echo "  FAIL: $desc (expected exit $expected, got $actual)"
    fail=$((fail + 1))
  fi
}

make_root() { mktemp -d; }
cleanup() { rm -rf "$1"; }

# --- Test 1: specs/ with a file causes failure ---

root=$(make_root)
mkdir -p "$root/specs/context"
touch "$root/specs/context/19.md"
assert_exit "exits 1 when specs/ contains a file" 1 "$CHECK" "$root"
cleanup "$root"

# --- Test 2: .md at root not on allowlist causes failure ---

root=$(make_root)
touch "$root/SOME_RANDOM.md"
assert_exit "exits 1 when a disallowed root .md exists" 1 "$CHECK" "$root"
cleanup "$root"

# --- Test 3: .md in docs/ not on allowlist causes failure ---

root=$(make_root)
mkdir -p "$root/docs"
touch "$root/docs/SNEAKY.md"
assert_exit "exits 1 when a disallowed docs/ .md exists" 1 "$CHECK" "$root"
cleanup "$root"

# --- Test 4: allowlisted files pass ---

root=$(make_root)
mkdir -p "$root/docs/design-system"
touch "$root/README.md"
touch "$root/CLAUDE.md"
touch "$root/docs/FRONTEND_PROPOSAL.md"
touch "$root/docs/NOTES.md"
touch "$root/docs/PROJECT_PLAN.md"
touch "$root/docs/PROPOSAL.md"
touch "$root/docs/UX_SPEC.md"
touch "$root/docs/design-system/DESIGN.md"
assert_exit "exits 0 when all .md files are on the allowlist" 0 "$CHECK" "$root"
cleanup "$root"

# --- Test 5: empty specs/ dir is allowed ---

root=$(make_root)
mkdir -p "$root/specs"
assert_exit "exits 0 when specs/ exists but is empty" 0 "$CHECK" "$root"
cleanup "$root"

# --- Test 6: no specs/ dir at all is allowed ---

root=$(make_root)
assert_exit "exits 0 when specs/ does not exist" 0 "$CHECK" "$root"
cleanup "$root"

# --- summary ---

echo ""
echo "Results: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
