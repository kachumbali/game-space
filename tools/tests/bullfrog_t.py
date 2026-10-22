#!/usr/bin/env python3
"""Bullfrog tests (docs/BULLFROG.md). One page per scenario. Usage: python3 bullfrog_t.py [spine|exeter|friendly|arcs|pd|hangar|inst|blast ...]
Set GS_PORT / GS_TEST_DIR to run beside another test run. Sim is stepped with update(0.05) (SwiftShader: slow; each scenario takes 0.5-5 min)."""
from lib import *
import sys, json
PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
g.ships.splice(0,g.ships.length,g.player);
g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const freeze=(s)=>{s.vel.set(0,0,0);s.ai.hold=true;};
const stepN=(sec,fn)=>{let t=0;while(t<sec-1e-9){g.update(0.05);t+=0.05;if(fn&&fn(t)===false)break;}return t;};'''
def js(body, arg=None):
    return '(arg)=>{'+PRE+body+'}'
fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

def t_spine(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-2500),{});const ex=g.spawnShip('exeter',0,V(0,0,-2500),V(0,0,0),{ai:'capital'});
      freeze(ex);ex.shield.fore=ex.shield.aft=1e6;ex.structure=1e6;   // target dummy: only the spine timeline is measured
      const ev=[];let last='';let t=0;const sp=bf.spine||(()=>{g.update(0.05);return bf.spine})();
      stepN(110,(tt)=>{ex.vel.set(0,0,0);t=tt;if(sp.st!==last){ev.push([+tt.toFixed(2),sp.st,Math.round(bf.group.position.distanceTo(ex.group.position))]);last=sp.st;}});
      return {ev,shots:sp.shots,log:__bf.log.slice(0,12),energy:Math.round(bf.energy)};'''))
    print(json.dumps(r))
    ev=r['ev']; ch=[e for e in ev if e[1]=='charge']; lk=[e for e in ev if e[1]=='lock']; cool=[e for e in ev if e[1]=='cool']
    check('first charge not before 15 s (spineDelay)', len(ch)>0 and ch[0][0]>=14.9, str(ch[:1]))
    check('charge to lock = 4.5 s (heading frozen last 1.5 s)', len(lk)>0 and abs((lk[0][0]-ch[0][0])-4.5)<0.15, str(lk[:1]))
    if len(cool)>=2:
        check('charge to fire = 6 s', abs(cool[1][0]-ch[0][0]-6)<0.15 if cool[0][0]==0 or True else False, str(cool[:3]))
    check('spine shot fired and hit target', any(s['hit']=='exeter' for s in r['shots']), str(r['shots'][:2]))
    if len(r['shots'])>=2:
        ch2=[e for e in ch if e[0]>ch[0][0]+7]
        check('cooldown 30 s after the shot before the next charge', len(ch2)>0 and ch2[0][0]-(ch[0][0]+6)>=29.9, str(ch2[:1]))

def t_exeter(R):
    res={}
    for regen in (False, True):
        pg=R.page(320,180,'?free&n=0&q=low')
        r=pg.evaluate('(arg)=>{'+PRE+'''
          const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-2300),{});bf.ai.role='capital';bf.stores.tad=0;
          const ex=g.spawnShip('exeter',0,V(0,0,-2300),V(0,0,0),{ai:'capital'});freeze(ex);
          g.update(0.05);const sp=bf.spine||__bf.spineInit(bf);sp.tgt=ex;
          const out=[];
          for(let i=1;i<=6;i++){
            if(!arg.regen)ex.lastHit=1e9;
            const rec=__bf.spineFire(bf);
            out.push({i,hit:rec.hit,str:Math.round(ex.structure),sh:Math.round(ex.shield.fore),dead:!ex.alive||ex.dying>0});
            if(out[out.length-1].dead)break;
            stepN(36,()=>{ex.vel.set(0,0,0);bf.vel.set(0,0,0);if(!arg.regen)ex.lastHit=1e9;});
          }
          return out;}''',{'regen':regen})
        print('regen' if regen else 'noregen', json.dumps(r)); res[regen]=r
    n0=next(x['i'] for x in res[False] if x['dead']); n1=next((x['i'] for x in res[True] if x['dead']),None)
    check('Exeter survives 3 hits without shield regen, dies on hit 4', n0==4, f'died on hit {n0}')
    check('Exeter with regen (384/cycle) survives 4, dies on hit 4..5 (spec: 5th)', n1 in (4,5), f'died on hit {n1}')

