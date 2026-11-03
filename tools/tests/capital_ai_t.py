#!/usr/bin/env python3
"""Cloud-only smoke for gated human capital ordnance AI and drone launch."""
from lib import Runner

JS = r'''()=>{
 const g=__game,T=g.THREE; __paused=true;
 for(const s of g.ships) if(s!==g.player) s.alive=false;
 g.player.group.position.set(50000,0,50000);
 g.TUNE.ordnance.enabled=true;
 const ship=g.makeShip('exeter',0,new T.Vector3(),new T.Quaternion(),{});
 const hostile=g.makeShip('darter',1,new T.Vector3(0,0,-1500),new T.Quaternion(),{});
 g.capitalOrdnanceAI(ship,0.1);
 const on={initialized:!!ship.capitalOrdnance,drones:ship.drones.length,stock:ship.stores.drone};
 g.TUNE.ordnance.enabled=false;
 const before=ship.drones.length;g.capitalOrdnanceAI(ship,20);
 return {on,disabled:g.ships.filter(s=>s.ctrl===ship&&s.alive).length===before,hostile:hostile.alive};
}'''
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom'); r=p.evaluate(JS)
    assert r['on']['initialized'] and 0<r['on']['drones']<=6 and r['on']['stock']<48,r
    assert r['disabled'] and r['hostile'],r
    assert not R.errs,R.errs
print('capital AI contact, drone limit and disabled control: OK')
