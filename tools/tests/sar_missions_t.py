#!/usr/bin/env python3
"""Cloud browser controls for optional SAR missions and manual ejection."""
from lib import Runner

JS=r'''()=>{
 const g=__game;__paused=true;g.TUNE.rescue.enabled=true;
 const M=g.SAR_MISSIONS[0];g.startMission(M);g.state='play';
 const S=g.game.mstate, spawned=S.sar.records.length;
 for(const r of S.sar.records)r.outcome='recovered';g.update(.05);
 const win=S.result;
 g.startMission(g.SAR_MISSIONS[1]);g.state='play';const S2=g.game.mstate;
 S2.sar.cutter.alive=false;g.update(.05);const loss=S2.result;
 g.startMission(M);g.state='play';const original=g.player;
 original.structure=original.def.structure*g.TUNE.rescue.ejectHullRatio*.5;
 g.update(.05);const prompt=!!document.querySelector('#ejectWarning') && document.querySelector('#ejectWarning').style.display==='block';
 dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',shiftKey:true,bubbles:true}));
 return {spawned,win,loss,prompt,ejected:!!g.player.rescueCapsule,oldDead:!original.alive};
}'''
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom');r=p.evaluate(JS)
    assert r['spawned']==2 and r['win']=='win' and r['loss']=='lose',r
    assert r['prompt'] and r['ejected'] and r['oldDead'],r
    assert not R.errs,R.errs
print('SAR scenario outcomes and critical Shift+E ejection: OK')
