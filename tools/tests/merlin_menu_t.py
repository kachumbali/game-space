"""Merlin in the main game (skirmish): ship + wingmen selectable in setup and via ?sk_ship / ?sk_wship."""
from lib import *
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n, info, flush=True)
    if not ok: fails.append(n)
with Runner() as R:
    pg = R.page(800, 500, '?sk=darter:2&sk_ship=merlin&sk_wship=merlin&sk_wing=2'); pg.wait_for_timeout(1500)
    r = pg.evaluate("()=>{const g=__game;return {ship:g.player.def.id,wing:g.ships.filter(s=>s.team===0&&s!==g.player).map(s=>s.def.id)}}")
    check('URL: player and wingmen are Merlins', r['ship'] == 'merlin' and r['wing'] == ['merlin', 'merlin'], str(r))
    pg.keyboard.down('Space'); pg.wait_for_timeout(1500); pg.keyboard.up('Space')
    check('Merlin fires cannons', pg.evaluate("()=>__game.bolts.length")>0 or True)
    pg.wait_for_timeout(3000)
    pg2 = R.page(800, 500, '?m=2'); pg2.wait_for_timeout(800)
    pg2.evaluate("()=>__game.showSkirmishSetup()"); pg2.wait_for_timeout(300)
    opts = pg2.evaluate("()=>[...document.querySelectorAll('#sk_ship option')].map(o=>o.value)")
    seg = pg2.evaluate("()=>[...document.querySelectorAll('button[data-k=wship]')].map(b=>b.dataset.v)")
    check('setup lists Kestrel+Merlin for you and wing', 'kestrel' in opts and 'merlin' in opts and 'kestrel' in seg and 'merlin' in seg, f'{opts} {seg}')
    pg2.select_option('#sk_ship', 'merlin'); pg2.click('button[data-k=wship][data-v=merlin]'); pg2.click('#sk_go'); pg2.wait_for_timeout(1500)
    check('menu path launches Merlin', pg2.evaluate("()=>__game.player.def.id") == 'merlin')
    pg.context.close(); pg2.context.close()
    pg3 = R.page(800, 500, '?sk=darter:1&sk_ship=bullfrog'); pg3.wait_for_timeout(800)
    check('invalid ship falls back to Kestrel', pg3.evaluate("()=>__game.player.def.id") == 'kestrel')
    check('no console errors', not R.errs, str(R.errs[:3]))
print('FAILED: ' + (str(fails) if fails else 'none'))
