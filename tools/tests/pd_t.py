from lib import *
JS='''()=>{const g=__game,T=g.THREE;__paused=true;
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.ships.splice(0,g.ships.length,g.player); g.player.group.position.set(0,0,60000); g.player.team=2;
 const H=g.spawnShip('halberd',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{});
 H.maxSpeed=0;
 const E=g.spawnShip('toad',1,new T.Vector3(0,60,-500),H.group.position.clone(),{});
 let n0=g.bolts?g.bolts.length:-1,maxb=0,hits=0;const hp0=E.structure+E.shield.fore+E.shield.aft;
 for(let i=0;i<80;i++){g.update(0.05);E.vel.set(0,0,0);H.vel.set(0,0,0);E.group.position.set(0,60,-500);maxb=Math.max(maxb,g.bolts?g.bolts.length:0);}
 return {maxb,dmg:Math.round(hp0-(E.structure+E.shield.fore+E.shield.aft)),en:Math.round(H.energy),tb:g.PLOG.cnt['shots.turretbeam'],live:g.PLOG.cnt['beam.live'],trk:g.PLOG.cnt['beam.track'],hasBolts:!!g.bolts}}'''
with Runner() as R:
    pg=R.page(800,450,'?free'); pg.wait_for_timeout(500)
    print(pg.evaluate(JS)); print(R.errs[:4])
