# v0.2.1 SIM (TIE Fighter style) flight option: throttle response, skid, match speed, F cycle + persistence, AI follows the mode, purist, UI. Screenshot in /tmp/gs_shots.
from lib import *
import os
os.makedirs('/tmp/gs_shots', exist_ok=True)
ok = True
def check(name, cond, info=''):
    global ok
    print(('PASS ' if cond else 'FAIL ') + name, info)
    ok = ok and bool(cond)
with Runner() as R:
    pg = R.page(1280, 720, '?free&go&q=low'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game,P=g.player,T=g.THREE;__paused=true;g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
      const out={};
      const run=(mode,sec)=>{g.fmSet(mode,true);P.group.quaternion.identity();P.vel.set(0,0,0);P.throttle=1;const v=[];let t=0;
        while(t<sec){g.flightModels[mode](P,{throttle:1,thrust:1,ab:false},0.05);t+=0.05;if(Math.abs(t-1)<1e-6||Math.abs(t-6)<0.026)v.push(+P.vel.length().toFixed(1))}return v};
      out.arcade=run('arcade',6.01);out.sim=run('sim',6.01);out.vmax=P.def.maxSpeed;
      // skid: cruise at 100 m/s then snap the nose 90 degrees
      g.fmSet('sim',true);P.group.quaternion.identity();P.vel.set(0,0,-100);P.throttle=100/P.def.maxSpeed;
      P.group.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);
      const ang=()=>{const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);return +(P.vel.angleTo(f)*57.3).toFixed(1)};
      const sk=[];let t=0;const marks=[0.3,0.7,1.0,2.0];let mi=0;
      while(t<2.01){g.flightModels.sim(P,{throttle:P.throttle,ab:false},0.05);t+=0.05;if(mi<marks.length&&t>=marks[mi]-1e-6){sk.push([marks[mi],ang(),+P.vel.length().toFixed(0)]);mi++}}
      out.skid=sk;
      return out}""")
    print(' ', r)
    check('SIM accelerates at real acceleration (slower than arcade at 1 s)', r['sim'][0] < r['arcade'][0] * 0.8, (r['sim'][0], r['arcade'][0]))
    check('SIM reaches the throttle speed eventually', r['sim'][1] > r['vmax'] * 0.9, (r['sim'][1], r['vmax']))
    check('SIM skids after a 90 degree snap turn', r['skid'][0][1] > 35, r['skid'][0])
    check('SIM velocity catches up with the nose', r['skid'][2][1] < 1, r['skid'][2])
    check('SIM keeps its speed through the turn', abs(r['skid'][3][2] - 100) < 8, r['skid'][3])
    # match speed, F cycle, persistence, AI follows
    r = pg.evaluate("""()=>{const g=__game,P=g.player,T=g.THREE;g.fmSet('arcade',true);
      const e=g.spawnShip('darter',1,P.group.position.clone().add(new T.Vector3(0,0,-500)),null,{});e.vel.set(0,0,-80);e.ai.hold=true;g.target=e;
      g.matchSpeed(P);const thr=P.throttle*P.def.maxSpeed*g.compFactor(P,'engine');
      return {matched:+(P.throttle*P.def.maxSpeed).toFixed(0)}}""")
    check('match speed sets the throttle to the target speed (80 m/s)', abs(r['matched'] - 80) < 3, r)
    pg.keyboard.press('KeyF'); r1 = pg.evaluate("()=>[__game.fmLoad(),localStorage.getItem('gs_fm')]")
    pg.keyboard.press('KeyF'); r2 = pg.evaluate("()=>__game.fmLoad()"); pg.keyboard.press('KeyF'); r3 = pg.evaluate("()=>__game.fmLoad()")
    check('F cycles arcade -> sim -> newton -> arcade and persists', r1 == ['sim', 'sim'] and r2 == 'newton' and r3 == 'arcade', (r1, r2, r3))
    r = pg.evaluate("""()=>{const g=__game,P=g.player,T=g.THREE;const a=g.spawnShip('leaper',1,P.group.position.clone().add(new T.Vector3(0,0,-900)),null,{});a.ai.hold=true;
      const before=a.fm;g.fmSet('sim',true);const after=a.fm;const b=g.spawnShip('darter',1,P.group.position.clone().add(new T.Vector3(0,0,-950)),null,{});
      const newShip=b.fm;g.fmSet('arcade',true);return {before,after,newShip,back:a.fm,newBack:b.fm}}""")
    check('AI ships follow the SIM mode (existing and new), and go back', r == {'before': 'arcade', 'after': 'sim', 'newShip': 'sim', 'back': 'arcade', 'newBack': 'arcade'}, r)
    # sim dogfight sanity: both sides fly SIM, no NaN, fight resolves or stays finite
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player;g.fmSet('sim',true);
      for(const s of g.ships){if(s!==P){s.alive=false;s.dying=0;s.group.visible=false;}}g.ships.splice(0,g.ships.length,P);P.group.position.set(0,0,60000);P.team=2;
      const A=[0,1,2,3].map(i=>g.spawnShip('kestrel',0,new T.Vector3(-900+i*40,i*30,0),new T.Vector3(900,0,0),{skill:3}));
      const B=[0,1,2,3,4,5].map(i=>g.spawnShip(i%2?'darter':'leaper',1,new T.Vector3(900+i*40,i*30-60,i*20),new T.Vector3(-900,0,0),{skill:2}));
      let t=0,bad=0;while(t<120&&A.some(s=>s.alive)&&B.some(s=>s.alive)){g.update(0.05);t+=0.05;for(const s of [...A,...B])if(!Number.isFinite(s.vel.length())||!Number.isFinite(s.group.position.x))bad++}
      const fms=[...new Set([...A,...B].map(s=>s.fm))];g.fmSet('arcade',true);return {t:Math.round(t),a:A.filter(s=>s.alive).length,b:B.filter(s=>s.alive).length,bad,fms}}""")
    check('SIM dogfight runs finite (4 Kestrels vs 6 FROGGs, all flying SIM)', r['bad'] == 0 and r['fms'] == ['sim'], r)
    # purist: nothing shown or dropped
    r = pg.evaluate("""()=>{const g=__game,P=g.player,T=g.THREE,J=g.juice;g.AOPT.purist=true;g.lootClear();J.marks.length=J.banners.length=J.arcs.length=0;const k0=J.kills,s0=J.score;
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      for(let i=0;i<7;i++){const e=g.spawnShip('darter',1,P.group.position.clone().addScaledVector(f,300),null,{});e.ai.hold=true;e.lastAttacker=P;g.hitSrc=P;g.hitKind='gun';g.applyHit(e,new T.Vector3(0,0,-2),2,e.group.position.clone(),'kin');g.killShip(e)}
      g.hitSrc=g.ships[0];g.applyHit(P,new T.Vector3(1,0,0),5,P.group.position.clone(),'kin');
      const out={marks:J.marks.length,banners:J.banners.length,arcs:J.arcs.length,pods:g.lootPods.length,kills:J.kills-k0,scored:J.score>s0,hitStop:J.hitStop};g.AOPT.purist=false;return out}""")
    check('purist: no markers, banners, arcs, pods or hit-stop, but the score is kept', r['marks'] == 0 and r['banners'] == 0 and r['arcs'] == 0 and r['pods'] == 0 and r['kills'] == 7 and r['scored'] and r['hitStop'] == 0, r)
    pg.evaluate("()=>{__game.fmSet('sim',true);__game.updateHud()}"); pg.wait_for_timeout(200)
    check('HUD names the flight model', 'SIM' in pg.evaluate("()=>document.getElementById('hudtxt').textContent"))
    pg.screenshot(path='/tmp/gs_shots/sim_hud.png')
    pg.keyboard.press('KeyO'); pg.wait_for_timeout(300)
    r = pg.evaluate("()=>({fm:[...document.querySelectorAll('#o_fm option')].map(o=>o.value),sel:document.getElementById('o_fm').value,pur:!!document.getElementById('o_pur')})")
    check('options: flight model select + purist checkbox', r['fm'] == ['arcade', 'sim', 'newton'] and r['sel'] == 'sim' and r['pur'], r)
    pg.screenshot(path='/tmp/gs_shots/sim_options.png'); pg.close()
    # briefing + skirmish + gauntlet selectors
    pg = R.page(1280, 720, '?m=1&q=low'); pg.wait_for_timeout(1200)
    r = pg.evaluate("()=>[...document.querySelectorAll('[data-fm]')].map(b=>b.dataset.fm+(b.classList.contains('on')?'*':''))")
    check('briefing has the flight model row (current marked)', r == ['arcade*', 'sim', 'newton'], r)
    pg.click('[data-fm="sim"]'); pg.wait_for_timeout(500)
    check('briefing click sets the preference and re-marks it', pg.evaluate("()=>[__game.fmLoad(),document.querySelector('[data-fm].on').dataset.fm]") == ['sim', 'sim'])
    pg.close()
    pg = R.page(1280, 720, '?q=low'); pg.wait_for_timeout(1200)
    pg.click('.mi[data-a="skirmish"]'); pg.wait_for_timeout(300)
    r = pg.evaluate("()=>[...document.querySelectorAll('[data-k=fm]')].map(b=>b.dataset.v)")
    check('skirmish setup offers arcade / sim / newton', r == ['arcade', 'sim', 'newton'], r)
    pg.click('[data-k=fm][data-v=sim]'); pg.wait_for_timeout(200); pg.click('#sk_go'); pg.wait_for_timeout(1500)
    check('skirmish launches in SIM with SIM AI', pg.evaluate("()=>[__game.game.sk.fm,[...new Set(__game.ships.filter(s=>s.team===1).map(s=>s.fm))].join()]") == ['sim', 'sim'])
    pg.close()
    check('no console errors', not R.errs, R.errs[:3])
print('SIM', 'OK' if ok else 'FAIL')
