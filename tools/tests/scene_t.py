# Intro cutscene smoke test: assets load from a GitHub-Pages-style subdirectory,
# dialogue animates, and the timeline returns to the menu without console errors.
import os, sys
from lib import Runner

bad = 0
def check(name, ok, detail=''):
    global bad
    print(('PASS ' if ok else 'FAIL ') + name, detail, flush=True)
    bad += not ok

with Runner() as R:
    pg = R.page(844, 390, '?scene=intro_test', touch=True)
    pg.wait_for_timeout(700)
    check('scene is visible', pg.evaluate("()=>getComputedStyle(document.getElementById('sceneWrap')).display") == 'flex')
    check('scene canvas is present', pg.locator('#sceneCv').count() == 1)
    check('scene assets loaded', pg.evaluate("()=>Object.keys(sceneState.images).length >= 20"), pg.evaluate("()=>Object.keys(sceneState.images).length"))
    pg.wait_for_timeout(1200)
    check('timeline advanced', pg.evaluate('()=>sceneState.t > 1'), pg.evaluate('()=>sceneState.t'))
    pg.evaluate('()=>{ sceneState.t=27.99; sceneState.eventIdx=sceneState.events.findIndex(e=>e.do === "end"); }')
    pg.wait_for_timeout(200)
    check('end returns to menu', pg.evaluate("()=>getComputedStyle(document.getElementById('sceneWrap')).display") == 'none')
    check('no console or HTTP errors', not R.errs, R.errs[:4])

print('FAILURES', bad)
sys.exit(1 if bad else 0)
