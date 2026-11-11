from lib import *
def without_prologue_scenes(p):
    p.evaluate("()=>{const a=__game.SCENE_IDS;for(let i=a.length-1;i>=0;i--)if(/^p0[1-4]_/.test(a[i]))a.splice(i,1);localStorage.setItem('gs_prologue_opening_seen','1')}")
with Runner() as r:
    p = r.page(1280,720,'?q=low')
    without_prologue_scenes(p)
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
for touch, w, h in [(False,1280,720),(True,1180,820)]:
    with Runner() as r:
        p=r.page(w,h,'?campaign=prologue&m=1&go&q=low',touch=touch,init_script="Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async s=>window.copied=s}})")
        without_prologue_scenes(p)
        p.evaluate("()=>{__game.prologueReset();__game.showCampaignList()}")
        assert p.locator('[data-a="campaign:severed_node"]').is_disabled()
        if not touch:
            p.locator('[data-a="campaign:prologue"]').focus(); p.keyboard.press('ArrowDown')
            assert p.evaluate("document.activeElement.dataset.a") == 'back'
        p.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[0]);__game.state='play';__game.endMission('win','test');__game.showDebrief()}")
        p.click('#bnext')
        assert 'MISSION 2 OF 4' in p.locator('#brief h2').inner_text()
        p.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[3]);__game.state='play';__game.endMission('lose','test');__game.startMission(__game.PROLOGUE_MISSIONS[3]);__game.state='play';__game.endMission('win','test');__game.showDebrief()}")
        p.click('#bending')
        assert 'TO BE CONTINUED' in p.locator('#brief h1').inner_text()
        assert 'Sorties 3' in p.locator('#brief').inner_text()
        p.click('#ending_copy')
        assert 'Prologue session: 3 sorties, 2 victories' in p.evaluate('window.copied')
        p.click('#ending_menu'); p.evaluate('()=>__game.showCampaignList()')
        b=p.locator('[data-a="campaign:severed_node"]')
        assert b.is_enabled() and 'UNPOLISHED' in b.inner_text()
        assert_no_console_errors(r)
        print('PASS ending and unlock', 'touch' if touch else 'desktop')
for touch,w,h in [(False,1280,720),(True,1180,820)]:
    with Runner() as r:
        p=r.page(w,h,'?campaign=prologue&m=2&go&q=low',touch=touch)
        without_prologue_scenes(p)
        p.evaluate("()=>{__game.__paused=true;__game.update(.05);__game.updateHud()}")
        assert 'WINGMEN' in p.locator('#tutorialText').inner_text()
        if touch:
            assert p.locator('#bcom').is_visible()
            p.locator('#bcom').dispatch_event('pointerdown')
        else:
            p.keyboard.press('j')
        for n in (1,1,3):
            p.locator(f'#coms [data-ci="{n}"]').click()
        assert p.locator('#tutorialText').inner_text() == 'GOOD'
        p.evaluate("()=>{for(let i=0;i<10;i++)__game.update(.05)}")
        assert p.evaluate("()=>localStorage.getItem('gs_tutorial_p02')") == 'done'
        p.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[2]);document.getElementById('brief').style.display='none';__game.state='play';__game.update(.05);__game.updateHud()}")
        assert p.locator('#ets').is_visible()
        if touch: p.locator('#ets [data-pw="w"]').tap()
        else: p.keyboard.press('4')
        assert p.locator('#tutorialText').inner_text() == 'GOOD'
        p.evaluate("()=>{for(let i=0;i<10;i++)__game.update(.05);__game.startMission(__game.PROLOGUE_MISSIONS[3]);document.getElementById('brief').style.display='none';__game.state='play';__game.update(.05);__game.updateHud()}")
        assert 'practice contact' in p.locator('#tutorialText').inner_text()
        if touch:
            assert p.locator('#bsub').is_visible()
            p.locator('#bsub').tap()
        else: p.keyboard.press('n')
        assert p.locator('#tutorialText').inner_text() == 'GOOD'
        p.evaluate("()=>{for(let i=0;i<10;i++)__game.update(.05);__game.startMission(__game.PROLOGUE_MISSIONS[3]);__game.state='play';__game.update(.05)}")
        assert not p.locator('#tutorial').is_visible()
        assert p.evaluate("()=>localStorage.getItem('gs_tutorial_p04')") == 'done'
        assert p.evaluate("()=>document.body.classList.contains('controls-basic')")
        assert_no_console_errors(r)
        print('PASS lessons', 'touch' if touch else 'desktop')
