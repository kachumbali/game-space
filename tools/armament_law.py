#!/usr/bin/env python3
"""Armament laws (docs/DESIGN_ARMAMENT_LAWS.md, owner 2026-11-12): power, toughness, hardpoint slots, FROGG burst stores.
python3 tools/armament_law.py [--calibrate] [--apply]
Size measure: in-game length L in km (tuning.scaleTo or def.length). A measured solid volume was tried first and dropped: the chunky
corvettes (scaled 64 -> 200 m) out-measured the slender 450 m Exeter, which would have made corvettes tougher than frigates. Prints
plant / store / hull / shields under the law against the data, the sustain check and the slot check.
--calibrate refits the power and hull coefficients on tuning.armamentLaw.calibrate (writes tuning.armamentLaw.coef).
--apply writes plant, capacitor (+ FROGG burst bank), structure and shields for corvettes, frigates and capitals, and the FROGG
fighter burst stores. Human fighters keep their tables. Run python3 build.py first (the measurement uses index.html)."""
import json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, 'tests'))
import dbmarks
from dbedit import DB, add_section_key
raw = dbmarks.load(); db = dbmarks.resolve(raw); S, W, T = db['ships'], db['weapons'], db['tuning']
DEFAULT = {
  "_doc": "docs/DESIGN_ARMAMENT_LAWS.md. V = in-game length in km. plantMW = plantA V^plantB; structure = hullA V^hullB x roleFactor; capacitorMJ = capPerMW x plantMW (+ burstMJ for FROGG); shields keep their ratio to structure. Humans: PD + secondaries sustained from the weapons bus (plant/3); FROGG: bus sustains PD only, the burst bank holds burstSec of the other energy weapons. Fitted by tools/armament_law.py --calibrate.",
  "calibrate": ["halberd", "exeter", "destroyer"],
  "coef": {"plantA": 487, "plantB": 0.63, "hullA": 1016, "hullB": 0.52, "capPerMW": 2.33},
  "roleFactor": {"warship": 1.0, "carrier": 0.85, "civil": 0.6},
  "roles": {"hecla": "carrier", "carrier": "carrier", "hivecarrier": "carrier", "liner": "civil", "tender": "civil"},
  "burstSec": {"capital": 8, "frigate": 8, "corvette": 8, "fighter": 4.5},
  "slots": {"corvette": {"XL": 0, "L": 0, "M": 2, "S": 4}, "frigate": {"XL": 1, "L": 4, "M": 8, "S": 6}, "destroyer": {"XL": 1, "L": 4, "M": 8, "S": 8},
            "carrier": {"XL": 0, "L": 0, "M": 8, "S": 12}, "froggCapital": {"XL": 1, "L": 2, "M": 6, "S": 12}},
  "slotClass": {"halberd": "corvette", "gulper": "corvette", "exeter": "frigate", "liner": "frigate", "tender": "frigate", "destroyer": "destroyer",
                "hecla": "carrier", "carrier": "carrier", "bullfrog": "froggCapital", "hivecarrier": "carrier"}
}
LAW = T.get('armamentLaw') or DEFAULT
BIG = [k for k, s in S.items() if not s.get('base') and s['cls'] in ('corvette', 'frigate', 'capital')]
FROGG_F = [k for k, s in S.items() if not s.get('base') and s['cls'] == 'fighter' and s['fac'] == 'frogg']

def is_spine(w): return W[w].get('kind') == 'spine'
def draw(s, which):            # MW at full fire of energy weapons; which: 'pd', 'nonpd', 'all' (spine and missiles excluded)
    tot = 0
    items = [(t['w'], t.get('cls') or W[t['w']].get('turretCls')) for t in s.get('turrets', [])] + [(m['w'], None) for m in s.get('mounts', []) if m.get('w')]
    for wid, cls in items:
        w = W[wid]
        if w.get('kind') == 'msl' or is_spine(wid) or not w.get('energy'): continue
        pd = (cls == 'S'); sec = (cls == 'M')                 # fixed mounts and L turrets are mains
        if which == 'pd' and not pd: continue
        if which == 'nonpd' and pd: continue
        if which == 'pdsec' and not (pd or sec): continue
        tot += w['energy'] / (w.get('cd') or 1)
    return tot
def slots(sid):
    s = S[sid]; c = {'XL': 0, 'L': 0, 'M': 0, 'S': 0}
    for t in s.get('turrets', []): c[t.get('cls') or W[t['w']].get('turretCls') or 'M'] += 1
    c['XL'] += sum(1 for m in s.get('mounts', []) if m.get('w') and is_spine(m['w']))
    return c

