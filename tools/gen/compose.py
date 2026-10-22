import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import json
from PIL import Image, ImageDraw, ImageFont
info=json.load(open('classes.json'))
ids=['kestrel','darter','leaper','spitter','toad','reaver','halberd','gulper']
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',s)
role={'kestrel':'fighter (human)','darter':'interceptor','leaper':'fighter','spitter':'acid gunship','toad':'torpedo bomber','reaver':'heavy fighter','halberd':'corvette (human)','gulper':'corvette (FROGG)'}
# grid
W,H=500,320
g=Image.new('RGB',(W*4,H*2+0),(8,10,16)); d=ImageDraw.Draw(g)
for i,id in enumerate(ids):
    im=Image.open(f'_c_{id}_f.png').resize((W,H)); x,y=(i%4)*W,(i//4)*H
    g.paste(im,(x,y)); i0=info[id]
    d.rectangle([x,y,x+W,y+52],fill=(0,0,0))
    d.text((x+8,y+4),f"{i0['n']}  {role[id]}",font=F(15),fill=(230,235,240))
    d.text((x+8,y+26),f"L {i0['l']:.0f} m  v {i0['sp']} m/s  shield {i0['sh']['fore']}  hull {i0['st']}",font=F(13),fill=(150,200,230))
g.save('classes_grid.png')
# true scale (top views, same px per metre)
k=1000/146*0.55  # px per metre
cw=int(146*k*1.1)
sc=Image.new('RGB',(cw+40,1100),(8,10,16)); d=ImageDraw.Draw(sc)
d.text((12,8),"TRUE-SCALE TOP VIEWS (same scale)",font=F(15),fill=(230,235,240))
y=40
order=['gulper','halberd','reaver','toad','spitter','leaper','kestrel','darter']
for id in order:
    L=info[id]['l']; im=Image.open(f'_c_{id}_t.png')
    # ship spans ~ fraction f of frame width; calibrate from image bbox
    px=im.convert('L').point(lambda v:255 if v>40 else 0)
    bb=px.getbbox(); 
    s=(L*k)/max(1,(bb[2]-bb[0]) if (bb[2]-bb[0])>(bb[3]-bb[1]) else (bb[3]-bb[1]))
    c=im.crop(bb); c=c.resize((max(2,int(c.width*s)),max(2,int(c.height*s))))
    sc.paste(c,(20,y)); d.text((30+c.width,y+c.height//2-8),f"{info[id]['n']} {L:.0f} m",font=F(13),fill=(150,200,230))
    y+=c.height+8
sc=sc.crop((0,0,sc.width,min(y+10,sc.height))); sc.save('classes_scale.png'); print(sc.size,y)
