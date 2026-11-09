#!/usr/bin/env python3
"""The merge gate: nothing reaches main unless this passes (docs/ROADMAP.md). Usage: python3 tools/gate.py [--quick]
--quick skips the browser smoke test (use it when Playwright is not installed; CI always runs the full gate)."""
import subprocess, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
steps = [('build', ['python3', 'build.py']), ('opsec', ['python3', 'tools/check_opsec.py']), ('db', ['python3', 'tools/validate_db.py'])]
if '--quick' not in sys.argv: steps.append(('smoke', ['python3', 'tools/tests/smoke_t.py']))
failed = []
for name, cmd in steps:
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    tail = (r.stdout + r.stderr).strip().split('\n')[-1][:160]
    print(f"{'PASS' if r.returncode == 0 else 'FAIL'} {name}: {tail}")
    if r.returncode: failed.append(name); print((r.stdout + r.stderr)[-1500:])
print('GATE OK' if not failed else 'GATE FAIL: ' + ', '.join(failed))
sys.exit(1 if failed else 0)
