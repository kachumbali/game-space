#!/usr/bin/env python3
"""Scripted slot dialogue follows living roster pilots, never a lost pilot."""
from lib import Runner
JS=r'''()=>{const g=__game;__paused=true;g.TUNE.roster.enabled=true;g.TUNE.cutscenes.enabled=false;
 g.startMission(g.MISSIONS[0]);const S=g.game.mstate,wing=g.rosterSlotShip(0),old=wing.callsign,id=wing.pilot;
 g.comm('HAWK','Echo, form up.');const first=g.comms.at(-1);
 g.rosterTransition(g.rosterFind(id),'KIA');wing.alive=false;const n=g.comms.length;g.comm('HAWK','A lost pilot must not speak.');const suppressed=g.comms.length===n;
 g.startMission(g.MISSIONS[0]);const replacement=g.rosterSlotShip(0);g.comm('HAWK','Echo, form up.');const next=g.comms.at(-1);
 return {old,first:first.from,suppressed,replacement:replacement?.callsign,next:next?.from,deadReferenced:next?.from===old};}'''
with Runner() as R:
    p=R.page(640,360,'?m=1&newcrew&nocut');r=p.evaluate(JS)
    assert r['first']==r['old'] and r['suppressed'] and r['replacement'] and r['next']==r['replacement'] and not r['deadReferenced'],r
    assert not R.errs,R.errs
print('roster dialogue resolves living assigned slots and suppresses lost pilots: OK')
