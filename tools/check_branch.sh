#!/usr/bin/env bash
# One-command gate for any branch an agent hands back. Usage: tools/check_branch.sh [branch]   (default: current)
# Prints a short PASS/FAIL report: build + lint, db validation, URL-variant suite, P0 tests, secrets/email scan, image scan.
# Needs python3 + Playwright/Chromium (see tools/tests/README.md). Takes ~5 minutes under software rendering.
set -u
cd "$(dirname "$0")/.."
[ "${1:-}" ] && git checkout -q "$1"
fail=0; ok(){ echo "PASS  $1"; }; bad(){ echo "FAIL  $1"; fail=1; }
run_timeout(){
  limit=$1; shift
  if command -v timeout >/dev/null 2>&1; then timeout "$limit" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$limit" "$@"
  else
    python3 - "$limit" "$@" <<'PY'
import subprocess, sys
try:
    result = subprocess.run(sys.argv[2:], timeout=int(sys.argv[1]))
except subprocess.TimeoutExpired:
    print(f"command timed out after {sys.argv[1]} seconds", file=sys.stderr)
    raise SystemExit(124)
raise SystemExit(result.returncode)
PY
  fi
}
python3 build.py >/tmp/cb_build.log 2>&1 && ok "build + duplicate-name lint" || { bad "build"; tail -5 /tmp/cb_build.log; }
git diff --quiet -- index.html || echo "NOTE  index.html differs from a fresh build (commit the rebuilt file)"
python3 tools/validate_db.py >/tmp/cb_db.log 2>&1 && ok "db validation: $(tail -1 /tmp/cb_db.log)" || { bad "db validation"; cat /tmp/cb_db.log; }
n=$(git log origin/main..HEAD --format='%ae %ce' | grep -ci -E 'opendiplo|gmail' || true); [ "$n" = 0 ] && ok "no personal email in new commits" || bad "personal email in $n new commit(s)"
img=$(git diff --name-only origin/main..HEAD | grep -ci -E '\.(png|jpe?g|gif|webp)$' || true); [ "$img" = 0 ] && ok "no images added" || bad "$img image file(s) added"
( cd tools/tests && run_timeout 600 python3 suite1.py 2>&1 | tee /tmp/cb_suite.log | tail -1 >/dev/null )
tot=$(grep -c "ERRS" /tmp/cb_suite.log || true); clean=$(grep -c "ERRS \[\]" /tmp/cb_suite.log || true)
[ "$tot" -gt 0 ] && [ "$tot" = "$clean" ] && ok "suite1: $clean/$tot URL variants clean" || { bad "suite1: $clean/$tot clean"; grep -v "ERRS \[\]" /tmp/cb_suite.log | tail -5; }
( cd tools/tests && run_timeout 300 python3 p0_t.py 2>&1 | tail -1 | grep -q "FAILED: none" ) && ok "p0_t" || bad "p0_t"
git diff --stat origin/main..HEAD | tail -1
[ $fail = 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL"; exit $fail
