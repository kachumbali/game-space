"""Regression: one missile hit must not delete a small fighter's hull (vanishing-ship bug). Usage: python3 tools/tests/hull_carve_t.py"""
from lib import *
FAILS = []
with Runner() as R:
    pg = R.page(1280, 720, '?free&n=0&q=mid&seed=8'); pg.wait_for_timeout(300)
    res = pg.evaluate("""()=>{const g=__game,T=g.THREE;g.__paused=true;const P=g.player;for(const s of [...g.ships]) if(s!==P) g.killShip(s);
      P.group.position.set(50000,0,50000);
      const msl=g.WEAPONS[Object.keys(g.WEAPONS).find(k=>g.WEAPONS[k].kind==='msl')];
      const solid=s=>s.vox.solid.reduce((a,b)=>a+b,0), out={};
      for(const id of ['darter','leaper','merlin','spitter']){
        const s=g.spawnShip(id,1,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{skill:3}); s.group.updateMatrixWorld(true);
        const b=solid(s); g.blastAt(s.group.localToWorld(new T.Vector3(0,0,-s.def.half[2]*0.9)),msl,0,P,null,null);
        out[id]=solid(s)/b;}
      return out;}""")
    for k, v in res.items():
        ok = v > 0.5; print(('PASS ' if ok else 'FAIL ') + f'{k} keeps {v:.0%} of hull after a missile blast', flush=True)
        if not ok: FAILS.append(k)
    assert_no_console_errors(R)
raise SystemExit(1 if FAILS else 0)
