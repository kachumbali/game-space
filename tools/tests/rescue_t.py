#!/usr/bin/env python3
"""Cloud-only browser smoke for rescue capsules, hit interruption and recovery."""
from lib import Runner

JS=r'''()=>{
 const g=__game,T=g.THREE;__paused=true;
 for(const s of g.ships) if(s!==g.player) s.alive=false;
 const p=g.player;p.group.position.set(0,0,0);p.vel.set(0,0,0);
 const cfg=g.TUNE.rescue;cfg.enabled=false;const disabled=g.rescueSpawnCapsule(p);
 cfg.enabled=true;const pod=g.rescueSpawnCapsule(p,{callsign:'TEST'});
 const sar=g.makeShip('sar',0,new T.Vector3(50,0,0),new T.Quaternion(),{});
 sar.lastHit=g.time;g.rescueTick(cfg.pickupTime);
 const blocked=pod.rescueCapsule.outcome;
 sar.lastHit=-999;g.rescueTick(cfg.pickupTime);
 const recovered=pod.rescueCapsule.outcome;
 const exp=g.rescueSpawnCapsule(p,{callsign:'EXPIRY'});
 sar.group.position.set(5000,0,0);g.rescueTick(cfg.lifeSupport);
 return {disabled:disabled===null,spawned:!!pod,blocked,recovered,expired:exp.rescueCapsule.outcome};
}'''
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom');r=p.evaluate(JS)
    assert r['disabled'] and r['spawned'] and r['blocked']=='adrift',r
    assert r['recovered']=='recovered' and r['expired']=='life support expired',r
    assert not R.errs,R.errs
print('rescue capsule flag, pickup interruption, recovery and expiry: OK')
