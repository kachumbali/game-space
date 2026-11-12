"""Columbus hangar cadence, launch positions, cap, and recovery conservation."""
from lib import *
with Runner() as R:
    pg = R.page(640,360,'?free&n=0&wing=0&q=low')
    result=pg.evaluate('''() => {
      const g=__game,T=g.THREE; window.__paused=true;
      g.player.group.position.set(50000,0,50000);
      const ship=g.makeShip('carrier',0,new T.Vector3(),new T.Quaternion(),{});
      const enemy=g.makeShip('darter',1,new T.Vector3(0,0,-1500),new T.Quaternion(),{});
      const tick=dt=>g.capitalOrdnanceAI(ship,dt);
      const sum=x=>Object.values(x).reduce((a,b)=>a+b,0);
      tick(.1); const H=ship.capitalOrdnance.hangar, first=H.out.length;
      const mouths=H.out.every(f=>{const b=ship.comps.find(c=>c.id===f.hangarBay); return f.group.position.distanceTo(ship.group.localToWorld(new T.Vector3(...b.launch))) < .01});
      tick(2); const early=H.out.length; tick(2.1); const second=H.out.length; tick(4); const capped=H.out.length;
      enemy.alive=false;
      for(const f of H.out){const b=ship.comps.find(c=>c.id===f.hangarBay); f.group.position.copy(ship.group.localToWorld(new T.Vector3(...b.launch)));}
      tick(.1); const recovered=H.out.length, refilled=sum(H.remaining);
      enemy.alive=true; tick(4); const relaunched=H.out.length;
      return {first,early,second,capped,mouths,recovered,refilled,relaunched,cap:ship.def.ordnancePlan.hangar.airborneCap,drone:g.droneLimitOf(ship),roster:g.rosterForCarrier("test:carrier","carrier").length};
    }''')
    print(result)
    assert result == {'first':6,'early':6,'second':12,'capped':18,'mouths':True,'recovered':0,'refilled':72,'relaunched':6,'cap':18,'drone':5,'roster':72}, result
    assert_no_console_errors(R)
print('carrier launch cadence, cap, recovery and relaunch OK')
with Runner() as R:
    pg=R.page(640,360,'?free&n=0&wing=0&q=low')
    result=pg.evaluate('''()=>{
      const g=__game,T=g.THREE;window.__paused=true;g.player.group.position.set(50000,0,50000);
      const s=g.makeShip('carrier',0,new T.Vector3(),new T.Quaternion(),{});s.stores.drone=0;
      const e=g.makeShip('darter',1,new T.Vector3(0,0,-1500),new T.Quaternion(),{});
      g.capitalOrdnanceAI(s,.1);const H=s.capitalOrdnance.hangar, f=H.out[0];
      const bay=s.comps.find(c=>c.id===f.hangarBay), before=H.remaining[f.def.id];
      for(const other of H.out.slice(1))other.alive=false; e.alive=false;
      f.group.position.copy(s.group.localToWorld(new T.Vector3(...bay.launch))).add(new T.Vector3(0,-150,0)); f.vel.set(0,0,0);
      let n=0;for(;n<1500&&f.alive;n++)g.update(.1);
      return {recovered:!f.alive,credited:H.remaining[f.def.id]===before+1,steps:n};
    }''')
    print('return flight',result)
    assert result['recovered'] and result['credited'], result
    assert_no_console_errors(R)
# Raise the cap only in this accounting test so all 72 can leave at once;
# the production cap is separately checked above.
with Runner() as R:
    pg=R.page(640,360,'?free&n=0&wing=0&q=low')
    result=pg.evaluate('''()=>{
      const g=__game,T=g.THREE;window.__paused=true;g.player.group.position.set(50000,0,50000);
      const s=g.makeShip('carrier',0,new T.Vector3(),new T.Quaternion(),{});s.stores.drone=0;
      const e=g.makeShip('darter',1,new T.Vector3(0,0,-1500),new T.Quaternion(),{});
      s.def.ordnancePlan.hangar.airborneCap=72;
      for(let i=0;i<12;i++)g.capitalOrdnanceAI(s,4);
      const H=s.capitalOrdnance.hangar, sum=()=>Object.values(H.remaining).reduce((a,b)=>a+b,0);
      const empty=sum(),airborne=H.out.length;e.alive=false;
      for(const f of H.out){const b=s.comps.find(c=>c.id===f.hangarBay);f.group.position.copy(s.group.localToWorld(new T.Vector3(...b.launch)));}
      g.capitalOrdnanceAI(s,.1);
      return {empty,airborne,refilled:sum(),out:H.out.length};
    }''')
    print('manifest accounting',result)
    assert result=={'empty':0,'airborne':72,'refilled':72,'out':0},result
    assert_no_console_errors(R)
