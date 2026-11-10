"""Damage presentation regressions. Run after build.py with the standard test harness."""
from lib import *
with Runner() as r:
    pg = r.page(1280, 720, '?free&n=0&q=mid&seed=8')
    out = pg.evaluate('''() => {
      const g=__game, T=g.THREE; g.__paused=true;
      const out={};
      for (const id of ['kestrel','merlin','halberd']) {
        const s=g.spawnShip(id,1,new T.Vector3(1000,0,0),new T.Vector3(1000,0,-1));
        const V=s.vox,D=V.data, before=V.solid.slice();
        // Select a normal-facing, sufficiently thick surface column.
        let p=null;
        for (let i=0;i<D.nx&&!p;i++) for(let j=0;j<D.ny&&!p;j++) for(let k=0;k<D.nz&&!p;k++) {
          let n=(i*D.ny+j)*D.nz+k;
          if(D.cellToVox[n]<0 || i+10>=D.nx || (i>0 && D.grid[((i-1)*D.ny+j)*D.nz+k]>=0)) continue;
          let ok=true;for(let q=0;q<10;q++) if(D.grid[((i+q)*D.ny+j)*D.nz+k]<0)ok=false;
          if(ok)p=new T.Vector3(-D.hx+(i+.5)*D.vs,-D.hy+(j+.5)*D.vs,-D.hz+(k+.5)*D.vs);
        }
        if(!p) {out[id]={candidate:false};continue;}
        for(let n=0;n<3;n++)g.chip(s,p,D.vs*2,D.vs*3,false);
        let removed=0,interior=0;for(let n=0;n<before.length;n++) if(before[n]&&!V.solid[n]) {removed++;if(D.cellToVox[n]<0)interior++;}
        const total=V.solid.reduce((a,b)=>a+b,0);
        const c=s.comps.find(x=>x.role!=='power');g.compEvent(s,c,2);
        const totalAfter=V.solid.reduce((a,b)=>a+b,0);
        const surf=g.componentSurface(s,c);
        out[id]={candidate:true,removed,interior,componentRemoved:total-totalAfter,surface:!!surf};
        if(id==='kestrel'){ const beforeChunks=g.debris.length;g.killShip(s);out[id].chunks=g.debris.slice(beforeChunks).filter(d=>d.chunk).length; }
      }
      return out;
    }''')
    for name, v in out.items():
        assert v['candidate'] and v['removed'] > 0 and v['interior'] == 0, (name,v)
        assert v['surface'] and v['componentRemoved'] == 0, (name,v)
        if name == 'kestrel': assert 2 <= v['chunks'] <= 4, v
        print('PASS',name,v,flush=True)
    assert_no_console_errors(r)
with Runner() as r:
    pg = r.page(1280, 720, '?free&n=0&q=low&rescap=40&seed=8')
    out = pg.evaluate('''() => {
      const g=__game,T=g.THREE;g.__paused=true;let failures=[],checked=0;
      for(const id of Object.keys(g.SHIPS)) {
        const def=g.SHIPS[id]; if(!def.shield || !def.shield.fore && !def.shield.aft)continue;
        const s=g.makeShip(id,1,new T.Vector3(1000,0,0),new T.Quaternion());
        const D=s.vox.data, a=s.shieldFx.scale, h=D.vs*.515;
        for(const v of D.voxels) if(Math.hypot((Math.abs(v.x)+h)/a.x,(Math.abs(v.y)+h)/a.y,(Math.abs(v.z)+h)/a.z)>1/1.12+1e-6){failures.push(id);break;}
        const start=s.group.localToWorld(new T.Vector3(0,0,-a.z*2)), end=s.group.localToWorld(new T.Vector3(0,0,0));
        const hit=g.traceWeapon(s,start,end);
        if(s.shield.fore>0 && (!hit || !hit.shield || Math.abs(hit.point.z+a.z)>1e-5))failures.push(id+':intersection');
        checked++;g.scene.remove(s.group);g.ships.splice(g.ships.indexOf(s),1);
      }
      const target=g.makeShip('merlin',1,new T.Vector3(3000,0,0),new T.Quaternion());
      const a=target.shieldFx.scale, start=target.group.localToWorld(new T.Vector3(0,0,-a.z*2)), end=target.group.localToWorld(new T.Vector3(0,0,0));
      const hit=g.traceWeapon(target,start,end), wp=target.group.localToWorld(hit.point.clone());
      const before={shield:target.shield.fore,structure:target.structure,comps:target.comps.map(c=>c.hp),solid:target.vox.solid.reduce((x,y)=>x+y,0)};
      const outcome=g.applyHit(target,hit.hull,1,wp,'kin',0.75,false,0,hit.point);
      if(outcome!=='shield'||target.shield.fore>=before.shield||target.structure!==before.structure||target.comps.some((c,i)=>c.hp!==before.comps[i])||target.vox.solid.reduce((x,y)=>x+y,0)!==before.solid)failures.push('shield absorption');
      target.shield.fore=0;const hull=g.traceWeapon(target,start,end);if(!hull || hull.shield)failures.push('down facet');
      const torp=Object.values(g.WEAPONS).find(w=>w.tandem);if(!torp) failures.push('missing tandem');
      else {target.shield.fore=target.def.shield.fore;const was=target.shield.fore, hullBefore=target.structure;g.blastAt(wp,torp,0,g.player,target,null);if(target.shield.fore!==0 || target.structure>=hullBefore || !(target.shHole?.fore>g.time) || !(target.tandemUntil>g.time))failures.push('tandem');}
      return {checked,failures};
    }''')
    assert out['checked'] > 0 and not out['failures'], out
    print('PASS shield enclosure and swept intersection',out,flush=True)
    assert_no_console_errors(r)
