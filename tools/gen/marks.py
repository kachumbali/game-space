import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from PIL import ImageDraw, ImageFont
MARK='''()=>{const g=__game;const T=g.THREE;const e=g.ships.find(s=>s.group.visible&&Math.abs(s.group.position.z+400)<1e-6&&s.group.position.x===0);
 const c=g.camera;c.updateMatrixWorld(true);const out=[];
 const P=(p)=>{const v=new T.Vector3(p[0],p[1],p[2]).add(e.group.position).project(c);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]};
 const dist=c.position.distanceTo(e.group.position);const ppm=innerHeight/(2*dist*Math.tan(c.fov*Math.PI/360));
 for(const k of e.def.comps){const q=P(k.pos);out.push({t:k.role,n:k.name,x:q[0],y:q[1],r:k.r*ppm})}
 for(const m of (e.def.mounts||[])){const q=P(m.pos);out.push({t:'muzzle',n:m.w,x:q[0],y:q[1],r:0})}
 return {pts:out,w:innerWidth,h:innerHeight}}'''
COL={'engine':(255,140,40),'gun':(120,255,120),'turret':(255,230,90),'shield':(90,230,255),'radar':(255,110,230),'power':(255,70,70),'radiator':(255,255,255),'bay':(190,150,255),'dock':(190,150,255),'muzzle':(120,255,120)}
LABEL={'engine':'ENGINE','gun':'MAIN GUN','turret':'PD TURRET','shield':'SHIELD GEN','radar':'SENSORS/BRIDGE','power':'REACTOR','radiator':'RADIATOR','bay':'FIGHTER BAY','dock':'CORVETTE CRADLE','muzzle':'WEAPON MUZZLE'}
def sym(d,t,x,y,s,col):
    if t=='engine': d.ellipse([x-s,y-s,x+s,y+s],outline=col,width=2); d.line([x-s*.6,y,x+s*.6,y],fill=col)
    elif t=='gun': d.rectangle([x-s*.8,y-s*.8,x+s*.8,y+s*.8],outline=col,width=2)
    elif t=='turret': d.polygon([(x,y-s),(x+s,y+s*.8),(x-s,y+s*.8)],outline=col)
    elif t=='shield': d.polygon([(x,y-s),(x+s,y),(x,y+s),(x-s,y)],outline=col)
    elif t=='radar': d.ellipse([x-s,y-s,x+s,y+s],outline=col,width=2); d.ellipse([x-2,y-2,x+2,y+2],fill=col)
    elif t=='power': d.line([x-s,y,x+s,y],fill=col,width=3); d.line([x,y-s,x,y+s],fill=col,width=3)
    elif t in('radiator',): d.rectangle([x-s,y-s*.6,x+s,y+s*.6],outline=col); d.line([x-s,y,x+s,y],fill=col)
    elif t in('bay','dock'): d.rectangle([x-s,y-s*.7,x+s,y+s*.7],outline=col,width=2); d.line([x-s,y-s*.7,x+s,y+s*.7],fill=col)
    else: d.line([x-s,y,x+s,y],fill=col); d.line([x,y-s,x,y+s],fill=col)
def draw_marks(d,pts,tf,sz=8,ring=True,legend_xy=None):
    """tf maps source px (x,y)->(X,Y); source radius scale returned via tf scale s"""
    seen=set()
    for p in pts:
        X,Y,S=tf(p['x'],p['y'],p['r'])
        col=COL.get(p['t'],(255,255,255))
        if ring and p['r']>0 and S>sz*1.2: d.ellipse([X-S,Y-S,X+S,Y+S],outline=tuple(int(c*.55) for c in col))
        sym(d,p['t'],X,Y,sz,col); seen.add(p['t'])
    return seen
def legend(d,x,y,types,font):
    for t in [k for k in COL if k in types]:
        sym(d,t,x+8,y+8,6,COL[t]); d.text((x+22,y),LABEL[t],font=font,fill=COL[t]); x+=30+len(LABEL[t])*8
