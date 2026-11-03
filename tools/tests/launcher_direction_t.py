#!/usr/bin/env python3
"""Cloud browser control for flag-gated cold launch and legacy behavior."""
from lib import Runner

JS=r'''()=>{
 const g=__game,T=g.THREE;__paused=true;const p=g.player;p.stores.ir=10;
 const t=g.makeShip('darter',1,new T.Vector3(800,0,0),new T.Quaternion(),{});
 const opts={pos:[1,2,3],dir:new T.Vector3(1,0,0),target:t};
 g.TUNE.ordnance.enabled=true;g.launchMissile(p,'ir',opts);const m=g.missiles.at(-1);
 const enabled={dir:m.dir.toArray(),local:p.group.worldToLocal(m.pos.clone()).toArray(),target:m.target===t};
 g.TUNE.ordnance.enabled=false;p.lock.p=0;g.launchMissile(p,'ir',opts);const legacy=g.missiles.at(-1);
 const disabled={dir:legacy.dir.toArray(),target:legacy.target===t};
 g.TUNE.ordnance.enabled=true;g.launchMissile(p,'ir',{dir:new T.Vector3(),target:p});const invalid=g.missiles.at(-1);
 return {enabled,disabled,invalid:{dir:invalid.dir.toArray(),target:!!invalid.target}};
}'''
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom');r=p.evaluate(JS);print(r,flush=True)
    assert abs(r['enabled']['dir'][0]-1)<1e-6 and r['enabled']['target'],r
    assert all(abs(a-b)<1e-6 for a,b in zip(r['enabled']['local'],[1,2,3])),r
    assert abs(r['disabled']['dir'][2]+1)<1e-6 and not r['disabled']['target'],r
    assert abs(r['invalid']['dir'][2]+1)<1e-6 and not r['invalid']['target'],r
    assert not R.errs,R.errs
print('cold launch direction and flag controls: OK')
