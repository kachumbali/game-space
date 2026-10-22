import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import sys
from lib import *
from marks import *
from PIL import Image, ImageDraw, ImageFont
src=open('sheet.py').read(); VIEW=src.split("VIEW='''")[1].split("'''")[0]
ids=['kestrel','darter','leaper','spitter','toad','reaver','halberd','gulper','exeter','hivecarrier']
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',s)
W,H=600,384; g=Image.new('RGB',(W*2,H*5+40),(8,10,16)); gd=ImageDraw.Draw(g); allt=set()
with Runner() as R:
    pg=R.page(1000,640,'?go&free&nobloom'); pg.wait_for_timeout(800)
    pg.add_style_tag(content='#brief,#ov,#wpn,#objs,#comm,#warn,#hit,#hud,#tgt,#log,#radar,#canopy,#cross,#bracket,#help,#msg,#rgl,#rgr,.rgs{display:none!important}')
    for i,id in enumerate(ids):
        pg.evaluate(VIEW,[id,0.75,0.5,-0.9,0.85]); pg.wait_for_timeout(700)
        pg.screenshot(path=f'{SP}/_sg_{id}.png'); m=pg.evaluate(MARK)
        im=Image.open(f'{SP}/_sg_{id}.png').convert('RGB'); d=ImageDraw.Draw(im)
        allt|=draw_marks(d,m['pts'],lambda X,Y,R:(X,Y,R),sz=9,ring=False)
        d.rectangle([0,0,1000,28],fill=(0,0,0)); nm=pg.evaluate("(id)=>__game.ships.find(s=>s.def.id===id).def.name",id)
        d.text((8,6),nm,font=F(16),fill=(230,235,240))
        im=im.resize((W,H)); g.paste(im,((i%2)*W,(i//2)*H))
    print(R.errs)
legend(gd,10,H*5+12,allt,F(12)); g.save('subgrid.png'); print(allt)
