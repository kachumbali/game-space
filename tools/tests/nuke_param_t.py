# Owner report 2026-11-12: "?sk=gulper:1&nuke=2&nukeKt=1&go" gave no nukes. The test URL flags must arm the player in skirmish as in free flight.
import sys
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    for q in ('?sk=gulper:1&nuke=2&nukeKt=1&go&mute', '?free&n=0&nuke=2&nukeKt=1&mute'):
        pg = R.page(800, 450, q); pg.wait_for_timeout(800)
        r = pg.evaluate("()=>{const P=__game.player; return {nuke:P.stores.nuke, kt:P.nukeKt, cls:P.def.cls}}")
        check(f'{q}: player carries 2 nukes at 1 kT', r['nuke'] == 2 and r['kt'] == 1, r)
        pg.close()
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
sys.exit(0 if ok else 1)