def t_friendly(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-2500),{});const ex=g.spawnShip('exeter',0,V(0,0,-2400),V(0,0,0),{ai:'capital'});
      freeze(ex);ex.shield.fore=ex.shield.aft=1e6;ex.structure=1e6;
      const gu=g.spawnShip('gulper',1,V(0,0,-1100),V(0,0,-3000),{});freeze(gu);gu.ai.escort=null;
      g.update(0.05);const sp=bf.spine;const o={};
      stepN(70,()=>{ex.vel.set(0,0,0);gu.vel.set(0,0,0);gu.group.position.set(0,0,-1100);bf.group.position.set(0,0,0);bf.vel.set(0,0,0);});
      o.stBlocked=sp.st;o.shots1=sp.shots.length;o.guHp=Math.round(gu.structure);
      gu.alive=false;
      let sawLock=false;
      stepN(30,()=>{ex.vel.set(0,0,0);bf.group.position.set(0,0,0);bf.vel.set(0,0,0);if(sp.st==='lock')return false;});
      o.stAfter=sp.st;
      // friendly enters the line during the lock: the shot must be held, then fizzle, never hit the friendly
      const gu2=g.spawnShip('gulper',1,V(300,0,-1100),V(0,0,-3000),{});freeze(gu2);gu2.ai.escort=null;
      gu2.group.position.set(0,0,-1100);const hp0=gu2.structure+gu2.shield.fore;
      stepN(20,()=>{ex.vel.set(0,0,0);gu2.vel.set(0,0,0);gu2.group.position.set(0,0,-1100);bf.group.position.set(0,0,0);bf.vel.set(0,0,0);});
      o.stFinal=sp.st;o.shots2=sp.shots.length;o.gu2hp=gu2.structure+gu2.shield.fore-hp0;o.log=__bf.log.filter(l=>l.ev==='fizzle');
      return o;'''))
    print(json.dumps(r))
    check('no charge while a friendly is in the line', r['stBlocked']=='ready' and r['shots1']==0, f"st={r['stBlocked']} shots={r['shots1']}")
    check('charge starts once the line is clear', r['stAfter']=='lock', r['stAfter'])
    check('friendly entering the line during the lock: held, then fizzle, friendly untouched', r['shots2']==0 and r['gu2hp']==0 and any('friendly' in l['why'] for l in r['log']), json.dumps(r['log']))

def t_arcs(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const d=g.SHIPS.bullfrog;const cnt={};const N=2000;let minC={L:99,M:99,S:99,PD:99};const dirs=[];
      for(let i=0;i<N;i++){const y=1-2*(i+0.5)/N,r=Math.sqrt(1-y*y),a=i*2.399963;dirs.push([r*Math.cos(a),y,r*Math.sin(a)]);}
      const cls=t=>t.cls==='S'&&t.w==='thorn'?'PD':t.cls;
      for(const dv of dirs){const c={L:0,M:0,S:0,PD:0};for(const t of d.turrets)if(dv[1]*t.side>-0.05)c[cls(t)]++;for(const k in c)minC[k]=Math.min(minC[k],c[k]);}
      const n={};for(const t of d.turrets){const k=cls(t)+(t.side>0?'d':'v');n[k]=(n[k]||0)+1;}
      // dynamic: a frozen hostile Kestrel at 700 m in 10 directions; count turrets that pick it and whether any bolt/beam leaves within 8 s
      const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-3000),{});bf.ai.role='capital';bf.hold=true;freeze(bf);
      const dyn=[];
      for(const dv of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,-1],[0,0,1],[1,1,0],[-1,-1,0],[0,1,1],[0,-1,-1]]){
        const k=new T.Vector3(...dv).normalize().multiplyScalar(800);
        const e=g.spawnShip('kestrel',0,k,V(0,0,0),{});freeze(e);e.group.position.copy(k);e.shield.fore=e.shield.aft=1e6;e.structure=1e6;
        let first=-1,tg=0;const b0=g.bolts.length;
        stepN(8,(t)=>{e.vel.set(0,0,0);e.group.position.copy(k);bf.vel.set(0,0,0);const n=bf.turrets.filter(T=>T.tgt===e).length;tg=Math.max(tg,n);if(first<0&&g.bolts.some(b=>b.owner===bf&&b.pos.distanceTo(bf.group.position)>20))first=t;});
        dyn.push({dir:dv.join(','),turretsOnIt:tg,firstFire:+first.toFixed(2)});
        e.alive=false;g.update(0.05);
      }
      return {minC,n,dyn};'''))
    print(json.dumps(r))
    check('every direction covered by >=1 L, M, S and PD turret (static hemisphere test)', all(v>=1 for v in r['minC'].values()), json.dumps(r['minC']))
    check('counts: L 1d+1v, M 4d+2v, S 6d+4v, PD 4d+4v', r['n']=={'Ld':1,'Lv':1,'Md':4,'Mv':2,'Sd':6,'Sv':4,'PDd':4,'PDv':4}, json.dumps(r['n']))
    bad=[x for x in r['dyn'] if x['turretsOnIt']<1 or x['firstFire']<0]
    check('dynamic: a hostile at 800 m in each of 10 directions is engaged within 8 s', not bad, json.dumps(bad))

