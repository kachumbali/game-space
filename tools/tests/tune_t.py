from lib import *
import sys, json
JS='''([n,tm,rm])=>{const g=__game,T=g.THREE;__paused=true;g.AI_TUNE.tolMul=tm;g.AI_TUNE.rngMul=rm;g.plogReset('t');
 let hullLoss=0;
 for(let i=0;i<n;i++){const P=g.player;
  if(P&&P.alive&&g.state==='play'){
    P.shield.fore=40;P.shield.aft=40;P.structure=50;   // keep alive: measure only shots/hits
    let best=null,bd=1e9;for(const s of g.ships){if(s.alive&&s.team===1){const d=s.group.position.distanceTo(P.group.position);if(d<bd){bd=d;best=s;}}}
    if(best){const m=new T.Matrix4().lookAt(P.group.position,best.group.position,new T.Vector3(0,1,0));const q=new T.Quaternion().setFromRotationMatrix(m);
      const jq=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.sin(i*0.03)*0.6);q.multiply(jq);
      P.group.quaternion.rotateTowards(q,0.08);P.throttle=0.6;}
  }
  g.update(0.05);}
 const c=g.PLOG.cnt;return {shots:c['shots.enemy'],hits:c['hit.enemy>player'],dmg:+(c['dmg.enemy>player']||0).toFixed(0),hold:c['hold.enemy']}}'''
for tm,rm in [(1,0.55),(0.5,0.55),(1,0.35),(1.5,0.55),(0.6,0.8)]:
    with Runner() as R:
        pg=R.page(480,270,'?free&n=8&wing=0'); pg.wait_for_timeout(800)
        print(tm,rm,pg.evaluate(JS,[1000,tm,rm]),R.errs[:2],flush=True)
