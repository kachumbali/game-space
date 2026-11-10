# Owner decisions 2026-11-10 (D14-D16): the player's ship survives one missile hit taken at full shields (AI fighters still die to one), missiles
# outrun an afterburning Merlin, AI wingmen hold fire with the player near their gun line, Prologue 3 is two smaller waves with a regroup pause.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(1280, 720, '?free&go&q=low&seed=5'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE,p=g.player;__paused=true;
      const hit=(s)=>{const W=g.WEAPONS.ir;g.blastAt(s.group.position.clone(),W,s.team===1?0:1,null,s);return {alive:s.alive&&!s.dying,hull:Math.round(100*s.structure/s.def.structure)}};
      const a=hit(p);
      const e=g.spawnShip('kestrel',1,new T.Vector3(500,0,0),new T.Vector3(0,0,0),{});const b=hit(e);
      p.structure=p.def.structure;p.shield.fore=p.shield.aft=1;const c=hit(p);
      return {player:a,ai:b,lowShield:c,vmax:g.WEAPONS.ir.vmax,merlinAB:g.SHIPS.merlin.maxSpeed*(g.TUNE.afterburner.human.spd||1.8)}}""")
    print(' ', r)
    check('player at full shields survives one SW-9 contact hit', r['player']['alive'] and r['player']['hull'] >= 15, r['player'])
    check('an AI Kestrel still dies to one', not r['ai']['alive'], r['ai'])
    check('the guard does not apply with shields down', not r['lowShield']['alive'] or r['lowShield']['hull'] < 15, r['lowShield'])
    check('SW-9 top speed clears an afterburning Merlin by 25 %', r['vmax'] >= 1.25 * r['merlinAB'], f"{r['vmax']} vs {r['merlinAB']:.0f}")
    f = pg.evaluate("""()=>{const g=__game,T=g.THREE,p=g.player;
      const w=g.spawnShip('kestrel',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-1),{});w.group.position.set(0,0,0);w.group.lookAt(0,0,-1);w.group.rotateY(Math.PI);w.group.updateMatrixWorld(true);
      p.group.position.set(18,0,-400);return [g.friendlyInLine(w,800), (p.group.position.set(80,0,-400), g.friendlyInLine(w,800))]}""")
    check('a wingman holds fire with the player 2.6 degrees off its gun line at 400 m, fires at 11 degrees', f == [True, False], f)
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
with Runner() as R:
    pg = R.page(1280, 720, '?campaign=prologue&m=3&go&q=low&seed=3', init_script="localStorage.setItem('gs_tutorial_p01','done')"); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game;__paused=true;const seen={},waves=[];let last=null;
      for(let i=0;i<2400&&!g.game.mstate.ended;i++){g.update(0.05);
        for(const s of g.ships) if(s.team===1&&s.grp&&!seen[s.group.id]){seen[s.group.id]=1;if(last!==s.grp){waves.push({grp:s.grp,t:+g.game.mstate.t.toFixed(1),n:0,skill:[]});last=s.grp;}const w=waves[waves.length-1];w.n++;w.skill.push(s.skill);}
        const w=waves[waves.length-1]; if(w&&g.game.mstate.t>w.t+2) g.ships.filter(s=>s.team===1&&s.grp===w.grp&&s.alive).forEach(s=>g.killShip(s));}
      return {waves,result:g.game.mstate.result}}""")
    for w in r['waves']: print(' ', w)
    check('Prologue 3: two waves of 4 (was 6 + 6)', [w['n'] for w in r['waves']] == [4, 4], [w['n'] for w in r['waves']])
    check('Prologue 3: a regroup pause before the second wave', len(r['waves']) == 2 and r['waves'][1]['t'] - r['waves'][0]['t'] >= 7.8, r['waves'])
    check('Prologue 3 still ends in a win', r['result'] == 'win', r['result'])
print('OWNER D OK' if ok else 'OWNER D FAIL'); raise SystemExit(0 if ok else 1)
