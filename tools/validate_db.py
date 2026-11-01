#!/usr/bin/env python3
"""Consistency check for data/db.json (no browser needed). Run from anywhere: python3 tools/validate_db.py [path/to/db.json]
Exit code 1 on any error. Checks: every mounted/turreted weapon exists, every mount points at a component of its ship,
store keys match, armour/class tables cover every ship, hex colours are well-formed, the tuning section is complete, and marks
(base + mods variants, docs/MARKS_SCHEMA.md): base exists, only known keys, deltas inside a sane band, roman-numeral name suffix.
Marks are checked on the raw file; every other check runs on the resolved db, so variants are validated as complete defs."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dbmarks
raw = dbmarks.load(sys.argv[1] if len(sys.argv) > 1 else dbmarks.DB_PATH)
errs, warns = [], []
def err(m): errs.append(m)
def warn(m): warns.append(m)

# ---- marks ----
MUL_MIN, MUL_MAX = 0.75, 1.20          # hard band for any single delta
LANE_MIN, LANE_MAX = 1.08, 1.12        # a mark's own-lane step (or its inverse for cost-like stats, e.g. cooldown)
FORBID_LAST = {'pos', 'half', 'length', 'radius', 'color', 'flame', 'flameColor', 'id', 'name', 'cls', 'fac', 'kind', 'seeker', 'sfx', 'glob', 'sz', 'len',
               'prims', 'comp', 'grp', 'store', 'role', 'mirror', 'r', 'seam', 'eye', 'launch', 'dock', 'size', 'base', 'mark', 'type'}
FORBID_FIRST = {'prims', 'engines', 'launch', 'dock', 'half', 'ai'}
for kind in ('ships', 'weapons'):
    table = raw[kind]
    seen = {}
    for vid, e in table.items():
        if 'base' not in e: continue
        where = f'{kind}.{vid}'
        for k in e:
            if k not in dbmarks.ENTRY_KEYS: err(f'{where}: unknown key {k!r} (allowed: {sorted(dbmarks.ENTRY_KEYS)})')
        b = table.get(e['base'])
        if b is None: err(f'{where}: base {e["base"]!r} does not exist'); continue
        if 'base' in b: err(f'{where}: base {e["base"]!r} is itself a variant (no chains)'); continue
        m = e.get('mark')
        if m not in dbmarks.ROMAN[1:]: err(f'{where}: mark {m!r} must be one of {dbmarks.ROMAN[1:]} (I is the base)'); continue
        want = f'{e["base"]}_{dbmarks.ROMAN.index(m) + 1}'
        if vid != want: err(f'{where}: id should be {want}')
        if (e['base'], m) in seen: err(f'{where}: duplicates mark {m} of {e["base"]} ({seen[(e["base"], m)]})')
        seen[(e['base'], m)] = vid
        if 'name' in e and e['name'] != f'{b["name"]} {m}': err(f'{where}: name {e["name"]!r} must be {b["name"] + " " + m!r} (base name + roman numeral)')
        mods = e.get('mods')
        if not isinstance(mods, dict) or not mods: err(f'{where}: needs a non-empty mods object'); continue
        lane = False
        for path, op in mods.items():
            if not isinstance(op, dict) or len(op) != 1 or next(iter(op)) not in ('mul', 'add', 'set'): err(f'{where}.{path}: op must be exactly one of mul/add/set'); continue
            segs = path.split('.')
            if segs[0] in FORBID_FIRST or segs[-1] in FORBID_LAST: err(f'{where}.{path}: geometry / identity / visual keys cannot be modded'); continue
            try: dbmarks.apply(json.loads(json.dumps(b)), path, op)
            except (KeyError, IndexError, ValueError, TypeError) as ex: err(f'{where}.{path}: bad path or non-number target ({ex!r})'); continue
            if 'set' in op:
                if segs[-1] == 'w':
                    if op['set'] not in raw['weapons']: err(f'{where}.{path}: unknown weapon {op["set"]!r}')
                elif not isinstance(op['set'], (int, float)): err(f'{where}.{path}: set only for numbers or a mount weapon id (.w)')
            elif 'mul' in op:
                x = op['mul']
                if not isinstance(x, (int, float)) or not MUL_MIN <= x <= MUL_MAX: err(f'{where}.{path}: mul {x} outside the sane band {MUL_MIN}..{MUL_MAX}')
                elif LANE_MIN - 1e-9 <= x <= LANE_MAX + 1e-9 or 1 / LANE_MAX - 1e-3 <= x <= 1 / LANE_MIN + 1e-3: lane = True
            elif not isinstance(op['add'], (int, float)): err(f'{where}.{path}: add must be a number')
        if not lane: warn(f'{where}: no delta is an own-lane step of 8..12% (x1.08..1.12 or its inverse)')
        if kind == 'weapons' and b.get('torp'):      # owner rule: torpedoes get +8-12% range per mark, slightly better speed and durability against PD
            r = mods.get('range', {}).get('mul')
            if r is None or not LANE_MIN - 1e-9 <= r <= LANE_MAX + 1e-9: err(f'{where}: a torpedo mark needs range x1.08..1.12')
            for k in ('vmax', 'hp'):
                if mods.get(k, {}).get('mul', 1) < 1: err(f'{where}: torpedo marks must not lower {k}')
db = dbmarks.resolve(raw) if not errs else raw
W, S, A = db['weapons'], db['ships'], db['armor']
S = {k: v for k, v in S.items() if 'cls' in v}       # unresolved variants (only when mark errors were reported above)

# ---- tuning: every section the game reads must exist ----
for k in ('dmgx', 'ff', 'exposed', 'soft', 'hit', 'beam', 'flak', 'regen', 'missile', 'nuke', 'crash', 'fighter', 'afterburner', 'ai', 'turret'):
    if not isinstance(db.get('tuning', {}).get(k), dict): err(f'tuning.{k} missing')

# ---- ships and weapons (resolved) ----
for sid, s in S.items():
    if 'mark' in s and s['name'] != S[s['base']]['name'] + ' ' + s['mark']: err(f'{sid}: resolved name {s["name"]!r} lacks the roman suffix')
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
nm = sum(1 for s in S.values() if 'mark' in s) + sum(1 for s in W.values() if 'mark' in s)
print(f'{len(S)} ships, {len(W)} weapons ({nm} marks), {len(A)} armour types: ' + ('OK' if not errs else f'{len(errs)} ERROR(S)'))
for e in errs: print('  ' + e)
for w in warns: print('  warning: ' + w)
sys.exit(1 if errs else 0)
