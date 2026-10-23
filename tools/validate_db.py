#!/usr/bin/env python3
"""Consistency check for data/db.json (no browser needed). Run from anywhere: python3 tools/validate_db.py
Exit code 1 on any error. Checks: every mounted/turreted weapon exists, every mount points at a component of its ship,
store keys match, armour/class tables cover every ship, and hex colours are well-formed."""
import json, os, re, sys
db = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'db.json')))
W, S, A = db['weapons'], db['ships'], db['armor']
errs = []
def err(m): errs.append(m)
for sid, s in S.items():
    comps = {c['id'] for c in s.get('comps', [])}
    for kind in ('mounts', 'turrets'):
        for m in s.get(kind, []):
            if m['w'] not in W: err(f'{sid}.{kind}: unknown weapon {m["w"]}')
            if m['comp'] not in comps: err(f'{sid}.{kind}: weapon {m["w"]} mounted on missing component {m["comp"]}')
            st = m.get('store')
            if st and st not in s.get('stores', {}) and W.get(m['w'], {}).get('kind') != 'spine': err(f'{sid}.{kind}: store {st} not in stores')
    for e in s.get('engines', []):
        if e['comp'] not in comps: err(f'{sid}.engines: missing component {e["comp"]}')
    if s['armor']['type'] not in A: err(f'{sid}: unknown armour {s["armor"]["type"]}')
    if s['cls'] not in db['mass'] or s['cls'] not in db['armorThreshCls']: err(f'{sid}: class {s["cls"]} missing from mass/armorThreshCls')
    for c in s.get('comps', []):
        if c['hp'] <= 0: err(f'{sid}.{c["id"]}: hp <= 0')
def hexes(o, p):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ('color', 'flameColor', 'flame') and not (isinstance(v, str) and re.fullmatch(r'#[0-9a-fA-F]{6}', v)): err(f'{p}/{k}: bad colour {v!r}')
            hexes(v, p + '/' + k)
    elif isinstance(o, list):
        for i, v in enumerate(o): hexes(v, p)
hexes(S, 'ships'); hexes(W, 'weapons')
print(f'{len(S)} ships, {len(W)} weapons, {len(A)} armour types: ' + ('OK' if not errs else f'{len(errs)} ERROR(S)'))
for e in errs: print('  ' + e)
sys.exit(1 if errs else 0)
