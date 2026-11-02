#!/usr/bin/env python3
"""Cloud browser test for cell clocks, world heading, mounts and launch cap."""
from lib import Runner

JS=r'''()=>{
 const g=__game,T=g.THREE;__paused=true;
 g.TUNE.ordnance.enabled=true;
 const s=g.makeShip('exeter',0,new T.Vector3(),new T.Quaternion(),{});
 const target=g.makeShip('darter',1,new T.Vector3(500,0,0),new T.Quaternion(),{});
 const a=s.launcherRuntime[0], b=s.launcherRuntime[1], w=a.wid;
 const ok=g.fireLauncher(s,a,w,target), m=g.missiles.at(-1);
 const local=s.group.worldToLocal(m.pos.clone()).toArray();
 const aim=m.dir.clone().dot(target.group.position.clone().sub(m.pos).normalize());
 const blockedReload=!g.fireLauncher(s,a,w,target), independent=g.fireLauncher(s,b,b.wid,target);
 g.launcherTick(s,a.reload); const component=s.comps.find(x=>x.id===a.comp);
 component.hp=component.max*0.5; const damaged=!g.fireLauncher(s,a,a.wid,target);
 component.hp=component.max;
 const before=s.stores[a.wid];
 while(g.missiles.length<g.missileLiveCap())g.missiles.push({dead:false});
 const cap=!g.fireLauncher(s,a,a.wid,target), unchanged=s.stores[a.wid]===before;
 g.TUNE.ordnance.enabled=false;const normal=g.makeShip('exeter',0,new T.Vector3(5000,0,0),new T.Quaternion(),{});
 return {ok,local,pos:a.pos,aim,blockedReload,independent,damaged,cap,unchanged,off:!normal.launcherRuntime};
}'''
with Runner() as R:
    page=R.page(640,360,'?free&n=0&nobloom'); r=page.evaluate(JS)
    assert r['ok'] and r['aim']>0.9999 and all(abs(x-y)<1e-5 for x,y in zip(r['local'],r['pos'])),r
    assert all(r[k] for k in ('blockedReload','independent','damaged','cap','unchanged','off')),r
    assert not R.errs,R.errs
print('launcher clocks, aims, damage, cap and opt-out: OK')
