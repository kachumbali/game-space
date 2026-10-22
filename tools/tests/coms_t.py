# comms menu: open with J, wingmen orders (attack/protect/form/hold/rtb), status reply, capital focus fire, target hail; screenshots in /tmp/gs_shots
from lib import *
with Runner() as R:
    pg=R.page(1280,720,'?free&go&wing=2&n=3'); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{__paused=true;const g=__game;for(let i=0;i<120;i++)g.update(0.05);g.updateHud()}")
    pg.keyboard.press('KeyJ'); pg.wait_for_timeout(200)
    print('open',pg.evaluate("()=>__game.coms.open"))
    pg.keyboard.press('Digit1'); pg.wait_for_timeout(100); pg.keyboard.press('Digit1'); pg.wait_for_timeout(200)
    pg.screenshot(path='/tmp/gs_shots/coms_orders.png')
    pg.keyboard.press('Digit1'); pg.wait_for_timeout(100)    # attack my target
    print('after attack',pg.evaluate("()=>{const g=__game;return [g.coms.open,g.comsWing().map(s=>s.ai.order&&s.ai.order.type)]}"))
    print('run',pg.evaluate("""()=>{const g=__game;let t=0;const w=g.comsWing();while(t<20){g.update(0.05);t+=0.05}
      return {tgts:w.map(s=>s.target&&s.target.def.name),comm:g.game&&1}}"""))
    # form + hold + status
    pg.evaluate("()=>{const g=__game;g.setOrder(g.comsWing(),'form');for(const s of g.comsWing())s.ai.hold=true;let t=0;while(t<25){g.update(0.05);t+=0.05}}")
    print('form dist',pg.evaluate("""()=>{const g=__game;return g.comsWing().map(s=>Math.round(s.group.position.distanceTo(g.player.group.position)))}"""))
    pg.keyboard.press('KeyJ'); pg.keyboard.press('Digit1'); pg.keyboard.press('Digit1'); pg.keyboard.press('Digit8'); pg.wait_for_timeout(100)
    pg.evaluate("()=>{const g=__game;for(let i=0;i<60;i++)g.update(0.05);g.updateHud()}"); pg.wait_for_timeout(200)
    pg.screenshot(path='/tmp/gs_shots/coms_status.png')
    pg.keyboard.press('KeyJ'); pg.keyboard.press('Digit4'); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/gs_shots/coms_target.png')
    pg.keyboard.press('KeyJ')
    pg.close()
    pt=R.page(844,390,'?free&go&wing=2&touch',touch=True); pt.wait_for_timeout(1200)
    pt.evaluate("()=>{__paused=true;const g=__game;for(let i=0;i<40;i++)g.update(0.05);g.comsToggle(true);g.coms.stack.push(()=>({title:'x',items:[]}));g.coms.stack.pop();g.updateHud()}")
    pt.wait_for_timeout(300); pt.screenshot(path='/tmp/gs_shots/coms_phone.png')
    print('ERRS',R.errs[:6])
