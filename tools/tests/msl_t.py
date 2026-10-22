# AI missile budget: counts missiles launched per side in 4 Kestrel vs N FROGG duels (arg1 = FROGG count, arg2 = runs, arg3 = sim-second limit)
from lib import *
import sys
M=int(sys.argv[1]) if len(sys.argv)>1 else 8; TR=int(sys.argv[2]) if len(sys.argv)>2 else 3; LIMIT=int(sys.argv[3]) if len(sys.argv)>3 else 180
JS=f"""([M,seed])=>{{const g=__game;__paused=true;const T=g.THREE;
  for(const s of g.ships){{if(s!==g.player){{s.alive=false;s.dying=0;s.group.visible=false;}}}}
  g.ships.splice(0,g.ships.length,g.player);
  g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
  const kind=['darter','leaper','darter','spitter','leaper'];
  const mk=(ids,team,x)=>ids.map((id,i)=>g.spawnShip(id,team,new T.Vector3(x+(i%3)*70,Math.floor(i/3)*70-60+seed*7,i*25),new T.Vector3(-x,0,0),{{skill:3}}));
  const A=mk(Array(4).fill('kestrel'),0,-900),B=mk(Array.from({{length:M}},(_,i)=>kind[i%kind.length]),1,900);
  const st0=s=>Object.values(s.stores).reduce((a,b)=>a+b,0)-(s.stores.flare||0);
  const a0=A.reduce((a,s)=>a+st0(s),0),b0=B.reduce((a,s)=>a+st0(s),0);
  const seen=new Set();let la=0,lb=0,hits=0,t=0;
  while(t<{LIMIT}&&A.some(s=>s.alive)&&B.some(s=>s.alive)){{g.update(0.05);t+=0.05;
    for(const m of g.missiles){{if(!seen.has(m)){{seen.add(m);if(m.team===0)la++;else lb++;}}}}}}
  return {{t:Math.round(t),a:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length,launchHuman:la,launchFrogg:lb,stockH:a0,stockF:b0}}}}"""
with Runner() as R:
    pg=R.page(800,450,'?free'); pg.wait_for_timeout(500)
    for t in range(TR): print(pg.evaluate(JS,[M,t]))
    print('ERRS',R.errs[:4])
