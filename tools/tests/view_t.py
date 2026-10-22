from lib import *
import sys
Q=sys.argv[1]; ONLY=sys.argv[2].split(',')
VIEWS=[('front',0,6,1.0),('mid',40,22,1.6),('side',90,5,1.3),('rear',200,15,1.4)]
HIDE="body>*:not(#c){display:none!important}"
SETUP='''(id)=>{const g=__game,T=g.THREE;__paused=true;
 if(window.__e){g.scene.remove(window.__e.group);window.__e.alive=false;}
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.player.group.visible=false;g.player.group.position.set(0,0,90000);
 const e=g.spawnShip(id,0,new T.Vector3(0,0,0),new T.Vector3(0,0,-100),{});e.vel.set(0,0,0);e.group.quaternion.set(0,0,0,1);e.shield.fore=0;e.shield.aft=0;window.__e=e;return e.def.length}'''
CAM='''([L,az,el,k])=>{const g=__game,c=g.camera;c.fov=34;c.updateProjectionMatrix();const d=L*k;const a=az*Math.PI/180,b=el*Math.PI/180;
 c.position.set(Math.sin(a)*Math.cos(b)*d,Math.sin(b)*d,-Math.cos(a)*Math.cos(b)*d);c.up.set(0,1,0);c.lookAt(0,0,0);c.updateMatrixWorld(true);}'''
with Runner() as R:
    pg=R.page(900,540,'?free&n=0&wing=0&q='+Q); pg.wait_for_timeout(1500)
    pg.add_style_tag(content=HIDE)
    for id in ONLY:
        L=pg.evaluate(SETUP,id); pg.wait_for_timeout(400)
        for nm,az,el,kk in VIEWS:
            pg.evaluate(CAM,[L,az,el,kk]); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/v_{id}_{nm}.png')
        print(id,L,flush=True)
    print(R.errs[:5])
