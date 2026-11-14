"""Comms controls for commanded capital and fighter carriers."""
from lib import Runner, assert_no_console_errors
with Runner() as r:
    p=r.page(800,450,'?free&go&n=0&frigate&mute')
    result=p.evaluate('''()=>{
      const g=__game,T=g.THREE; __paused=true;
      const c=g.ships.find(s=>s.def.id==='exeter' && s.team===0);
      const visit=()=>{g.comsToggle(true); g.comsPick(2); g.comsPick(1); g.comsPick(4);};
      visit(); g.comsPick(1); const launched=g.dronesOf(c).length, limit=g.droneLimitOf(c);
      visit(); g.comsPick(4); const fighters=c.droneCommand==='fighters' && g.dronesOf(c).some(d=>d.dOrder==='protect');
      visit(); g.comsPick(8); const recalled=g.dronesOf(c).every(d=>d.dOrder==='return') && c.droneRecalling;
      const f=g.makeShip('falchion',0,new T.Vector3(3000,0,0),new T.Quaternion(),{callsign:'TEST-2'}); f.stores.drone=2;   // the Falchion carries no drones since 2026-11-14; the wing-order mechanics are tested with a stocked one
      g.comsToggle(true);g.comsPick(1);g.comsPick(2);g.comsPick(9);g.comsPick(1);
      return {launched,limit,fighters,recalled,wing:g.dronesOf(f).length};
    }''')
    print(result)
    assert result=={'launched':3,'limit':3,'fighters':True,'recalled':True,'wing':2}   # frigate drone limit 3 (owner 2026-11-12)
    assert_no_console_errors(r)
