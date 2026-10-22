from lib import *
JS='''()=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
 const e=g.spawnShip('darter',1,P.group.position.clone().add(new T.Vector3(0,0,-600)),P.group.position.clone());
 e.vel.set(0,0,0);P.mounts.push({w:'laser',pos:[0,0,-3],grp:1,cool:0});
 const h0=e.structure+e.shield.fore+e.shield.aft;
 for(let i=0;i<20;i++){g.fireGuns(P,1);g.update(0.05);}
 return {h0,h1:e.structure+e.shield.fore+e.shield.aft,alive:e.alive}}'''
with Runner() as R:
    pg=R.page(640,360,'?free&n=0&wing=0'); pg.wait_for_timeout(800)
    print(pg.evaluate(JS)); print(R.errs[:5])
