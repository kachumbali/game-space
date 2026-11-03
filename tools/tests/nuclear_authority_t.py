#!/usr/bin/env python3
"""Cloud browser controls for opt-in nuclear authority and options UI."""
from lib import Runner

JS = r'''()=>{
 const g=__game,T=g.THREE;__paused=true;
 g.TUNE.ordnance.enabled=true;g.toggleOpts(true);
 const setting=document.getElementById('o_nuke');
 const present=!!setting, initiallyOff=setting && !setting.checked;
 if(setting){setting.checked=true;setting.dispatchEvent(new Event('change'));}
 g.toggleOpts(false);
 g.startSkirmish({ship:'kestrel',rows:[['leaper',1]]});
 const p=g.player, quick=p.stores.nuke;
 const ai=g.makeShip('kestrel',0,new T.Vector3(500,0,0),new T.Quaternion(),{});
 ai.stores.nuke=1;const aiResult=g.launchMissile(ai,'nuke');
 g.game.mode='mission';g.game.mstate={nuclearReleased:false};
 const before=g.launchMissile(p,'nuke');
 g.game.mstate.nuclearReleased=true;const released=g.launchMissile(p,'nuke');
 p.stores.nuke=1;const second=g.launchMissile(p,'nuke');
 return {present,initiallyOff,quick,aiResult,before,released,second};
}'''
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom'); r=p.evaluate(JS)
    assert r['present'] and r['initiallyOff'] and r['quick']==1,r
    assert not r['aiResult'] and not r['before'] and r['released'] and not r['second'],r
    assert not R.errs,R.errs
print('nuclear option, player-only fire and one scripted campaign release: OK')
