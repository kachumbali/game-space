"""Tender turret-drum resupply (Brief 7).
Usage: python3 tender_pd_t.py
Checks seeded Halberd PD drums at 20 rounds/s in proximity and 40 rounds/s while docked.
"""
from lib import *
import json

PRE='''const g=__game,T=g.THREE;__paused=true;
for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
const V=(x,y,z)=>new T.Vector3(x,y,z);
const DT=0.05;
const dryPDs=s=>s.turrets.filter(t=>t.wid==='pd');
const pdColors=s=>dryPDs(s).map(t=>t.mats.map(m=>m.color.clone()));
const colorsMatch=(s,base)=>dryPDs(s).every((t,i)=>t.mats.every((m,j)=>
  Math.abs(m.color.r-base[i][j].r)<1e-6&&Math.abs(m.color.g-base[i][j].g)<1e-6&&Math.abs(m.color.b-base[i][j].b)<1e-6));
const emptyPDs=s=>{for(const t of dryPDs(s)){t.ammo=0;t.dry=true;for(const m of t.mats)m.color.multiplyScalar(0.55);}};'''
def js(body):
    return '(arg)=>{'+PRE+body+'}'

fails=[]
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ')+name, info)
    if not ok: fails.append(name)

with Runner() as R:
    pg=R.page(320,180,'?free&n=0&q=low&seed=7')
    pg.wait_for_timeout(300)
    r=pg.evaluate(js('''
      const old=g.player;old.alive=false;old.dying=0;old.group.visible=false;
      const P=g.makeShip('halberd',0,V(2000,0,0),new T.Quaternion(),{player:true,ai:'capital',hold:true});
      P.vel.set(0,0,0);P.throttle=0;
      for(const k in P.ammoMax)P.ammo[k]=0;
      const tn=g.spawnShip('tender',0,V(0,0,0),V(0,0,-1),{ai:'capital',hold:true});
      tn.vel.set(0,0,0);
      const wing=g.spawnShip('halberd',0,V(300,0,0),V(0,0,-1),{ai:'capital',hold:true});
      wing.vel.set(0,0,0);const wingColors=pdColors(wing);emptyPDs(wing);
      let t=0;
      while(t<3-1e-9){g.update(DT);t+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,0);
        wing.vel.set(0,0,0);wing.group.position.set(300,0,0);P.vel.set(0,0,0);P.group.position.set(2000,0,0);}
      const proximity=dryPDs(wing);
      const proxAmmo=proximity.map(t=>t.ammo);
      const proxDry=proximity.map(t=>t.dry);
      const proxColors=colorsMatch(wing,wingColors);
      P.group.position.set(0,0,-150);P.group.quaternion.identity();P.vel.set(0,0,0);P.throttle=0;
      g.dockTry();
      let docked=false,approach=0;
      while(approach<12&&!docked){
        g.update(DT);approach+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,0);P.vel.set(0,0,0);
        docked=!!g.dock&&g.dock.phase==='docked';
      }
      if(docked) {
        const pds=dryPDs(P),playerColors=pdColors(P);emptyPDs(P);
        for(const k in P.ammoMax)P.ammo[k]=0;
        let elapsed=0;
        while(elapsed<3-1e-9&&g.dock&&g.dock.phase==='docked'){
          g.update(DT);elapsed+=DT;tn.vel.set(0,0,0);tn.group.position.set(0,0,0);
        }
        return {proxAmmo,proxDry,docked,elapsed:+elapsed.toFixed(2),
          proxColors,dockAmmo:pds.map(t=>t.ammo),dockDry:pds.map(t=>t.dry),
          dockColors:colorsMatch(P,playerColors),stillDocked:!!g.dock&&g.dock.phase==='docked'};
      }
      return {proxAmmo,proxDry,proxColors,docked};
    '''))
    print(json.dumps(r))
    check('proximity trickle refills each Halberd PD drum at 20 rds/s',
          all(59.9 <= a <= 60.1 for a in r['proxAmmo']), str(r))
    check('proximity trickle clears the dry flag', all(not dry for dry in r['proxDry']), str(r))
    check('proximity service restores the turret brightness', r['proxColors'], str(r))
    check('Halberd docks live with D at the tender', r['docked'], str(r))
    if r['docked']:
        check('docked service refills each PD drum at 40 rds/s',
              all(119.9 <= a <= 120.1 for a in r['dockAmmo']), str(r))
        check('docked service clears the dry flag', all(not dry for dry in r['dockDry']), str(r))
        check('docked service restores the turret brightness', r['dockColors'], str(r))
        check('Halberd remains docked during the measured refill interval', r['stillDocked'], str(r))
    check('no browser errors', not R.errs, str(R.errs[:5]))
    print('FAILED: ' + (str(fails) if fails else 'none'))
    if fails: raise SystemExit(1)
