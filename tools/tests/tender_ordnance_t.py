#!/usr/bin/env python3
"""Cloud browser controls for finite shared tender stock and the opt-out path."""
from lib import Runner

JS = r'''()=>{
 const g=__game,T=g.THREE;__paused=true;
 for(const s of g.ships) s.group.position.set(50000,0,50000);
 const q=new T.Quaternion(), p=new T.Vector3();
 const tender=g.makeShip('tender',0,p,q,{});
 const a=g.makeShip('kestrel',0,p,q,{}), b=g.makeShip('kestrel',0,p,q,{});
 for(const s of [a,b]) {s.def={...s.def,stores:{ir:4,nuke:1}};s.stores={ir:0,nuke:0};}
 g.TUNE.ordnance.enabled=true;g.tenderTick(1);
 const enabled={ir:a.stores.ir+b.stores.ir,nuke:a.stores.nuke+b.stores.nuke,hold:tender.ordnanceHold.missile};
 tender.ordnanceHold.missile=0;g.tenderTick(1);
 const exhausted=a.stores.ir+b.stores.ir;
 g.TUNE.ordnance.enabled=false;g.tenderTick(1);
 return {enabled,exhausted,legacy:a.stores.ir+b.stores.ir,nukeLegacy:a.stores.nuke+b.stores.nuke};
}'''
with Runner() as R:
    page=R.page(640,360,'?free&n=0&nobloom');r=page.evaluate(JS)
    assert abs(r['enabled']['ir']-2)<1e-6 and r['enabled']['nuke']==0,r
    assert r['enabled']['hold']==398 and r['exhausted']==2,r
    assert r['legacy']>r['exhausted'] and r['nukeLegacy']>0,r
    assert not R.errs,R.errs
print('tender shared capacity, finite hold, nuclear exclusion and flag control: OK')
