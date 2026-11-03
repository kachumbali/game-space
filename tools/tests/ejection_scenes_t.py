#!/usr/bin/env python3
"""Cutscene shot loading, skip, repeat and mobile bounds."""
from lib import Runner
import os
with Runner() as R:
    for w,h in [(844,390),(390,844)]:
        p=R.page(w,h,'?free&n=0&touch',touch=True)
        p.evaluate("localStorage.removeItem('gs_ejection_scene_ejection')")
        p.emulate_media(reduced_motion='reduce')
        r=p.evaluate('''async()=>{const g=__game;const started=await g.playEjectionSequence('ejection');
          const el=document.getElementById('ejectionScene'),r=el.getBoundingClientRect();
          return {started,visible:el.style.display==='flex',bounds:r.width<=innerWidth&&r.height<=innerHeight,
          caption:el.querySelector('.ejs-caption').textContent,animation:getComputedStyle(el.querySelector('.ejs-art')).animationName};}''')
        assert r['started'] and r['visible'] and r['bounds'] and r['caption'] and r['animation']=='none',r
        shotdir=os.environ.get('GS_SHOTS','/private/tmp/ejection-shots');os.makedirs(shotdir,exist_ok=True)
        p.screenshot(path=os.path.join(shotdir,f'ejection-{w}x{h}.png'))
        p.locator('.ejs-skip').click();assert not p.evaluate('__game.getEjectionScene().active')
        assert not p.evaluate("__game.playEjectionSequence('ejection')")
        p.context.close()
    p=R.page(640,360,'?free&n=0&nocut')
    assert not p.evaluate("__game.playEjectionSequence('captured')")
    p.context.close()
    assert not R.errs,R.errs
print('ejection cutscene mobile layout, reduced motion, skip and repeat: OK')
