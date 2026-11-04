"""Exercise the fighter leash with a Halberd moving at its top speed."""
from lib import Runner, assert_no_console_errors
with Runner() as r:
    p=r.page(640,360,'?free&go&n=0&nolaunch&mute&seed=7',init_script='globalThis.__paused=true;')
    out=p.evaluate('''()=>{
      const g=__game,T=g.THREE,V=(x,y,z)=>new T.Vector3(x,y,z), P=g.player;
      P.group.position.set(50000,0,50000); P.vel.set(0,0,0);
      const c=g.spawnShip('halberd',0,V(0,0,0),V(1000,0,0),{}); g.capitalOrdnanceAI(c,0);
      c.stores.drone=6; c.dlimit=6; const ds=g.launchDrones(c,6); c.stores.drone=0;
      for(let i=0;i<4;i++) g.spawnShip('darter',1,V(-1300,0,(i-1.5)*120),V(0,0,0),{});
      g.spawnShip('darter',1,V(1000000,0,0),V(1000000,0,-1),{}); // suppress free-flight replacement waves
      let max=0;
      for(let i=0;i<600;i++){
        c.group.position.set(28*i*.1,0,0); c.vel.set(28,0,0); g.update(.1);
        for(const d of ds) if(d.alive) max=Math.max(max,d.group.position.distanceTo(c.group.position));
      }
      const d=ds.find(d=>d.alive); if(!d) return {max:Math.round(max),survivor:false};
      d.group.position.copy(c.group.position).add(V(-2100,0,0)); d.dOrder='fighters'; d.target=null; d.dLeashReturning=false;
      g.update(.05);
      return {max:Math.round(max),survivor:true,returning:d.dLeashReturning && d.target===null};
    }''')
    print(out)
    assert out['survivor'] and out['returning'] and out['max']<=2000,out
    assert_no_console_errors(r)
