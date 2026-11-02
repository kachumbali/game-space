#!/usr/bin/env python3
"""A drone spawned by a mission has no controller (s.ctrl undefined). droneAI used to throw ("reading 'lastAttacker'"), which broke the whole update loop
(found by the campaign measurement in prologue mission 2). It must now run, and hunt the nearest hostile."""
from lib import *
with Runner() as R:
    pg = R.page(320, 180, '?free&n=0&wing=0&seed=7&q=low'); pg.wait_for_timeout(500)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;
      for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.player.group.position.set(0,0,60000);g.player.team=2;g.update(0.001);
      const d=g.spawnShip('drone',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
      const k=g.spawnShip('kestrel',0,new T.Vector3(0,0,-900),new T.Vector3(0,0,0),{skill:3}); k.ai.hold=true;
      let err=null; try{ for(let i=0;i<80;i++)g.update(0.05); }catch(e){err=String(e)}
      return {err, ctrl:d.ctrl===undefined||d.ctrl===null, tgt:d.target?d.target.def.id:null, alive:d.alive}}""")
    print(r)
    ok = r['err'] is None and r['ctrl'] and r['tgt'] == 'kestrel'
    print(('PASS' if ok else 'FAIL') + ' controller-less hostile drone runs and targets the Kestrel')
    print(('PASS' if not R.errs else 'FAIL') + ' no console errors', R.errs[:2])
    raise SystemExit(0 if ok and not R.errs else 1)