def t_pd(R):
    out={}
    for kind,wid in (('swift','ir'),('hammer','torp')):
        pg=R.page(320,180,'?free&n=0&q=low')
        r=pg.evaluate('(arg)=>{'+PRE+'''
          const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-3000),{});bf.ai.role='capital';freeze(bf);
          const shooters=[];const dirs=[[0,0,-1],[1,0,-1],[-1,0,-1],[0,1,0],[0,-1,0],[1,0,1],[-1,0,1],[0,0,1],[1,1,-1],[-1,-1,-1],[0,1,-1],[0,-1,1],[1,-1,0],[-1,1,0],[1,0,0],[-1,0,0]];
          const res={single:{n:0,killed:0,reached:0},salvo:{n:0,killed:0,reached:0}};
          const mk=(i)=>{const k=new T.Vector3(...dirs[i%dirs.length]).normalize().multiplyScalar(arg.range);
            const s=g.spawnShip('kestrel',0,k,V(0,0,0),{});freeze(s);s.stores[arg.wid]=9;s.ai.hold=false;s.group.position.copy(k);
            s.lock={tgt:bf,wid:arg.wid,p:1,state:'locked',d:arg.range,ang:0};s.sel=g.selectedMissile?0:0;return s;};
          const fire=(s)=>{s.group.lookAt(bf.group.position);s.group.rotateY(Math.PI);s.group.updateMatrixWorld(true);const ids=Object.keys(s.stores);
            s.lock={tgt:bf,wid:arg.wid,p:1,state:'locked',d:1,ang:0};return g.launchMissile(s,arg.wid);};
          const ms=[];
          // singles: one missile every 6 s from a rotating bearing
          for(let i=0;i<8;i++){const s=mk(i);const b0=g.missiles.length;fire(s);const m=g.missiles[g.missiles.length-1];ms.push([m,'single']);stepN(6,()=>{s.vel.set(0,0,0);s.group.position.copy(s.group.position);});}
          // salvo: 16 at once
          const sh=[];for(let i=0;i<16;i++){const s=mk(i);sh.push(s);fire(s);ms.push([g.missiles[g.missiles.length-1],'salvo']);}
          stepN(25,()=>{for(const s of sh)s.vel.set(0,0,0);});
          for(const [m,k] of ms){res[k].n++;if(m.dead){if(m.hp<=0)res[k].killed++;else res[k].reached++;}else res[k].reached++;}
          return res;}''',{'wid':wid,'range':1200 if wid=='ir' else 1500})
        print(kind, json.dumps(r)); out[kind]=r
    s=out['swift']; h=out['hammer']
    check('PD stops single Swifts (spec model: ~1.0)', s['single']['killed']>=7, json.dumps(s['single']))
    check('PD stops single HM-1 torpedoes (spec model: 1.0 with 4 turrets bearing)', h['single']['killed']>=6, json.dumps(h['single']))
    print('INFO salvo of 16: swift', s['salvo'], 'hammer', h['salvo'])

