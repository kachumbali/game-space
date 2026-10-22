#!/usr/bin/env python3
"""Owner acceptance engagement: Exeter + 12 Kestrels (AI skill 3) + 2 Halberd escorts vs a Bullfrog with its 36 fighters (launched through the hangar logic),
10 km apart head-on, both AI. Headless, update(0.05), capped at 900 sim-s. ONE seed per run (software renderer is slow):
  python3 bullfrog_eng.py SEED [LIMIT_S] [START_RANGE_M] [DT]   -> prints a JSON result line and writes $ENG_OUT (default /tmp/bf_eng_SEED.json)
Seeds randomise the pre-run Math.random stream (a seeded PRNG replaces Math.random) and the starting offsets."""
from lib import *
import sys, json, os, time as _t
SEED=int(sys.argv[1]) if len(sys.argv)>1 else 1
LIMIT=float(sys.argv[2]) if len(sys.argv)>2 else 900
RANGE=float(sys.argv[3]) if len(sys.argv)>3 else 10000
DT=float(sys.argv[4]) if len(sys.argv)>4 else 0.05
OUT=os.environ.get('ENG_OUT',f'/tmp/bf_eng_{SEED}.json')
SETUP='''([seed,range,dt])=>{const g=__game,T=g.THREE;__paused=true;window.requestAnimationFrame=()=>0;   // no rendering: sim only
  let a=seed*2654435761>>>0;Math.random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
  g.ships.splice(0,g.ships.length,g.player);
  g.player.group.position.set(0,0,200000);g.player.vel.set(0,0,0);g.player.team=2;
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const ex=g.spawnShip('exeter',0,V(0,0,0),V(0,0,-range),{callsign:'EXETER',ai:'capital'});
  const hal=[-1,1].map(i=>{const h=g.spawnShip('halberd',0,V(i*500,40,-300),V(0,0,-range),{callsign:'HAL'+(i<0?1:2),ai:'capital'});h.ai.escort=ex;return h;});
  const kes=[];for(let i=0;i<12;i++){const k=g.spawnShip('kestrel',0,V((i%4-1.5)*70,Math.floor(i/4)*60-60,60+i*10),V(0,0,-range),{callsign:'K'+(i+1),ai:'fighter',skill:3,grp:'K'});kes.push(k);}
  const bf=g.spawnShip('bullfrog',1,V(0,0,-range),V(0,0,0),{callsign:'BULLFROG',grp:'W',skill:3});
  for(const s of g.ships)if(s!==g.player){s.vel.copy(V(0,0,0));}
  window.__E={g,ex,hal,kes,bf,t:0,dt,seen:new Set(),tad:[],tadOut:{launched:0,intercepted:0,hit:0,expired:0},first:{cap:null,fighters:null,damage:null,spine:null},death:{},hits0:0,fl:{h:new Set(),f:new Set()},snap:[],all:new Map()};
  return 'ok';}'''
STEP='''(sec)=>{const E=__E,g=E.g;let n=Math.round(sec/E.dt);
  const sum=()=>{let h=0;for(const s of g.ships)h+=s.hitsTaken||0;return h;};
  while(n-->0){
    g.update(E.dt);E.t+=E.dt;
    for(const s of g.ships){if(!E.all.has(s)){E.all.set(s,{id:s.def.id,team:s.team,cls:s.def.cls,born:E.t});}}
    for(const [s,r] of E.all){if(!r.dead&&(!s.alive||s.dying>0)&&s!==g.player){r.dead=E.t;r.jumped=!!s.jumped;r.removed=(s.orphanT||0)>=30;r.by=s.lastAttacker?s.lastAttacker.def.id:null;}}
    if(E.first.cap===null&&E.ex.alive&&E.bf.alive&&E.ex.group.position.distanceTo(E.bf.group.position)<3400)E.first.cap=E.t;
    if(E.first.fighters===null){let f=false;for(const a of E.kes){if(!a.alive)continue;for(const b of g.ships){if(b.team===1&&b.def.cls==='fighter'&&b.alive&&a.group.position.distanceTo(b.group.position)<900){f=true;break;}}if(f)break;}if(f)E.first.fighters=E.t;}
    if(E.first.damage===null){const h=sum();if(h>0)E.first.damage=E.t;}
    // missiles: Tadpoles launched / outcome
    for(const m of g.missiles){if(m.wid==='tad'&&!E.seen.has(m)){E.seen.add(m);E.tad.push({m,t:E.t,by:m.owner.def.id,tgt:m.target?m.target.def.id:null});E.tadOut.launched++;}}
    for(const r of E.tad){if(!r.done&&r.m.dead){r.done=true;if(r.m.hp<=0){E.tadOut.intercepted++;r.o='pd';}else if(r.m.age<r.m.w.life-0.01){E.tadOut.hit++;r.o='hit';}else{E.tadOut.expired++;r.o='exp';}}}
    if(Math.round(E.t*20)%1200===0){const f=s=>s.alive?Math.round(100*Math.max(0,s.structure)/s.def.structure)+'/'+Math.round(100*(s.shield.fore+s.shield.aft)/(s.def.shield.fore+s.def.shield.aft)):'X';
      const cnt=t=>g.ships.filter(s=>s.team===t&&s.def.cls==='fighter'&&s.alive&&!s.dying).length;
      E.snap.push({t:Math.round(E.t),ex:f(E.ex),bf:f(E.bf),dist:Math.round(E.ex.group.position.distanceTo(E.bf.group.position)),hum:cnt(0),frogg:cnt(1),hal:E.hal.map(f)});}
    const exD=!E.ex.alive||E.ex.dying>0,bfD=!E.bf.alive||E.bf.dying>0;
    if(exD||bfD){E.endT=E.endT??E.t;if(E.t-E.endT>8)break;}
  }
  const cnt=t=>g.ships.filter(s=>s.team===t&&s.def.cls==='fighter'&&s.alive&&!s.dying).length;
  return {t:+E.t.toFixed(1),ex:E.ex.alive&&!(E.ex.dying>0),bf:E.bf.alive&&!(E.bf.dying>0),end:E.endT??null,hum:cnt(0),frogg:cnt(1),ships:g.ships.length};}'''
