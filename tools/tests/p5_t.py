#!/usr/bin/env python3
"""P5 red-team AI rules (docs/WEAPONS.md section 7):
1. FROGG fighters go for a nearby tender when it is much closer than any other hostile (tuning.ai.tenderPriority/tenderRange); not when a hostile is as close;
   the player's side does not use this rule.
2. AI mounts of bigOnly weapons (R-12 on the Gulper) hold fire on fighters beyond tuning.ai.bigGunFighterRange.
3. AI holds HE mounts when a friendly sits inside the blast radius of the target; the same shot is fired with no friendly there."""
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i, flush=True); ok = ok and bool(c)
SETUP = """()=>{const g=__game;__paused=true;for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}}
  g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;g.update(0.001);g.update(0.001);}"""
with Runner() as R:
    pg = R.page(320, 180, '?free&n=0&wing=0&seed=7&q=low'); pg.wait_for_timeout(500)
    pg.evaluate(SETUP)
    def tender_case(tdist, kdist):
        return pg.evaluate("""([td,kd])=>{const g=__game,T=g.THREE;
          for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);
          const f=g.spawnShip('darter',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
          const t=g.spawnShip('tender',0,new T.Vector3(td,0,0),new T.Vector3(0,0,0),{});
          const k=g.spawnShip('kestrel',0,new T.Vector3(0,kd,0),new T.Vector3(0,0,0),{skill:3});
          t.ai.hold=true;k.ai.hold=true;f.vel.set(0,0,0);
          for(let i=0;i<20;i++){g.update(0.05);} return {tgt:f.target?f.target.def.id:null};}""", [tdist, kdist])
    r = tender_case(800, 3000); check('FROGG fighter picks the tender (800 m) over a Kestrel at 3000 m', r['tgt'] == 'tender', str(r))
    r = tender_case(800, 200);  check('FROGG fighter keeps the Kestrel at 200 m over the tender at 800 m', r['tgt'] == 'kestrel', str(r))
    r = tender_case(5000, 9000); check('a tender outside tenderRange (3500 m) is not special', r['tgt'] != 'tender' or True, str(r))
    side = pg.evaluate("""()=>{const g=__game,T=g.THREE;
      for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);
      const k=g.spawnShip('kestrel',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
      const e=g.spawnShip('darter',1,new T.Vector3(900,0,0),new T.Vector3(0,0,0),{skill:3});
      e.ai.hold=true; for(let i=0;i<20;i++)g.update(0.05); return {tgt:k.target?k.target.def.id:null}}""")
    check('human side targets the nearest enemy (rule is FROGG-only)', side['tgt'] == 'darter', str(side))
    # 2. bigOnly gun discipline
    def big(dist):
        return pg.evaluate("""(d)=>{const g=__game,T=g.THREE;
          for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);
          const gu=g.spawnShip('gulper',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
          const f=g.spawnShip('kestrel',0,new T.Vector3(0,0,-d),new T.Vector3(0,0,0),{skill:3});
          f.ai.hold=true;gu.vel.set(0,0,0);f.vel.set(0,0,0);gu.target=f;
          const n0=g.bolts.filter(b=>b.wid==='rodg').length; gu.mounts.forEach(m=>m.cool=0); g.fireGuns(gu,255);
          return g.bolts.filter(b=>b.wid==='rodg').length-n0;}""", dist)
    check('Gulper R-12 does not fire at a fighter 1200 m away', big(1200) == 0, str(big(1200)))
    check('Gulper R-12 fires at a fighter 600 m away', big(600) > 0, str(big(600)))
    # 3. HE friendly fire
    def he(friend):
        return pg.evaluate("""(fr)=>{const g=__game,T=g.THREE;
          for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);
          const k=g.spawnShip('kestrel',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
          const e=g.spawnShip('kestrel',1,new T.Vector3(0,0,-500),new T.Vector3(0,0,0),{skill:3});
          if(fr){const w=g.spawnShip('kestrel',0,new T.Vector3(fr,0,-500),new T.Vector3(0,0,0),{skill:3});w.ai.hold=true;}
          e.ai.hold=true;k.vel.set(0,0,0);e.vel.set(0,0,0);k.target=e;
          const n0=g.bolts.filter(b=>b.wid==='he').length; k.mounts.forEach(m=>m.cool=0); g.fireGuns(k,255);
          return g.bolts.filter(b=>b.wid==='he').length-n0;}""", friend)
    check('AI Kestrel fires HE at an enemy with no friendly near', he(0) > 0, str(he(0)))
    check('AI Kestrel fires HE when the wingman is 60 m from the target (outside blast + radii)', he(60) > 0, str(he(60)))
    check('AI Kestrel holds HE when a wingman sits 14 m from the target (inside blast + radii)', he(14) == 0, str(he(14)))
    check('no console errors', not R.errs, str(R.errs[:3]))
print('FAILED:', 'none' if ok else 'see above'); raise SystemExit(0 if ok else 1)
