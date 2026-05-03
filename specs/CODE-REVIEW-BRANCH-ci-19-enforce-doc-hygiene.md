# Review Report

## Metadata

| Field | Value |
|-------|-------|
| **Review Mode** | Branch — `ci/19/enforce-doc-hygiene` |
| **Target** | 3 new files (~115 lines) |
| **Date** | 2026-05-03 |
| **Tech Stack** | Bash, YAML (GitHub Actions) |
| **Checks Run** | Code Quality, Test Coverage, Config/Dependencies |
| **Checks Skipped** | Security (hardcoded args), Task Completion (no ARCH), TypeScript/React/Express/DB/Async/Accessibility (not applicable) |
| **Files Changed** | 3 new files (+ `specs/context/19.md` — untracked, must not be committed) |

## Review Process
- [x] Preflight checks passed
- [x] Files read directly (untracked, no committed diff)
- [x] Tech stack detected: Bash + YAML
- [x] CLAUDE.md read for project conventions
- [x] Triage agreed with developer
- [x] Inline review — 3 checks (Code Quality, Test Coverage, Config/Dependencies)
- [x] Findings compiled

---

## Verdict: ⚠️ APPROVE WITH COMMENTS

The implementation is correct and all 4 tests pass. Two medium findings and one critical manual action (the context file must not be committed) before the PR can merge cleanly.

### Finding Counts

| Category | 🔴 | 🟠 | 🟡 | 💭 | ⚠️ |
|----------|----|----|----|----|----|
| Code Quality | 0 | 0 | 2 | 1 | 0 |
| Test Coverage | 0 | 0 | 1 | 0 | 0 |
| Config/Dependencies | 0 | 0 | 0 | 0 | 1 |
| **Total** | **0** | **0** | **3** | **1** | **1** |

---

## Code Quality

### Findings

| # | File | Line | Severity | Description |
|---|------|------|----------|-------------|
| Q1 | `check-doc-hygiene.sh` | 17 | 🟡 Medium | `basename` variable shadows the `basename` command |
| Q2 | `check-doc-hygiene.sh` | 28 | 🟡 Medium | `exit "$errors"` exits with a count (0–2) rather than 0/1 |
| Q3 | `check-doc-hygiene.sh` | 17 | 💭 Low | `allowed` flag pattern is verbose; could use a regex match |

**Q1 — `basename` variable shadows command**

```bash
# current
basename=$(basename "$mdfile")
```

`basename` is both the variable being assigned and the command being called. This works — the command executes first, then the result is stored — but it surprises readers who might think the variable is being read recursively. Rename to `fname` or `mdname`:

```bash
fname=$(basename "$mdfile")
```

**Q2 — `exit "$errors"` with count**

When both checks fail, the script exits 2. GitHub Actions treats any non-zero as failure, so this is functionally correct. The convention for scripts is to exit 0 (success) or 1 (failure). Consider:

```bash
[ "$errors" -eq 0 ]  # exits 0 or 1 via the test return value
```

Or keep it as-is — the behaviour is correct, it's just non-standard.

**Q3 — Verbose allowlist membership test**

The inner `for` loop to check allowlist membership is clear but could be one line using a `case` statement:

```bash
case "$fname" in
  README.md|CLAUDE.md) ;;
  *)
    echo "ERROR: root-level $fname is not on the allowlist — add it or remove it before merging"
    errors=$((errors + 1))
    ;;
esac
```

This also makes adding new allowed filenames more explicit.

---

## Test Coverage

### Findings

| # | File | Line | Severity | Description |
|---|------|------|----------|-------------|
| T1 | `test-doc-hygiene.sh` | — | 🟡 Medium | Missing test: `specs/` directory does not exist at all |

**Acceptance criteria coverage:**

| Criterion | Tested? |
|-----------|---------|
| Fails when file under `specs/` | ✅ Test 1 |
| Fails when disallowed root `.md` exists | ✅ Test 2 |
| Passes when neither condition is triggered | ✅ Test 3 |
| Passes when `specs/` is empty | ✅ Test 4 |
| `specs/` absent entirely | ❌ Not tested |

**T1 — No `specs/` directory**

The check script uses `find "$ROOT/specs" -type f 2>/dev/null` — the `2>/dev/null` correctly suppresses the error when `specs/` doesn't exist, and `grep -q .` returns false on empty input, so the check correctly passes. But this is not covered by a test. Most real repos on main will have no `specs/` directory at all, so this is the most common path.

Add:

```bash
# --- Test 5: no specs/ dir is allowed ---

root=$(make_root)
assert_exit "exits 0 when specs/ does not exist" 0 "$CHECK" "$root"
cleanup "$root"
```

---

## Config / Dependencies

### Findings

| # | File | Line | Severity | Description |
|---|------|------|----------|-------------|
| C1 | `doc-hygiene.yml` | — | ⚠️ Manual | `specs/context/19.md` must NOT be committed — it will fail the CI check on this PR |

**C1 — Context file must stay untracked**

`specs/context/19.md` currently exists as an untracked file. If it is accidentally committed with this PR, the workflow will check out the branch and the check script will find a file under `specs/`, failing the CI gate on the PR that introduces the CI gate.

Per issue #19 convention: upload `specs/context/19.md` as a comment to issue #19, then delete the file before or instead of committing it. Alternatively, simply don't `git add` it when staging.

**Workflow correctness check:**

| Item | Status |
|------|--------|
| Triggers on PR to `main` only | ✅ Correct per spec |
| Uses `actions/checkout@v4` | ✅ Current major version |
| Runs script with `.` as root arg | ✅ Matches `ROOT="${1:-.}"` default |
| No unnecessary permissions granted | ✅ Read-only by default |
| Script name matches actual file | ✅ |

---

## Manual Checks Required

- [ ] **Do not commit `specs/context/19.md`** — stage only `.github/` files when committing this PR.
- [ ] Upload `specs/context/19.md` content to GitHub issue #19 as a comment before deleting (per project convention from `docs/NOTES.md` / issue #19 description).

---

## Prioritized Action Items

### Must Fix (🔴 Critical / 🟠 High)

*None.*

### Should Address (🟡 Medium)

- **Q1** — Rename `basename` variable to `fname` in `check-doc-hygiene.sh:17`
- **Q2** — Change `exit "$errors"` to `[ "$errors" -eq 0 ]` in `check-doc-hygiene.sh:28`
- **T1** — Add Test 5 for "no `specs/` directory" case in `test-doc-hygiene.sh`

### Nice to Have (💭 Low)

- **Q3** — Replace `for` loop allowlist check with a `case` statement for readability

---

*Generated by Review — 2026-05-03*
