from lib import *
import sys, json
BOT='''(n)=>{const g=__game,T=g.THREE;__paused=true;const out=[];
 for(let i=0;i<n;i++){
  const P=g.player; if(P&&P.alive&&g.state==='play'){
    const t=g.target;
    if(t){const d=t.group.position.distanceTo(P.group.position);
      const tt=d/900;const ap=t.group.position.clone().addScaledVector(t.vel.clone().sub(P.vel.clone().multiplyScalar(0.9)),tt);
      const m=new T.Matrix4().lookAt(P.group.position,ap,new T.Vector3(0,1,0));const q=new T.Quaternion().setFromRotationMatrix(m);
      P.group.quaternion.rotateTowards(q,2.0*0.05);
      P.throttle=d<250?0.4:0.8;
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);const err=f.angleTo(ap.clone().sub(P.group.position).normalize());
      g.keys.delete('Space'); if(err<0.05&&d<700) g.fireGuns(P,3);
      if(P.lock.state==='locked'&&P.stores[g.selectedMissile(P)]>0&&d>500&&Math.random()<0.02) g.launchMissile(P,g.selectedMissile(P));
    }
    // flares when missile inbound
    if(g.warnState.incoming.length){const m=g.warnState.incoming[0]; if(m.pos.distanceTo(P.group.position)<450) g.deployCM(P);}
  }
  g.update(0.05);
  if(i%100===99){const P2=g.player;out.push({i,t:+g.game.mstate?.t?.toFixed(1),kills:g.kills,alive:P2?.alive,shd:P2?[Math.round(P2.shield.fore),Math.round(P2.shield.aft)]:0,str:P2?Math.round(P2.structure):0,hostile:g.ships.filter(s=>s.team===1&&s.alive).length,msl:g.missiles.length,stage:g.game.mstate?.stage,state:g.state,stores:P2?JSON.stringify(P2.stores):'',ammo:P2?P2.ammo.cannon:0,en:P2?Math.round(P2.energy):0});}
 }
 return out}'''
with Runner() as R:
    pg=R.page(1280,720,'?go&m=2')
    pg.wait_for_timeout(1000)
    N=int(sys.argv[1]) if len(sys.argv)>1 else 600
    for r in pg.evaluate(BOT,N): print(r)
    print(pg.evaluate('JSON.stringify(__game.PLOG.cnt)'))
    pg.wait_for_timeout(300); pg.screenshot(path=SP+'/bot_end.png')
    print(R.errs[:10])
