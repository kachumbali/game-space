from lib import *
JS='''(mode)=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
 P.group.position.set(0,0,0);P.group.quaternion.identity();const base=new T.Vector3(0,0,-500);
 const e=g.spawnShip(mode.tg||'darter',1,base.clone(),P.group.position.clone());
 P.mounts.length=0;P.mounts.push({w:mode.w,pos:[0,0,-3],grp:1,cool:0});
 e.shield.fore=e.shield.aft=1e5; e.structure=1e5; e.def.structure=1e5;
 const tot=()=>e.structure+e.shield.fore+e.shield.aft; const out=[]; let last=tot();
 for(let i=0;i<80;i++){
   P.energy=9999; e.vel.set(0,0,0); P.vel.set(0,0,0); P.group.position.set(0,0,0); P.group.quaternion.identity();
   e.group.position.copy(base); if(mode.jink) e.group.position.x+=Math.sin(i*0.9)*14; e.group.updateMatrixWorld(true);
   g.fireGuns(P,1); g.update(0.05);
   if(i%8==7){const t=tot(); out.push(+(last-t).toFixed(1)); last=t;}
 }
 return {perWindow:out, bt:g.PLOG.cnt['beam.track']|0, bl:g.PLOG.cnt['beam.live']|0}}'''
with Runner() as R:
    pg=R.page(640,360,'?free&n=0&wing=0'); pg.wait_for_timeout(800)
    for m in ({'w':'flaser'},{'w':'flaser','jink':1},{'w':'lance'},{'w':'laser'},{'w':'flaser','tg':'toad'},{'w':'flaser','tg':'gulper'}):
        pg.reload(); pg.wait_for_timeout(800)
        print(m, pg.evaluate(JS,m))
    print(R.errs[:5])
