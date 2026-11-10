# Owner playtest 2026-11-10: died in Prologue 2 (15 fighters, waves 3 s apart, all wingmen lost). Now 10 fighters, a regroup pause, merc skill 2.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(1280, 720, '?campaign=prologue&m=2&go&q=low&seed=3', init_script="localStorage.setItem('gs_tutorial_p01','done')")
    pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game;__paused=true;const seen={},waves=[];let last=null;
      const kill=grp=>g.ships.filter(s=>s.team===1&&s.grp===grp&&s.alive).forEach(s=>g.killShip(s));
      for(let i=0;i<2400&&!g.game.mstate.ended;i++){g.update(0.05);
        for(const s of g.ships) if(s.team===1&&s.grp&&!seen[s.id||s.uuid||s.group.id]){seen[s.id||s.uuid||s.group.id]=1;
          if(last!==s.grp){waves.push({grp:s.grp,t:+g.game.mstate.t.toFixed(1),n:0,skill:[]});last=s.grp;} const w=waves[waves.length-1];w.n++;w.skill.push(s.skill);}
        const w=waves[waves.length-1]; if(w&&g.game.mstate.t>w.t+2) kill(w.grp);}
      return {waves,ended:g.game.mstate.ended,result:g.game.mstate.result,players:g.ships.filter(s=>s.team===1).length}}""")
    for w in r['waves']: print(' ', w)
    n = sum(w['n'] for w in r['waves'])
    check('three waves, 10 fighters in total on normal', len(r['waves']) == 3 and n == 10, n)
    gaps = [round(b['t'] - a['t'], 1) for a, b in zip(r['waves'], r['waves'][1:])]
    check('each wave arrives at least 6 sim-s (about 16 s real) after the previous one was cleared', all(g >= 2 + 6 - 0.2 for g in gaps), gaps)
    check('picket and strike pilots fly at skill 2', all(s == 2 for w in r['waves'] if w['grp'] in ('A', 'C') for s in w['skill']), [w['skill'] for w in r['waves']])
    check('the mission still ends in a win when the waves are cleared', r['ended'] and r['result'] == 'win', r['result'])
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
print('P02 OK' if ok else 'P02 FAIL'); raise SystemExit(0 if ok else 1)
