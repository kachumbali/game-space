# Bullfrog appearance check at mid quality: skirmish vs one Bullfrog, a few camera distances; screenshots in /tmp/gs_shots (not committed: images are git-ignored)
from lib import *
with Runner() as R:
    pg = R.page(1280, 720, '?sk=bullfrog:1&sk_range=2000&q=mid&sk_missiles=0'); pg.wait_for_timeout(3000)
    pg.evaluate("()=>{const g=__game;__paused=true;for(let i=0;i<20;i++)g.update(0.05);g.updateHud()}")
    pg.screenshot(path='/tmp/gs_shots/bf_far.png')
    print(pg.evaluate("""()=>{const g=__game,T=g.THREE;const b=g.ships.find(s=>s.def.id==='bullfrog');const P=g.player;
      // park the player 700 m off the bullfrog's port bow, looking at it
      const f=new T.Vector3(0,0,-1).applyQuaternion(b.group.quaternion), r=new T.Vector3(1,0,0).applyQuaternion(b.group.quaternion), u=new T.Vector3(0,1,0).applyQuaternion(b.group.quaternion);
      P.group.position.copy(b.group.position).addScaledVector(f,-350).addScaledVector(r,-650).addScaledVector(u,180);
      P.group.lookAt(b.group.position); P.group.rotateY(Math.PI); P.vel.set(0,0,0);
      b.vel.set(0,0,0); for(let i=0;i<3;i++)g.update(0.02); g.updateHud();
      return {n:b.turrets.length,cls:b.turrets.map(t=>t.def.cls||'-').join(''),inst:b.vox.body.count+b.vox.glow.count}}"""))
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/gs_shots/bf_close.png')
    pg.evaluate("""()=>{const g=__game,T=g.THREE;const b=g.ships.find(s=>s.def.id==='bullfrog');const P=g.player;
      const f=new T.Vector3(0,0,-1).applyQuaternion(b.group.quaternion), u=new T.Vector3(0,1,0).applyQuaternion(b.group.quaternion);
      P.group.position.copy(b.group.position).addScaledVector(f,-900).addScaledVector(u,60);
      P.group.lookAt(b.group.position); P.group.rotateY(Math.PI); for(let i=0;i<3;i++)g.update(0.02); g.updateHud();}""")
    pg.wait_for_timeout(500); pg.screenshot(path='/tmp/gs_shots/bf_bow.png')
    print('ERRS', R.errs[:4])
