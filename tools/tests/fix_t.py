# 2026-10-22 bug fixes: (1) missiles hit friendly hulls (damage scaled by FF), (2) collisions use the lighter body's extremities, not only its centre
from lib import *
with Runner() as R:
    pg=R.page(800,450,'?free&go'); pg.wait_for_timeout(1200)
    print('friendly missile',pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player;__paused=true;
      g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
      const h=g.spawnShip('halberd',0,P.group.position.clone().add(new T.Vector3(0,0,-700)),null,{});h.vel.set(0,0,0);h.throttle=0;h.ai.role='capital';
      const sh0=h.shield.fore+h.shield.aft,st0=h.structure;
      P.stores.torp=2;g.launchMissile(P,'torp');
      let t=0,dead=false;while(t<40){g.update(0.05);t+=0.05;if(!g.missiles.length){dead=true;break}}
      return {dead,t:+t.toFixed(1),shieldLoss:+(sh0-(h.shield.fore+h.shield.aft)).toFixed(1),structLoss:+(st0-h.structure).toFixed(1)}}"""))
    print('wing/nose collision',pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player;__paused=true;
      g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
      P.group.position.set(0,0,60000);
      const h=g.spawnShip('halberd',1,new T.Vector3(0,0,0),null,{});h.group.quaternion.identity();h.vel.set(0,0,0);h.throttle=0;h.group.updateMatrixWorld(true);
      const V=h.vox,D=V.data;let top=null;
      for(let j=D.ny-1;j>=0&&top===null;j--){const i=Math.floor(D.nx/2),k=Math.floor(D.nz/2);if(V.solid[(i*D.ny+j)*D.nz+k]===1)top=-D.hy+(j+0.5)*D.vs}
      const k=g.spawnShip('kestrel',0,new T.Vector3(0,top+k_h(),0),null,{});function k_h(){return g.SHIPS.kestrel.half[1]*0.9-1.0}
      k.group.position.set(0,top+g.SHIPS.kestrel.half[1]*0.9-1.0,0);k.group.quaternion.identity();k.vel.set(0,0,0);k.group.updateMatrixWorld(true);
      k.ai.order=null;const before=k.structure+k.shield.fore+k.shield.aft;
      g.update(0.02);
      return {top:+top.toFixed(1),kCenterY:+k.group.position.y.toFixed(1),hitCool:+k.hitCool.toFixed(2),lost:+(before-(k.structure+k.shield.fore+k.shield.aft)).toFixed(1)}}"""))
    print('ERRS',R.errs[:4])
