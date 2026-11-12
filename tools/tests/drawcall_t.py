"""Render one capital at a time at low quality and enforce its draw-call budget."""
from lib import *

with Runner() as r:
    pg = r.page(1280, 720, '?free&n=0&wing=0&q=low&seed=8')
    rows = pg.evaluate('''() => {
      const g=__game, T=g.THREE; g.__paused=true;
      for (const s of g.ships) s.group.visible=false;
      const result={};
      const isolated=new T.Scene();
      g.scene.children.filter(x=>x.isLight).forEach(x=>isolated.add(x.clone()));
      for (const id of ['bullfrog','destroyer','exeter','gulper','hecla']) {
        const s=g.spawnShip(id,1,new T.Vector3(),new T.Vector3(0,0,-1000),{});
        s.group.quaternion.identity();
        const length=s.def.length;
        g.camera.position.set(length*.7,length*.45,-length*.9);
        g.camera.lookAt(0,0,0); g.camera.updateMatrixWorld(true);
        isolated.add(s.group);
        g.renderer.info.reset(); g.renderer.render(isolated,g.camera);
        const row={calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,voxels:s.vox.body.count};
        const batch=s.turretVisualBatches[0], before=new T.Matrix4(), after=new T.Matrix4();
        batch.getMatrixAt(0,before); s.turrets[0].head.rotation.x=.4; s.syncTurretVisuals(); batch.getMatrixAt(0,after);
        row.tracks=!before.equals(after);
        result[id]=row;
        s.group.visible=false; isolated.remove(s.group);
      }
      return result;
    }''')
    for name, row in rows.items(): print(name, row, flush=True)
    assert_no_console_errors(r)
    assert all(row['calls'] <= 40 and row['tracks'] for row in rows.values()), rows
