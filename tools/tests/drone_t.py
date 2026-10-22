# Drone logic (docs/FLEET_LOGIC.md 9/9a): launch + limits, every order, ram on a corvette, PD vs drones, controller death, console errors.
# Run after build.py:  python3 drone_t.py [scenario ...]   One page per scenario (several pages in one browser run time out).
import sys
from lib import *
PRE='''const g=__game,T=g.THREE;__paused=true;g.game.mode='test';
 for(const s of g.ships){if(s!==g.player&&!s.def.drone){s.alive=false;}} g.update(0.01);
 const P=g.player; P.vel.set(0,0,0); P.throttle=0;
 const step=(n,f)=>{for(let i=0;i<n;i++){g.update(0.05); P.vel.set(0,0,0); P.group.position.set(0,0,0); if(f)f(i);}};
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 const live=c=>g.dronesOf(c).length;'''
SC={}
SC['launch']=('?free&drones=5&dlimit=3','''()=>{'''+PRE+'''
 const r={};
 r.live0=live(P); r.stock0=P.stores.drone; r.more=g.launchDrones(P,5).length;
 const d=g.dronesOf(P)[0]; g.killShip(d); step(2); r.live1=live(P); r.stock1=P.stores.drone; r.lostCount=P.dronesLost;
 r.relaunch=g.launchDrones(P,3).length; r.live2=live(P); r.stock2=P.stores.drone;
 r.limitFighter=g.droneLimitOf(P); r.noPilot=g.dronesOf(P).every(x=>!x.pilot);
 const h=g.spawnShip('halberd',0,V(0,0,3000),V(0,0,0),{}); r.limitCorv=g.droneLimitOf(h); h.stores.drone=10; r.corvLaunch=g.launchDrones(h,10).length;
 const ex=g.spawnShip('exeter',0,V(0,0,6000),V(0,0,0),{}); r.exStock=ex.stores.drone; r.exLimit=g.droneLimitOf(ex);
 return r}''')
SC['engage']=('?free&drones=3&dlimit=3','''()=>{'''+PRE+'''
 const r={};
 const E=g.spawnShip('darter',1,V(0,0,-900),V(0,0,0),{}); E.ai.role='hold'; E.shield.fore=E.shield.aft=0; E.structure=3;
 P.target=E; r.n=g.droneOrder(P,'engage',E);
 step(600,()=>{E.vel.set(0,0,0);E.group.position.set(0,0,-900);});
 r.orders=g.dronesOf(P).map(d=>d.dOrder); r.targetDead=!E.alive; r.droneKills=P.droneKills; r.personal=P.kills;
 const F=g.spawnShip('darter',1,V(300,0,-700),V(0,0,0),{}); F.ai.role='hold'; F.shield.fore=F.shield.aft=0; F.structure=3;
 r.nAll=g.droneOrder(P,'all'); step(100,()=>{F.vel.set(0,0,0);F.group.position.set(300,0,-700);}); r.allTgt=g.dronesOf(P).filter(d=>d.target&&d.target.team===1).length; step(500,()=>{F.vel.set(0,0,0);F.group.position.set(300,0,-700);});
 r.allKills=P.droneKills; r.live=live(P); r.enemiesLeft=g.ships.filter(s=>s.team===1&&s.alive).length;
 return r}''')
SC['protect_return']=('?free&drones=3&dlimit=3','''()=>{'''+PRE+'''
 const r={};
 const ds=g.dronesOf(P); ds.forEach(d=>d.group.position.set(500,0,-500));
 r.nRet=g.droneOrder(P,'return'); step(260);
 r.retDist=Math.round(Math.max(...g.dronesOf(P).map(d=>d.group.position.length())));
 ds.forEach(d=>d.group.position.set(0,0,-1000));
 r.nProt=g.droneOrder(P,'protect'); step(260);
 r.protDist=Math.round(Math.max(...g.dronesOf(P).map(d=>d.group.position.length())));
 const E=g.spawnShip('leaper',1,V(150,0,-300),V(0,0,0),{}); E.ai.role='hold'; E.shield.fore=E.shield.aft=0; E.structure=3;
 step(600,()=>{E.vel.set(0,0,0);E.group.position.set(150,0,-300);}); r.attackerDead=!E.alive; r.protKills=P.droneKills;
 return r}''')
SC['scout']=('?free&drones=3&dlimit=3','''()=>{'''+PRE+'''
 const r={};
 const E=g.spawnShip('toad',1,V(100,0,-1900),V(0,0,0),{}); E.hold=true; E.ai.role='hold';
 r.n=g.droneOrder(P,'scout',1700);
 step(500,()=>{E.vel.set(0,0,0);E.group.position.set(100,0,-1900);});
 const ds=g.dronesOf(P); r.live=ds.length; r.fwd=ds.map(d=>Math.round(-d.group.position.z));
 r.detected=!!E.detectedBy&&E.detectedBy===P; r.contacts=(P.contacts||[]).length;
 return r}''')
