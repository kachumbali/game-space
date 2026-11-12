#!/usr/bin/env python3
"""Range law (owner 2026-11-12): every gun and beam sits in the range band of its role, FROGG and human alike.
python3 tools/range_law.py            report every weapon against tuning.rangeLaw
python3 tools/range_law.py --apply    clamp ranges into their bands in data/db.json (projectiles: life = range / v, so the bolt really
                                      flies that far; beams and spine guns: the range field). Missiles keep their own ranges.
Marks multiply their base weapon, so only base weapons are written."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dbmarks
raw = dbmarks.load(); W = raw['weapons']; L = raw['tuning']['rangeLaw']
role = {w: r for r, ws in L['roles'].items() for w in ws}
def rng(w): return w.get('range') or (round(w['v'] * w['life']) if w.get('v') and w.get('life') else None)
bad = 0; fixes = []
print('weapon       role               range   band')
for wid, w in sorted(W.items()):
    if w.get('base') or w.get('kind') not in ('proj', 'beam', 'spine'): continue
    r = role.get(wid)
    if not r: print(f'{wid:12s} UNMAPPED'); bad += 1; continue
    lo, hi = L['bands'][r]; cur = rng(w); ok = lo <= cur <= hi
    print(f"{wid:12s} {r:18s} {cur:<7} {lo}-{hi} {'' if ok else '<- off'}")
    if not ok: fixes.append((wid, min(hi, max(lo, cur))))
if '--apply' in sys.argv:
    txt = open(dbmarks.DB_PATH).read()
    def setkey(wid, key, val):
        global txt
        sec = txt.index('\n  "weapons": {'); i = txt.index('\n    "%s": {' % wid, sec); j = i + len('\n    "%s": ' % wid)
        _, end = json.JSONDecoder().raw_decode(txt, j); seg = txt[j:end]
        if '"%s":' % key in seg:
            k = seg.index('"%s":' % key); v0 = k + len('"%s":' % key)
            while seg[v0] == ' ': v0 += 1
            _, v1 = json.JSONDecoder().raw_decode(seg, v0); seg = seg[:v0] + json.dumps(val) + seg[v1:]
        else:
            seg = seg[:1] + '\n      "%s": %s,' % (key, json.dumps(val)) + seg[1:]
        txt = txt[:j] + seg + txt[end:]
    for wid, r in fixes:
        w = W[wid]
        if w.get('kind') == 'proj' and w.get('v'): setkey(wid, 'life', round(r / w['v'], 3))
        if w.get('kind') != 'proj' or 'range' in w: setkey(wid, 'range', r)
        print('set', wid, r)
    open(dbmarks.DB_PATH, 'w').write(txt)
sys.exit(1 if bad else 0)