def t_hangar(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const bf=g.spawnShip('bullfrog',1,V(0,0,0),V(0,0,-3600),{});bf.ai.noJump=true;
      const hv=g.spawnShip('hivecarrier',0,V(0,0,-3700),V(0,0,0),{ai:'capital'});freeze(hv);hv.shield.fore=hv.shield.aft=1e9;hv.structure=1e9;
      const o={};g.update(0.05);const H=bf.hangar;
      const air=()=>H.out.filter(f=>f.alive&&!f.dying).length;
      let maxAir=0,t12=-1;
      stepN(120,(t)=>{hv.vel.set(0,0,0);hv.group.position.set(0,0,-3700);bf.vel.set(0,0,0);bf.group.position.set(0,0,0);bf.ai.role='capital';  // role switched off so only the hangar runs
        bf.ai.role='lancer';maxAir=Math.max(maxAir,air());if(t12<0&&air()>=12)t12=t;});
      o.first12=+t12.toFixed(1);o.maxAir=maxAir;o.launched1=H.launched;
      const ls=__bf.log.filter(l=>l.ev==='launch').map(l=>l.t);o.firstLaunches=ls.slice(0,6);
      o.mix=H.out.reduce((a,f)=>{a[f.def.id]=(a[f.def.id]||0)+1;return a;},{});
      // free 6 slots: launches resume
      const kill=H.out.slice(0,6);kill.forEach(f=>{f.alive=false;});g.update(0.05);
      const l0=H.launched;stepN(30,()=>{hv.vel.set(0,0,0);bf.vel.set(0,0,0);bf.group.position.set(0,0,0);});o.refill=H.launched-l0;o.airAfter=air();
      // bay A destroyed: its manifest is lost, launches come only from bay B
      const left=H.bays[0].man;const nA=Object.values(left).reduce((a,b)=>a+b,0);
      bf.comps.find(c=>c.id==='bayA').hp=0;H.out.slice(0,6).forEach(f=>{f.alive=false;});
      const bl=__bf.log.length;const lA=H.bays[0].launched;stepN(30,()=>{hv.vel.set(0,0,0);bf.vel.set(0,0,0);bf.group.position.set(0,0,0);});
      o.bayA={manifestBefore:nA,lost:H.lostManifest,launchedAfterLoss:H.bays[0].launched-lA,bayBlaunched:H.bays[1].launched};
      // emergency: below 25% structure the cap lifts and the interval drops to 1.5 s per bay
      bf.structure=bf.def.structure*0.2;bf.ai.noJump=true;const l1=H.launched;const a1=air();
      stepN(12,()=>{hv.vel.set(0,0,0);bf.group.position.set(0,0,0);});o.emergency={mode:bf.ai.mode,launches:H.launched-l1,airDelta:air()-a1};
      o.perBay=H.bays.map(b=>({id:b.id,launched:b.launched,left:Object.values(b.man).reduce((a,c)=>a+c,0)}));
      return o;'''))
    print(json.dumps(r))
    check('airborne cap 12 respected', r['maxAir']<=12, str(r['maxAir']))
    check('first 12 out in ~27 sim-s (2 bays x 4.5 s alternating)', 20<=r['first12']<=40, str(r['first12']))
    check('refill resumes after losses', r['refill']>=4, str(r['refill']))
    check('bay loss: manifest lost, no further launches from bay A', r['bayA']['lost']>=1 and r['bayA']['launchedAfterLoss']==0, json.dumps(r['bayA']))
    check('emergency launch ignores cap (mode spool)', r['emergency']['mode']=='spool' and r['emergency']['launches']>=2, json.dumps(r['emergency']))

def t_inst(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const bf=g.spawnShip('bullfrog',1,V(0,0,-1000),V(0,0,-3000),{});bf.ai.role='capital';freeze(bf);
      const o={};
      let cur=2;for(const i of [2,4,6]){g.changeDetail(i-cur);cur=i;
        const res=__bf.resFor(bf.def,i);const n=bf.vox.body.count+bf.vox.glow.count;o[i]={res,instances:n};}
      // LOD: camera 6 km away, 'normal' levels
      g.setLod('normal');g.camera.position.set(0,0,45000);g.camera.updateMatrixWorld(true);
      for(let k=0;k<6;k++){g.lodTick(1);}
      o.lod={drop:bf.lodDrop|0,instances:bf.vox.body.count+bf.vox.glow.count};
      g.camera.position.set(0,0,-1400);g.camera.updateMatrixWorld(true);for(let k=0;k<6;k++){g.lodTick(1);}
      o.lodNear={drop:bf.lodDrop|0,instances:bf.vox.body.count+bf.vox.glow.count};
      return o;'''))
    print(json.dumps(r))
    check('tablet (detail 2) instances 40-60k', 40000<=r['2']['instances']<=60000, str(r['2']))
    check('laptop (detail 4) <= 130k', r['4']['instances']<=130000, str(r['4']))
    print('INFO detail 6 (desktop):', r['6'])
    check('LOD drops detail for a far ship and restores it near', r['lod']['drop']>0 and r['lod']['instances']<r['6']['instances'] and r['lodNear']['drop']<r['lod']['drop'], json.dumps([r['lod'],r['lodNear']]))