SC['ram_corvette']=('?free&drones=3&dlimit=3','''()=>{'''+PRE+'''
 const r={};
 const H=g.spawnShip('halberd',1,V(0,0,-700),V(0,0,0),{}); H.vel.set(0,0,0);
 for(const c of H.comps) if(c.role==='turret') c.hp=0;      // no PD in this case: measures raw ram damage
 H.shield.fore=H.shield.aft=0;
 const s0=H.structure, hp0=H.comps.map(c=>c.hp);
 P.target=H; r.n=g.droneOrder(P,'ram',H);
 step(260,()=>{H.vel.set(0,0,0);H.group.position.set(0,0,-700);});
 r.droneLeft=live(P); r.structureLoss=Math.round(s0-H.structure);
 r.compLoss=H.comps.map((c,i)=>[c.id,Math.round(hp0[i]-c.hp)]).filter(x=>x[1]>0);
 r.rams=g.PLOG.cnt['drone.ram']||0; r.ramdmg=Math.round(g.PLOG.cnt['drone.ramdmg']||0);
 return r}''')
SC['pd']=('?free&drones=6&dlimit=6','''()=>{'''+PRE+'''
 const r={};
 // PD must shoot drones: a Halberd 450 m away, drones on 'protect' around the player (inside its PD range), no player-side fire
 const H=g.spawnShip('halberd',1,V(0,0,-450),V(0,0,0),{}); H.vel.set(0,0,0);
 for(const c of H.comps) if(c.role==='turret'&&c.id.startsWith('tur')) {}
 r.n=g.droneOrder(P,'return');
 const before=g.dronesOf(P).map(d=>d.structure+d.shield.fore+d.shield.aft).reduce((a,b)=>a+b,0);
 step(200,()=>{H.vel.set(0,0,0);H.group.position.set(0,0,-450);});
 const after=g.dronesOf(P).map(d=>d.structure+d.shield.fore+d.shield.aft).reduce((a,b)=>a+b,0);
 r.droneLeft=live(P); r.lost=P.dronesLost; r.hitsOnDrones=g.PLOG.cnt['hit.enemy>ally']||0; r.dmgOnDrones=Math.round(g.PLOG.cnt['dmg.enemy>ally']||0);
 r.hpBefore=Math.round(before); r.hpAfter=Math.round(after);
 return r}''')
SC['pd_ram']=('?free&drones=6&dlimit=6','''()=>{'''+PRE+'''
 const r={};
 const H=g.spawnShip('halberd',1,V(0,0,-900),V(0,0,0),{}); H.vel.set(0,0,0);
 P.target=H; r.n=g.droneOrder(P,'ram',H);
 step(300,()=>{H.vel.set(0,0,0);H.group.position.set(0,0,-900);});
 r.droneLeft=live(P); r.lost=P.dronesLost; r.rams=g.PLOG.cnt['drone.ram']||0; r.shotDownBeforeContact=r.lost-r.rams;
 r.structureLoss=Math.round(H.def.structure-H.structure);
 return r}''')
SC['ctrl_death']=('?free','''()=>{'''+PRE+'''
 const r={};
 const H=g.spawnShip('halberd',0,V(0,0,-500),V(0,0,0),{callsign:'HAL'}); H.stores.drone=6; r.l=g.launchDrones(H,6).length;
 const Fr=g.spawnShip('exeter',0,V(1500,0,-500),V(0,0,0),{});
 step(20); r.before=live(H);
 g.killShip(H); step(200);
 const ds=g.ships.filter(s=>s.def.drone&&s.alive); r.drones=ds.length; r.modes=[...new Set(ds.map(d=>d.dOrder))]; r.ctrls=ds.filter(d=>d.ctrl).length;
 r.reorder=g.droneOrder(H,'ram',Fr);
 const dd=ds.map(d=>d.group.position.distanceTo(Fr.group.position)); r.nearFrigate=Math.round(Math.min(...dd))+'..'+Math.round(Math.max(...dd));
 return r}''')
CHK={
 'launch':lambda r:r['live0']==3 and r['stock0']==2 and r['more']==0 and r['live1']==2 and r['stock1']==2 and r['lostCount']==1 and r['relaunch']==1 and r['stock2']==1 and r['limitFighter']==3 and r['noPilot'] and r['limitCorv']==6 and r['corvLaunch']==6 and r['exStock']==48,
 'engage':lambda r:r['n']==3 and r['targetDead'] and r['droneKills']>=1 and r['personal']==0 and r['nAll']>0 and r['allTgt']>=1,
 'protect_return':lambda r:r['retDist']<400 and r['protDist']<400 and r['attackerDead'],
 'scout':lambda r:r['detected'] and r['contacts']>=1 and max(r['fwd'])>1400,
 'ram_corvette':lambda r:r['rams']>=1 and r['structureLoss']>20 and len(r['compLoss'])>=1,
 'pd':lambda r:r['hitsOnDrones']>=3 and r['hpAfter']<r['hpBefore'],
 'pd_ram':lambda r:r['lost']==6,
 'ctrl_death':lambda r:r['drones']==6 and r['modes']==['orphan'] and r['ctrls']==0 and r['reorder']==0,
}
def run(name):
    q,js=SC[name]
    with Runner() as R:
        pg=R.page(800,450,q); pg.wait_for_timeout(800)
        r=pg.evaluate(js); print(name,r,flush=True)
        errs=[e for e in R.errs if e[0] in('pageerror','error')]
        ok=bool(CHK[name](r)) and not errs
        print(name,'OK' if ok else 'FAIL','errs',R.errs[:3],flush=True)
        return ok
if __name__=='__main__':
    names=sys.argv[1:] or list(SC)
    res={n:run(n) for n in names}
    print(res); sys.exit(0 if all(res.values()) else 1)
