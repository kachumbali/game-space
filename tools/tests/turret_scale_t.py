#!/usr/bin/env python3
"""Runtime size, targeting-origin and muzzle clearance audit of every turret-equipped hull."""
import json, os, subprocess, sys
from pathlib import Path
from lib import Runner, SP

phase = sys.argv[1] if len(sys.argv)>1 else 'after'
out = Path('assets/review/turret-scale')
out.mkdir(parents=True, exist_ok=True)
ids=['bittern','halberd','exeter','hecla','gulper','bullfrog','falchion','liner','destroyer','hivecarrier']
JS = r'''id=>{
 const g=__game,T=g.THREE;globalThis.__paused=true;
 for(const s of g.ships){s.alive=false;s.group.visible=false;g.scene.remove(s.group)}
 const s=g.makeShip(id,0,new T.Vector3(),new T.Quaternion(),{});s.group.updateMatrixWorld(true);
 const V=s.vox,A=V.data,vs=A.vs;
 function clearance(p){
  const R=Math.min(80,Math.max(5,s.def.length*.12)), n=Math.ceil(R/vs);
  const ci=Math.floor((p.x+A.hx)/vs),cj=Math.floor((p.y+A.hy)/vs),ck=Math.floor((p.z+A.hz)/vs);let best=Infinity;
  for(let i=Math.max(0,ci-n);i<Math.min(A.nx,ci+n+1);i++)for(let j=Math.max(0,cj-n);j<Math.min(A.ny,cj+n+1);j++)for(let k=Math.max(0,ck-n);k<Math.min(A.nz,ck+n+1);k++){
   if(!V.solid[(i*A.ny+j)*A.nz+k])continue;
   const dx=Math.max(0,Math.abs((i+.5)*vs-A.hx-p.x)-vs/2),dy=Math.max(0,Math.abs((j+.5)*vs-A.hy-p.y)-vs/2),dz=Math.max(0,Math.abs((k+.5)*vs-A.hz-p.z)-vs/2);best=Math.min(best,Math.hypot(dx,dy,dz));
  }return Number.isFinite(best)?+best.toFixed(3):null;
 }
 return {id,length:s.def.length,voxel:vs,turrets:s.turrets.map(t=>{
  const tip=s.group.worldToLocal(t.head.localToWorld(t.muzzles[0].clone())),aim=s.group.worldToLocal(t.aimY===undefined?t.head.getWorldPosition(new T.Vector3()):t.group.localToWorld(new T.Vector3(0,t.aimY,0)));
  const brake=t.head.children.find(o=>o.isMesh&&o.geometry?.parameters?.depth===.1*t.dia);
  const barrelTip=brake?brake.position.z-brake.geometry.parameters.depth/2:null;
  let lift=0;for(;lift<40;lift+=vs*.25){const q=tip.clone();q.y+=t.def.side*lift;const i=Math.floor((q.x+A.hx)/vs),j=Math.floor((q.y+A.hy)/vs),k=Math.floor((q.z+A.hz)/vs);if(i<0||j<0||k<0||i>=A.nx||j>=A.ny||k>=A.nz||!V.solid[(i*A.ny+j)*A.nz+k])break;}
  return {cls:t.cls,weapon:t.wid,dia:+t.dia.toFixed(4),cssPixelsAt300:+(t.dia*390/(600*Math.tan(75*Math.PI/360))).toFixed(3),lowRenderPixelsAt300:+(t.dia*390/(1800*Math.tan(75*Math.PI/360))).toFixed(3),tip:tip.toArray(),aim:aim.toArray(),clearance:clearance(tip),lift:+lift.toFixed(3),tipMatch:barrelTip===null?false:Math.abs(barrelTip-t.muzzles[0].z)<1e-6};
 })};}'''
with Runner() as R:
    if phase=='before':
        base=subprocess.check_output(['git','show','origin/main:index.html'],text=True)
        base=base.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js','/node_modules/three/build/three.module.js').replace('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/','/node_modules/three/examples/jsm/')
        Path(SP,'index.html').write_text(base)
    p=R.page(640,360,'?free&n=0&nobloom&q=low&seed=1')
    results=[]
    for sid in ids:
        result=p.evaluate(JS,sid);results.append(result)
        print(sid,'turrets',len(result['turrets']),flush=True)
    assert not R.errs,R.errs
    (out/(phase+'-measurements.json')).write_text(json.dumps(results,indent=2)+'\n')
    if phase=='after':
        before=json.loads((out/'before-measurements.json').read_text())
        for a,b in zip(before,results):
            assert a['id']==b['id'] and len(a['turrets'])==len(b['turrets'])
            for old,new in zip(a['turrets'],b['turrets']):
                assert new['tipMatch'],(b['id'],new)
                assert new['cssPixelsAt300'] >= 2,(b['id'],new)
                assert new['clearance'] is None or new['clearance'] > 0,(b['id'],new)
                assert max(abs(x-y) for x,y in zip(old['aim'],new['aim']))<1e-6,(b['id'],old,new)
        override=p.evaluate("""()=>{const g=__game,T=g.THREE,d=g.SHIPS.bittern,t=d.turrets[0],old=t.visualScale;
          t.visualScale=.5;const s=g.makeShip('bittern',0,new T.Vector3(),new T.Quaternion(),{});const x=s.turrets[0];
          if(old===undefined)delete t.visualScale;else t.visualScale=old;
          return {dia:x.dia,aimY:x.aimY,side:t.side,posY:t.pos[1]};}""")
        bittern=results[0]['turrets'][0]
        assert abs(override['dia']-bittern['dia']*.5)<1e-6,override
        assert abs(override['aimY'] - ((bittern['aim'][1] - override['posY']) * override['side'])) < 1e-6, override
        print('visual muzzle tips and unchanged targeting origins: OK')
