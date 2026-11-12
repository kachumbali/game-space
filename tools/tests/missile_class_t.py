#!/usr/bin/env python3
"""Cloud browser check: direct blast application for each class and exemptions."""
from lib import Runner

JS=r'''()=>{const g=__game,T=g.THREE;__paused=true;
 const p=g.player;p.team=2;p.group.position.set(0,0,60000);
 for(const s of g.ships)if(s!==p)s.alive=false;
 const out={};
 for(const wid of ['ir','rf','tick','torp','tad'])for(const cls of ['fighter','corvette','frigate','capital']){
   const t=g.makeShip('kestrel',1,new T.Vector3(),new T.Quaternion(),{});
   t.def={...t.def,cls,armor:{type:'composite',rating:0}};t.comps=[];t.shield.fore=t.shield.aft=0;t.structure=100000;
   const before=t.structure;__bf.blastAt(t.group.position.clone(),g.WEAPONS[wid],0,p,t);
   out[wid+':'+cls]=before-t.structure;t.alive=false;
 }
 return out}'''
with Runner() as R:
    p=R.page(320,180,'?free&n=0&q=low'); r=p.evaluate(JS); print(r,flush=True)
    for wid,base in [('ir',210),('rf',240),('tick',251)]:   # tick: FROGG Mark V base (2026-11-12)
        for cls,factor in [('fighter',1),('corvette',.45),('frigate',.25),('capital',.15)]:
            assert abs(r[wid+':'+cls]-base*factor*1.1)<.1,(wid,cls,r)
    for wid in ('torp','tad'):
        vals=[r[wid+':'+cls] for cls in ('fighter','corvette','frigate','capital')]
        assert max(vals)-min(vals)<.1,(wid,vals)
    assert not R.errs,R.errs
print('missile class runtime: OK')
