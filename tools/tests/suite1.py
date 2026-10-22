from lib import *
CASES=['?free','?free&q=low','?free&q=mid','?free&q=high','?free&wing=2&frigate&q=high','?free&n=6&wing=2&nuke=2&aifm=newton','?go&m=1','?go&m=2','?touch&free','?free&speed=2&nobloom','?m=2','?sk=darter:2,gulper:1&sk_wing=1','']
for u in CASES:
    with Runner() as R:
        pg=R.page(640,360,u); pg.wait_for_timeout(1500)
        r=pg.evaluate("()=>{const g=__game;__paused=true;for(let i=0;i<300;i++)g.update(0.05);return [g.state,g.ships.length,g.ships.filter(s=>s.alive).length]}")
        print(u,r,'ERRS',R.errs[:3],flush=True)
