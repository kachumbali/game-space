from lib import *
import sys
with Runner() as R:
    pg=R.page(900,500,'?free&n=0&q=low'); pg.wait_for_timeout(500); pg.add_style_tag(content='body>*:not(#c){display:none!important}')
    pg.evaluate('''()=>{const g=__game,T=g.THREE;__paused=true;
      for(const s of g.ships) if(s!==g.player){s.alive=false;}
      g.player.group.position.set(0,0,-3000);
      const b=g.spawnShip('bullfrog',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{});
      b.vel.set(0,0,0); window.__b=b;}''')
    views={'side':[600,0,0,0,0,0],'top':[0,650,1,0,0,0],'front':[0,50,-700,0,0,0],'iso':[-420,240,-480,0,0,0],'under':[250,-380,-300,0,0,0]}
    for n,(x,y,z,tx,ty,tz) in views.items():
        pg.evaluate('''([x,y,z])=>{const g=__game,c=g.camera;g.player.group.visible=false;c.position.set(x,y,z);c.up.set(0,1,0);c.lookAt(0,0,0);if(x==0&&z==1)c.up.set(0,0,-1),c.lookAt(0,0,0);c.updateMatrixWorld(true);}''',[x,y,z])
        pg.wait_for_timeout(6000)
        #print(pg.evaluate('()=>[__paused,__game.camera.position.toArray(),__game.ships.length,__game.ships.map(s=>s.def.id+s.group.position.toArray().map(Math.round))]'))
        pg.screenshot(path=f'/tmp/gs_bf_{n}.png')
    print(R.errs[:5])
