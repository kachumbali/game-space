"""v0.3 M3: no-console-error loads (?free&go, ?go&m=2, ?sk=darter:2&sk_ship=bittern with torpedoes fired)."""
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i, flush=True); ok = ok and bool(c)
with Runner() as R:
    for q in ('?free&go&q=low', '?go&m=2&q=low'):
        pg = R.page(640, 360, q); pg.wait_for_timeout(3000)
        pg.evaluate("()=>{const g=__game;for(let i=0;i<200;i++)g.update(0.05)}")
        check('loads and steps ' + q, not R.errs, R.errs[:3]); pg.close()
    pg = R.page(640, 360, '?sk=darter:2&sk_ship=bittern&go&q=low'); pg.wait_for_timeout(3000)
    r = pg.evaluate("""()=>{const g=__game,p=g.player;__paused=true;const T=g.THREE;
      p.stores.torp=12;const sel=g.missileIds?0:0;
      const out={fired:0,flights:0,boom:0};
      for(let i=0;i<6;i++){const tg=g.ships.find(s=>s.team===1&&s.alive);if(!tg)break;
        p.lock={tgt:tg,wid:'torp',p:1,state:'locked',d:600,ang:0};
        if(g.launchMissile(p,'torp'))out.fired++;
        for(let k=0;k<120;k++)g.update(0.05);}
      out.left=p.stores.torp;out.alive=g.ships.filter(s=>s.team===1&&s.alive).length;return out}""")
    print(r)
    check('torpedoes fire', r['fired'] >= 3 and r['left'] == 12 - r['fired'], r)
    check('no console errors in Bittern skirmish', not R.errs, R.errs[:3])
print('LOAD OK' if ok else 'LOAD FAIL')
