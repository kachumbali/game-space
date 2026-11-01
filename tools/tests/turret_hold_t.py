# v0.3: key U (touch: TUR) makes the player's turrets hold fire; Bittern carries 12 torpedoes.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(1280, 720, '?sk=toad:3&sk_ship=bittern&go&q=low'); pg.wait_for_timeout(3500)
    check('bittern carries 12 torpedoes', pg.evaluate("()=>__game.player.stores.torp") == 12)
    def run():
        return pg.evaluate("""()=>{const g=__game,p=g.player;__paused=true;const f0=p.turrets.reduce((a,t)=>a+t.fired,0);
          g.ships.filter(s=>s.team===1).forEach(s=>s.group.position.set(p.group.position.x,p.group.position.y+40,p.group.position.z+300));
          for(let i=0;i<120;i++)g.update(0.05);__paused=false;return p.turrets.reduce((a,t)=>a+t.fired,0)-f0}""")
    fired = run(); check('turrets fire on auto', fired > 0, fired)
    pg.keyboard.press('KeyU'); pg.wait_for_timeout(200)
    check('U sets hold', pg.evaluate("()=>__game.player.turretsHold") is True)
    fired = run(); check('no turret fire on hold', fired == 0, fired)
    check('HUD shows hold', 'HOLD' in pg.inner_text('#wpn'))
    pg.keyboard.press('KeyU'); pg.wait_for_timeout(200)
    check('U toggles back to auto', pg.evaluate("()=>__game.player.turretsHold") is False)
    pg.close()
    pg = R.page(844, 390, '?sk=toad:1&sk_ship=bittern&go&touch&q=low', touch=True); pg.wait_for_timeout(3000)
    pg.tap('#btur'); pg.wait_for_timeout(300)
    check('touch TUR button toggles hold', pg.evaluate("()=>__game.player.turretsHold") is True)
    r = pg.evaluate("()=>{const b=document.getElementById('btur').getBoundingClientRect();const o=['bpause','brad'].map(i=>document.getElementById(i).getBoundingClientRect());return [b.left>=o[1].right-1,b.right<innerWidth]}")
    check('TUR does not overlap RAD', all(r), r)
print('HOLD OK' if ok else 'HOLD FAIL')
