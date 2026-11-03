#!/usr/bin/env python3
"""Consistency check for data/db.json (no browser needed). Run from anywhere: python3 tools/validate_db.py [path/to/db.json]
Exit code 1 on any error. Checks: every mounted/turreted weapon exists, every mount points at a component of its ship,
store keys match, armour/class tables cover every ship, hex colours are well-formed, the tuning section is complete, and marks
(base + mods variants, docs/MARKS_SCHEMA.md): base exists, only known keys, deltas inside a sane band, roman-numeral name suffix.
Marks are checked on the raw file; every other check runs on the resolved db, so variants are validated as complete defs."""
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dbmarks
raw = dbmarks.load(sys.argv[1] if len(sys.argv) > 1 else dbmarks.DB_PATH)
errs, warns = [], []
def err(m): errs.append(m)
def warn(m): warns.append(m)

# ---- ordnance hardpoints (docs/ORDNANCE_MANIFEST.md) ----
SIZES = ('S', 'M', 'L', 'XL')
for sid, ship in raw['ships'].items():
    if 'launchers' not in ship: continue
    entries = ship['launchers']
    if not isinstance(entries, list): err(f'ships.{sid}.launchers must be a list'); continue
    seen = set()
    for i, launcher in enumerate(entries):
        loc = f'ships.{sid}.launchers[{i}]'
        if not isinstance(launcher, dict): err(f'{loc} must be an object'); continue
        ident = launcher.get('id')
        if not isinstance(ident, str) or not ident or ident in seen: err(f'{loc}: missing or duplicate id')
        seen.add(ident)
        if launcher.get('kind') not in ('fixed','reloadable'): err(f'{loc}: kind must be fixed or reloadable')
        if launcher.get('role') not in ('missile','torpedo'): err(f'{loc}: role must be missile or torpedo')
        for field in ('cap','count'):
            value=launcher.get(field, 1 if field=='count' else None)
            if not isinstance(value,int) or isinstance(value,bool) or value<1: err(f'{loc}.{field}: positive integer required')
        points = launcher.get('positions')
        if not isinstance(points, list) or len(points) != launcher.get('count') or any(not isinstance(p, list) or len(p) != 3 or any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) for v in p) for p in (points if isinstance(points, list) else [])):
            err(f'{loc}.positions: one finite 3D point per launcher required')
        elif any(any(abs(v) > h for v, h in zip(p, ship['half'])) for p in points):
            err(f'{loc}.positions: launcher point outside the hull extents')
        for field in ('mountHp', 'mountRadius'):
            value = launcher.get(field)
            if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or value <= 0: err(f'{loc}.{field}: finite positive number required')
        reload=launcher.get('reload')
        if not isinstance(reload,(int,float)) or isinstance(reload,bool) or not math.isfinite(reload) or reload<0: err(f'{loc}.reload: finite non-negative number required')
        stores=launcher.get('stores',[])
        if not isinstance(stores,list): err(f'{loc}.stores must be a list'); continue
        for wid in stores:
            w=raw['weapons'].get(wid,{}) if isinstance(wid,str) else {}
            if w.get('kind')!='msl' or bool(w.get('torp')) != (launcher.get('role')=='torpedo') or w.get('nuclear'): err(f'{loc}: incompatible store {wid!r}')
    plan=ship.get('ordnancePlan')
    if not isinstance(plan,dict) or plan.get('enabled') is not False: err(f'ships.{sid}.ordnancePlan must remain disabled')
    if isinstance(plan,dict):
        h=plan.get('hangar',{})
        if h.get('total',0):
            refs=h.get('bayComponents',[]); extra=h.get('extraComponents',[])
            if not isinstance(extra,list): err(f'ships.{sid}.hangar: invalid extra components'); extra=[]
            components={c.get('id'):c for c in ship.get('comps',[])}
            for c in extra:
                if not isinstance(c,dict) or not isinstance(c.get('id'),str) or c['id'] in components:
                    err(f'ships.{sid}.hangar: invalid extra component'); continue
                components[c['id']]=c
            if not isinstance(refs,list) or any(not isinstance(r,str) for r in refs) or len(refs)!=h.get('bays') or len(set(refs))!=len(refs): err(f'ships.{sid}.hangar: bay references must match bay count')
            elif any(ref not in components or components[ref].get('role') not in ('bay','dock') for ref in refs): err(f'ships.{sid}.hangar: missing bay component')
            manifest=h.get('manifest',{})
            if not isinstance(manifest,dict) or any(k not in raw['ships'] or not isinstance(v,int) or isinstance(v,bool) or v < 0 for k,v in manifest.items()) or sum(manifest.values()) != h.get('total'):
                err(f'ships.{sid}.hangar: invalid manifest or total')
            if not isinstance(h.get('airborneCap'),int) or not 0 < h['airborneCap'] <= h['total']: err(f'ships.{sid}.hangar: invalid airborne cap')
            if not isinstance(h.get('interval'),(int,float)) or h['interval'] <= 0: err(f'ships.{sid}.hangar: invalid interval')