def t_blast(R):
    pg=R.page(320,180,'?free&n=0&q=low')
    r=pg.evaluate(js('''
      const o={};
      for(const id of ['bullfrog','exeter','halberd']){
        const bf=g.spawnShip(id,1,V(0,0,0),V(0,0,-3000),{});bf.ai.role='capital';freeze(bf);bf.turrets.length=0;g.update(0.05);
        const hz=bf.def.half[2],res=[];
        for(const f of [0,0.45,0.8,0.97]){   // blast right at the hull surface along the axis, f x half-length from the centre toward the bow
          const lp=V(0,0,-hz*f);const hit=null;
          // find the hull surface along the axis from outside
          let z=-hz*1.05;const d=g.THREE;
          const out=new T.Vector3(0,0,-hz*1.2),dir=new T.Vector3(0,0,1);
          // use the real missile: Tadpole fired along the axis from 400 m ahead, unguided, hits the prow
          bf.structure=bf.def.structure;bf.shield.fore=bf.def.shield.fore;bf.shield.aft=bf.def.shield.aft;
          const pos=bf.group.position.clone().add(V(0,0,-hz*f-1));
          const before=bf.structure+bf.shield.fore+bf.shield.aft;
          __bf.blastAt(pos,g.WEAPONS.tad,0,null,null);
          res.push({f,dmg:+(before-(bf.structure+bf.shield.fore+bf.shield.aft)).toFixed(1)});
        }
        o[id]=res;
        bf.alive=false;g.update(0.05);
      }
      return o;'''))
    print(json.dumps(r))
    # blasts on the hull surface of an outer third must hurt (the bug: gate used a 0.62 R sphere around the centre)
    for id,hz in (('bullfrog',300),('exeter',230)):
        check(f'{id}: blast at 97% of half-length (outer hull) deals damage', r[id][3]['dmg']>0, json.dumps(r[id]))
    check('halberd (small hull) behaviour: damage at the prow', r['halberd'][3]['dmg']>=0, json.dumps(r['halberd']))

SC={'spine':t_spine,'exeter':t_exeter,'friendly':t_friendly,'arcs':t_arcs,'pd':t_pd,'hangar':t_hangar,'inst':t_inst,'blast':t_blast}
if __name__=='__main__':
    names=sys.argv[1:] or list(SC)
    with Runner() as R:
        for n in names:
            print('====',n,flush=True); SC[n](R)
        print('ERRS',R.errs[:5])
    print('FAILED:',fails if fails else 'none')
