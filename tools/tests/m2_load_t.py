# v0.3 M2: no console errors on load (and after 15 sim-seconds) for the three standard entry points.
# Run: GS_PORT=8881 GS_TEST_DIR=/tmp/gs_m2_l python3 tools/tests/m2_load_t.py
from lib import *
ok = True
with Runner() as R:
    for q in ('?free&go&q=low', '?go&m=2&q=low', '?sk=darter:2&sk_ship=bittern&go&q=low'):
        n0 = len(R.errs)
        pg = R.page(1280, 720, q); pg.wait_for_timeout(3000)
        r = pg.evaluate("()=>{const g=__game;g.__paused=true;for(let i=0;i<300;i++)g.update(0.05);return {ships:g.ships.length,state:g.state,player:g.player&&g.player.def.id,alive:g.player.alive}}")
        new = R.errs[n0:]
        print(('PASS ' if not new else 'FAIL ') + q, r, new, flush=True)
        ok = ok and not new
        pg.close()
print('ALL PASS' if ok else 'FAILED')
raise SystemExit(0 if ok else 1)
