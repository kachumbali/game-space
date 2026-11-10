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
