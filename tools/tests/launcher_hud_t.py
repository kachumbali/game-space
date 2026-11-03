#!/usr/bin/env python3
"""Cloud-only: launcher readout is bounded and flag-gated at three sizes."""
from lib import Runner

JS=r'''()=>{
 const g=__game,T=g.THREE;__paused=true;g.TUNE.ordnance.enabled=true;
 const p=g.makeShip('exeter',0,new T.Vector3(),new T.Quaternion(),{player:true});
 const cell=p.launcherRuntime[0];cell.ready=0;cell.timer=3.2;
 g.updateLauncherHud(p);const el=document.getElementById('launcherHud');
 const rect=el.getBoundingClientRect();const text=el.textContent;
 const within=rect.left>=0 && rect.right<=innerWidth && rect.top>=0 && rect.bottom<=innerHeight;
 g.TUNE.ordnance.enabled=false;g.updateLauncherHud(p);
 return {text,within,hidden:el.style.display==='none'};
}'''
with Runner() as R:
    for width,height,touch in [(1280,720,False),(1024,768,True),(390,844,True),(844,390,True)]:
        p=R.page(width,height,'?free&n=0&nobloom'+('&touch' if touch else ''),touch=touch)
        r=p.evaluate(JS)
        assert r['within'] and r['hidden'] and 'READY' in r['text'] and 'RELOAD 4s' in r['text'] and 'MAG' in r['text'],(width,height,r)
        p.context.close()
    assert not R.errs,R.errs
print('launcher HUD desktop, tablet and phone bounds and disabled control: OK')
