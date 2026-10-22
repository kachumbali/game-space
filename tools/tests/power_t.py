"""AI power management (owner decision 2026-10-22): every ship works its 12-point energy budget,
not just the player's fighter. One page per scenario. Usage: python3 power_t.py
Checks: under fire -> SHIELDS; distant target -> ENGINES; pressure gone -> back to 4/4/4;
and the mechanics (shield regen at pw.s 8 is ~1.48x the 4/4/4 rate).
Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import sys, json
PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);
g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const DT=0.05;const stepN=(sec,fn)=>{let t=0;while(t<sec-1e-9){g.update(DT);t+=DT;if(fn)fn(t);}};'''
def js(body, arg=None):
    return '(arg)=>{'+PRE+body+'}'
fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

with Runner() as R:
    # 1: under maser fire (1200 m, all Bullfrog turrets in range) the AI pushes SHIELDS
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{ai:'capital',skill:4});
      const bf=g.spawnShip('bullfrog',1,V(0,0,-1200),V(0,0,0),{});
      bf.shield.fore=bf.shield.aft=1e6;bf.structure=1e6;bf.ai.hold=true;bf.vel.set(0,0,0);
      ex.target=bf;bf.target=ex;
      stepN(20,()=>{bf.vel.set(0,0,0);bf.group.position.set(0,0,-1200);ex.group.position.set(0,0,0);ex.vel.set(0,0,0);});
      return {pw:{...ex.pw}};'''))
    print(json.dumps(r))
    check('Exeter under maser fire pushes SHIELDS (pw.s > 4)', r['pw']['s'] > 4, str(r['pw']))

    # 2: distant target pushes ENGINES; target gone resets to 4/4/4 (player made friendly so the re-target does not pick it)
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      g.player.team=0;
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{ai:'capital',skill:4});
      const bf=g.spawnShip('bullfrog',1,V(0,0,-8000),V(0,0,0),{});
      bf.shield.fore=bf.shield.aft=1e6;bf.structure=1e6;bf.ai.hold=true;bf.vel.set(0,0,0);
      ex.target=bf;
      stepN(10,()=>{bf.vel.set(0,0,0);bf.group.position.set(0,0,-8000);});
      const far={...ex.pw};
      bf.alive=false;g.update(0.05);ex.target=null;
      stepN(15);
      return {far,calm:{...ex.pw}};'''))
    print(json.dumps(r))
    check('Exeter with a target 8 km off pushes ENGINES (pw.e > 4)', r['far']['e'] > 4, str(r['far']))
    check('pressure gone: back to 4/4/4', r['calm'] == {'w':4,'s':4,'e':4}, str(r['calm']))

    # 3: mechanics - shield regen scales with pwF(s,'s'); pwT pinned so the AI does not rebalance mid-run
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{});ex.ai.hold=true;ex.vel.set(0,0,0);ex.pwT=99;
      const cap=ex.shield.fore, s0=cap*0.5;
      ex.shield.fore=s0;ex.pwT=99;stepN(2);const r4=ex.shield.fore;
      ex.shield.fore=s0;for(let i=0;i<4;i++)g.powerShift(ex,'s');ex.pwT=99;
      stepN(2);const r8=ex.shield.fore;
      return {pw:{...ex.pw},s0:+s0.toFixed(1),r4:+r4.toFixed(1),r8:+r8.toFixed(1)};'''))
    print(json.dumps(r))
    g4, g8 = r['r4'] - r['s0'], r['r8'] - r['s0']
    ratio = g8 / g4 if g4 > 0 else 0
    check(f'shield regen at pw.s 8 is ~1.48x the 4/4/4 rate (got {ratio:.2f})', 1.3 < ratio < 1.7, str(r))
    print('FAILED: ' + (str(fails) if fails else 'none'))
