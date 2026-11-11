#!/usr/bin/env python3
"""Ordnance stations (docs/ORDNANCE_MANIFEST.md): briefing lists each hull's stations, a tap cycles allowed ordnance then EMPTY, LAUNCH resolves
the selection to player.stores, defaults equal the authored stores, the AI is untouched, nothing exceeds station capacity, touch tap works."""
from lib import *
FAILS = 0
def check(name, ok, info=''):
    global FAILS
    print(('PASS ' if ok else 'FAIL ') + name, info, flush=True)
    if not ok: FAILS += 1
with Runner() as R:
    pg = R.page(844, 390, '?seed=1&nobloom')
    pg.wait_for_timeout(800)
    pg.evaluate("()=>__game.startMission(__game.MISSIONS[0])"); pg.wait_for_timeout(500)
    r = pg.evaluate("""()=>{const g=__game; return {stations:g.ordnanceStations('kestrel').map(s=>s.id+':'+s.size+':'+s.cap), brief:document.getElementById('brief').innerText}}""")
    # owner 2026-11-12: the Kestrel no longer carries a torpedo (its legacy L1 station is gone); the Falchion keeps its legacy fit
    check('briefing shows Kestrel stations', r['stations'] == ['S1:S:4', 'M1:M:2'] and 'ORDNANCE STATIONS' in r['brief'], str(r['stations']))
    check('legacy torpedo fit still defined for the Falchion', any(s.get('legacy') for s in pg.evaluate("()=>__game.ordnanceStations('falchion')")))
    # default launch equals authored stores
    d = pg.evaluate("""()=>{const g=__game; g.ordnanceApply(g.player); return JSON.stringify(g.player.stores)}""")
    check('default selection reproduces authored stores (no torpedo)', '"ir":4' in d and '"rf":2' in d and '"torp"' not in d, d)
    # tap M1: rf -> ir, then rf stores 0 and ir 6 after launch
    pg.locator('[data-station="M1"]').click(); pg.wait_for_timeout(200)
    t = pg.evaluate("""()=>{const g=__game; g.ordnanceApply(g.player); const s=g.player.stores; return {ir:s.ir, rf:s.rf, torp:s.torp, text:document.getElementById('brief').innerText}}""")
    check('M1 tap swaps RADAR missiles to IR (6 IR, 0 RF)', t['ir'] == 6 and t['rf'] == 0 and 'SWAPPED' in t['text'], str(t)[:200])
    pg.locator('[data-station="M1"]').click(); pg.wait_for_timeout(200)
    t = pg.evaluate("""()=>{const g=__game; g.ordnanceApply(g.player); const s=g.player.stores; return {ir:s.ir, rf:s.rf}}""")
    check('second tap leaves M1 EMPTY (4 IR, 0 RF)', t['ir'] == 4 and t['rf'] == 0, str(t))
    # no selection exceeds capacity, for every hull with stations
    c = pg.evaluate("""()=>{const g=__game, bad=[]; for (const id of Object.keys(g.SHIPS)) { const hp=g.ordnanceStations(id); if(!hp.length) continue;
        const tot=g.ordnanceTotals(id); for (const [w,n] of Object.entries(tot)) { const cap=hp.filter(s=>s.allow.includes(w)).reduce((a,s)=>a+s.cap,0); if (n>cap) bad.push(id+':'+w); } } return bad}""")
    check('no hull exceeds its station capacity', c == [], str(c))
    # AI keeps the authored default
    a = pg.evaluate("""()=>{const g=__game; return g.ships.filter(s=>s.team===1&&s.def.stores&&s.def.stores.ir!==undefined).every(s=>s.stores.ir===s.def.stores.ir)}""")
    check('AI ships keep authored stores', a)
    # follow-up: launches come from the selected station; mission stock caps block LAUNCH
    pg.evaluate("()=>__game.startMission(__game.MISSIONS[0])"); pg.wait_for_timeout(400)
    L = pg.evaluate("""()=>{const g=__game,T=g.THREE,p=g.player; g.ordnanceApply(p);
      const st=p.ordnanceLoad.find(x=>x.wid==='ir'); const want=p.group.localToWorld(new T.Vector3(...st.pos));
      p.lock.p=0; const n0=g.missiles.length; const ok=g.launchMissile(p,'ir');
      const m=g.missiles[g.missiles.length-1]; return {ok, added:g.missiles.length-n0, d:m?m.pos.distanceTo(want):999, left:st.remaining}}""")
    check('IR launch spawns at the S1 station position', L['ok'] and L['added'] == 1 and L['d'] < 1.5, str(L))
    pg.evaluate("()=>{const g=__game; g.game.mission.ordnanceStock={ir:3}; g.startMission(g.game.mission);}"); pg.wait_for_timeout(300)
    pg.locator('#bgo').click(); pg.wait_for_timeout(300)
    blocked = pg.evaluate("()=>({state:__game.state,text:document.getElementById('brief').innerText})")
    check('stock cap 3 IR blocks LAUNCH with 4 loaded', blocked['state'] == 'brief' and 'MISSION' in blocked['text'].upper(), blocked['state'])
    pg.evaluate("()=>{const g=__game; g.game.mission.ordnanceStock={ir:4}; g.startMission(g.game.mission);}"); pg.wait_for_timeout(300)
    pg.locator('#bgo').click(); pg.wait_for_timeout(300)
    check('stock cap 4 IR allows LAUNCH', pg.evaluate("()=>__game.state") == 'play')
    check('help overlay mentions briefing ordnance', 'BRIEFING ORDNANCE' in pg.evaluate("()=>document.getElementById('help').innerText"))
    check('no console errors', not R.errs, str(R.errs[:3]))
print('FAILURES', FAILS)
raise SystemExit(1 if FAILS else 0)
