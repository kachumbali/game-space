"""Turret aim check: for every turret of the test ship (dorsal and ventral), at each shot compute from the scene graph (independent of the game's own error
value) the angle between the barrel's world forward axis and the direction from the barrel tip to the target, and check the shot leaves from the barrel tip.
Usage: GS_PORT=8814 GS_TEST_DIR=/tmp/gs_test_aim python3 tur_aim_t.py [halberd|exeter|gulper ...]"""
import sys, json
from lib import *
IDS = sys.argv[1:] or ['halberd', 'exeter', 'gulper']
JS = '''(id)=>{const g=__game,T=g.THREE;__paused=true;
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.ships.splice(0,g.ships.length,g.player);g.player.group.position.set(0,0,60000);g.player.team=2;
 const H=g.spawnShip(id,id==='gulper'?1:0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{});H.group.quaternion.identity();H.shield.fore=H.shield.aft=1e6;H.structure=1e6;
 const hostile=id==='gulper'?0:1;const E=[];
 const add=(k,x,y,z)=>{const e=g.spawnShip(k,hostile,new T.Vector3(x,y,z),H.group.position.clone(),{});e.vel.set(0,0,0);e.ai.hold=true;e.hold=true;e.shield.fore=e.shield.aft=1e6;e.structure=1e6;E.push([e,x,y,z]);};
 const R=H.def.radius,d=Math.min(1100,R*3+500);
 add('halberd',0,d*.5,-d);add('halberd',0,-d*.5,-d);add('halberd',d*.7,0,d*.4);add('halberd',-d*.7,0,d*.4);add('halberd',0,d*.45,d);add('halberd',0,-d*.45,d*.9);
 for(let i=0;i<6;i++)add(i%2?'leaper':'toad',(i-2.5)*60,(i%2?1:-1)*(d*.3),-d*.6+i*40);
 const rec={},worst={};const q=new T.Quaternion(),fw=new T.Vector3(),tip=new T.Vector3(),tp=new T.Vector3(),dir=new T.Vector3();
 for(const T_ of H.turrets){rec[T_.comp]={w:T_.wid,side:T_.def.side,cls:T_.cls,n:0,maxAng:0,maxTipErr:0};}
 const last={};for(const T_ of H.turrets)last[T_.comp]=0;
 let t=0;
 while(t<45&&H.alive){for(const [e,x,y,z] of E){if(e.alive){e.group.position.set(x,y,z);e.vel.set(0,0,0);}}
  const nb=g.bolts.length;
  g.update(0.05);t+=0.05;H.shield.fore=H.shield.aft=1e6;
  H.group.updateMatrixWorld(true);
  for(const T_ of H.turrets){ if(T_.fired>last[T_.comp]){last[T_.comp]=T_.fired;
    T_.head.updateWorldMatrix(true,false);
    q.setFromRotationMatrix(T_.head.matrixWorld);fw.set(0,0,-1).applyQuaternion(q).normalize();
    const mz=T_.muzzles[(T_.mi-1+T_.muzzles.length)%T_.muzzles.length];tip.copy(mz).applyMatrix4(T_.head.matrixWorld);
    const tg=T_.tgt;if(!tg)continue;tp.copy(tg.group?tg.group.position:tg.pos);dir.copy(tp).sub(tip).normalize();
    const ang=fw.angleTo(dir);const r=rec[T_.comp];r.n++;r.maxAng=Math.max(r.maxAng,ang);
    // bolt origin: newest spawn point (bolt.prev after the step, ship drift < 2.5 m) must be the barrel tip
    if(T_.w.kind!=='beam'){const b=g.bolts.find(b=>b.owner===H&&b.wid===T_.wid&&b.prev.distanceTo(tip)<2.5);if(!b)r.noBoltAtTip=(r.noBoltAtTip||0)+1;}
  }}
 }
 return {id,len:H.def.length,t:Math.round(t),rec}}'''
DEAD = '''()=>{const g=__game,T=g.THREE;const H=g.ships.find(s=>s.team===0&&s.turrets&&s.turrets.length);
 for(const t of H.turrets){const c=g.compOf(H,t.comp);c.hp=0;}
 const n0=H.turrets.map(t=>t.fired);for(let i=0;i<60;i++)g.update(0.05);
 return H.turrets.map((t,i)=>({comp:t.comp,newShots:t.fired-n0[i],dead:t.dead,pitch:+new T.Euler().setFromQuaternion(t.head.quaternion).x.toFixed(2)}))}'''
bad = 0
with Runner() as R:
    pg = R.page(640, 360, '?free&n=0'); pg.wait_for_timeout(500)
    for sid in IDS:
        pg.reload(); pg.wait_for_function('window.__game!==undefined'); pg.wait_for_timeout(400)
        out = pg.evaluate(JS, sid)
        print(sid, 'len', out['len'], 't', out['t'])
        for c, r in out['rec'].items():
            flag = ''
            if r['n'] == 0: flag = 'NEVER FIRED'
            elif r['maxAng'] > 0.12: flag = 'AIM OFF'
            if r.get('noBoltAtTip'): flag += ' BOLT-NOT-AT-TIP x%d' % r['noBoltAtTip']
            if flag: bad += 1
            print('  %-6s %-6s side %2d cls %s shots %3d max angle %.3f rad %s' % (c, r['w'], r['side'], r['cls'], r['n'], r['maxAng'], flag))
    d = pg.evaluate(DEAD)
    for r in d:
        flag = '' if (r['newShots'] == 0 and r['dead'] and r['pitch'] < -0.3) else 'DEAD TURRET MISBEHAVES'
        if flag: bad += 1
        print('  dead', r['comp'], r, flag)
    print('errors', R.errs[:4])
print('BAD', bad)
sys.exit(1 if bad else 0)
