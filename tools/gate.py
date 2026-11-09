#!/usr/bin/env python3
"""The merge gate: nothing reaches main unless this passes (docs/ROADMAP.md). Usage: python3 tools/gate.py [--quick]
--quick skips the browser smoke test (use it when Playwright is not installed; CI always runs the full gate).
Every step runs with the interpreter that started the gate, so start it from the virtualenv that has Playwright:
  python3 -m venv /tmp/gs_venv && /tmp/gs_venv/bin/pip install playwright && /tmp/gs_venv/bin/playwright install chromium
  /tmp/gs_venv/bin/python tools/gate.py"""
import subprocess, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
steps = [('build', [sys.executable, 'build.py']), ('opsec', [sys.executable, 'tools/check_opsec.py']), ('db', [sys.executable, 'tools/validate_db.py'])]
if '--quick' not in sys.argv: steps.append(('smoke', [sys.executable, 'tools/tests/smoke_t.py']))
failed = []
for name, cmd in steps:
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    tail = (r.stdout + r.stderr).strip().split('\n')[-1][:160]
    print(f"{'PASS' if r.returncode == 0 else 'FAIL'} {name}: {tail}")
    if r.returncode: failed.append(name); print((r.stdout + r.stderr)[-1500:])
print('GATE OK' if not failed else 'GATE FAIL: ' + ', '.join(failed))
sys.exit(1 if failed else 0)
