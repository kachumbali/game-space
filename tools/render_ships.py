import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import *
import sys
OUT=REPO+'/docs/img/ships/'
Q=sys.argv[1] if len(sys.argv)>1 else 'high'
ONLY=sys.argv[2].split(',') if len(sys.argv)>2 else None
VIEWS=[('34',35,20),('top',0,88),('side',90,0),('front',180,8)]
HIDE="body>*:not(#c){display:none!important}"
SETUP='''(id)=>{const g=__game,T=g.THREE;__paused=true;
 if(window.__e){g.scene.remove(window.__e.group);window.__e.alive=false;}
 for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.player.group.visible=false;g.player.group.position.set(0,0,90000);
 const e=g.spawnShip(id,0,new T.Vector3(0,0,0),new T.Vector3(0,0,-100),{});e.vel.set(0,0,0);e.group.quaternion.set(0,0,0,1);e.shield.fore=0;e.shield.aft=0;window.__e=e;
 const d=e.def,mk=new T.Group();mk.name='mk';
 const COL={engine:0xff8a20,gun:0xff3030,turret:0xffe040,radar:0x30e0ff,shield:0x4080ff,radiator:0xff40ff,reactor:0xffffff};
 const add=(p,r,c)=>{const m=new T.Mesh(new T.SphereGeometry(r,10,8),new T.MeshBasicMaterial({color:c,depthTest:false,transparent:true,opacity:0.85}));m.position.set(p[0],p[1],p[2]);m.renderOrder=999;mk.add(m);
   if(d.mirror&&Math.abs(p[0])>0.05){const m2=m.clone();m2.position.x=-p[0];mk.add(m2);}};
 const base=Math.max(0.3,d.length*0.006);
 for(const c of d.comps||[])add(c.pos,Math.max(base,(c.r||1)*0.45),COL[c.role]||0xaaaaaa);
 for(const m of d.mounts||[])if(m.pos)add(m.pos,base*0.7,0xff3030);
 for(const m of d.turrets||[])add(m.pos,base*0.8,0xffe040);
 for(const m of d.engines||[])if(m.pos)add(m.pos,base*0.9,0xff8a20);
 mk.visible=false;e.group.add(mk);window.__mk=mk;
 return d.length}'''
CAM='''([L,az,el,k,mk])=>{const g=__game,T=g.THREE,c=g.camera;c.fov=30;c.updateProjectionMatrix();const d=L*k;const a=az*Math.PI/180,b=el*Math.PI/180;
 c.position.set(Math.sin(a)*Math.cos(b)*d,Math.sin(b)*d,-Math.cos(a)*Math.cos(b)*d);c.up.set(0,1,0);if(el>80)c.up.set(0,0,-1);c.lookAt(0,0,0);c.updateMatrixWorld(true);window.__mk.visible=!!mk;}'''
with Runner() as R:
    pg=R.page(900,540,'?free&n=0&wing=0&q='+Q); pg.wait_for_timeout(1500)
    pg.add_style_tag(content=HIDE)
    ids=pg.evaluate('Object.keys(__game.SHIPS)')
    for id in ids:
        if ONLY and id not in ONLY: continue
        L=pg.evaluate(SETUP,id); pg.wait_for_timeout(400)
        k=2.5
        pg.evaluate(CAM,[L,35,20,k,0]); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}{id}_clean.png')
        for nm,az,el in VIEWS:
            pg.evaluate(CAM,[L,az,el,k,1]); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}{id}_{nm}.png')
        print(id,L,flush=True)
    print(R.errs[:5])
