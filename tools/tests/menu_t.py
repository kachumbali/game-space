# Main menu + skirmish: render at three sizes (screenshots), keyboard navigation, launch a skirmish (2 fighters + Gulper), step the sim.
# Screenshots go to $GS_SHOTS (default: current folder). Run: python3 menu_t.py
import os, sys
from lib import *
SH = os.environ.get('GS_SHOTS', '.')
os.makedirs(SH, exist_ok=True)
bad = 0
def check(name, ok, info=''):
    global bad
    print(('PASS ' if ok else 'FAIL ') + name, info, flush=True)
    if not ok: bad += 1
VIS = "id=>getComputedStyle(document.getElementById(id)).display"
FIT = "()=>{const p=document.querySelector('#brief .panel');const r=p.getBoundingClientRect();return {h:r.height,top:r.top,bot:r.bottom,vh:innerHeight,vw:innerWidth,sw:p.scrollWidth,cw:p.clientWidth,sh:p.scrollHeight,ch:p.clientHeight}}"
SIZES = [(1280, 720, False, 'desk'), (844, 390, True, 'land'), (390, 844, True, 'port')]
for w, h, touch, tag in SIZES:
    with Runner() as R:
        pg = R.page(w, h, '?touch' if touch else '', touch=touch); pg.wait_for_timeout(1500)
        check(f'{tag} menu visible', pg.evaluate(VIS, 'brief') == 'flex' and pg.locator('.mi').count() == 6, pg.evaluate("()=>[...document.querySelectorAll('.mi b')].map(b=>b.textContent)"))
        f = pg.evaluate(FIT)
        check(f'{tag} main fits', f['bot'] <= f['vh'] + 1 and f['top'] >= -1 and f['sw'] <= f['cw'] + 1, f)
        pg.screenshot(path=f'{SH}/menu_{tag}_main.png')
        pg.locator('.mi[data-a=skirmish]').click(); pg.wait_for_timeout(300)
        f = pg.evaluate(FIT)
        check(f'{tag} setup no horizontal overflow', f['sw'] <= f['cw'] + 1, f)
        pg.screenshot(path=f'{SH}/menu_{tag}_setup.png')
        pg.evaluate("()=>document.querySelector('#brief .panel').scrollTo(0,99999)"); pg.wait_for_timeout(100)
        pg.screenshot(path=f'{SH}/menu_{tag}_setup_bottom.png')
        check(f'{tag} launch button in view', pg.evaluate("()=>{const r=document.getElementById('sk_go').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}"))
        check(f'{tag} no errors', not R.errs, R.errs[:3])

