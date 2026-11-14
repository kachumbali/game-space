"""Carrier balance probe: one seeded escorted or lone Columbus vs Bullfrog fight from armament_duels' opening, printing the
damage the Bullfrog took by weapon, the Columbus hangar launches and the time line. Usage: python3 carrier_probe.py [seed] [lone]"""
import json, sys
from lib import Runner
import armament_duels as A
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 1
left = ['carrier'] if 'lone' in sys.argv else ['carrier', 'halberd', 'halberd']
JS = A.DUEL.replace("if (a || b) return {", "if (a || b) return {dmg: Object.fromEntries(teams.flat().map(s => [s.def.id + s.team, s.duelDmg || {}])), launched: (teams[0][0].capitalOrdnance?.hangar ? Object.values(teams[0][0].def.ordnancePlan.hangar.manifest).reduce((x,y)=>x+y,0) - Object.values(teams[0][0].capitalOrdnance.hangar.remaining).reduce((x,y)=>x+y,0) : -1), spine: __bf.log.filter(e => e.ev === 'spine').map(e => [e.t, e.hit, e.str0, e.str1]),")
with Runner() as R:
    pg = R.page(480, 270, f'?free&n=0&q=low&skyres=128&mute&duelbench&seed={seed}', init_script='globalThis.__paused=true')
    r = pg.evaluate(JS, [left, ['bullfrog'], 180, seed])
    print(json.dumps({k: r[k] for k in r if k != 'dmg'}))
    for k, v in r.get('dmg', {}).items():
        print(k, {a: round(b) for a, b in sorted(v.items(), key=lambda x: -x[1])[:10]})
