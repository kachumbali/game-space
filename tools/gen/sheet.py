import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import sys
from lib import *
from PIL import Image
VIEW='''([id,ox,oy,oz,dist])=>{const g=__game;__paused=true;const T=g.THREE;
  g.ships.filter(s=>s.def.id!=='kestrel'&&s.def.id!==id).forEach(x=>x.group.position.set(5000,0,5000));
  let e=g.ships.find(s=>s.def.id===id);
  if(!e) e=g.makeShip(id,id==='halberd'?0.5:1,new T.Vector3(0,0,-300),new T.Quaternion());
  g.ships.forEach(x=>{if(x!==e){x.group.position.set(5000,0,5000);x.group.visible=false}});
  e.group.visible=true;e.group.position.set(0,0,-400); e.group.quaternion.identity(); e.vel.set(0,0,0); e.group.updateMatrixWorld(true);
  const c=g.camera; const v=new T.Vector3(ox,oy,oz).normalize().multiplyScalar(dist*e.def.length);
  c.position.copy(e.group.position).add(v); c.lookAt(e.group.position); c.updateMatrixWorld(true);}'''
ids=sys.argv[1].split(','); q=sys.argv[2] if len(sys.argv)>2 else ''
out=sys.argv[3] if len(sys.argv)>3 else 'sheet'
views=[('front34',(0.75,0.5,-0.9),0.95),('rear34',(-0.7,0.55,0.85),0.95),('top',(0.0,1,0.001),0.95),('side',(1,0.05,0.0),0.95)]
with Runner() as R:
    pg=R.page(1000,640,q)
    pg.wait_for_timeout(800)
    pg.add_style_tag(content='#brief,#ov,#wpn,#objs,#comm,#warn,#hit,#hud,#tgt,#log,#radar,#canopy,#cross,#bracket,#help,#msg{display:none!important}')
    for id in ids:
        ims=[]
        for name,v,d in views:
            pg.evaluate(VIEW,[id,*v,d]); pg.wait_for_timeout(500)
            fn=f'{SP}/_{id}_{name}.png'; pg.screenshot(path=fn); ims.append(Image.open(fn))
        W,H=ims[0].size
        sh=Image.new('RGB',(W*2,H*2))
        for i,im in enumerate(ims): sh.paste(im,((i%2)*W,(i//2)*H))
        sh.save(f'{SP}/{out}_{id}.png')
    print(R.errs)
