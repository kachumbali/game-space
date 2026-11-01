#!/usr/bin/env python3
"""Fail if a tracked file contains a real person's name or a non-noreply email address (owner rule 2026-11-01; docs/PLAN_V03.md).
The retired names are assembled from parts so this file does not contain them itself."""
import re, subprocess, sys
BANNED = [re.compile(w, re.I) for w in ('Jon' + 'as', 'Ko' + 'll' + r'\b')]
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
OK_EMAIL = re.compile(r'(@users\.noreply\.github\.com|^noreply@[a-z.]+)$')
bad = []
for f in subprocess.check_output(['git', 'ls-files'], text=True).split('\n'):
    if not f or f.endswith(('.png', '.jpg', '.jpeg', '.ogg', '.mp3', '.wav', '.woff2', '.ico')):
        continue
    try:
        text = open(f, encoding='utf-8').read()
    except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
        continue
    for i, line in enumerate(text.split('\n'), 1):
        for r in BANNED:
            if r.search(line): bad.append(f'{f}:{i}: retired real name')
        for m in EMAIL.findall(line):
            if not OK_EMAIL.search(m): bad.append(f'{f}:{i}: email address {m}')
print('\n'.join(bad) if bad else 'opsec OK')
sys.exit(1 if bad else 0)
