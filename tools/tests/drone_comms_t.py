from lib import Runner, assert_no_console_errors
with Runner() as r:
    p=r.page(1280,720,'?free&go&n=0&nolaunch&mute')
    result=p.evaluate('''() => {
      const g=__game, P=g.player, V=g.THREE.Vector3; __paused=true;
      P.stores.drone=2; P.dlimit=2; const start=g.comms.length;
      const ds=g.launchDrones(P,2); const launch=g.comms.slice(start).map(x=>x.text);
      g.killShip(ds[0]); const loss=g.comms.at(-1).text;
      ds[1].structure=3; ds[1].comps[0].hp=1; ds[1].ammo[Object.keys(ds[1].ammo)[0]]=7; ds[1].stores.ir=0;
      g.droneOrder(P,'return'); const recall=g.comms.at(-1).text;
      ds[1].group.position.copy(P.group.position);
      g.update(.05); const recovered=g.comms.at(-1).text, stock=P.stores.drone;
      const relaunched=g.launchDrones(P,1)[0];
      const preserved=relaunched.structure===3 && relaunched.comps[0].hp===1 && Object.values(relaunched.ammo)[0]===7 && relaunched.stores.ir===0;
      const E=g.spawnShip('exeter',1,new V(50000,0,0),new V(0,0,0),{}); E.stores.drone=1;   // corvettes no longer carry drones (owner 2026-11-12)
      const before=JSON.stringify(g.comms); const enemy=g.launchDrones(E,1)[0];
      g.update(.05); const enemySilent=JSON.stringify(g.comms)===before;
      enemy.group.position.copy(P.group.position).add(new V(0,0,-1000));
      g.update(.05); const warning=g.comms.at(-1).text;
      const wing=g.spawnShip('falchion',0,new V(1000,0,0),new V(1000,0,-1000),{callsign:'TEST-2'});
      g.spawnShip('darter',1,new V(1000,0,-600),new V(1000,0,0),{});
      g.update(.05); const wingDrones=g.dronesOf(wing).length;
      const wingChatter=g.comms.some(m=>m.from==='TEST-2' && m.text==='Launching drones');
      g.comms.length=0; for(const d of [...g.dronesOf(wing)]) g.killShip(d);
      const lossLimited=g.comms.filter(m=>m.from==='TEST-2' && m.text==='Drone lost').length===1 && g.comms.some(m=>m.text==='All drones recovered/expended');
      const carrier=g.makeShip('exeter',0,new V(0,0,30000),new g.THREE.Quaternion(),{player:true,callsign:'TEST'});
      const playerCarrier={stock:carrier.stores.drone,limit:g.droneLimitOf(carrier),launched:g.launchDrones(carrier,99).length};
      return {launch,recall,loss,recovered,stock,preserved,enemySilent,warning,wingDrones,wingChatter,lossLimited,playerCarrier};
    }''')
    print(result)
    assert result['launch']==['Launching drones','2 drones away']
    assert result['recall']=='Recalling drones' and result['loss']=='Drone lost'
    assert result['recovered']=='All drones recovered/expended' and result['stock']==1
    assert result['wingDrones']==2 and result['wingChatter'] and result['lossLimited']
    assert result['playerCarrier']=={'stock':6,'limit':3,'launched':3}   # frigate as the player carrier (corvettes carry no drones, owner 2026-11-12)
    assert result['preserved'] and result['enemySilent'] and result['warning']=='Enemy drones launched'
    assert_no_console_errors(r)