# Authored scenes run in briefing step 1 and the debrief; invalid content falls back.
import base64
with Runner() as r:
    p=r.page(1280,720,'?q=low')
    p.evaluate("()=>localStorage.setItem('gs_prologue_opening_seen','1')")
    pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aN8AAAAASUVORK5CYII=')
    def scene_route(route):
        url=route.request.url
        if url.endswith('/scene.json'):
            scene_id=url.split('/')[-2]
            if scene_id == 'p02_before': route.fulfill(json={'id':scene_id})
            else: route.fulfill(json={'id':scene_id,'size':[320,200],'events':[{'t':60,'do':'end'}]})
        else: route.fulfill(body=pixel,content_type='image/png')
    p.route('**/assets/scenes/**',scene_route)
    p.evaluate("()=>__game.startMission(__game.PROLOGUE_MISSIONS[0])")
    p.wait_for_function("()=>__game.sceneState.id==='p01_before' && __game.sceneState.active")
    assert p.evaluate("()=>document.getElementById('sceneWrap').parentElement.id==='briefScene'")
    p.click('#sceneSkip')
    assert 'MISSION 1 OF 4' in p.locator('#brief h2').inner_text()
    p.evaluate("()=>{__game.state='play';__game.endMission('win','test');__game.game.mstate.endT=3.5;__game.update(.05)}")
    p.wait_for_function("()=>__game.sceneState.id==='p01_after_win' && __game.sceneState.active")
    p.click('#sceneSkip')
    assert 'MISSION ACCOMPLISHED' in p.locator('#brief h1').inner_text()
    p.evaluate("()=>__game.startMission(__game.PROLOGUE_MISSIONS[0],null,false,true)")
    assert p.evaluate("()=>__game.state==='play' && !__game.sceneState.active && document.getElementById('brief').style.display==='none'")
    p.evaluate("()=>__game.startMission(__game.PROLOGUE_MISSIONS[1])")
    p.wait_for_function("()=>!__game.sceneState.active && __game.game.mission?.id==='p02'")
    assert 'MISSION 2 OF 4' in p.locator('#brief h2').inner_text()
    p.evaluate("()=>{__game.state='play';__game.endMission('lose','test');__game.game.mstate.endT=3.5;__game.update(.05)}")
    p.wait_for_function("()=>__game.sceneState.id==='p02_after_lose' && __game.sceneState.active")
    p.evaluate("()=>{__game.sceneState.events=[{t:0,do:'end'}];__game.sceneState.eventIdx=0}")
    p.wait_for_function("()=>!__game.sceneState.active")
    assert 'MISSION FAILED' in p.locator('#brief h1').inner_text()
    assert_no_console_errors(r)
    print('PASS scene hooks, malformed assets and skip')

# Ending a mission while a lesson is open must not leave its panel above the debrief.
with Runner() as r:
    p=r.page(1180,820,'?campaign=prologue&m=4&go&q=low',touch=True)
    p.evaluate("()=>{__game.__paused=true;__game.update(.05)}")
    assert p.locator('#tutorial').is_visible()
    p.evaluate("()=>{__game.endMission('lose','test');__game.showDebrief()}")
    assert not p.locator('#tutorial').is_visible()
    assert_no_console_errors(r)
    print('PASS lesson hidden on mission end')
# Skipping a later lesson persists and does not block a replay.
with Runner() as r:
    p=r.page(1180,820,'?campaign=prologue&m=2&go&q=low',touch=True)
    without_prologue_scenes(p)
    p.evaluate("()=>{__game.__paused=true;__game.update(.05)}")
    p.locator('#tutorialSkip').tap()
    assert p.evaluate("()=>localStorage.getItem('gs_tutorial_p02')") == 'done'
    p.evaluate("()=>{__game.startMission(__game.PROLOGUE_MISSIONS[1]);document.getElementById('brief').style.display='none';__game.state='play';__game.update(.05)}")
    assert not p.locator('#tutorial').is_visible()
    assert_no_console_errors(r)
    print('PASS lesson skip and replay')
