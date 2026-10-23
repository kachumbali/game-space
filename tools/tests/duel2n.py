from lib import *
import sys, json
NA=4; TR=int(sys.argv[2]) if len(sys.argv)>2 else 3
Ms=[int(x) for x in sys.argv[1].split(',')] if len(sys.argv)>1 else [4,8,10]
LIMIT=int(sys.argv[3]) if len(sys.argv)>3 else 300
KIND=['darter','leaper','darter','spitter','leaper']
JS=f"""([NA,M,kind,seed,ska,skb])=>{{const g=__game;__paused=true;const T=g.THREE;
  for(const s of g.ships){{if(s!==g.player){{s.alive=false;s.dying=0;s.group.visible=false;}}}}
  g.ships.splice(0,g.ships.length,g.player);
  g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
  const mk=(ids,team,x,sk)=>{{const arr=[];ids.forEach((id,i)=>{{const p=new T.Vector3(x+(i%3)*70,(Math.floor(i/3))*70-60+seed*7,i*25);
    const s=g.spawnShip(id,team,p,new T.Vector3(-x,0,0),{{skill:sk,fm:'newton'}});arr.push(s);}});return arr}};
  const A1=mk(Array(NA).fill('kestrel'),0,-900,ska),B1=mk(Array.from({{length:M}},(_,i)=>kind[i%kind.length]),1,900,skb);
  let t=0;while(t<{LIMIT}&&A1.some(s=>s.alive)&&B1.some(s=>s.alive)){{g.update(0.05);t+=0.05;}}
  return {{t:Math.round(t),a:A1.filter(s=>s.alive).length,b:B1.filter(s=>s.alive).length}}}}"""
with Runner() as R:
    pg=R.page(800,450,'?free&seed=99'); pg.wait_for_timeout(500); pg.wait_for_timeout(500)
    for M in Ms:
        res=[pg.evaluate(JS,[NA,M,KIND,t,3,3]) for t in range(TR)]
        print(f'4 Kestrel(sk3) vs {M} FROGG(sk3):',[(r['a'],r['b'],r['t']) for r in res], 'human wins',sum(1 for r in res if r['b']==0 and r['a']>0),'/',TR)
    print('ERRS',R.errs[:4])
