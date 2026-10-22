import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import sys
from lib import *
from PIL import Image, ImageDraw, ImageFont
exec(open('sheet.py').read().split("ids=sys.argv")[0].split("VIEW=")[1].join(["VIEW=",""])) if False else None
src=open('sheet.py').read()
VIEW=src.split("VIEW='''")[1].split("'''")[0]
ids=['kestrel','darter','leaper','spitter','toad','reaver','halberd','gulper']
info={}
with Runner() as R:
    pg=R.page(1000,640,'?go&free')
    pg.wait_for_timeout(800)
    pg.add_style_tag(content='#brief,#ov,#wpn,#objs,#comm,#warn,#hit,#hud,#tgt,#log,#radar,#canopy,#cross,#bracket,#help,#msg{display:none!important}')
    for id in ids:
        for name,v in [('f',(0.75,0.5,-0.9)),('t',(0.0,1,0.001))]:
            pg.evaluate(VIEW,[id,*v,0.95]); pg.wait_for_timeout(600)
            pg.screenshot(path=f'{SP}/_c_{id}_{name}.png')
        info[id]=pg.evaluate("(id)=>{const d=__game.ships.find(s=>s.def.id===id)?.def||null;return d?{n:d.name,c:d.cls,f:d.fac,l:d.length,h:d.half,sp:d.maxSpeed,sh:d.shield,ar:d.armor,st:d.structure}:null}",id)
    print(R.errs)
import json;print(json.dumps(info))
json.dump(info,open(f'{SP}/classes.json','w'))
