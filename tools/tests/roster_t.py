"""v0.3 M4 roster smoke test: FALCHION, SAR CUTTER, ARGOSY liner and CLAYMORE destroyer.
For each new ship: spawn it in a skirmish (player ship / ally), step the sim, assert alive + no console errors, mount / turret / component counts,
the weapon panel and the turret hold key (U), then open it in the Shipyard and save a screenshot (GS_SHOTS/roster, default /tmp/gs_shots/roster).
Use a unique GS_PORT / GS_TEST_DIR when other runs share the machine."""
from lib import *
import os

FAILS = []
SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'roster')
os.makedirs(SHOTS, exist_ok=True)


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' - {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


# id -> (url, role of the ship in the scene, expected counts)
CASES = {
    'falchion': dict(q='?sk=leaper:2&sk_ship=falchion&sk_wing=1&sk_wship=falchion&sk_respawn=1&go&q=low', who='player', mounts=4, turrets=3, comps=12, engines=4, stores={'ir': 6, 'rf': 2, 'torp': 2, 'flare': 32}),
    'sar': dict(q='?sk=leaper:1&sk_ship=sar&go&q=low', who='player', mounts=0, turrets=0, comps=7, engines=2, stores={'flare': 24}),
    'liner': dict(q='?sk=darter:2&sk_ally=liner&go&q=low', who='ally', mounts=0, turrets=6, comps=16, engines=4, stores={'flare': 24}),
    'destroyer': dict(q='?sk=darter:2&sk_ally=destroyer&go&q=low', who='ally', mounts=4, turrets=20, comps=None, engines=3, stores={'torp': 8}),
}

with Runner() as R:
    for sid, c in CASES.items():
        pg = R.page(1280, 720, c['q'])
        pg.wait_for_timeout(2500)
        info = pg.evaluate("""([sid, who]) => {
          const g = __game, s = who === 'player' ? g.player : g.ships.find(x => x.id === 'ally');
          return s ? { id: s.def.id, alive: s.alive, mounts: s.mounts.length, turrets: s.turrets.length, comps: s.comps.length, engines: s.def.engines.length,
                       stores: s.def.stores, voxels: s.vox ? s.vox.data.voxels.length : -1, len: s.def.length, structure: s.structure, shield: s.shield } : null;
        }""", [sid, c['who']])
        check(f'{sid}: spawned as {c["who"]} (skirmish)', info is not None and info['id'] == sid, str(info))
        if info is None:
            pg.close(); continue
        check(f'{sid}: mounts {info["mounts"]}', info['mounts'] == c['mounts'])
        check(f'{sid}: turrets {info["turrets"]}', info['turrets'] == c['turrets'])
        if c['comps']: check(f'{sid}: components {info["comps"]}', info['comps'] == c['comps'])
        check(f'{sid}: engines {info["engines"]}', info['engines'] == c['engines'])
        check(f'{sid}: stores', all(info['stores'].get(k) == v for k, v in c['stores'].items()), str(info['stores']))
        print(f'  {sid}: {info["voxels"]} voxel instances, length {info["len"]} m', flush=True)
        # step the sim 40 s, then 5 s with the turrets on hold and a hostile placed right on top of the ship
        res = pg.evaluate("""([sid, who]) => {
          const g = __game; g.__paused = true;
          const get = () => who === 'player' ? g.player : g.ships.find(x => x.id === 'ally');
          for (let i = 0; i < 800; i++) g.update(0.05);
          const s = get();
          const wpn = document.getElementById('wpn') ? document.getElementById('wpn').innerText : '';
          return { alive: !!(s && s.alive), state: g.state, wpn, turretsFired: s ? s.turrets.reduce((a, t) => a + (t.fired || 0), 0) : 0, hostile: g.ships.filter(x => x.team === 1 && x.alive).length };
        }""", [sid, c['who']])
        check(f'{sid}: alive after 40 s of sim', res['alive'], str(res)[:300])
        if c['who'] == 'player':
            check(f'{sid}: weapon panel built from mounts', len(res['wpn']) > 0, res['wpn'].replace('\n', ' | ')[:200])
            if c['turrets']:
                pg.keyboard.press('KeyU'); pg.wait_for_timeout(200)
                check(f'{sid}: U sets turret hold', pg.evaluate("() => __game.player.turretsHold") is True)
                check(f'{sid}: HUD shows HOLD', 'HOLD' in pg.inner_text('#wpn'))
                pg.keyboard.press('KeyU'); pg.wait_for_timeout(200)
                check(f'{sid}: U toggles back', pg.evaluate("() => __game.player.turretsHold") is False)
        pg.evaluate("() => { __game.__paused = false; }")
        pg.wait_for_timeout(300)
        check(f'{sid}: no console errors in skirmish', not R.errs, str(R.errs[:3]))
        pg.close()

        # Shipyard sheet: model screenshot
        pg = R.page(1280, 720, f'?yard={sid}')
        pg.wait_for_selector('#yard')
        pg.locator('#yard-detail').select_option('5'); pg.wait_for_timeout(2500)
        out = os.path.join(SHOTS, f'{sid}_yard.png')
        pg.screenshot(path=out)
        check(f'{sid}: Shipyard opens', pg.locator('#yard-ship').input_value() == sid, pg.locator('#yard-stat').inner_text().replace('\n', ' ')[:160])
        check(f'{sid}: no console errors in Shipyard', not R.errs, str(R.errs[:3]))
        pg.close()

    # the SAR cutter and the unarmed liner are not offered as wingmen; the Falchion is
    pg = R.page(1280, 720, '?free&n=0')
    wing = pg.evaluate("() => __game.SK_WING.map(x => x[0])")
    player = pg.evaluate("() => __game.SK_PLAYER.map(x => x[0])")
    check('wingman list: Falchion yes, Tern/SAR no', 'falchion' in wing and 'sar' not in wing and 'tern' not in wing, str(wing))
    check('player list has Falchion and SAR', 'falchion' in player and 'sar' in player, str(player))
    pg.close()

print(f'FAILURES: {FAILS}', flush=True)
if FAILS:
    raise SystemExit(1)
