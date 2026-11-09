from lib import *

URL = '?campaign=prologue&m=1&go&q=low&tutorial=1'
def step(pg, seconds=1):
    pg.evaluate('(n)=>{for(let i=0;i<n;i++) __game.update(0.05)}', int(seconds / .05))
def index(pg):
    return pg.evaluate('()=>__game.game.mstate.tutorial?.step')
def expect(pg, n):
    assert index(pg) == n, (index(pg), n)
def advance(pg): step(pg, .5)
def press(pg, key):
    pg.keyboard.down(key); step(pg, .15); pg.keyboard.up(key)
def touch(pg, selector):
    pg.locator(selector).dispatch_event('pointerdown', {'pointerId':1, 'pointerType':'touch', 'buttons':1})
    step(pg, .15)
    pg.locator(selector).dispatch_event('pointerup', {'pointerId':1, 'pointerType':'touch'})

with Runner() as R:
    pg = R.page(1280,720,URL)
    pg.evaluate('()=>{globalThis.__paused=true}')
    step(pg,.1); expect(pg,0)
    press(pg,'ArrowLeft'); advance(pg); expect(pg,1)
    press(pg,'w'); advance(pg); expect(pg,2)
    step(pg,.2); press(pg,'t'); advance(pg); expect(pg,3)
    press(pg,'Space'); advance(pg); expect(pg,4)
    step(pg,12)
    assert pg.evaluate('()=>__game.player.lock.p >= 1')
    press(pg,'Enter'); advance(pg); expect(pg,5)
    press(pg,'z'); advance(pg); expect(pg,6)
    press(pg,'Shift'); advance(pg); expect(pg,7)
    press(pg,'Enter'); advance(pg); assert index(pg) is None
    assert pg.evaluate("()=>localStorage.getItem('gs_tutorial_p01')") == 'done'
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS desktop real inputs')

with Runner() as R:
    pg = R.page(1180,820,URL,touch=True)
    pg.evaluate('()=>{globalThis.__paused=true}')
    step(pg,.1)
    box=pg.locator('#tutorial').bounding_box()
    assert box['x'] >= 0 and box['x']+box['width'] <= 1180 and box['y']+box['height'] <= 820
    # Timeout repeats at 20 seconds and advances at 40, without advancing mission time.
    step(pg,7.6); assert 'AGAIN:' in pg.locator('#tutorialText').inner_text(); expect(pg,0)
    step(pg,7.6); expect(pg,1)
    assert pg.evaluate('()=>__game.game.mstate.t') == 0
    pg.locator('#tutorialSkip').click(); assert index(pg) is None
    assert pg.evaluate("()=>localStorage.getItem('gs_tutorial_p01')") == 'done'
    pg.goto('http://localhost:'+PORT+'/index.html?campaign=prologue&m=1&go&q=low')
    pg.wait_for_function('window.__game!==undefined'); pg.evaluate('()=>{globalThis.__paused=true}')
    step(pg,.2); assert index(pg) is None
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS timeout, skip, persistence and iPad layout')

with Runner() as R:
    pg = R.page(1180,820,URL,touch=True)
    pg.evaluate('()=>{globalThis.__paused=true}')
    step(pg,.1)
    zone=pg.locator('#stickzone').bounding_box()
    x=zone['x']+zone['width']*.5; y=zone['y']+zone['height']*.5
    pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.move(x+40,y); step(pg,.15); pg.mouse.up(); advance(pg); expect(pg,1)
    thr=pg.locator('#thr').bounding_box()
    pg.mouse.click(thr['x']+thr['width']/2,thr['y']+thr['height']*.1); advance(pg); expect(pg,2)
    step(pg,.2); pg.locator('#btgt').click(); advance(pg); expect(pg,3)
    box=pg.locator('#bfire').bounding_box(); pg.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2); pg.mouse.down(); step(pg,.3); pg.mouse.up(); advance(pg); expect(pg,4)
    step(pg,12); assert pg.evaluate('()=>__game.player.lock.p>=1')
    pg.locator('#bmsl').click(); advance(pg); expect(pg,5)
    pg.locator('#bflr').click(); advance(pg); expect(pg,6)
    box=pg.locator('#bboost').bounding_box(); pg.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2); pg.mouse.down(); step(pg,.15); pg.mouse.up(); advance(pg); expect(pg,7)
    pg.locator('#tutorialReady').click(); advance(pg); assert index(pg) is None
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS iPad controls')

with Runner() as R:
    pg = R.page(1280,720,URL,init_script="localStorage.setItem('gs_tutorial_p01','done')")
    pg.evaluate('()=>{globalThis.__paused=true}'); step(pg,.1); expect(pg,0)
    press(pg,'i'); assert index(pg) is None
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS forced replay and keyboard skip')
print('TUTORIAL OK')
