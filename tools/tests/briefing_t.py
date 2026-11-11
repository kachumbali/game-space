"""Three-screen Prologue briefing, options and touch viewport regression."""
from lib import *

def exercise(r, width, height, touch=False):
    p=r.page(width,height,'?campaign=prologue&m=1&seed=42',touch=touch)
    assert p.locator('#briefNext').count()==1 and p.locator('#bgo').count()==0
    assert 'CDR. SARAH VANCE' in p.locator('#brief').inner_text()
    p.locator('#briefNext').click()
    assert p.locator('#bgo').count()==0
    observed=p.locator('.approach').evaluate_all('(xs)=>xs.map(x=>({bearing:x.dataset.bearing,distance:+x.dataset.distance}))')
    expected=p.evaluate("()=>__game.game.mission.stages.flatMap(s=>s.do.filter(a=>a.spawn).map(a=>({bearing:a.spawn.bearing.join(','),distance:a.spawn.dist})))")
    assert observed==expected,(observed,expected)
    p.locator('#briefBack').click();assert 'STEP 1 OF 3' in p.locator('#brief').inner_text()
    p.locator('#briefNext').click();p.locator('#briefNext').click()
    assert p.locator('#bgo').count()==1
    buttons=p.locator('[data-roster]:not([disabled])')
    if buttons.count(): buttons.first.click()
    stations=p.locator('[data-station]')
    if stations.count(): stations.first.click()
    selected=p.evaluate("()=>({crew:[...__game.game.mstate.rosterSelected],stations:[...document.querySelectorAll('[data-station]')].map(b=>b.textContent)})")
    p.locator('#briefOptions').click();p.locator('#o_fm').select_option('sim');p.locator('#o_diff').select_option('easy');p.locator('#o_close').click()
    assert p.evaluate("()=>({crew:[...__game.game.mstate.rosterSelected],stations:[...document.querySelectorAll('[data-station]')].map(b=>b.textContent)})")==selected
    p.locator('#briefBack').click();p.locator('#briefNext').click()
    assert p.evaluate("()=>({crew:[...__game.game.mstate.rosterSelected],stations:[...document.querySelectorAll('[data-station]')].map(b=>b.textContent)})")==selected
    assert p.locator('#bgo').count()==1
    p.locator('#bgo').click()
    assert p.evaluate("()=>__game.state==='play' && __game.player.modBase.take===__game.DIFFS.easy.take")
    print('PASS briefing',width,height,'touch' if touch else 'desktop',flush=True)
    p.context.close()

with Runner() as r:
    exercise(r,1440,900)
    exercise(r,1180,820,True)
    p=r.page(1280,720,'?campaign=prologue&m=1&go&seed=42')
    assert p.evaluate("()=>__game.state==='play' && document.getElementById('brief').style.display==='none'")
    print('PASS ?go bypass',flush=True)
    for i in range(4):
        p.evaluate('(i)=>__game.startMission(__game.PROLOGUE_MISSIONS[i])',i)
        p.locator('#briefNext').click()
        observed=p.locator('.approach').evaluate_all('(xs)=>xs.map(x=>({bearing:x.dataset.bearing,distance:+x.dataset.distance}))')
        expected=p.evaluate("()=>__game.game.mission.stages.flatMap(s=>s.do.filter(a=>a.spawn).map(a=>({bearing:a.spawn.bearing.join(','),distance:a.spawn.dist})))")
        assert observed==expected,(i,observed,expected)
    print('PASS sectors for all four missions',flush=True)
    p.context.close();assert_no_console_errors(r)
