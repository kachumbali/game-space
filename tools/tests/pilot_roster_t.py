#!/usr/bin/env python3
"""Roster briefing, debrief, loss and flag-off browser checks."""
from lib import Runner
import os

OFF = r'''()=>{const g=__game;__paused=true;g.TUNE.roster.enabled=false;g.startMission(g.MISSIONS[0]);
 return {legacy:g.ships.filter(s=>s.pilot==='hawk'||s.pilot==='sparrow').length,
         controls:document.querySelectorAll('[data-roster]').length};}'''
ON = r'''()=>{const g=__game;g.TUNE.roster.enabled=true;g.startMission(g.MISSIONS[0]);
 const S=g.game.mstate,pool=g.rosterForCarrier(S.rosterKey,g.game.mission.setup.anchor.ship);
 const choices=document.querySelectorAll('[data-roster]').length;
 document.getElementById('rosterRecord').click();
 const record=document.getElementById('rosterDetails').textContent.includes('SERVICE RECORD');
 const wing=g.ships.find(s=>s.rosterWing),lost=wing.pilot;const old=Math.random;Math.random=()=>0.999;g.killShip(wing);Math.random=old;
 const kia=g.rosterFind(lost).status;
 g.rosterFind('player').kills=1;g.endMission('win','TEST');g.showDebrief();
 const award=document.getElementById('brief').textContent.includes('First confirmed victory');
 for(const p of pool)g.rosterTransition(p,'KIA');g.startMission(g.MISSIONS[0]);
 return {choices,record,kia,award,short:document.getElementById('brief').textContent.includes('SHORT 2 WINGMAN'),wing:g.ships.filter(s=>s.rosterWing).length};}'''
with Runner() as R:
    p=R.page(844,390,'?m=1&newcrew&touch',touch=True)
    off=p.evaluate(OFF); assert off['legacy']==2 and off['controls']==0,off
    on=p.evaluate(ON); assert on['choices']>=12 and on['record'] and on['kia']=='KIA' and on['award'] and on['short'] and on['wing']==0,on
    shotdir=os.environ.get('GS_SHOTS','/private/tmp/roster-shots');os.makedirs(shotdir,exist_ok=True)
    p.locator('#rosterRecord').click()
    p.screenshot(path=os.path.join(shotdir,'service-record-landscape.png'))
    p.locator('#rosterRecord').click()
    p.set_viewport_size({'width':390,'height':844})
    p.evaluate("document.querySelector('#brief .panel').scrollTop=0")
    p.screenshot(path=os.path.join(shotdir,'briefing-portrait.png'))
    assert not R.errs,R.errs
print('roster flag-off, selection, service record, KIA, medal and exhaustion: OK')
