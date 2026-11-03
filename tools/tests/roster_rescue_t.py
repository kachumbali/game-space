#!/usr/bin/env python3
"""Actual ejection/capsule hooks update the experimental roster."""
from lib import Runner
JS=r'''()=>{const g=__game;__paused=true;g.TUNE.roster.enabled=true;g.TUNE.rescue.enabled=true;g.startMission(g.MISSIONS[0]);
 const wing=g.ships.filter(s=>s.rosterWing),ids=wing.map(s=>s.pilot);
 wing[0].rescueManualRequested=true;g.killShip(wing[0]);
 const a=g.rescueCapsules().find(s=>s.rescueCapsule.pilot===ids[0]),missing=g.rosterFind(ids[0]).status;
 g.rescueResolve(a,'recovered',g.player);const recovered=g.rosterFind(ids[0]).status;
 wing[1].rescueManualRequested=true;g.killShip(wing[1]);
 const b=g.rescueCapsules().find(s=>s.rescueCapsule.pilot===ids[1]);g.rescueResolve(b,'captured');
 const captured=g.rosterFind(ids[1]).status;g.endMission('win','TEST');
 return {missing,recovered,captured,medal:g.rosterFind(g.game.mstate.rosterPlayer).medals.some(x=>x.id==='rescued')};}'''
with Runner() as R:
    p=R.page(640,360,'?m=1&newcrew&nobloom');r=p.evaluate(JS)
    assert r=={'missing':'MIA','recovered':'RECOVERING','captured':'CAPTURED','medal':True},r
    assert not R.errs,R.errs
print('roster ejection, recovery, capture and rescue medal: OK')
