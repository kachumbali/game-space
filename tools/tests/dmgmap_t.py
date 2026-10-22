# WC2-style damage map: zone highlights per component (healthy / damaged / dead / just-hit flash); element screenshots in /tmp/gs_shots
from lib import *
with Runner() as R:
    pg=R.page(1280,720,'?free&go'); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{__paused=true;const g=__game;g.ships.filter(s=>s!==g.player).forEach(s=>s.alive=false);document.getElementById('dmg').style.cssText='width:450px;height:510px;image-rendering:pixelated';g.update(0.05);g.updateHud()}")
    pg.locator('#dmg').screenshot(path='/tmp/gs_shots/dmg_healthy.png')
    pg.evaluate("""()=>{const g=__game,p=g.player;const set=(id,f)=>{const c=p.comps.find(c=>c.id===id);c.hp=c.max*f};
      set('engL',0.4);set('gunR',0);set('radar',0.2);set('shield',0.6);set('wingL',0.55);g.updateHud();g.updateHud()}""")
    pg.evaluate("()=>{__game.keys;__game.update(0.0);}")
    pg.evaluate("()=>{for(let i=0;i<30;i++)__game.update(0.05);__game.updateHud()}")
    pg.locator('#dmg').screenshot(path='/tmp/gs_shots/dmg_damaged.png')
    pg.evaluate("""()=>{const g=__game,p=g.player;const c=p.comps.find(c=>c.id==='engR');c.hp-=5;g.updateHud()}""")
    pg.locator('#dmg').screenshot(path='/tmp/gs_shots/dmg_flash.png')
    print('ERRS',R.errs[:4])
