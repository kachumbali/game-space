"""P0 fixes (owner directive 2026-10-22): S1 real pause, PD proximity flak, seeded determinism.
Usage: python3 p0_t.py. Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import sys, json, math
fails = []
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name, info)
    if not ok: fails.append(name)

FLAK_JS = """
()=>{const g=__game,T=g.THREE;__paused=true;
  const P=g.player;P.group.position.set(0,0,60000);P.vel.set(0,0,0);P.team=2;
  const hal=g.spawnShip('halberd',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1),{ai:'capital'});
  hal.shield.fore=hal.shield.aft=1e6;hal.structure=1e6;hal.vel.set(0,0,0);hal.ai.hold=true;
  const toad=g.spawnShip('toad',1,new T.Vector3(0,0,-1200),new T.Vector3(0,0,1),{});
  toad.shield.fore=toad.shield.aft=1e6;toad.structure=1e6;
  toad.target=hal;toad.lock={state:'locked',tgt:hal,d:1200,p:1,tgtSince:0,wid:'tad'};
  toad.stores.tad=4;
  for(let i=0;i<4;i++){g.launchMissile(toad,'tad');}   // direct launches: no AI variance in the measurement
  g.ships.splice(g.ships.indexOf(toad),1);            // launcher out of play: what remains is PD vs torpedoes
  let t=0;const deaths=[];const seen=new Map();
  while(t<60){g.update(0.0125);t+=0.0125;
    const live=new Set();
    for(const m of g.missiles){if(m.wid!=='tad')continue;
      if(!m.__id)m.__id=1+seen.size;
      live.add(m.__id);seen.set(m.__id,Math.round(m.pos.distanceTo(hal.group.position)));}
    for(const [id,d] of [...seen])if(!live.has(id)){deaths.push(d);seen.delete(id);}   // vanished this step: died (dead missiles are filtered inside update, so identity is the only witness)
  }
  return {launched:4,intercepted:deaths.filter(d=>d>150).length,hits:deaths.filter(d=>d<=150).length,deathsAt:deaths};}
"""

with Runner() as R:
    # S1: real pause - the sim freezes in REAL time (rAF frames keep running, update stops)
    pg = R.page(320, 180, '?free&n=0&q=low')
    pg.wait_for_timeout(400)
    pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
      g.ships.splice(0,g.ships.length,P);
      P.group.position.set(0,0,60000);P.vel.set(0,0,0);P.team=2;
      const e=g.spawnShip('darter',1,new T.Vector3(0,0,-800),new T.Vector3(0,0,0),{});
      e.vel.set(0,0,60);e.ai.hold=true;
      window.__e=e;__paused=false;g.state='play';}""")
    pg.wait_for_timeout(700)
    z1 = pg.evaluate('()=>window.__e.group.position.z')
    pg.evaluate('()=>{__game.pauseToggle(); window.__z1 = window.__e.group.position.z;}')   # toggle + snapshot in one JS turn: no frame can slip between them
    paused = pg.evaluate('()=>__game.userPause')
    pg.wait_for_timeout(900)
    z2 = pg.evaluate('()=>window.__e.group.position.z')
    z1 = pg.evaluate('()=>window.__z1')
    pg.evaluate('()=>__game.pauseToggle()')
    pg.wait_for_timeout(700)
    z3 = pg.evaluate('()=>window.__e.group.position.z')
    r = {'z1': round(z1, 1), 'z2': round(z2, 1), 'z3': round(z3, 1), 'paused': paused}
    print(json.dumps(r))
    check('ships moved before the pause', abs(z1 + 800) > 15, str(r))
    check('S1: the sim froze while paused (position identical)', abs(z2 - z1) < 0.6, str(r))
    check('S1: resume unfreezes the sim (position moved again)', abs(z3 - z2) > 15, str(r))

    # P0: PD proximity flak - ST-2s get intercepted now (the acceptance run recorded 0 of 7)
    pg = R.page(320, 180, '?free&n=0&q=low')
    pg.wait_for_timeout(300)
    r = pg.evaluate(FLAK_JS)
    print(json.dumps(r))
    check('flak intercepts torpedoes in flight (0 of 7 was the recorded baseline)', r['intercepted'] >= 2, str(r))

    # P0: seeded determinism - same seed, identical draws
    a = R.page(320, 180, '?free&n=0&seed=7'); a.wait_for_timeout(300)
    b = R.page(320, 180, '?free&n=0&seed=7'); b.wait_for_timeout(300)
    ra = a.evaluate('()=>[Math.random(),Math.random(),Math.random()]')
    rb = b.evaluate('()=>[Math.random(),Math.random(),Math.random()]')
    check('same seed -> identical Math.random streams', ra == rb, f'{ra} vs {rb}')
    c = R.page(320, 180, '?free&n=0&seed=8'); c.wait_for_timeout(300)
    rc = c.evaluate('()=>Math.random()')
    check('different seed -> different stream', abs(rc - ra[0]) > 1e-9, str(rc))
    print('FAILED: ' + (str(fails) if fails else 'none'))
