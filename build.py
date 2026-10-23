#!/usr/bin/env python3
"""Concatenate src/* (sorted by filename) into the single-file index.html.

Owner P0 2026-10-22: the build now fails on duplicate top-level names (the _bm merge collision
once broke the whole page). Every src part shares one module scope: two top-level declarations
of the same name is a bug, not a warning. CI runs this (see .github/workflows/ci.yml)."""
import glob, os, re, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
parts = sorted(glob.glob('src/*'))

TOP_LEVEL = re.compile(r'^(?:function\s*\*?\s+|const\s+|let\s+|var\s+|class\s+)([A-Za-z_$][\w$]*)', re.M)
decl = {}
for f in parts:
    for name in TOP_LEVEL.findall(open(f).read()):
        decl.setdefault(name, []).append(os.path.basename(f))

dups = {n: fs for n, fs in decl.items() if len(fs) > 1}
if dups:
    print('DUPLICATE TOP-LEVEL NAMES (one module scope - this would break the page at runtime):')
    for n, fs in sorted(dups.items()):
        print(f'  {n}: {", ".join(fs)}')
    sys.exit(1)

import json
db = json.load(open('data/db.json'))
db.pop('notes', None)                 # design notes stay in the JSON file; they are not needed at runtime
db.pop('_about', None)
db_js = json.dumps(db, separators=(',', ':'))
out = []
for f in parts:
    t = open(f).read().rstrip('\n') + '\n'
    if '/*@DB@*/null' in t: t = t.replace('/*@DB@*/null', db_js)
    out.append(t)
open('index.html', 'w').write(''.join(out))
print(f'built index.html from {len(out)} parts, {sum(map(len, out)) // 1024} KB, {len(decl)} top-level names checked')
