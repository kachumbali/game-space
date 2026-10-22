from lib import *
JS='''([cls,n])=>{const g=__game,T=g.THREE;__paused=true;
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.ships.splice(0,g.ships.length,g.player); g.player.group.position.set(0,0,60000); g.player.team=2;
 const H=g.spawnShip(cls,0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{});
 const E=[];for(let i=0;i<n;i++)E.push(g.spawnShip(i%2?'leaper':'toad',1,new T.Vector3(-300+i*120,60,-900-i*30),H.group.position.clone(),{}));
 const out=[];let t=0,en0=H.energy;
 while(t<40&&E.some(s=>s.alive)&&H.alive){g.update(0.05);t+=0.05;if(Math.abs(t%10)<0.026)out.push([Math.round(t),E.filter(s=>s.alive).length,Math.round(H.energy),Math.round(H.structure)]);}
 return {t:Math.round(t),left:E.filter(s=>s.alive).length,hAlive:H.alive,hull:Math.round(H.structure),en:[en0,Math.round(H.energy)],cnt:{live:g.PLOG.cnt['beam.live'],trk:g.PLOG.cnt['beam.track'],tb:g.PLOG.cnt['shots.turretbeam']},out}}'''
with Runner() as R:
    pg=R.page(800,450,'?free'); pg.wait_for_timeout(500)
    for a in (['halberd',4],['halberd',8],['exeter',8]):
        pg.reload(); pg.wait_for_timeout(600)
        print(a, pg.evaluate(JS,a))
    print(R.errs[:4])
