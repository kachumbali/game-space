from lib import *

with Runner() as R:
    pg=R.page(1180,820,'?campaign=prologue&m=1&go&q=low',touch=True,
              init_script="localStorage.setItem('gs_tutorial_p01','done')")
    pg.evaluate('()=>{globalThis.__paused=true; __game.update(.05)}')
    assert pg.evaluate("()=>document.body.classList.contains('controls-basic')")
    assert not pg.locator('#bsel').is_visible()
    pg.locator('#bpause').click(); pg.locator('#pm_help').click()
    assert pg.locator('#helpBasic').is_visible()
    assert not pg.locator('#helpAdvanced').is_visible()
    pg.locator('#helpMode').click()
    assert pg.locator('#helpAdvanced').is_visible()
    assert pg.evaluate("()=>localStorage.getItem('gs_controls')") == 'advanced'
    pg.locator('#helpClose').click(); pg.locator('#pm_res').click()
    assert pg.locator('#bsel').is_visible()
    pg.reload(); pg.wait_for_function('window.__game!==undefined')
    assert not pg.evaluate("()=>document.body.classList.contains('controls-basic')")
    pg.locator('#msg').click()
    pg.locator('#bpause').click(); pg.locator('#pm_help').click(); pg.locator('#helpMode').click()
    assert pg.evaluate("()=>localStorage.getItem('gs_controls')") == 'basic'
    pg.locator('#helpClose').click(); pg.locator('#pm_res').click()
    # Advanced keyboard bindings still work while their labels are hidden.
    before=pg.evaluate('()=>__game.player.fireMask')
    pg.keyboard.press('1')
    assert pg.evaluate('()=>__game.player.fireMask') == 1
    pg.keyboard.press('3')
    assert pg.evaluate('()=>__game.player.fireMask') == 3
    pg.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[3]); __game.endMission('win')}")
    assert pg.evaluate("()=>localStorage.getItem('gs_controls')") == 'advanced'
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS basic and advanced modes, persistence, keys, touch and completion')
with Runner() as R:
    pg=R.page(1280,720,'?campaign=prologue&m=1&go&q=low', init_script="localStorage.setItem('gs_tutorial_p01','done')")
    pg.keyboard.press('h')
    assert pg.locator('#helpBasic').is_visible() and not pg.locator('#helpAdvanced').is_visible()
    assert pg.evaluate('()=>__game.userPause')
    pg.locator('#helpMode').click(); assert pg.locator('#helpAdvanced').is_visible()
    pg.locator('#helpClose').click()
    assert not pg.locator('#help').is_visible()
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS desktop help')
print('BASIC CONTROLS OK')
