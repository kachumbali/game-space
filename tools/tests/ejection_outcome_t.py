#!/usr/bin/env python3
"""A player capsule resolves to a persistent campaign capture, or remains missing."""
from lib import Runner

JS = r'''(outcome)=>{const g=__game;__paused=true;g.TUNE.cutscenes.enabled=false;
 g.TUNE.roster.enabled=true;g.TUNE.rescue.enabled=true;g.startMission(g.MISSIONS[0]);
 const old=g.player,id=old.pilot;old.rescueManualRequested=true;g.killShip(old);
 const pod=g.rescueCapsules().find(s=>s.rescueCapsule.player);
 const before=g.rosterFind(id).status;
 g.rescueResolve(pod,outcome);
 return {before,after:g.rosterFind(id).status,result:g.game.mstate.result,
   pending:(g.rosterLoad().capturePending||[]).some(x=>x.pilot===id&&!x.resolved)};
}'''
with Runner() as R:
    for outcome, expected in [('captured','CAPTURED'),('missing','MIA')]:
        p=R.page(640,360,'?m=1&newcrew&nobloom&nocut')
        result=p.evaluate(JS,outcome)
        assert result=={'before':'MIA','after':expected,'result':'partial','pending':outcome=='captured'},result
        p.context.close()
    assert not R.errs,R.errs
print('player capsule capture and missing campaign outcomes: OK')
