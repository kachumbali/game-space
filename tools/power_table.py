#!/usr/bin/env python3
"""Power budget table from data/db.json (no browser). python3 tools/power_table.py [--md] [--law [--apply]]
--law: every energy-costed weapon against tuning.energyLaw (MJ per damage point by delivery type; spine guns sized from their ship's capacitor).
Units: 1 energy unit = 1 MJ, per second = MW (sim seconds; real seconds = sim / SIM_SPEED 0.375).
Weapon draw = energy per shot / cooldown, summed over every energy-costed mount and turret firing at once (spine/charged weapons excluded).
Sustained = plant share on the weapons bus (plantMW / 3, balanced split) / peak draw. Step 1 of the power model: shields, engines and
the rest do not draw yet."""
import json, os, sys
SIM = 0.375
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dbmarks
db = dbmarks.resolve(dbmarks.load())      # variants (marks) resolved into complete defs
W = db['weapons']
if '--law' in sys.argv:
    L = db['tuning']['energyLaw']; K = L['mjPerDamage']
    def kind(w):
        if w.get('kind') == 'spine': return 'spine'
        if w.get('kind') == 'beam' or (w.get('kind') == 'proj' and w.get('dt') == 'en'): return 'beam'   # maser bolts are energy weapons too
        return 'pd' if w.get('dmgMsl') and w.get('dmg', 0) < 10 else 'coil'
    print('weapon        type   dmg     MJ/shot  MJ/dmg  law   off')
    for wid, w in sorted(W.items()):
        if w.get('base') or not w.get('dmg') or not (w.get('energy') or kind(w) == 'beam') or w.get('kind') == 'msl': continue
        k = kind(w); r = (w.get('energy') or 0) / w['dmg']
        print(f"{wid:13s} {k:6s} {w['dmg']:<7g} {w.get('energy') or 0:<8g} {r:<7.2f} {K[k]:<5g} {100 * (r / K[k] - 1):+.0f}%")
    print('\nspine guns vs ship capacitor (law: energy = %.2f x capacitor)' % L['spineCapacitorShare'])
    for sid, s in db['ships'].items():
        for m in s.get('mounts', []):
            w = W[m['w']]
            if w.get('kind') != 'spine' or s.get('base'): continue
            e = L['spineCapacitorShare'] * (s['power']['capacitorMJ'] - s['power'].get('burstMJ', 0))   # FROGG burst bank excluded (docs/DESIGN_ARMAMENT_LAWS.md)
            print(f"{sid:12s} {m['w']:6s} energy {w['energy']} (law {e:.0f})  dmg {w['dmg']} (law {e / K['spine']:.0f})")
    if '--apply' in sys.argv:                 # rewrite base weapons in data/db.json to the law (owner 2026-11-12: follow the law)
        raw = dbmarks.load(); txt = open(dbmarks.DB_PATH).read()
        def setnum(wid, key, val):
            global txt
            sec = txt.index('\n  "weapons": {'); i = txt.index('\n    "%s": {' % wid, sec); j = i + len('\n    "%s": ' % wid)
            _, end = json.JSONDecoder().raw_decode(txt, j); seg = txt[j:end]
            if '"%s":' % key not in seg: seg = seg[:1] + '\n      "%s": %s,' % (key, json.dumps(val)) + seg[1:]
            else:
                k = seg.index('"%s":' % key); v0 = k + len('"%s":' % key)
                while seg[v0] == ' ': v0 += 1
                _, v1 = json.JSONDecoder().raw_decode(seg, v0); seg = seg[:v0] + json.dumps(val) + seg[v1:]
            txt = txt[:j] + seg + txt[end:]
        spineOf = {}
        for sid, s in raw['ships'].items():
            for m in s.get('mounts', []):
                if raw['weapons'][m['w']].get('kind') == 'spine' and 'power' in s: spineOf.setdefault(m['w'], s['power']['capacitorMJ'] - s['power'].get('burstMJ', 0))
        for wid, w in raw['weapons'].items():
            if w.get('base') or not w.get('dmg') or w.get('kind') not in ('proj', 'beam', 'spine'): continue
            k = kind(w)
            if not w.get('energy') and k != 'beam': continue        # ammo-fed kinetic guns draw nothing from the capacitor
            if k == 'spine' and wid in spineOf:
                e = round(L['spineCapacitorShare'] * spineOf[wid]); d = round(e / K['spine'])
                if (e, d) != (w['energy'], w['dmg']): setnum(wid, 'energy', e); setnum(wid, 'dmg', d); print('set', wid, 'energy', e, 'dmg', d)
            elif k != 'spine':
                e = round(w['dmg'] * K[k], 2)
                if not w.get('energy') or abs(e - w['energy']) > 0.1 * w['energy']: setnum(wid, 'energy', e); print('set', wid, 'energy', w.get('energy'), '->', e)
        open(dbmarks.DB_PATH, 'w').write(txt)
    sys.exit(0)
rows = []
for sid, s in db['ships'].items():
    p = s['power']; bus = p['plantMW'] / 3
    draw = sum(W[m['w']]['energy'] / W[m['w']]['cd'] for m in s.get('mounts', []) + s.get('turrets', [])
               if W[m['w']].get('energy') and W[m['w']].get('cd') and W[m['w']].get('kind') != 'spine')
    react = [c for c in s['comps'] if c['role'] == 'power']
    empty = p['capacitorMJ'] / (draw - bus) if draw > bus else None
    rows.append((sid, s['cls'], p['plantMW'], round(bus), p['capacitorMJ'], len(react), sum(c['hp'] for c in react),
                 round(draw), (100 * bus / draw) if draw else None, empty))
hdr = ('ship', 'class', 'plant MW', 'wpn bus MW', 'capacitor MJ', 'reactors', 'reactor hp', 'wpn peak MW', 'sustain %', 'empty after sim-s (real-s)')
def f(r):
    e = '-' if r[9] is None else f'{r[9]:.1f} ({r[9] / SIM:.0f})'
    return [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], '-' if r[8] is None else f'{r[8]:.0f}', e]
out = [hdr] + [f(r) for r in rows]
if '--md' in sys.argv:
    print('| ' + ' | '.join(hdr) + ' |\n|' + '---|' * len(hdr))
    for r in out[1:]: print('| ' + ' | '.join(map(str, r)) + ' |')
else:
    w = [max(len(str(r[i])) for r in out) for i in range(len(hdr))]
    for r in out: print('  '.join(str(x).ljust(w[i]) for i, x in enumerate(r)))
