# Owner report 2026-11-12: some destroyer turrets were not attached to the hull. Every turret base must sit on solid hull voxels:
# scanning from the turret position towards the hull (along -side) must hit a solid voxel within 0.6 turret diameters plus one voxel.
import os, sys
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
ONLY = sys.argv[1].split(',') if len(sys.argv) > 1 else None
JS = """([id])=>{const g=__game,T=g.THREE;__paused=true;
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.group.visible=false;}}
  const e=g.spawnShip(id,1,new T.Vector3(0,0,0),new T.Vector3(0,0,-100),{});e.vel.set(0,0,0);e.group.quaternion.set(0,0,0,1);
  const V=e.vox; if(!V||!V.solid) return {none:true}; const D=V.data;
  const solid=(x,y,z)=>{const i=Math.floor((x+D.hx)/D.vs),j=Math.floor((y+D.hy)/D.vs),k=Math.floor((z+D.hz)/D.vs);
    return i>=0&&j>=0&&k>=0&&i<D.nx&&j<D.ny&&k<D.nz&&V.solid[(i*D.ny+j)*D.nz+k]===1;};
  const out=[];
  (e.def.turrets||[]).forEach((t,n)=>{const Dt=g.turretDia?g.turretDia(e,t):e.def.length*0.02, sd=t.side||1;
    // the seat footprint: centre plus four points at a third of the turret radius; each must find hull within 0.6 D below the base
    const pts=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[t.pos[0]+a*Dt*0.17,t.pos[2]+b*Dt*0.17]);
    let worst=0;
    for(const [x,z] of pts){let gap=null;const lim=0.6+D.vs/Dt;for(let s=-0.3;s<=lim;s+=D.vs/(4*Dt)){if(solid(x,t.pos[1]-sd*s*Dt,z)){gap=s;break;}} worst=Math.max(worst,gap===null?9:gap);}
    worst=worst>0.6+D.vs/Dt?worst:Math.min(worst,0.6);
    out.push({n,w:t.w,pos:t.pos,dia:+Dt.toFixed(2),gap:+worst.toFixed(2)});});
  e.alive=false;e.group.visible=false;g.scene.remove(e.group);
  return {vs:D.vs,rows:out};}"""
with Runner() as R:
    pg = R.page(640, 360, '?free&n=0&wing=0&q=high'); pg.wait_for_timeout(1500)
    ids = pg.evaluate("Object.keys(__game.SHIPS).filter(k=>(__game.SHIPS[k].turrets||[]).length && __game.SHIPS[k].cls!=='fighter')")
    for id in ids:
        if ONLY and id not in ONLY: continue
        r = pg.evaluate(JS, [id])
        if r.get('none'): print('skip', id); continue
        bad = [x for x in r['rows'] if x['gap'] > 0.6]
        check(f'{id}: all {len(r["rows"])} turret seats rest on hull', not bad, bad[:6])
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
sys.exit(0 if ok else 1)
