"""Friendly skirmish fleet, legacy URL, persistence, and device-limit regression."""
import json
from lib import Runner

with Runner() as r:
    p = r.page(1280, 720, '?q=low&skyres=64&rescap=64&sk=darter:2&skh=exeter:1,halberd:2,kestrel:6', init_script='window.__paused=true')
    result = p.evaluate("""() => {const g=__game; const h=g.ships.filter(s=>s.team===0); return {
      ids:h.map(s=>s.def.id), enemy:g.ships.filter(s=>s.team===1).length,
      exeter:h.find(s=>s.def.id==='exeter').stores.drone,
      plan:h.find(s=>s.def.id==='exeter').def.ordnancePlan.stores.drone,
      hangar:h.find(s=>s.def.id==='exeter').capitalOrdnance.hangar.remaining,
      manifest:h.find(s=>s.def.id==='exeter').def.ordnancePlan.hangar.manifest};}""")
    assert result['ids'].count('exeter') == 1 and result['ids'].count('halberd') == 2 and result['ids'].count('kestrel') == 7, result
    assert result['enemy'] == 2 and result['exeter'] == result['plan'] and result['hangar'] == result['manifest'], result
    unchanged = p.evaluate("() => {const before=JSON.stringify(__game.rosterLoad()); __game.killShip(__game.player); return before===JSON.stringify(__game.rosterLoad())}")
    assert unchanged, 'skirmish loss changed campaign roster'
    assert not r.errs, r.errs
    print('PASS friendly stacks and ordnance', result, flush=True)

with Runner() as r:
    p = r.page(390, 844, '?q=low&skyres=64&rescap=64&touch&sk=leaper:2&skh=kestrel:100', touch=True, init_script='window.__paused=true')
    result = p.evaluate("() => [__game.game.sk, __game.ships.length]")
    assert result[0]['clamped'] and result[1] == 20, result
    assert not r.errs, r.errs
    print('PASS phone clamp', result, flush=True)

with Runner() as r:
    p = r.page(640, 360, '?q=low&skyres=64&rescap=64&sk=leaper:1&sk_ally=halberd', init_script='window.__paused=true')
    assert p.evaluate("() => __game.ships.filter(s=>s.team===0&&s.def.id==='halberd').length") == 1
    assert not r.errs, r.errs
    print('PASS legacy ally URL', flush=True)

with Runner() as r:
    p = r.page(844, 390, '?q=low&skyres=64&rescap=64&touch', touch=True)
    p.locator('[data-a=skirmish]').click()
    p.locator('[data-hadd]').click()
    p.locator('[data-f=hp0]').click()
    assert p.evaluate("() => JSON.parse(localStorage.getItem('gs_sk')).friendly[0][1]") == 2
    p.reload(); p.locator('[data-a=skirmish]').click()
    assert p.evaluate("() => __game.skCfg.friendly[0][1]") == 2
    sizes = p.evaluate("() => [...document.querySelectorAll('#brief .menu.sk button,#brief .menu.sk select')].map(e=>[e.getBoundingClientRect().width,e.getBoundingClientRect().height])")
    assert all(w >= 44 and h >= 44 for w,h in sizes), sizes
    assert not r.errs, r.errs
    print('PASS persistence and touch targets', flush=True)
