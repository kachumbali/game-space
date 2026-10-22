from lib import *
import sys, json
# player-like target: turns toward nearest enemy, no fire, mild jink; enemies = FROGG swarm
JS='''(n)=>{const g=__game,T=g.THREE;__paused=true;g.plogReset('t');
 for(let i=0;i<n;i++){const P=g.player;
  if(P&&P.alive&&g.state==='play'){
    let best=null,bd=1e9;for(const s of g.ships){if(s.alive&&s.team===1){const d=s.group.position.distanceTo(P.group.position);if(d<bd){bd=d;best=s;}}}
    if(best){const m=new T.Matrix4().lookAt(P.group.position,best.group.position,new T.Vector3(0,1,0));const q=new T.Quaternion().setFromRotationMatrix(m);
      const jq=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.sin(i*0.03)*0.6);q.multiply(jq);
      P.group.quaternion.rotateTowards(q,0.08);P.throttle=0.6;}
  }
  g.update(0.05);
 }
 const P=g.player;return {cnt:g.PLOG.cnt,hull:P&&P.structure,sh:P&&P.shield,alive:P&&P.alive,en:g.ships.filter(s=>s.team===1&&s.alive).length}}'''
with Runner() as R:
    pg=R.page(640,360,sys.argv[2] if len(sys.argv)>2 else '?free&n=10&wing=0')
    pg.wait_for_timeout(800)
    print(json.dumps(pg.evaluate(JS,int(sys.argv[1])),indent=0))
    print(R.errs[:5])