FINAL='''()=>{const E=__E,g=E.g,bf=E.bf,sp=bf.spine||{shots:[]};
  const recs=[...E.all.values()];const dead=(team,cls)=>recs.filter(r=>r.team===team&&r.cls===cls&&r.dead).length;
  const tot=(team,cls)=>recs.filter(r=>r.team===team&&r.cls===cls).length;
  const cap=(s,id)=>{const r=E.all.get(s);return {by:(E.all.get(s)||{}).by||null,alive:s.alive&&!(s.dying>0),died:r&&r.dead?+r.dead.toFixed(1):null,jumped:!!s.jumped,structPct:Math.round(100*Math.max(0,s.structure)/s.def.structure)};};
  const H=bf.hangar||{launched:0,lostManifest:0,bays:[]};
  const orphaned=recs.filter(r=>r.team===1&&r.cls==='fighter'&&r.dead&&r.removed).length;
  return {t:+E.t.toFixed(1),first:E.first,exeter:cap(E.ex),bullfrog:cap(bf),halberds:E.hal.map(h=>cap(h)),
   spine:{fired:sp.shots.length,shots:sp.shots.map(s=>({t:s.t,tgt:s.tgt,hit:s.hit,team:s.hitTeam,dead:s.dead})),charges:__bf.log.filter(l=>l.ev==='charge').length,fizzles:__bf.log.filter(l=>l.ev==='fizzle').map(l=>l.why)},
   fighters:{humanTotal:tot(0,'fighter'),humanLost:dead(0,'fighter'),froggTotal:tot(1,'fighter'),froggLost:dead(1,'fighter'),froggRemovedByFlee:orphaned},
   tadpoles:{...E.tadOut,bySource:E.tad.reduce((a,r)=>{a[r.by]=(a[r.by]||0)+1;return a;},{}),bfLaunched:bf.tadsLaunched||0},
   hangar:{launches:H.launched,lostManifest:H.lostManifest,perBay:(H.bays||[]).map(b=>({id:b.id,launched:b.launched}))},
   bayEvents:__bf.log.filter(l=>l.ev==='bayLost'||l.ev==='spool'||l.ev==='jump'),snap:E.snap};}'''
with Runner() as R:
    pg=R.page(320,180,'?free&n=0&q=low')
    pg.evaluate(SETUP,[SEED,RANGE,DT])
    t0=_t.time(); last=None
    while True:
        r=pg.evaluate(STEP,30)
        print(f"seed {SEED} sim {r['t']:.0f}s wall {_t.time()-t0:.0f}s ex={r['ex']} bf={r['bf']} fighters hum/frogg={r['hum']}/{r['frogg']} ships={r['ships']}",flush=True)
        if r['end'] is not None and (not r['ex'] or not r['bf']) and r['t']-r['end']>8: break
        if r['t']>=LIMIT: break
        if not r['ex'] and not r['bf']: break
    res=pg.evaluate(FINAL); res['seed']=SEED; res['range']=RANGE; res['dt']=DT; res['wall_s']=round(_t.time()-t0); res['errs']=R.errs[:5]
    res['winner']=('draw/timeout' if (res['exeter']['alive'] and res['bullfrog']['alive']) else
                   'human (Bullfrog %s)'%('jumped' if res['bullfrog']['jumped'] else 'destroyed') if res['exeter']['alive'] else
                   'FROGG' if res['bullfrog']['alive'] else 'mutual')
    open(OUT,'w').write(json.dumps(res,indent=1)); print('RESULT',json.dumps(res))
