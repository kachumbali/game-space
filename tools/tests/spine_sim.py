#!/usr/bin/env python3
"""Spine-vs-Exeter diagnostic sim (docs/BULLFROG.md section 4.4, follow-up to docs/UX_REVIEW.md).

1v1: Bullfrog (lancer AI) vs Exeter (capital AI), no escorts, no fighters, no player.
Instruments every spine charge/fire/fizzle with time, distance, and the Exeter's
shield/structure before and after, plus Tadpole launches and the end state.
Answers: can the spine finish a frigate on its own, and if not, where does it fail?

Usage: cd tools/tests && python3 spine_sim.py [start_dist] [limit_s]
Defaults: 6000 m start, 900 sim-seconds limit. SwiftShader: ~1-4 min per run.
"""
from lib import *
import sys, json

DIST = int(sys.argv[1]) if len(sys.argv) > 1 else 6000
LIMIT = int(sys.argv[2]) if len(sys.argv) > 2 else 900

JS = f'''(arg)=>{{const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){{if(s!==g.player){{s.alive=false;s.dying=0;s.group.visible=false;}}}}
g.ships.splice(0,g.ships.length,g.player);
g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-1),{{}});
bf.stores.tad=0;                                  // no Tadpoles: isolate the spine
const H0=__bf.hangarInit(bf);for(const b of H0.bays)for(const k in b.man)b.man[k]=0;  // hangar empty: no fighters
const ex=g.spawnShip('exeter',0,V(0,0,-{DIST}),V(0,0,0),{{ai:'capital'}});
bf.target=ex;ex.target=bf;
__bf.log.length=0;
const snap=()=>({{t:+t.toFixed(1),dist:Math.round(bf.group.position.distanceTo(ex.group.position)),
  bfStr:Math.round(bf.structure),exShF:Math.round(ex.shield.fore),exShA:Math.round(ex.shield.aft),
  exStr:Math.round(ex.structure),exStrPct:Math.round(100*ex.structure/ex.def.structure),
  spSt:bf.spine?bf.spine.st:'-',spE:Math.round(bf.energy),mode:bf.ai.mode}});
const ev=[];let last='';let t=0;const DT=0.05;
const beforeHit=snap;
while(t<{LIMIT}&&bf.alive&&ex.alive&&!ex.dying&&!bf.dying&&!(bf.spotted===false)){{g.update(DT);t+=DT;
  const st=bf.spine?bf.spine.st:'-';
  if(st!==last){{ev.push(['st',last+'>'+st,snap()]);last=st;}}}}
let lastShots=0;let lastLog=0;const hits=[];
// replay through the same loop again instrumenting per-shot deltas
const bf2=g.ships.find(s=>s.def.id==='bullfrog'), ex2=g.ships.find(s=>s.def.id==='exeter');
const end={{t:+t.toFixed(1),bfAlive:bf2?bf2.alive:false,exAlive:ex2?ex2.alive:false,
  bfStrPct:bf2?Math.round(100*bf2.structure/bf2.def.structure):null,
  exStrPct:ex2?Math.round(100*ex2.structure/ex2.def.structure):null,
  bfJumped:bf2?!!bf2.jumped:null}};
return {{ev,end}};}}'''

with Runner() as R:
    pg = R.page(320, 180, '?free&n=0&q=low')
    r = pg.evaluate(JS)
    print('start_dist', DIST, 'limit', LIMIT)
    for e in r['ev']:
        print('EV', json.dumps(e))
    print('END', json.dumps(r['end']))
    print('BFLOG', json.dumps(R.errs[:6]) if False else json.dumps(pg.evaluate('()=>__bf.log.slice(0,80)')))
    print('SPINE SHOTS', json.dumps(pg.evaluate('()=>{const bf=__game.ships.find(s=>s.def.id==="bullfrog");return bf&&bf.spine?bf.spine.shots:[]}')))
    print('ERRS', json.dumps(R.errs[:6]))
