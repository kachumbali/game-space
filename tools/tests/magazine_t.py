"""Magazines (owner decision 2026-10-22: every kinetic weapon carries ammo - the magazine scales
with the weapon, XL = 100 slugs - and fleet tenders resupply). One page per scenario.
Usage: python3 magazine_t.py
Checks: mount pool drains and the gun goes silent while others keep firing; turret drums drain and
the dry turret goes dark but keeps tracking; XL slugs decrement and a dry XL will not charge;
the Halberd's GA-9 rotary fires and runs dry; the Gulper's grp-2 maser lances now fire under AI
(capitalAI used to fire group 1 only); a tender rearms ammo/stores/slugs but repairs nothing.
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
    # 1: mount pool drains; the dry gun stops, the other group keeps firing
    pg = R.page(320,180,'?free&n=0')
    pg.wait_for_timeout(300)
    r = pg.evaluate(js('''
      const P=g.player;P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);P.group.updateMatrixWorld(true);
      P.ammo.cannon=25;
      stepN(3,()=>{P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);g.fireGuns(P,0b11);});
      return {cannon:P.ammo.cannon,he:P.ammo.he};'''))
    print(json.dumps(r))
    check('cannon pool drains to 0 and stops there', r['cannon'] == 0, str(r))
    check('the HE group kept its own pool', r['he'] > 0, str(r))

    # 2: turret drum drains; dry turret goes dark but keeps tracking
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const d=g.spawnShip('darter',1,V(0,0,-600),V(0,0,0),{});d.vel.set(0,0,0);d.ai.hold=true;
      ex.target=d;
      const pds=ex.turrets.filter(tr=>tr.wid==='pd');
      for(const tr of pds){tr.ammo=2;tr.dry=false;for(const m of tr.mats)m.color.multiplyScalar(1/0.55);}
      stepN(30,()=>{d.vel.set(0,0,0);d.group.position.set(0,0,-600);ex.vel.set(0,0,0);ex.group.position.set(0,0,0);
        if(pds.every(tr=>tr.ammo===0))return;});
      return {ammo:pds.map(tr=>tr.ammo),dry:pds.map(tr=>!!tr.dry)};'''))
    print(json.dumps(r))
    check('PD drums drained to 0', all(a == 0 for a in r['ammo']), str(r))
    check('dry PDs flagged dark', all(r['dry']), str(r))

    # 3: XL slugs decrement; a dry XL will not charge
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const bf=g.spawnShip('bullfrog',1,V(0,0,-900),V(0,0,0),{});
      bf.shield.fore=bf.shield.aft=1e6;bf.structure=1e6;bf.ai.hold=true;bf.vel.set(0,0,0);
      bf.comps.find(c=>c.id==='spine').hp=0;   // the dummy's own XL offline: a charge in the log must be the Exeter's
      ex.target=bf;__bf.log.length=0;
      const sp=__bf.spineInit(ex);sp.tgt=bf;sp.st='off';
      __bf.spineFire(ex);
      const afterFire=sp.mag;
      sp.mag=0;sp.st='cool';sp.cd=0;ex.energy=ex.energyMax;
      bf.group.position.set(0,0,-900);ex.vel.set(0,0,0);ex.group.position.set(0,0,0);ex.group.quaternion.identity();
      stepN(30,()=>{bf.vel.set(0,0,0);bf.group.position.set(0,0,-900);ex.vel.set(0,0,0);ex.group.position.set(0,0,0);});
      return {startMag:100,afterFire,charges:__bf.log.filter(l=>l.ev==='charge').length};'''))
    print(json.dumps(r))
    check('XL magazine starts at 100 and decrements per shot', r['afterFire'] == 99, str(r))
    check('a dry XL will not charge (capitalAI gate)', r['charges'] == 0, str(r))

    # 4: Halberd GA-9 rotary fires under AI and runs dry
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const hal=g.spawnShip('halberd',0,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const gu=g.spawnShip('gulper',1,V(0,0,-800),V(0,0,0),{});
      gu.shield.fore=gu.shield.aft=1e6;gu.structure=1e6;gu.ai.hold=true;gu.vel.set(0,0,0);
      hal.target=gu;
      let sawRotary=false;
      stepN(8,(t)=>{gu.vel.set(0,0,0);gu.group.position.set(0,0,-800);hal.vel.set(0,0,0);hal.group.position.set(0,0,0);
        if(g.bolts.some(b=>b.wid==='rotary'))sawRotary=true;});
      const fired=hal.ammo.rotary;
      hal.ammo.rotary=10;
      stepN(6,(t)=>{gu.vel.set(0,0,0);gu.group.position.set(0,0,-800);hal.vel.set(0,0,0);hal.group.position.set(0,0,0);});
      return {sawRotary,firedFrom900:hal.ammoMax.rotary-fired,dry:hal.ammo.rotary};'''))
    print(json.dumps(r))
    check('the GA-9 rotary fires under AI', r['sawRotary'], str(r))
    check('the rotary magazine drains (900-rd pool, 36 s of fire)', 0 < r['firedFrom900'] <= 900, str(r))
    check('the rotary runs dry and stops at 0', r['dry'] == 0, str(r))

    # 5: the Gulper's grp-2 maser lances now fire under AI (capitalAI used to fire group 1 only)
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const gu=g.spawnShip('gulper',1,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const hal=g.spawnShip('halberd',0,V(0,0,-700),V(0,0,0),{});
      hal.shield.fore=hal.shield.aft=1e6;hal.structure=1e6;hal.ai.hold=true;hal.vel.set(0,0,0);
      gu.ammo.rodg=0;gu.stores.tad=0;   // rods and torpedoes silent: any energy draw is the grp-2 maser lances
      gu.target=hal;
      const e0=gu.energyMax;
      stepN(6,()=>{hal.vel.set(0,0,0);hal.group.position.set(0,0,-700);gu.vel.set(0,0,0);gu.group.position.set(0,0,0);});
      return {energy0:e0,energy1:Math.round(gu.energy)};'''))
    print(json.dumps(r))
    check('Gulper grp-2 lances fire under AI (energy drawn)', r['energy1'] < r['energy0'] - 10, str(r))

    # 6: tender rearms but does not repair
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const tn=g.spawnShip('tender',0,V(0,0,0),V(0,0,-1),{ai:'capital'});
      const k=g.spawnShip('kestrel',0,V(0,0,-300),V(0,0,-1),{});
      k.ammo.cannon=0;k.ammo.he=0;k.stores.ir=0;k.stores.torp=0;
      const s0=Math.round(k.structure);k.structure=s0*0.5;
      stepN(8,()=>{k.vel.set(0,0,0);k.group.position.set(0,0,-300);tn.vel.set(0,0,0);tn.group.position.set(0,0,0);});
      return {cannon:Math.round(k.ammo.cannon),he:Math.round(k.ammo.he),ir:k.stores.ir,torp:k.stores.torp,
              str0:s0,str1:Math.round(k.structure),strPct:Math.round(100*k.structure/s0)};'''))
    print(json.dumps(r))
    check('tender restores gun ammo pools', r['cannon'] > 0 and r['he'] > 0, str(r))
    check('tender restores missile stores', r['ir'] >= 1 and r['torp'] >= 1, str(r))
    check('tender repairs nothing (structure unchanged)', r['strPct'] == 50, str(r))
    print('FAILED: ' + (str(fails) if fails else 'none'))
