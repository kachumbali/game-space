"""Tactical docking at a Tender (owner decision 2026-10-22): approach within 500 m, press D, the ship
auto-docks to a service boom and holds while cassettes and missiles go in; D again undocks; full magazines
auto-undock. Docked ships rearm at twice the proximity trickle that hovering AI ships get.
Usage: python3 dock_t.py. Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import sys, json
PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);
const P=g.player;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const DT=0.05;const stepN=(sec,fn)=>{let t=0;while(t<sec-1e-9){g.update(DT);t+=DT;if(fn)fn(t);}};'''
def js(body, arg=None):
    return '(arg)=>{'+PRE+body+'}'
fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

with Runner() as R:
    # 1: dock -> glued at the boom -> rearm at the cassette rate -> auto-undock when full -> nothing repaired
    pg = R.page(320,180,'?free&n=0&q=low')
    pg.wait_for_timeout(300)
    r = pg.evaluate(js('''
      P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);P.target=null;
      const tn=g.spawnShip('tender',0,V(0,0,-150),V(0,0,-1),{ai:'capital'});tn.vel.set(0,0,0);tn.ai.hold=true;
      P.ammo.cannon=300;                    // 50%: the only pool that is not full
      const s0=Math.round(P.structure);P.structure=s0*0.5;
      g.dockTry();
      let everDocked=false, everGlued=false, t=0;
      while(t<30&&g.dock){g.update(DT);t+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,-150);
        if(g.dock&&g.dock.phase==='docked'){everDocked=true;
          const bp=tn.group.localToWorld(new T.Vector3(36,2,-56));
          if(P.group.position.distanceTo(bp)<2)everGlued=true;}}
      return {dockNow:!!g.dock,t:+t.toFixed(1),everDocked,cannon:Math.round(P.ammo.cannon),everGlued,
              strPct:Math.round(100*P.structure/s0),velOut:+P.vel.length().toFixed(0)};'''))
    print(json.dumps(r))
    check('dock request starts the approach (docking began)', r['everDocked'], str(r))
    check('docked ship is glued to the service boom', r['everGlued'], str(r))
    check('cassette rate refills the cannon (300 -> 600)', r['cannon'] == 600, str(r))
    check('auto-undock when full (dock released, push-out velocity)', not r['dockNow'] and r['velOut'] > 10, str(r))
    check('docking repairs nothing (structure unchanged at 50%)', r['strPct'] == 50, str(r))

    # 2: manual undock with D
    pg = R.page(320,180,'?free&n=0&q=low')
    pg.wait_for_timeout(300)
    r = pg.evaluate(js('''
      P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);P.target=null;
      const tn=g.spawnShip('tender',0,V(0,0,-150),V(0,0,-1),{ai:'capital'});tn.vel.set(0,0,0);tn.ai.hold=true;
      g.dockTry();
      let t=0,docked=false;
      while(t<15){g.update(DT);t+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,-150);
        if(g.dock&&g.dock.phase==='docked')docked=true;
        if(docked&&t>10){g.dockTry();break;}}
      return {manualUndock:!g.dock,docked};'''))
    print(json.dumps(r))
    check('D undocks manually', r['manualUndock'] and r['docked'], str(r))

    # 3: hovering AI ships get the half-rate shuttle trickle, docked get the full cassette rate
    pg = R.page(320,180,'?free&n=0&q=low')
    pg.wait_for_timeout(300)
    r = pg.evaluate(js('''
      P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);P.target=null;
      const tn=g.spawnShip('tender',0,V(0,0,0),V(0,0,-1),{ai:'capital'});tn.vel.set(0,0,0);tn.ai.hold=true;
      const k=g.spawnShip('kestrel',0,V(0,0,-300),V(0,0,-1),{});k.vel.set(0,0,0);k.ai.hold=true;k.ammo.cannon=100;
      P.group.position.set(0,0,-300);P.vel.set(0,0,0);P.ammo.cannon=100;P.target=null;   // low start so neither side caps
      g.dockTry();                                  // player docks: full cassette rate
      let t=0,dockedAt=-1;
      while(t<10){g.update(DT);t+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,0);k.vel.set(0,0,0);k.group.position.set(0,0,-300);
        if(g.dock&&g.dock.phase==='docked'&&dockedAt<0)dockedAt=t;}
      return {dockedAt:+dockedAt.toFixed(1),playerGain:Math.round(P.ammo.cannon-100),aiGain:Math.round(k.ammo.cannon-100)};'''))
    print(json.dumps(r))
    check(f"docked player rearms at the full cassette rate (~{r['playerGain']} rds in 10 s)", r['playerGain'] >= 280, str(r))
    check(f"hovering AI gets the half-rate trickle (~{r['aiGain']} rds in 10 s)", 140 <= r['aiGain'] <= 240, str(r))
    check('docked rate is about double the proximity trickle', r['playerGain'] > r['aiGain'] * 1.6, str(r))
    print('FAILED: ' + (str(fails) if fails else 'none'))
