# 2026-10-22 features: power allocation, afterburner pool (FROGG vs human), LOD, Newtonian vector overlay, energy gauge. Screenshots in /tmp/gs_shots.
from lib import *
import sys
with Runner() as R:
    pg=R.page(1280,720,'?free&go'); pg.wait_for_timeout(1500)
    print('power', pg.evaluate("""()=>{const g=__game,p=g.player;__paused=true;const o=[];
      for(const k of ['w','w','w','e','s']) {g.powerShift(p,k);o.push(JSON.stringify(p.pw))}
      const f=[g.pwF(p,'w'),g.pwF(p,'s'),g.pwF(p,'e')];g.powerKey(p,null);o.push(JSON.stringify(p.pw));return [o,f]}"""))
    print('ab', pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;const out={};
      g.ships.filter(s=>s!==g.player).forEach(s=>s.alive=false);
      for(const id of ['kestrel','leaper','darter']){const s=g.spawnShip(id,id==='kestrel'?0:1,new T.Vector3(0,0,50000),new T.Vector3(0,0,0),{});
        s.team=2;let t=0;const fuel0=s.abFuel;let vmax=0;
        while(t<10){g.flightModels.arcade(s,{throttle:1,ab:true},0.05);s.vel.length()>vmax&&(vmax=s.vel.length());t+=0.05}
        const f10=s.abFuel;while(t<20){g.flightModels.arcade(s,{throttle:1,ab:false},0.05);t+=0.05}
        out[id]={max:s.def.abMax,fuel0,after10s:+f10.toFixed(1),after10sRest:+s.abFuel.toFixed(1),vmax:+vmax.toFixed(0),cruise:s.def.maxSpeed,lock:s.abLock}}
      return out}"""))
    # LOD: put a corvette far away and near, count instances
    print('lod', pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
      const c=g.spawnShip('gulper',1,new T.Vector3(0,0,-600).add(P.group.position),null,{});
      const n=s=>s.vox.body.count+s.vox.glow.count;const near=n(c);
      c.group.position.copy(P.group.position).add(new T.Vector3(0,0,-9000));g.camera.position.copy(P.group.position);
      for(let i=0;i<40;i++)g.update(0.05);const far=n(c);
      c.group.position.copy(P.group.position).add(new T.Vector3(0,0,-600));for(let i=0;i<40;i++)g.update(0.05);
      return {near,far,back:n(c),drop:c.lodDrop,level:g.lodLevel}}"""))
    pg.evaluate("()=>{const g=__game;g.ships.filter(s=>s!==g.player).forEach(s=>s.alive=false);__paused=false}")
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const g=__game;__paused=true;const T=g.THREE,P=g.player;P.vel.set(60,25,-80);g.spawnShip('leaper',1,P.group.position.clone().add(new T.Vector3(150,40,-700)),null,{});for(let i=0;i<5;i++)g.update(0.05);g.updateHud()}")
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/gs_shots/desktop_newton.png')
    pg.keyboard.press('Digit4'); pg.keyboard.press('Digit4'); pg.wait_for_timeout(200); pg.evaluate("()=>__game.updateHud()"); pg.screenshot(path='/tmp/gs_shots/desktop_power.png')
    pg.close()
    pt=R.page(844,390,'?free&go&touch',touch=True); pt.wait_for_timeout(1500)
    pt.evaluate("()=>{const g=__game;g.ships.filter(s=>s!==g.player).forEach(s=>s.alive=false);__paused=true;g.update(0.05);g.updateHud()}")
    pt.wait_for_timeout(300); pt.screenshot(path='/tmp/gs_shots/phone.png')
    print('ERRS',R.errs[:6])
