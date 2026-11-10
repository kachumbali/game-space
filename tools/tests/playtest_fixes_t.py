# Owner hand-play 2026-11-10 (four COPY REPORT texts): power bars hidden in basic mode although the keys work, wingmen named PILOT-02/03 instead of
# HAWK / SPARROW, report hull in raw points, subsystems lost forgotten by the time the report is built.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(1280, 720, '?campaign=prologue&m=1&go&q=low', init_script="localStorage.setItem('gs_tutorial_p01','done');localStorage.removeItem('gs_taught_power')")
    pg.wait_for_timeout(1500)
    vis = lambda: pg.evaluate("()=>getComputedStyle(document.getElementById('ets')).display!=='none'")
    check('basic mode hides the power bars before they are used', not vis())
    pg.keyboard.press('Digit6'); pg.wait_for_timeout(300)
    check('pressing a power key shows the power bars', vis())
    check('and remembers it', pg.evaluate("()=>localStorage.getItem('gs_taught_power')") == '1')
    wing = pg.evaluate("()=>__game.ships.filter(s=>s.team===0&&s!==__game.player&&s.def.cls==='fighter').map(s=>s.callsign)")
    check('Prologue wingmen are HAWK and SPARROW', 'HAWK' in wing and 'SPARROW' in wing, wing)
    check('the player is MEOW', pg.evaluate("()=>__game.player.callsign") == 'MEOW', pg.evaluate("()=>__game.player.callsign"))
    r = pg.evaluate("""()=>{const g=__game,p=g.player;__paused=true;g.reportSample();
      p.structure=p.def.structure*0.4;const c=p.comps.find(c=>c.role==='radar'||/radar/i.test(c.id))||p.comps[0];c.hp=0;g.reportSample();
      c.hp=c.max;p.structure=p.def.structure;g.reportSample();return g.reportText('win')}""")
    line = [l for l in r.split('\n') if l.startswith('Lowest')][0]; lost = [l for l in r.split('\n') if l.startswith('Subsystems')][0]
    check('report shows hull as a percentage of the ship maximum', '/ 40%' in line, line)
    check('report remembers a subsystem lost earlier in the sortie', lost != 'Subsystems lost: none', lost)
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
with Runner() as R:   # an old save with the pre-rename player and generic wing
    old = "localStorage.setItem('gs_tutorial_p01','done');localStorage.setItem('gs_roster_v1',JSON.stringify({version:1,player:{id:'player',callsign:'ECHO',name:'X'},pools:{'prologue:halberd':[{id:'a',callsign:'PILOT-01',name:'A B',kills:3},{id:'b',callsign:'PILOT-02',name:'C D'}]},legacyImported:true}))"
    pg = R.page(1280, 720, '?campaign=prologue&m=1&go&q=low', init_script=old); pg.wait_for_timeout(1500)
    r = pg.evaluate("()=>{const s=__game.rosterLoad?__game.rosterLoad():null;return s?{p:s.player.callsign,pool:(s.pools['prologue:halberd']||[]).map(x=>[x.callsign,x.kills])}:null}")
    print(' ', r)
    if r: check('an old save is migrated: player MEOW, story wing names, records kept', r['p'] == 'MEOW' and r['pool'][0] == ['HAWK', 3] and r['pool'][1][0] == 'SPARROW', r)
print('PLAYTEST FIXES OK' if ok else 'PLAYTEST FIXES FAIL'); raise SystemExit(0 if ok else 1)
