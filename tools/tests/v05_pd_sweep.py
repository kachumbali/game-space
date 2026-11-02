#!/usr/bin/env python3
"""Seeded PD-vs-IR/RF/torpedo experiment; cloud browser execution only."""
import json
import sys
from lib import Runner

count = int(sys.argv[1]) if len(sys.argv) > 1 else 20
output = sys.argv[2] if len(sys.argv) > 2 else 'v05_pd_sweep.json'
rows = []
SCRIPT = r'''([ship,weapon])=>{
 const g=__game,T=g.THREE;__paused=true;
 const p=g.player;p.group.position.set(0,0,60000);p.vel.set(0,0,0);p.team=2;
 const target=g.spawnShip(ship,0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1),{});
 target.shield.fore=target.shield.aft=1e6;target.structure=1e6;target.vel.set(0,0,0);target.ai.hold=true;
 const shooter=g.spawnShip('toad',1,new T.Vector3(0,200,-1200),new T.Vector3(0,0,0),{});
 shooter.target=target;shooter.lock={state:'locked',tgt:target,d:1200,p:1,wid:weapon};shooter.stores[weapon]=4;
 let launched=0;for(let i=0;i<4;i++)if(g.launchMissile(shooter,weapon)){launched++;shooter.lock.p=1;}
 g.ships.splice(g.ships.indexOf(shooter),1);
 const seen=new Map(),death=[];
 for(let i=0;i<4800;i++){
   g.update(0.0125); const live=new Set();
   for(const m of g.missiles) if(m.wid===weapon){live.add(m);seen.set(m,m.pos.distanceTo(target.group.position));}
   for(const [m,d] of [...seen]) if(!live.has(m)){death.push(d);seen.delete(m);}
 }
 return {launched,intercepted:death.filter(d=>d>target.def.radius+50).length,
   near:death.filter(d=>d<=target.def.radius+50).length,unresolved:launched-death.length};
}'''
with Runner() as R:
    for ship in ('falchion','bittern','halberd','gulper'):
        for weapon in ('ir','rf','tad'):
            for seed in range(1,count+1):
                for context in list(R.b.contexts): context.close()
                R.errs.clear(); p=R.page(320,180,f'?free&n=0&seed={seed}&q=low')
                result=p.evaluate(SCRIPT,[ship,weapon]); row={'ship':ship,'weapon':weapon,'seed':seed,**result,'errors':R.errs[:]}
                rows.append(row); open(output,'w').write(json.dumps(rows,indent=2)); print(row,flush=True)
print(f'{len(rows)} runs written to {output}')
