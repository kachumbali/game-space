import sys, os
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests')); from lib import *
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','render_ships.py')).read(); ns={}; exec(src[src.index('HIDE='):src.index('with Runner()')], ns)
HY=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'hybrid_preview.js')).read()
V=[('far',35,20,1.4),('close',25,12,0.65),('side',90,0,1.3)]
TRI="()=>{const r=__game.renderer;r.info.autoReset=false;r.info.reset();r.render(__game.scene,__game.camera);const t=r.info.render.triangles;r.info.autoReset=true;return t}"
with Runner() as R:
  pg=R.page(1000,600,'?free&n=0&wing=0&q=low'); pg.wait_for_timeout(1500); pg.add_style_tag(content=ns['HIDE'])
  for id in sys.argv[1].split(','):
    L=pg.evaluate(ns['SETUP'],id); pg.wait_for_timeout(300)
    for mode,arg in [('cham',None),('mesh',['mesh',0,2]),('hyb',['hybrid',2.0,2])]:
      info=pg.evaluate(HY,arg) if arg else {}
      for vn,az,el,k in V:
        pg.evaluate(ns['CAM'],[L,az,el,k,0]); pg.wait_for_timeout(250); pg.screenshot(path=f'h_{id}_{mode}_{vn}.png')
      pg.evaluate(ns['CAM'],[L,35,20,1.4,0]); print(id,mode,'scene tris',pg.evaluate(TRI),info,flush=True)
  print(R.errs[:3])
