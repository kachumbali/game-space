from lib import *
with Runner() as r:
    p = r.page(1280,720,'?q=low')
    p.evaluate('()=>{__game.prologueReset();__game.showMainMenu()}')
    assert 'Mission 1 of 4' in p.locator('[data-a=continue]').inner_text()
    p.click('[data-a=continue]')
    assert 'MISSION 1 OF 4' in p.locator('#brief h2').inner_text()
    p.evaluate("()=>{__game.state='play';__game.endMission('lose','test')}")
    assert p.evaluate('()=>__game.prologueNextIndex()') == 0
    p.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[0]);__game.state='play';__game.endMission('win','test');__game.openMenu()}")
    assert 'Mission 2 of 4' in p.locator('[data-a=continue]').inner_text()
    assert p.evaluate("()=>JSON.parse(localStorage.getItem('gs_prologue_progress')).wins.p01!==undefined")
    p.reload(); p.wait_for_function('window.__game!==undefined')
    assert 'Mission 2 of 4' in p.locator('[data-a=continue]').inner_text()
    p.click('[data-a=continue]')
    assert 'MISSION 2 OF 4' in p.locator('#brief h2').inner_text()
    assert_no_console_errors(r)
print('PROLOGUE PROGRESS OK')
