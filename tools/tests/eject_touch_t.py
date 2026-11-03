#!/usr/bin/env python3
"""Cloud touch control: EJECT appears only at critical hull and launches a capsule."""
from lib import Runner
with Runner() as R:
    p=R.page(844,390,'?free&n=0&touch&nobloom')
    r=p.evaluate('''()=>{const g=__game;__paused=true;g.TUNE.rescue.enabled=true;
      const b=document.querySelector('#beject');g.update(.05);const hidden=b.style.display==='none';
      g.player.structure=g.player.def.structure*g.TUNE.rescue.ejectHullRatio*.5;g.update(.05);
      const shown=b.style.display==='block';b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      return {hidden,shown,ejected:!!g.player.rescueCapsule};}''')
    assert r['hidden'] and r['shown'] and r['ejected'],r
    assert not R.errs,R.errs
print('touch ejection warning and control: OK')
