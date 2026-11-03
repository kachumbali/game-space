from lib import Runner, assert_no_console_errors
with Runner() as r:
    p=r.page(1280,720,'?free&go&n=0&nolaunch')
    result=p.evaluate('''() => {
      const g=__game, P=g.player, V=g.THREE.Vector3; g.__paused=true;
      P.stores.drone=2; P.dlimit=2; const start=g.comms.length;
      const ds=g.launchDrones(P,2); const launch=g.comms.slice(start).map(x=>x.text);
      g.droneOrder(P,'return'); const recall=g.comms.at(-1).text;
      g.killShip(ds[0]); const loss=g.comms.at(-1).text;
      const E=g.spawnShip('halberd',1,new V(50000,0,0),new V(0,0,0),{}); E.stores.drone=1;
      const before=JSON.stringify(g.comms); g.launchDrones(E,1);
      return {launch,recall,loss,enemySilent:JSON.stringify(g.comms)===before};
    }''')
    print(result)
    assert result['launch']==['Launching drones','2 drones away']
    assert result['recall']=='Recalling drones' and result['loss']=='Drone lost' and result['enemySilent']
    assert_no_console_errors(r)
