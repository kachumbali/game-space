"""Drone comms access and scrollable panel at phone, tablet and desktop sizes."""
from lib import Runner, assert_no_console_errors
sizes=[(844,390,'phone-landscape',True),(390,844,'phone-portrait',True),(1024,768,'tablet',True),(1280,720,'desktop',False)]
with Runner() as r:
    for w,h,name,touch in sizes:
        p=r.page(w,h,'?free&go&n=0&drones=2&dlimit=2&nolaunch'+('&touch' if touch else ''),touch=touch)
        if touch:
            overlaps=p.evaluate('''()=>{
              const b=document.querySelector('#bcom').getBoundingClientRect();
              return [...document.querySelectorAll('.tbtn')].filter(e=>e.id!=='bcom'&&getComputedStyle(e).display!=='none').filter(e=>{
                const r=e.getBoundingClientRect(); return Math.min(b.right,r.right)-Math.max(b.left,r.left)>.5 && Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>.5;
              }).map(e=>e.id);
            }''')
            assert not overlaps,(name,overlaps)
        def activate(locator):
            if touch:
                locator.wait_for(state='visible',timeout=10000)
                box=locator.bounding_box(); assert box, name
                p.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
            else: locator.click()
        if touch: activate(p.locator('#bcom'))
        else: p.keyboard.press('j')
        if touch: activate(p.locator('#coms .ci',has_text='DRONES').first)
        else: p.keyboard.press('Digit3')
        panel=p.locator('#coms')
        assert panel.is_visible(),name
        rect=panel.bounding_box()
        assert rect['x']>=0 and rect['y']>=0 and rect['x']+rect['width']<=w and rect['y']+rect['height']<=h,(name,rect)
        if touch: activate(p.locator('#coms .ci',has_text='LAUNCH'))
        else: p.keyboard.press('Digit1')
        assert p.evaluate('()=>__game.dronesOf(__game.player).length')==2,name
        if touch: activate(p.locator('#bcom'))
        else: p.keyboard.press('j')
        if touch: activate(p.locator('#coms .ci',has_text='DRONES').first)
        else: p.keyboard.press('Digit3')
        recall=p.locator('#coms .ci',has_text='RECALL')
        if name=='phone-landscape':
            # A real touch drag must scroll; programmatic scrollIntoView alone is not a touch check.
            cdp=p.context.new_cdp_session(p)
            def touch_event(kind,y):
                points=[] if kind=='touchEnd' else [{'x':40,'y':y,'id':1,'radiusX':1,'radiusY':1,'force':1}]
                cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
            touch_event('touchStart',320)
            for y in range(300,99,-20):
                touch_event('touchMove',y); p.wait_for_timeout(15)
            touch_event('touchEnd',100); p.wait_for_timeout(200)
            assert panel.evaluate('(el)=>el.scrollTop')>0, 'phone menu did not scroll on a touch drag'
            cdp.detach()
        p.screenshot(path='/tmp/drone-touch-'+name+'.png')
        if touch: activate(recall)
        else: p.keyboard.press('Digit8')
        assert p.evaluate("()=>__game.dronesOf(__game.player).every(d=>d.dOrder==='return')"),name
        if touch:
            activate(p.locator('#bcom'))
            activate(p.locator('#coms [data-close]'))
            assert not panel.is_visible(),name
        print(name,'PASS',rect,flush=True)
        p.context.close()
    assert_no_console_errors(r)
