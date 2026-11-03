#!/usr/bin/env python3
"""Versioned roster persistence, player succession and recovery countdown."""
from lib import Runner
with Runner() as R:
    p=R.page(640,360,'?m=1&newcrew&nobloom')
    first=p.evaluate('''()=>{const g=__game;__paused=true;localStorage.removeItem('gs_roster_v1');g.TUNE.roster.enabled=true;g.startMission(g.MISSIONS[0]);
      const S=g.game.mstate,pool=g.rosterForCarrier(S.rosterKey,g.game.mission.setup.anchor.ship),pilot=g.rosterFind('player');
      pilot.kills=4;g.rosterTransition(pilot,'KIA');g.rosterTransition(pool[0],'RECOVERING');g.endMission('win','TEST');
      return {player:pilot.status,missions:pilot.missions};}''')
    assert first=={'player':'KIA','missions':1},first
    p.reload();p.wait_for_function('window.__game!==undefined',timeout=120000)
    later=p.evaluate('''()=>{const g=__game;__paused=true;g.TUNE.roster.enabled=true;g.startMission(g.MISSIONS[0]);
      const S=g.game.mstate,pool=g.rosterForCarrier(S.rosterKey,g.game.mission.setup.anchor.ship),r=pool[0];
      const out={kills:g.rosterFind('player').kills,player:g.rosterFind('player').status,successor:S.rosterPlayer,selected:S.rosterSelected.slice(),recovery:r.recoveryLeft};
      g.endMission('win','TEST');out.afterOne=r.recoveryLeft;g.startMission(g.MISSIONS[0]);g.endMission('win','TEST');out.afterTwo=r.status;return out;}''')
    assert later['kills']==4 and later['player']=='KIA' and later['successor']!='player',later
    assert later['successor'] not in later['selected'] and later['recovery']==2 and later['afterOne']==1 and later['afterTwo']=='ACTIVE',later
    assert not R.errs,R.errs
print('roster persistence, player succession and mission-counted recovery: OK')
