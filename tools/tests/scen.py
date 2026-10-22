from lib import *
import sys
TR=int(sys.argv[2]) if len(sys.argv)>2 else 3
which=sys.argv[1]
BURSTS=[int(x) for x in sys.argv[3].split(',')] if len(sys.argv)>3 else [6,60,150,300]
SETUP="""
const g=__game;__paused=true;const T=g.THREE;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);g.player.group.position.set(0,0,60000);g.player.team=2;
const mk=(ids,team,x,o={})=>ids.map((id,i)=>{const s=g.spawnShip(id,team,new T.Vector3(x+(i%3)*70,Math.floor(i/3)*70-60+(o.dy||0),i*25),new T.Vector3(-x,0,0),o);return s});
"""
FM="""([fmA,fmB,seed])=>{"""+SETUP+"""
 const K=['darter','leaper','darter','spitter','leaper','darter','leaper','darter'];
 const A=mk(Array(4).fill('kestrel'),0,-900,{fm:fmA}),B=mk(K,1,900,{fm:fmB});
 let t=0;while(t<400&&A.some(s=>s.alive)&&B.some(s=>s.alive)){g.update(0.05);t+=0.05;}
 return {t:Math.round(t),a:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length,hitsA:A.reduce((q,s)=>q+(s.hitsTaken||0),0),hitsB:B.reduce((q,s)=>q+(s.hitsTaken||0),0)}}"""
FRI="""([seed])=>{"""+SETUP+"""
 const ex=mk(['exeter'],0,-1500)[0];ex.vital=false;ex.ai.role='capital';
 const A=mk(Array(4).fill('kestrel'),0,-1300,{dy:200});
 const K=['darter','leaper','darter','spitter','leaper','darter','leaper','darter'];
 const B=mk(K.concat(['gulper']),1,1500);
 let t=0;while(t<500&&ex.alive&&B.some(s=>s.alive)){g.update(0.05);t+=0.05;}
 return {t:Math.round(t),exAlive:ex.alive,exStr:Math.round(100*Math.max(0,ex.structure)/ex.def.structure),exShd:Math.round(ex.shield.fore+ex.shield.aft),kest:A.filter(s=>s.alive).length,frogg:B.filter(s=>s.alive).length,comps:ex.comps.filter(c=>c.hp<=0).map(c=>c.id).join(',')}}"""
NUK="""([burst,seed])=>{"""+SETUP+"""
 const ex=mk(['exeter'],0,-1500)[0];
 const A=mk(Array(4).fill('kestrel'),0,-1300,{dy:200});
 const B=mk(['darter','leaper','darter','spitter','leaper','darter','leaper','darter','gulper'],1,1500);
 // fly the groups together, then launch a nuke from the frigate at the FROGG centroid
 for(let i=0;i<260;i++)g.update(0.05);
 const alive0={ex:ex.alive,k:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length};
 const tgt=B.find(s=>s.alive);
 ex.stores.nuke=1;ex.lock.tgt=tgt;ex.lock.p=1;ex.lock.wid='nuke';ex.lock.state='locked';
 const mm=g.missiles.length;g.launchMissile(ex,'nuke');
 const m=g.missiles[g.missiles.length-1];if(m)m.fuze=burst;
 let st=null;for(let i=0;i<1600;i++){g.update(0.05);if(g.nukeLog.length)break;}st=g.missiles.map(q=>({w:q.w.name,age:+q.age.toFixed(1),dead:q.dead,tgt:q.target&&q.target.def.id,d:q.target?Math.round(q.pos.distanceTo(q.target.group.position)):null,fuze:q.fuze}));
 const L=g.nukeLog[0];
 return {st,launched:!!m,alive0,after:{ex:ex.alive,k:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length},det:L?L.rep.filter(r=>r.r<4000).map(r=>`${r.team?'F':'H'}:${r.id}@${r.r}m F${r.F} ${r.dose}Gy ${r.dead?'DEAD':r.str+'%'}`):null}}"""
SWEEP="""([M,fm,seed])=>{"""+SETUP+"""
 const K=['darter','leaper','darter','spitter','leaper','darter','leaper','darter'];
 const A=mk(Array(4).fill('kestrel'),0,-900,{fm}),B=mk(Array.from({length:M},(_,i)=>K[i%K.length]),1,900,{fm});
 let t=0;while(t<500&&A.some(s=>s.alive)&&B.some(s=>s.alive)){g.update(0.05);t+=0.05;}
 return {t:Math.round(t),a:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length}}"""
with Runner() as R:
    pg=R.page(800,450,'?free'); pg.wait_for_timeout(500)
    if which=='fm':
        for fa,fb in [('arcade','arcade'),('newton','newton'),('newton','arcade'),('arcade','newton')]:
            res=[pg.evaluate(FM,[fa,fb,t]) for t in range(TR)]
            print(f'humans {fa} / FROGG {fb}:',[(r['a'],r['b'],r['hitsA'],r['hitsB']) for r in res])
    elif which=='sweep':
        for fm in ['arcade','newton']:
            for M in ([12,16,20] if fm=='arcade' else [6,8]):
                res=[pg.evaluate(SWEEP,[M,fm,t]) for t in range(TR)]
                print(f'{fm}: 4 Kestrel vs {M} FROGG:',[(r['a'],r['b'],r['t']) for r in res])
    elif which=='fri':
        for t in range(TR): print(pg.evaluate(FRI,[t]))
    else:
        for burst in BURSTS:
            pg.evaluate('()=>{__game.nukeLog.length=0}')
            print('burst',burst,pg.evaluate(NUK,[burst,0]))
    print('ERRS',R.errs[:5])
