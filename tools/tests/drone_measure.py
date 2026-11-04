"""Seeded Halberd vs four fighters, comparing origin/main and the working build.
Run after build: python tools/tests/drone_measure.py; requires local Playwright/three.
"""
import json, os, subprocess, sys
from pathlib import Path
from lib import Runner, SP
base_ref = os.environ.get('DRONE_BASE', '70ae06f')
base = subprocess.check_output(['git','show',base_ref + ':index.html'], text=True)
current = Path('index.html').read_text()
def localize(s):
    return s.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js','/node_modules/three/build/three.module.js').replace('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/','/node_modules/three/examples/jsm/')
JS = '''() => {
 const g=__game,T=g.THREE; __paused=true;
 for(const s of g.ships) if(s!==g.player) s.alive=false;
 g.player.group.position.set(50000,0,50000); g.player.vel.set(0,0,0);
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 const c=g.spawnShip('halberd',0,v(0,0,0),v(0,0,-1000),{callsign:'TEST'});
 g.capitalOrdnanceAI(c,0); c.dlimit=6; c.stores.drone=6; c.droneRecalling=true;
 for(const m of c.mounts) m.cool=1e9;
 for(const t of c.turrets) t.dead=true;
 c.stores.ir=0; c.stores.rf=0; c.stores.torp=0; c.launcherRuntime=[];
 const ds=g.launchDrones(c,6); c.stores.drone=0; c.droneRecalling=true;
 const fighters=[]; for(let i=0;i<4;i++) fighters.push(g.spawnShip('darter',1,v((i-1.5)*180,0,-1650),v(0,0,0),{}));
 let max=0; const recordedDead=new Set();
 for(let i=0;i<400;i++) {
   c.vel.set(0,0,0); c.group.position.set(0,0,0);
   g.update(.25);
   for(const d of ds) if(d.alive || !recordedDead.has(d)) {
     max=Math.max(max,d.group.position.distanceTo(c.group.position)); if(!d.alive) recordedDead.add(d);
   }
   if(fighters.every(f=>!f.alive || f.dying)) break;
 }
 return {max:Math.round(max),kills:c.droneKills,live:ds.filter(d=>d.alive).length};
}'''
with Runner() as r:
    results={}
    versions = [('before',base),('after',current)]
    if len(sys.argv) > 1: versions = [v for v in versions if v[0] in sys.argv[1:]]
    for label, html in versions:
        Path(SP,'index.html').write_text(localize(html))
        rows=[]
        seeds = [int(x) for x in os.environ.get('DRONE_SEEDS', '1,2,3,4,5,6,7,8,9,10').split(',')]
        for seed in seeds:
            page=r.page(640,360,f'?free&go&n=0&nolaunch&seed={seed}&mute&nobloom',init_script='globalThis.__paused = true;')
            out=page.evaluate(JS); rows.append(out); print(label,seed,json.dumps(out),flush=True)
            page.context.close()
        results[label]=rows
    print('RESULT '+json.dumps(results),flush=True)
    if r.errs: print('BROWSER_ERRORS '+json.dumps(r.errs),flush=True)