for sid, s in raw['ships'].items():
    hp = s.get('hardpoints')
    if hp is None: continue
    where = f'ships.{sid}.hardpoints'
    ids = [h.get('id') for h in hp]
    if len(set(ids)) != len(ids): err(f'{where}: duplicate station ids')
    default = {}
    for h in hp:
        pos = h.get('pos')
        if not isinstance(pos, list) or len(pos) != 3 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in pos): err(f'{where}.{h.get("id")}: pos must be three coordinates')
        if h.get('size') not in SIZES: err(f'{where}.{h.get("id")}: size must be one of {SIZES}')
        if not isinstance(h.get('cap'), int) or h['cap'] < 1: err(f'{where}.{h.get("id")}: cap must be a positive integer')
        if not h.get('allow'): err(f'{where}.{h.get("id")}: needs a non-empty allow list'); continue
        for w in h['allow']:
            if raw['weapons'].get(w, {}).get('kind') != 'msl': err(f'{where}.{h.get("id")}: allow {w!r} is not a missile/torpedo weapon')
        if 'base' not in s: default[h['allow'][0]] = default.get(h['allow'][0], 0) + h.get('cap', 0)
        torp_ok = s.get('ai', {}).get('role') == 'bomber' or s['cls'] != 'fighter' or h.get('legacy')
        if any(raw['weapons'].get(w, {}).get('torp') for w in h['allow']) and not torp_ok: err(f'{where}.{h.get("id")}: a torpedo station on a non-bomber fighter must be marked legacy: true')
    if 'base' not in s:
        for w, n in default.items():
            if s.get('stores', {}).get(w) != n: err(f'ships.{sid}: default station load of {w} is {n} but stores.{w} is {s.get("stores", {}).get(w)}')

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
            td0, td = b.get('tandem'), (mods.get('tandem.shieldDrain'), mods.get('tandem.pierce'), mods.get('tandem.window'))
            if td0 and any(x is not None and x.get('add', x.get('mul', 1) - 1) < 0 for x in td): err(f'{where}: a torpedo mark must not lower the tandem shieldDrain / pierce / window')
            for k in ('vmax', 'hp'):
                if mods.get(k, {}).get('mul', 1) < 1: err(f'{where}: torpedo marks must not lower {k}')
db = dbmarks.resolve(raw) if not errs else raw
W, S, A = db['weapons'], db['ships'], db['armor']
S = {k: v for k, v in S.items() if 'cls' in v}       # unresolved variants (only when mark errors were reported above)

# ---- tuning: every section the game reads must exist ----
for k in ('dmgx', 'ff', 'exposed', 'soft', 'hit', 'beam', 'flak', 'regen', 'missile', 'nuke', 'crash', 'fighter', 'afterburner', 'ai', 'turret'):
    if not isinstance(db.get('tuning', {}).get(k), dict): err(f'tuning.{k} missing')
ordnance = db.get('tuning', {}).get('ordnance')
if not isinstance(ordnance, dict) or not isinstance(ordnance.get('enabled'), bool): err('tuning.ordnance.enabled must be boolean')
else:
    caps=ordnance.get('liveCap')
    if not isinstance(caps,dict): err('tuning.ordnance.liveCap must be an object')
    else:
        for k in ('desktop','tablet','phone'):
            v=caps.get(k)
            if not isinstance(v,int) or isinstance(v,bool) or v<1: err(f'tuning.ordnance.liveCap.{k} must be a positive integer')

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
for wid, w in W.items():      # tandem warhead (Codex schema 2026-11-01): shieldDrain = share of the facet shield removed by the precursor, pierce = share of the main charge that bypasses it, window = seconds the facet stays weakened
    t = w.get('tandem')
    if t is None: continue
    if not w.get('torp'): err(f'{wid}: tandem only on torpedoes')
    if not (isinstance(t.get('shieldDrain'), (int, float)) and 0 < t['shieldDrain'] <= 1): err(f'{wid}.tandem.shieldDrain must be in (0, 1]')
    if not (isinstance(t.get('window'), (int, float)) and 1 <= t['window'] <= 5): err(f'{wid}.tandem.window must be 1..5 s')
    if not (isinstance(t.get('pierce'), (int, float)) and 0 <= t['pierce'] <= 0.95): err(f'{wid}.tandem.pierce must be in [0, 0.95]')
    if w.get('mark') and not (2 <= t.get('window', 0) <= 4.2): warn(f'{wid}: window outside the 2-4 s range')
for wid, w in W.items():
    if w.get('kind') == 'msl' and 'pierce' in w and not 0 <= w['pierce'] <= 0.9: err(f'{wid}.pierce must be 0..0.9')
    if 'burst' in w or 'burstPause' in w:
        if not isinstance(w.get('burst'), int) or isinstance(w.get('burst'), bool) or w['burst'] < 1: err(f'{wid}.burst must be a positive integer')
        if not isinstance(w.get('burstPause'), (int, float)) or isinstance(w.get('burstPause'), bool) or w['burstPause'] <= 0: err(f'{wid}.burstPause must be positive')
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
