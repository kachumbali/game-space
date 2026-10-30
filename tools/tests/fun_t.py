# v0.2 fun update tests. Usage: python3 fun_t.py [feel|shot|loot|survival|missions ...]; screenshots in /tmp/gs_shots (git-ignored).
from lib import *
import sys, os
which = sys.argv[1:] or ['feel', 'shot']
os.makedirs('/tmp/gs_shots', exist_ok=True)

def feel(R):
    pg = R.page(1280, 720, '?free&go&q=low'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player,J=g.juice;__paused=true;
      g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const mk=(id,d)=>{const e=g.spawnShip(id,1,P.group.position.clone().addScaledVector(f,d),null,{skill:1});e.vel.set(0,0,0);e.ai.hold=true;return e};
      const out={};
      const a=mk('darter',300);                                   // 1. our hit on an enemy: a marker
      g.hitSrc=P;g.hitKind='gun';g.applyHit(a,new T.Vector3(0,0,-2),2,a.group.position.clone(),'kin');
      out.marks=J.marks.map(m=>m.kind);
      const b=mk('leaper',400);b.group.position.copy(P.group.position).addScaledVector(new T.Vector3(1,0,0).applyQuaternion(P.group.quaternion),300);
      g.hitSrc=b;g.hitKind='gun';g.applyHit(P,new T.Vector3(1,0,0),5,P.group.position.clone(),'kin');   // 2. we get hit from the right: an arc
      out.arcs=J.arcs.map(x=>+x.ang.toFixed(2));
      const kill=(e,kind)=>{e.lastAttacker=P;e.lastKind=kind||'gun';g.killShip(e)};                      // 3. kills: chain, score, banners, hit-stop
      const c=[mk('darter',200),mk('leaper',220),mk('spitter',240)];
      kill(c[0]);kill(c[1],'missile');kill(c[2]);
      out.chain=J.chain;out.mult=J.mult;out.kills=J.kills;out.score=J.score;out.bonus=J.bonus;out.missileKills=J.missileKills;
      out.banners=J.banners.map(x=>x.text+' | '+x.sub);out.hitStop=+J.hitStop.toFixed(2);
      out.medals=g.juiceMedals(50,60,J.kills).map(m=>m[0]);
      for(let i=0;i<150;i++)g.update(0.05);                       // 4. the chain expires
      out.chainAfter=J.chain;
      return out}""")
    for k, v in r.items(): print(' ', k, v)
    ok = ({'hull', 'shield', 'armor'} & set(r['marks'])) and len(r['arcs']) == 1 and abs(r['arcs'][0]) < 0.6 and r['chain'] == 3 and r['kills'] == 3 \
        and r['mult'] == 2 and r['score'] > 300 and r['hitStop'] > 0 and r['chainAfter'] == 0 and r['missileKills'] == 1
    print('FEEL', 'OK' if ok else 'FAIL', 'errs', R.errs[:3]); pg.close()
    return bool(ok)

def shot(R):
    for w, h, tag, q in ((1280, 720, 'desk', '?free&go&q=mid'), (844, 390, 'phone', '?free&go&touch&q=low')):
        pg = R.page(w, h, q, touch=(tag == 'phone')); pg.wait_for_timeout(1500)
        pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player,J=g.juice;__paused=true;g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
          const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
          const e=g.spawnShip('darter',1,P.group.position.clone().addScaledVector(f,260),null,{});e.vel.set(0,0,0);e.ai.hold=true;
          g.update(0.05);const t=g.time;
          J.chain=4;J.mult=2.5;J.chainT=t+4;
          J.arcs.push({t:t,ang:-0.2,out:'hull',big:1},{t:t,ang:2.6,out:'shield',big:0.5});
          J.marks.push({t:t,kind:'sub'});
          J.banners.push({t:t,text:'+450  FROGG DARTER',sub:'QUAD KILL · MISSILE · POINT BLANK',col:'#c8fff0',big:false},{t:t,text:'ENGINE L DESTROYED',sub:'+40',col:'#ffb060',big:false});
          g.updateHud();}""")
        pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/gs_shots/fun_feel_{tag}.png'); pg.close()
    return True

with Runner() as R:
    ok = True
    for name in which:
        ok = globals()[name](R) and ok
    print('ALL', 'OK' if ok else 'FAIL')
