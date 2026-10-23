"""Gun discipline, the Kestrel MD-9 mag, and the tactical nuke dial (owner decisions 2026-10-22).
One page per scenario. Usage: python3 discipline_t.py
Checks: AI burst cadence shortens with the ammo pool (60%/30% bands); the 5% gun-empty status stops gun
fire; the MD-9 fires from the right boom and draws the energy pool; and the nuke yield dial scales the
detonation (0.1 kT vs 2 kT produce different kill radii).
Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import sys, json
PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);
g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const DT=0.05;const stepN=(sec,fn)=>{let t=0;while(t<sec-1e-9){g.update(DT);t+=DT;if(fn)fn(t);}};
const dummy=()=>{const d=g.spawnShip('gulper',1,V(0,0,-400),V(0,0,0),{});
  d.shield.fore=d.shield.aft=1e6;d.structure=1e6;d.ai.hold=true;d.vel.set(0,0,0);
  for(const c of d.comps)if(c.role==='gun'||c.role==='turret')c.hp=0;   // disarmed: only the Kestrel shoots
  return d;};'''
def js(body, arg=None):
    return '(arg)=>{'+PRE+body+'}'
fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

with Runner() as R:
    # 1: burst cadence - drain rate scales with the ammo fraction band (free fire reference first)
    out = {}
    for frac in (0.95, 0.5, 0.2):
        pg = R.page(320,180,'?free&n=0&q=low')
        r = pg.evaluate(js(f'''
          const k=g.spawnShip('kestrel',0,V(0,0,0),V(0,0,-1),{{ai:'fighter',skill:5}});
          const d=dummy();k.target=d;k.gb=null;k.gunEmpty=false;
          k.ammo.cannon=Math.round(k.ammoMax.cannon*{frac});k.ammo.he=Math.round(k.ammoMax.he*{frac});
          const start=k.ammo.cannon;
          stepN(6,()=>{{d.vel.set(0,0,0);d.group.position.set(0,0,-400);k.vel.set(0,0,0);k.group.position.set(0,0,0);}});
          return {{start:Math.round(start),cannon:Math.round(k.ammo.cannon),frac:{frac},alive:k.alive}};'''))
        print(json.dumps(r)); out[frac] = r
    drain = {f: (out[f]['start'] - out[f]['cannon']) for f in out}
    free = drain[0.95]
    check(f"free-fire reference drained the cannon ({free} rds in 6 s, Kestrel alive)", free > 15 and out[0.95]['alive'], str(out[0.95]))
    check(f"50% pool throttles the burst (drain {drain[0.5]} vs free {free})", drain[0.5] < free * 0.8, str(drain))
    check(f"20% pool throttles harder (drain {drain[0.2]} vs 50% {drain[0.5]})", drain[0.2] < drain[0.5] * 0.75, str(drain))
    check("50% band still fights (drain > 25% of free)", drain[0.5] > free * 0.25, str(drain))

    # 2: gun-empty status at 5%
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const k=g.spawnShip('kestrel',0,V(0,0,0),V(0,0,-1),{ai:'fighter',skill:5});
      const d=dummy();k.target=d;
      k.ammo.cannon=10;k.ammo.he=10;   // ~2% and ~2% of pool: below the 5% gun-empty line
      const c0=k.ammo.cannon;
      stepN(3,()=>{d.vel.set(0,0,0);d.group.position.set(0,0,-400);k.vel.set(0,0,0);k.group.position.set(0,0,0);});
      return {gunEmpty:!!k.gunEmpty,cannon:k.ammo.cannon,c0};'''))
    print(json.dumps(r))
    check('gun-empty status set at 5%', r['gunEmpty'], str(r))
    check('gun fire stopped (cannon unchanged)', r['cannon'] == r['c0'], str(r))

    # 3: MD-9 mag fires and draws the energy pool
    pg = R.page(320,180,'?free&n=0&q=low')
    r = pg.evaluate(js('''
      const k=g.spawnShip('kestrel',0,V(0,0,0),V(0,0,-1),{ai:'fighter',skill:5});
      const d=dummy();k.target=d;
      let sawMag=false;
      stepN(6,()=>{d.vel.set(0,0,0);d.group.position.set(0,0,-400);k.vel.set(0,0,0);k.group.position.set(0,0,0);
        if(g.bolts.some(b=>b.wid==='fmag'&&b.owner===k))sawMag=true;});
      return {sawMag,energy:Math.round(k.energy),energyMax:k.energyMax};'''))
    print(json.dumps(r))
    check('the MD-9 fires from the Kestrel', r['sawMag'], str(r))
    check('the MD-9 draws the energy pool (below max after firing)', r['energy'] < r['energyMax'], str(r))

    # 4: nuke yield dial - 0.1 kT vs 2 kT produce different kill counts on the same cluster
    res = {}
    for kt in (0.1, 2.0):
        pg = R.page(320,180,f'?free&n=0&q=low&nuke=1&nukeKt={kt}')
        pg.wait_for_timeout(300)
        r = pg.evaluate(js(f'''
          const P=g.player;P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);P.group.updateMatrixWorld(true);
          const zs=[3000,3050,3100,3200,3400,3800];   // 0/50/100/200/400/800 m from the burst: the fluence model kills fighters within ~42 m at 0.1 kT, ~190 m at 2 kT
          const cluster=zs.map(z=>{{const f=g.spawnShip('darter',1,V(0,0,-z),V(0,0,0),{{}});f.vel.set(0,0,0);f.ai.hold=true;return f;}});
          const tgt=cluster[0];P.target=tgt;
          P.stores.nuke=1;P.nukeKt={kt};
          g.launchMissile(P,'nuke');   // fires unguided; the IR seeker walks it to the target
          let t=0;while(t<80){{g.update(0.05);t+=0.05;P.group.position.set(0,0,0);P.vel.set(0,0,0);}}
          return {{kt:{kt},dead:cluster.filter(f=>!f.alive).length,launched:P.stores.nuke===0}};'''))
        print(json.dumps(r)); res[kt] = r
    check('the 2 kT dial kills more than 0.1 kT on the same cluster', res[2.0]['dead'] > res[0.1]['dead'], str(res))
    check('the dial actually detonated (both launches killed something)', res[0.1]['dead'] >= 1 and res[2.0]['dead'] >= 1, str(res))
    print('FAILED: ' + (str(fails) if fails else 'none'))