# keyboard navigation + launch paths
with Runner() as R:
    pg = R.page(1280, 720, ''); pg.wait_for_timeout(1500)
    foc = "()=>document.activeElement.dataset.a"
    check('first item focused', pg.evaluate(foc) == 'campaign', pg.evaluate(foc))
    pg.keyboard.press('ArrowDown'); check('down -> gauntlet (v0.2 entry)', pg.evaluate(foc) == 'survival')
    pg.keyboard.press('ArrowDown'); check('down -> skirmish', pg.evaluate(foc) == 'skirmish')
    pg.keyboard.press('ArrowUp'); pg.keyboard.press('ArrowUp'); pg.keyboard.press('ArrowUp'); check('wraps up -> credits', pg.evaluate(foc) == 'credits')
    pg.keyboard.press('ArrowDown'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    check('enter opens mission list', pg.locator('.mi[data-a=m0]').count() == 1)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    check('esc back to main', pg.locator('.mi[data-a=skirmish]').count() == 1)
    pg.keyboard.press('o'); pg.wait_for_timeout(200)
    check('O opens options over menu', pg.evaluate(VIS, 'opts') == 'flex'); pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    check('options closed, menu still up', pg.evaluate(VIS, 'opts') == 'none' and pg.evaluate(VIS, 'brief') == 'flex')
    pg.keyboard.press('r'); pg.wait_for_timeout(100)
    check('R does not open restart dialog in menu', pg.evaluate(VIS, 'rdlg') == 'none')
    pg.locator('.mi[data-a=credits]').click(); pg.wait_for_timeout(200)
    check('credits open', pg.evaluate(VIS, 'cred') == 'flex'); pg.keyboard.press('Escape')
    # setup: preset + rows, then launch via LAUNCH
    pg.locator('.mi[data-a=skirmish]').click(); pg.wait_for_timeout(200)
    pg.locator('[data-pre=w2]').click(); pg.wait_for_timeout(100)
    pg.locator('[data-f=add]').click(); pg.wait_for_timeout(100)
    pg.select_option('select[data-t="2"]', 'gulper'); pg.wait_for_timeout(100)
    pg.locator('[data-f="wing-2"]').click(); pg.locator('[data-f="skill-4"]').click(); pg.locator('[data-f="missiles-false"]').click(); pg.locator('[data-f="range-800"]').click()
    cfg = pg.evaluate("()=>JSON.stringify(__game.skCfg)"); print('cfg', cfg)
    check('cfg rows darter/leaper/gulper', '[["darter",1],["leaper",1],["gulper",1]]' in cfg and '"wing":2' in cfg and '"skill":4' in cfg and '"missiles":false' in cfg and '"range":800' in cfg)
    pg.add_style_tag(content='#msg{display:none!important}')
    pg.locator('#sk_go').click(); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>{const g=__game;return {mode:g.game.mode,state:g.state,brief:document.getElementById('brief').style.display,ships:g.ships.map(s=>[s.def.id,s.team,s.skill])}}")
    print(r)
    ids = [s[0] for s in r['ships']]
    check('skirmish launched with player, 2 wing, 3 enemies', r['mode'] == 'skirmish' and r['state'] == 'play' and ids.count('kestrel') == 3 and ids.count('gulper') == 1 and ids.count('darter') == 1 and r['brief'] == 'none', ids)
    check('enemy missiles removed', pg.evaluate("()=>__game.ships.filter(s=>s.team===1).every(s=>['tick','tad'].every(k=>!(s.stores[k]>0)))"))
    d = pg.evaluate("()=>{const g=__game;const p=g.player;return Math.min(...g.ships.filter(s=>s.team===1).map(s=>s.group.position.distanceTo(p.group.position)))}")
    check('start range ~800 m', 700 < d < 1100, d)
    st = pg.evaluate("()=>{const g=__game;__paused=true;for(let i=0;i<600;i++)g.update(0.05);return [g.state,g.ships.length,g.ships.filter(s=>s.alive&&s.team===1).length,g.skState.t]}")
    check('stepped 30 sim-s', st[3] > 25, st)
    pg.screenshot(path=f'{SH}/menu_skirmish_flight.png')
    # win path: kill all enemies, debrief
    pg.evaluate("()=>{const g=__game;g.ships.filter(s=>s.team===1).forEach(s=>g.killShip(s));for(let i=0;i<200;i++)g.update(0.05)}")
    pg.wait_for_timeout(300)
    check('debrief shown after win', pg.evaluate(VIS, 'brief') == 'flex' and 'VICTORY' in pg.inner_text('#brief'), pg.inner_text('#brief')[:120].replace('\n', ' '))
    pg.screenshot(path=f'{SH}/menu_skirmish_debrief.png')
    pg.locator('#sk_re').click(); pg.wait_for_timeout(300)
    check('restart relaunches', pg.evaluate("()=>__game.game.mode==='skirmish'&&__game.ships.filter(s=>s.team===1).length===3"))
    pg.keyboard.press('r'); pg.wait_for_timeout(200)
    check('R opens restart dialog with SKIRMISH + MAIN MENU', pg.evaluate(VIS, 'rdlg') == 'flex' and 'RESTART SKIRMISH' in pg.inner_text('#rdlg') and pg.locator('#rd3').count() == 1)
    pg.locator('#rd3').click(); pg.wait_for_timeout(500)
    check('restart dialog -> main menu', pg.locator('.mi[data-a=skirmish]').count() == 1 and pg.evaluate(VIS, 'rdlg') == 'none')
    pg.locator('.mi[data-a=campaign]').click(); pg.locator('.mi[data-a=m1]').click(); pg.wait_for_timeout(300)
    check('mission list opens the briefing with MAIN MENU button', pg.locator('#bgo').count() == 1 and pg.locator('#bmenu').count() == 1)
    pg.locator('#bmenu').click(); pg.wait_for_timeout(300)
    check('briefing -> main menu', pg.locator('.mi[data-a=free]').count() == 1)
    pg.locator('.mi[data-a=free]').click(); pg.wait_for_timeout(300)
    check('free flight from menu', pg.evaluate("()=>__game.game.mode==='free'&&__game.state==='play'") and pg.evaluate(VIS, 'brief') == 'none')
    pg.evaluate("()=>__game.startSkirmish({rows:[['darter',2]]})"); pg.wait_for_timeout(200)
    # loss path
    pg.evaluate("()=>{const g=__game;g.killShip(g.player);for(let i=0;i<200;i++)g.update(0.05)}"); pg.wait_for_timeout(300)
    check('debrief after loss', 'DEFEAT' in pg.inner_text('#brief'))
    pg.locator('#sk_menu').click(); pg.wait_for_timeout(500)
    check('back to main menu', pg.locator('.mi[data-a=skirmish]').count() == 1 and pg.evaluate("()=>__game.state") == 'brief')
    check('no console errors', not R.errs, R.errs[:4])

# URL form
with Runner() as R:
    pg = R.page(640, 360, '?sk=darter:3,leaper:2&sk_skill=3&sk_wing=2&sk_msl=0&sk_range=800'); pg.wait_for_timeout(1500)
    r = pg.evaluate("()=>{const g=__game;__paused=true;for(let i=0;i<400;i++)g.update(0.05);const e=g.ships.filter(s=>s.team===1);return [g.game.mode,g.ships.filter(s=>s.team===0).length,e.length,e.map(s=>s.def.id).sort().join(','),g.state]}")
    check('?sk form', r[0] == 'skirmish' and r[1] == 3 and r[3].startswith('darter') and r[4] in ('play', 'done'), r)
    check('no console errors', not R.errs, R.errs[:4])
# __game.startSkirmish from a ?go page + respawn
with Runner() as R:
    pg = R.page(640, 360, '?go'); pg.wait_for_timeout(1000)
    r = pg.evaluate("()=>{const g=__game;g.startSkirmish({rows:[['darter',2]],respawn:true,range:600});__paused=true;let w0=g.wave;g.ships.filter(s=>s.team===1).forEach(s=>g.killShip(s));for(let i=0;i<300;i++)g.update(0.05);return [w0,g.wave,g.ships.filter(s=>s.team===1&&s.alive).length,g.state]}")
    check('endless respawn spawns a new wave', r[1] == 2 and r[2] == 2 and r[3] == 'play', r)
    check('no console errors', not R.errs, R.errs[:4])
print('FAILURES', bad); sys.exit(1 if bad else 0)
