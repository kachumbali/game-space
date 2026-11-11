# Owner decision 2026-11-11 (option B): Prologue pilots lost in a sortie that is flown again come back, also after a reload or a trip through
# the menu; they stay lost once the mission is won or another mission is started.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
HAWK = "()=>{const s=__game.rosterLoad();const p=Object.values(s.pools).flat().find(x=>x.callsign==='HAWK');return p?p.status:null}"
KILL = "()=>{const g=__game;const w=g.ships.find(s=>s.callsign==='HAWK');g.rosterMarkPilot(w.pilot||w.id,'KIA');return w.pilot||w.id}"
with Runner() as R:
    ctx = R.b.new_context(viewport={'width': 1280, 'height': 720}); ctx.add_init_script("localStorage.setItem('gs_tutorial_p01','done')")
    def load(q):
        pg = ctx.new_page(); pg.goto('http://localhost:' + PORT + '/index.html' + q, timeout=120000); pg.wait_for_function('window.__game!==undefined', timeout=120000); pg.wait_for_timeout(1200); return pg
    pg = load('?campaign=prologue&m=2&go&q=low')
    check('HAWK starts active', pg.evaluate(HAWK) == 'ACTIVE', pg.evaluate(HAWK))
    pg.evaluate(KILL); pg.evaluate("()=>__game.endMission('lose','test')")
    check('HAWK is KIA after the lost sortie', pg.evaluate(HAWK) == 'KIA', pg.evaluate(HAWK))
    pg.close()
    pg = load('?campaign=prologue&m=2&go&q=low')              # a reload, then the same mission again
    check('re-flying the mission after a reload brings HAWK back', pg.evaluate(HAWK) == 'ACTIVE', pg.evaluate(HAWK))
    check('and HAWK is in the wing', pg.evaluate("()=>__game.ships.some(s=>s.callsign==='HAWK'&&s.alive)"))
    pg.evaluate(KILL); pg.evaluate("()=>__game.endMission('win')")
    pg.close()
    pg = load('?campaign=prologue&m=3&go&q=low')              # moving on after a win
    check('a loss in a mission that was won is permanent', pg.evaluate(HAWK) == 'KIA', pg.evaluate(HAWK))
    pg.close()
    pg = load('?campaign=prologue&m=2&go&q=low')              # replaying the won mission does not resurrect anyone
    check('replaying the won mission does not bring HAWK back', pg.evaluate(HAWK) == 'KIA', pg.evaluate(HAWK))
    pg.close()
print('PROLOGUE RETRY OK' if ok else 'PROLOGUE RETRY FAIL'); raise SystemExit(0 if ok else 1)
