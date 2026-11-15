"""Exeter MK-90 mass driver (XL, owner decision 2026-10-22): the FROGG spine's charge/lock/cool machine
driven from capitalAI with a kinetic weapon. One page. Usage: python3 mdxl_t.py
Checks the cycle (delay 15 s, charge 4 s, lock at 3 s (Job U, 2026-11-14), cooldown 30 s) and that a hit lands ~540 to
structure (900 kin, 60% pierce). The Bullfrog target dummy is disarmed (spine emitter dead, hangar
manifests emptied, no Tadpoles) so only the XL is measured; its turrets stay live as pressure.
Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import sys, json
PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);
g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const freeze=(s)=>{s.vel.set(0,0,0);s.ai.hold=true;};'''
def js(body, arg=None):
    return '(arg)=>{'+PRE+body+'}'
fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

with Runner() as R:
    pg = R.page(320, 180, '?free&n=0&q=low')
    r = pg.evaluate(js('''
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const bf=g.spawnShip('bullfrog',1,V(0,0,-6000),V(0,0,0),{});
      bf.shield.fore=bf.shield.aft=1e6;bf.structure=1e6;bf.ai.hold=true;bf.vel.set(0,0,0);   // disarmed dummy, cannot die
      const c0=bf.comps.find(c=>c.id==='spine');c0.hp=0;                                     // its own spine offline
      const H0=__bf.hangarInit(bf);for(const b of H0.bays)for(const k in b.man)b.man[k]=0;    // no hangar fighters
      bf.stores.tad=0;                                                                       // no Tadpoles
      ex.target=bf;bf.target=ex;__bf.log.length=0;
      let t=0;const DT=0.05;const ev=[];let last='-';
      while(t<140&&ex.alive&&!ex.dying){g.update(DT);t+=DT;
        const st=ex.spine?ex.spine.st:'-';
        if(st!==last){ev.push([+t.toFixed(2),last+'>'+st,Math.round(ex.group.position.distanceTo(bf.group.position))]);last=st;}}
      return {ev,shots:ex.spine.shots};'''))
    print(json.dumps(r))
    ev = r['ev']
    ch = [e for e in ev if e[1].endswith('>charge')]
    lk = [e for e in ev if e[1].endswith('>lock')]
    co = [e for e in ev if e[1].endswith('>cool')]
    check('first charge not before 15 s (mdxl delay)', len(ch) > 0 and ch[0][0] >= 14.9, str(ch[:1]))
    check('charge to lock = 3 s (lockT 1 before the 4 s charge ends)', len(lk) > 0 and abs((lk[0][0] - ch[0][0]) - 3.0) < 0.15, str(lk[:1]))
    check('charge to fire = 4 s (a friendly-corridor hold may add a little, lockHold 3 s at most)', len(co) > 1 and -0.15 < (co[1][0] - ch[0][0]) - 4 < 0.65, str(co[:3]))
    hits = [s for s in r['shots'] if s['hit'] == 'bullfrog']
    check('mass driver shot hit the Bullfrog', len(hits) >= 1, str(r['shots'][:2]))
    check('hit pierces ~540 to structure (900 kin, 60% pierce; armour may add)', any(s['str0'] - s['str1'] >= 500 for s in hits), str([(s['str0'], s['str1']) for s in hits]))
    if len(hits) >= 2:
        check('cooldown 30 s before the next charge', len(ch) > 1 and ch[1][0] - co[1][0] >= 29.9, str(ch[:2]))
    print('FAILED: ' + (str(fails) if fails else 'none'))
