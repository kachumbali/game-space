#!/usr/bin/env python3
"""Cloud browser: device caps, refusal accounting and reusable resources."""
from lib import Runner

SCRIPT = r'''device=>{
 const g=__game;__paused=true;g.TUNE.ordnance.enabled=true;g.setDevice(device,false);
 const p=g.player;p.stores.ir=10000;
 const cap=g.missileLiveCap(),start=g.missileResourceCount();let first=null,refused=0,flat=true;
 for(let cycle=0;cycle<4;cycle++){
   const before=p.stores.ir;
   for(let i=0;i<cap;i++)if(!g.launchMissile(p,'ir'))throw Error('launch refused before cap');
   const m=g.missiles.filter(x=>!x.dead), one=m[0].mesh.children[0];
   if(cycle===0)first={geo:one.geometry,mat:one.material};
   flat=flat&&m.length===cap&&m.every(x=>x.mesh.children[0].geometry===first.geo&&x.mesh.children[0].material===first.mat);
   const remain=p.stores.ir; if(g.launchMissile(p,'ir'))throw Error('launch passed cap');
   if(p.stores.ir!==remain||before-remain!==cap)throw Error('refusal consumed ammunition');
   refused++;for(const x of m)x.dead=true;g.update(0.001);
 }
 return {cap,refused,flat,resources:g.missileResourceCount(),start,count:g.PLOG.cnt['missile.capRefused']};
}'''
with Runner() as R:
    for device,cap in [('phone',20),('tablet',32),('desktop',48)]:
        page=R.page(640,360,'?free&n=0&nobloom')
        r=page.evaluate(SCRIPT,device);print(device,r,flush=True)
        assert r['cap']==cap and r['refused']==4 and r['count']==4 and r['flat'] and r['resources']==r['start']+1,r
        page.context.close()
    page=R.page(640,360,'?free&n=0&nobloom')
    r=page.evaluate('''()=>{const g=__game;__paused=true;g.TUNE.ordnance.enabled=false;g.setDevice('phone',false);
      const p=g.player;p.stores.ir=30;let launched=0;for(let i=0;i<21;i++)if(g.launchMissile(p,'ir'))launched++;
      return {launched,uncapped:g.missileLiveCap()===Infinity,cached:g.missileResourceCount()};}''')
    assert r=={'launched':21,'uncapped':True,'cached':0},r
    page.context.close()
    assert not R.errs,R.errs
print('missile budget and shared resources: OK')
