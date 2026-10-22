import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import sys, json, math
from lib import *
from marks import *
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageFilter, ImageOps
ids=sys.argv[1].split(',') if len(sys.argv)>1 else ['kestrel','darter','leaper','spitter','toad','reaver','halberd','gulper','exeter','hivecarrier']
PLACE='''([id,dx,dy,dz,fov,ext,vis])=>{const g=__game;__paused=true;const T=g.THREE;
  let e=g.ships.find(s=>s.def.id===id);
  if(!e) e=g.makeShip(id,id==='halberd'?0.5:1,new T.Vector3(0,0,-300),new T.Quaternion());
  g.ships.forEach(x=>{if(x!==e){x.group.position.set(5000,0,5000);x.group.visible=false}});
  e.group.visible=vis;e.group.position.set(0,0,-400);e.group.quaternion.identity();e.vel.set(0,0,0);e.group.updateMatrixWorld(true);
  const c=g.camera;c.fov=fov;c.updateProjectionMatrix();
  const dist=ext/Math.tan(fov*Math.PI/360);c.far=Math.max(c.far,dist*4);c.near=Math.max(0.1,dist*0.002);c.updateProjectionMatrix();
  const v=new T.Vector3(dx,dy,dz).normalize().multiplyScalar(dist);
  c.position.copy(e.group.position).add(v);c.lookAt(e.group.position);c.updateMatrixWorld(true);
  return {n:e.def.name,c:e.def.cls,f:e.def.fac,r:e.def.role,l:e.def.length,h:e.def.half,sp:e.def.maxSpeed,sh:e.def.shield,ar:e.def.armor,st:e.def.structure}}'''
MASK_ON='''()=>{const g=__game;const e=g.ships.find(s=>s.group.visible&&s.group.position.z===-400);window.__mo=[];
  e.group.traverse(o=>{if(o.material){const m=o.material;window.__mo.push([m,m.color.clone(),m.emissive?m.emissive.clone():null,m.emissiveIntensity]);
    if(m.emissive){m.color.set(0);m.emissive.set(0xffffff);m.emissiveIntensity=20}else{m.color.set(0xffffff)}}});}'''
