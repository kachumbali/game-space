# Owner report 2026-11-11: a fighter hidden inside the lattice of a HECLA was still killed, the tender's turrets fired through their own hull.
# A turret must hold fire while its own ship's voxels lie between it and the target, its shells end on its own hull, and with a clear line it still fires.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
JS = """([mode])=>{const g=__game,T=g.THREE;__paused=true;
  g.bolts.length=g.missiles.length=0;
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.group.visible=false;}} g.ships.splice(0,g.ships.length,g.player);
  g.player.group.position.set(0,0,90000);g.player.team=2;
  // Build stationary test ships. spawnShip gives AI ships cruise velocity, and resetting
  // positions after update lets them move and collide before the reset.
  const stationary=(id,team)=>{
    const s=g.makeShip(id,team,new T.Vector3(),new T.Quaternion());
    s.mod.speed=0; s.mod.turn=0;
    return s;
  };
  g.setLod('off'); // A camera-driven collision-grid rebuild would invalidate the clearance check.
  const h=stationary('hecla',1), k=stationary('kestrel',0);
  const tw=t=>t.group.localToWorld(new T.Vector3(0,t.aimY,0));
  const blockedFrom=(t,p)=>{const a=tw(t),d=p.clone().sub(a),L=d.length();d.normalize();const st=Math.max(t.muzzle||0,t.dia||0)+h.vox.data.vs*g.TUNE.turret.losStart;
    return L>st && !!g.traceShip(h,a.clone().addScaledVector(d,st),a.clone().addScaledVector(d,Math.min(L,h.def.radius*2.2)));};
  // Score candidate positions inside the hull box that clear the Kestrel's collision probes,
  // using the fraction of nearby turrets that cannot see it (hide) or can (open).
  // own fixed sequence: Math.random's position depends on how many frames ran before this call (frame timing), so the candidate set would vary
  let sd=12345;const rnd=()=>((sd=sd*16807%2147483647)/2147483647);
  const D=h.vox.data;let best=null,bestN=-1;
  for(let i=0;i<4000;i++){const p=new T.Vector3((rnd()-.5)*2*D.hx*0.8,(rnd()-.5)*2*D.hy*0.8,(rnd()-.5)*2*D.hz*0.8);
    const w=h.group.localToWorld(p); k.group.position.copy(w);
    if(g.contactPoint(k,h,0)) continue;
    const near=h.turrets.filter(t=>tw(t).distanceTo(w)<t.w.range*0.9); if(near.length<4) continue;
    const n=near.filter(t=>blockedFrom(t,w)).length; const sc=mode==='hide'?n/near.length:1-n/near.length;
    if(sc>bestN){bestN=sc;best=w;}}
  if(!best) return {none:true};
  k.structure=1e7; k.shield.fore=k.shield.aft=0; k.group.position.copy(best);
  const f0=h.turrets.map(t=>t.fired), hp0=k.structure;
  let collision=false;
  for(let i=0;i<200;i++){
    g.update(0.05);
    collision ||= k.hitCool > 0 || h.hitCool > 0;
  }
  const rows=h.turrets.map((t,i)=>({w:t.wid,fired:t.fired-f0[i],blocked:blockedFrom(t,best),inRange:tw(t).distanceTo(best)<t.w.range}));
  return {collision, stationary:k.group.position.equals(best)&&h.group.position.lengthSq()===0, shots:rows.reduce((n,r)=>n+r.fired,0), score:+bestN.toFixed(2),n:rows.length,clearFired:rows.filter(r=>!r.blocked&&r.fired>0).length,
    blocked:rows.filter(r=>r.blocked&&r.inRange).length,clear:rows.filter(r=>!r.blocked&&r.inRange).length,dmg:Math.round(hp0-k.structure),held:h.turrets.reduce((a,t)=>a+(t.losBlocked||0),0)};}"""
with Runner() as R:
    pg = R.page(640, 360, '?free&n=0&q=low&seed=11', init_script='globalThis.__paused = true;')
    r = pg.evaluate(JS, ['hide']); print(' hidden in the lattice', r)
    check('a hiding place exists where most turrets have no clear line', not r.get('none') and r['blocked'] >= 3 and r['score'] >= 0.6, r)
    check('hidden in the lattice the fighter takes almost no damage (a shell may thread a real gap)', r['dmg'] <= 12, r['dmg'])
    check('the hold-fire rule was actually exercised', r['held'] > 0, r['held'])
    check('hidden test ships held position without a collision', r['stationary'] and not r['collision'], r)
    hid = r['dmg']
    pg.close()
    pg = R.page(640, 360, '?free&n=0&q=low&seed=11', init_script='globalThis.__paused = true;')
    r = pg.evaluate(JS, ['open']); print(' in the open', r)
    check('with a clear line the turrets still fire and hit', not r.get('none') and r['clearFired'] >= 1 and r['dmg'] >= 30, r)
    check('open test ships held position without a collision', r['stationary'] and not r['collision'], r)
    check('the open position is hit far harder than the hidden one', r['dmg'] >= 4 * max(1, hid), (r['dmg'], hid))
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
print('TURRET LOS OK' if ok else 'TURRET LOS FAIL'); raise SystemExit(0 if ok else 1)
