# Owner report 2026-11-14: "when I told all wingmen to attack the carrier they didn't". Wingmen ordered onto the 2.5 km Hive carrier
# hovered ~800 m off its hull: avoidance and break-off used its centre and radius, so they never closed or fired. They must now
# make attack runs and do damage. Usage: python3 wing_capital_t.py
import json, sys
from lib import Runner
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(640, 360, '?sk=hivecarrier:1,darter:3&sk_wing=2&go&q=low&seed=5', init_script='globalThis.__paused=true'); pg.wait_for_timeout(2500)
    r = pg.evaluate("""()=>{const g=__game;__paused=true;for(let i=0;i<20;i++)g.update(0.05);
      const P=g.player, hive=g.ships.find(s=>s.def.id==='hivecarrier'); const wing=g.ships.filter(s=>s.team===P.team&&s!==P&&s.def.cls==='fighter'&&!s.def.drone);
      for(const s of wing){s.ai.order={type:'attack',tgt:hive,slot:0,t:0};s.ai.tgtT=0;}
      const pool=()=>hive.structure+hive.shield.fore+hive.shield.aft, p0=pool(); let closest=1e9;
      for(let i=0;i<600;i++){g.update(0.05);for(const s of wing)closest=Math.min(closest,s.group.position.distanceTo(hive.group.position));}
      return {wing:wing.length, onTarget:wing.every(s=>s.target===hive), dmg:Math.round(p0-pool()), closest:Math.round(closest), radius:Math.round(hive.def.radius)};}""")
    print(json.dumps(r))
    check('both wingmen keep the ordered carrier as target', r['wing'] == 2 and r['onTarget'], r)
    check('they close inside the carrier radius (attack runs, not hovering at the sphere)', r['closest'] < r['radius'], r)
    check('they damage it: over 300 points of shields and hull in 30 s', r['dmg'] > 300, r['dmg'])
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
sys.exit(0 if ok else 1)