MASK_OFF='''()=>{for(const [m,c,e,i] of window.__mo){m.color.copy(c);if(e){m.emissive.copy(e);m.emissiveIntensity=i}}}'''
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',s)
INK=(190,225,255); PAPER=(18,48,104); GRID=(30,66,128)
def panel(a,b,size,mk=None):
    m=ImageChops.difference(mk,b).convert('L').point(lambda v:255 if v>90 else 0).filter(ImageFilter.MedianFilter(3))
    bb=m.getbbox()
    g=ImageOps.equalize(a.convert('L'),mask=m).filter(ImageFilter.GaussianBlur(0.6)).filter(ImageFilter.FIND_EDGES).point(lambda v:min(255,v*2))
    edge=ImageChops.multiply(g,m.filter(ImageFilter.MinFilter(3)))
    out=Image.new('RGB',a.size,PAPER)
    fill=Image.new('RGB',a.size,(40,90,160)); out.paste(fill,(0,0),m.point(lambda v:v//3))
    sh=ImageOps.equalize(a.convert('L'),mask=m); out.paste(Image.merge('RGB',[sh.point(lambda v:int(v*0.25)),sh.point(lambda v:int(v*0.45)),sh.point(lambda v:int(v*0.6))]),(0,0),m.point(lambda v:int(v*0.55)))
    ol=m.filter(ImageFilter.FIND_EDGES).point(lambda v:255 if v>60 else 0)
    out.paste(Image.new('RGB',a.size,INK),(0,0),ol)
    out.paste(Image.new('RGB',a.size,(150,200,245)),(0,0),edge.point(lambda v:int(v*0.55)))
    return out,bb
def grid(d,w,h,step=40):
    for x in range(0,w,step): d.line([x,0,x,h],fill=GRID)
    for y in range(0,h,step): d.line([0,y,w,y],fill=GRID)
with Runner() as R:
    pg=R.page(1000,640,'?go&free&nobloom'); pg.wait_for_timeout(800)
    pg.add_style_tag(content='#brief,#ov,#wpn,#objs,#comm,#warn,#hit,#hud,#tgt,#log,#radar,#canopy,#cross,#bracket,#help,#msg,#rgl,#rgr,.rgs{display:none!important}')
    for id in ids:
        info=pg.evaluate(PLACE,[id,1,0,0,10,10,True]); L=info['l']; hx,hy,hz=info['h']
        asp=1000/640
        views={
          'side':((1,0,0),max(hy*1.15,hz*1.1/asp)),
          'front':((0,0,-1),max(hy*1.15,hx*1.1/asp)),
          'top':((0,1,0.0001),max(hz*1.12,hx*1.1/asp)),
          'q34':((0.75,0.5,-0.9),max(hz,hx,hy)*0.9),
        }
        ims={}
        for k,(d,ext) in views.items():
            fov=10 if k!='q34' else 16
            pg.evaluate(PLACE,[id,*d,fov,ext,True]); pg.wait_for_timeout(450); pg.screenshot(path=f'{SP}/_p_{id}_{k}_a.png'); mk_=pg.evaluate(MARK)
            pg.evaluate(PLACE,[id,*d,fov,ext,False]); pg.wait_for_timeout(300); pg.screenshot(path=f'{SP}/_p_{id}_{k}_b.png')
            pg.evaluate(PLACE,[id,*d,fov,ext,True]); pg.evaluate(MASK_ON); pg.wait_for_timeout(300); pg.screenshot(path=f'{SP}/_p_{id}_{k}_m.png'); pg.evaluate(MASK_OFF)
            ims[k]=(Image.open(f'{SP}/_p_{id}_{k}_a.png').convert('RGB'),Image.open(f'{SP}/_p_{id}_{k}_b.png').convert('RGB'),ext,fov,Image.open(f'{SP}/_p_{id}_{k}_m.png').convert('RGB'),mk_)
        W,H=1800,1180; pl=Image.new('RGB',(W,H),PAPER); d=ImageDraw.Draw(pl); grid(d,W,H)
        d.rectangle([20,20,W-20,H-20],outline=INK,width=3)
        # panels positions (x,y,w,h)
        P={'side':(40,120,1060,620),'front':(1120,120,640,620),'top':(40,760,1060,380),'q34':(1120,760,640,380)}
        names={'side':'SIDE ELEVATION','front':'FRONT ELEVATION','top':'PLAN VIEW','q34':'3/4 VIEW'}
        types_all=set()
        for k,(x,y,w,h) in P.items():
            a,b,ext,fov,mk,mks=ims[k]; im,bb=panel(a,b,a.size,mk)
            if bb is None: continue
            pad=14; c=im.crop((max(0,bb[0]-pad),max(0,bb[1]-pad),min(1000,bb[2]+pad),min(640,bb[3]+pad)))
            s=min((w-20)/c.width,(h-40)/c.height); c=c.resize((int(c.width*s),int(c.height*s)),Image.LANCZOS)
            px=x+(w-c.width)//2; py=y+20+(h-40-c.height)//2
            pl.paste(c,(px,py)); d.rectangle([x,y,x+w,y+h],outline=(70,120,190))
            x0=max(0,bb[0]-pad); y0=max(0,bb[1]-pad); sx=1000/mks['w']; sy=640/mks['h']
            tf=lambda X,Y,R:((X*sx-x0)*s+px,(Y*sy-y0)*s+py,R*sx*s)
            types_all.update(draw_marks(d,mks['pts'],tf,sz=7 if k!='q34' else 6,ring=(k!='q34')))
            d.text((x+8,y+4),names[k],font=F(15),fill=INK)
            ppo=640/(2*ext)               # original px per metre
            bw=(bb[2]-bb[0])/ppo; bh=(bb[3]-bb[1])/ppo
            if k=='side':   lab=f"{bw:.1f} m"; hor=True
            elif k=='front': lab=f"{bw:.1f} m"; hor=True
            elif k=='top': lab=f"{bh:.1f} m"; hor=False
            else: lab=None
            if lab and hor:
                yy=py+c.height+10; xx=px
                d.line([xx,yy,xx+c.width,yy],fill=INK); d.line([xx,yy-5,xx,yy+5],fill=INK); d.line([xx+c.width,yy-5,xx+c.width,yy+5],fill=INK)
                d.text((xx+c.width/2-40,yy+4),"OVERALL "+lab,font=F(13),fill=INK)
                if k=='front':
                    xx=px-10; d.line([xx,py,xx,py+c.height],fill=INK); d.line([xx-5,py,xx+5,py],fill=INK); d.line([xx-5,py+c.height,xx+5,py+c.height],fill=INK)
                    d.text((xx+4,py+c.height/2),f"{bh:.1f}",font=F(12),fill=INK)
            elif lab:
                xx=px-10; d.line([xx,py,xx,py+c.height],fill=INK); d.line([xx-5,py,xx+5,py],fill=INK); d.line([xx-5,py+c.height,xx+5,py+c.height],fill=INK)
                d.text((xx+6,py+c.height/2),lab,font=F(13),fill=INK)
        d.text((40,36),info['n'],font=F(34),fill=INK)
        d.text((40,80),f"{info['c'].upper()}  /  {info['r'] or ''}  /  {'FROGG' if info['f']=='frogg' else 'HUMAN'}",font=F(18),fill=INK)
        sh=info['sh']; ar=info['ar']
        tx=[f"LENGTH {L:.0f} m   SPAN {2*hx:.0f} m   HEIGHT {2*hy:.0f} m",f"MAX SPEED {info['sp']} m/s   SHIELD F{sh['fore']}/A{sh['aft']}   HULL {info['st']}",f"ARMOUR F{ar['fore']} A{ar['aft']} L{ar['left']} R{ar['right']}"]
        for i,t in enumerate(tx): d.text((900,34+i*24),t,font=F(15),fill=INK)
        legend(d,40,H-40,types_all,F(12))
        d.text((W-520,H-44),"GAME-SPACE SHIP HANDBOOK - from voxel data 2026-10-21; markers = subsystems (ring = hit zone), subsystem positions marked",font=F(12),fill=(120,160,210))
        pl.save(f'{SP}/bp_{id}.png'); print(id,'ok')
    print(R.errs)