V = {k: T['scaleTo'].get(k, S[k]['length']) / 1000 for k in BIG}     # size measure: in-game length in km
coef = dict(LAW['coef'])
if '--calibrate' in sys.argv:
    cal = LAW['calibrate']; xs = [math.log(V[k]) for k in cal]
    def fit(ys):
        n = len(xs); mx = sum(xs) / n; my = sum(ys) / n; b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
        return math.exp(my - b * mx), b
    coef['plantA'], coef['plantB'] = fit([math.log(S[k]['power']['plantMW']) for k in cal])
    coef['hullA'], coef['hullB'] = fit([math.log(S[k]['structure']) for k in cal])
    caps = sorted(S[k]['power']['capacitorMJ'] / S[k]['power']['plantMW'] for k in cal); coef['capPerMW'] = caps[len(caps) // 2]
    coef = {k: round(v, 3) for k, v in coef.items()}
    print('calibrated', coef)
role = lambda k: LAW['roleFactor'][LAW['roles'].get(k, 'warship')]
rows = {}
print(f"{'ship':11s} {'L km':>7s} | {'plant':>6s} {'law':>6s} | {'cap':>6s} {'law':>6s} {'burst':>5s} | {'hull':>6s} {'law':>6s} | {'PD+SEC MW':>9s} {'bus':>5s} sustain | slots XL/L/M/S vs table")
for k in BIG:
    s = S[k]; v = V[k]; frogg = s['fac'] == 'frogg'
    plant = coef['plantA'] * v ** coef['plantB']; capb = coef['capPerMW'] * plant
    burst = LAW['burstSec'][s['cls']] * draw(s, 'nonpd') if frogg else 0
    hull = coef['hullA'] * v ** coef['hullB'] * role(k)
    need = draw(s, 'pd') if frogg else draw(s, 'pdsec'); bus = plant / 3
    c = slots(k); tab = LAW['slots'].get(LAW['slotClass'].get(k, ''), None)
    bad = tab and any(c[x] > tab[x] for x in c)
    rows[k] = dict(plant=round(plant), cap=round(capb + burst), burst=round(burst), hull=round(hull))
    print(f"{k:11s} {v:7.3f} | {s['power']['plantMW']:6.0f} {plant:6.0f} | {s['power']['capacitorMJ']:6.0f} {capb + burst:6.0f} {burst:5.0f} | {s['structure']:6.0f} {hull:6.0f} | {need:9.0f} {bus:5.0f} {'ok' if need <= bus else 'NO':7s} | {c['XL']}/{c['L']}/{c['M']}/{c['S']} {'' if tab is None else ('OVER ' if bad else 'ok ') + '/'.join(str(tab[x]) for x in ('XL','L','M','S'))}")
frows = {}
for k in FROGG_F:
    s = S[k]; d = draw(s, 'all')
    base = s['power']['capacitorMJ'] - s['power'].get('burstMJ', 0)
    cap = max(base, LAW['burstSec']['fighter'] * d)
    frows[k] = dict(cap=round(cap), burst=round(cap - base))
    print(f"{k:11s} fighter  draw {d:5.0f} MW  store {s['power']['capacitorMJ']:5.0f} -> {cap:5.0f} MJ ({cap / d if d else 0:.1f} s of full fire)")
if '--apply' in sys.argv:
    ed = DB()
    law = dict(LAW); law['coef'] = coef
    if 'armamentLaw' in raw['tuning']: ed.set_key('tuning', 'armamentLaw', law) if False else None
    if 'armamentLaw' not in raw['tuning']: add_section_key(ed, 'tuning', 'armamentLaw', law)
    for k, r in rows.items():
        s = raw['ships'][k]; p = dict(s['power']); p['plantMW'] = r['plant']; p['capacitorMJ'] = r['cap']
        if r['burst']: p['burstMJ'] = r['burst']
        else: p.pop('burstMJ', None)
        ed.set_key('ships', k, 'power', p)
        f = r['hull'] / s['structure']; ed.set_key('ships', k, 'structure', r['hull'])
        ed.set_key('ships', k, 'shield', {kk: round(vv * f) for kk, vv in s['shield'].items()})
    for k, r in frows.items():
        s = raw['ships'][k]; p = dict(s['power']); p['capacitorMJ'] = r['cap']
        if r['burst']: p['burstMJ'] = r['burst']
        else: p.pop('burstMJ', None)
        ed.set_key('ships', k, 'power', p)
    ed.save(); print('applied')
