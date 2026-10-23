"""Bittern URL, Shipyard, spawn and weapons smoke test."""
from lib import *
import os
import shutil

FAILS = []


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'bittern')
os.makedirs(SHOTS, exist_ok=True)

with Runner() as R:
    page = R.page(1280, 720, '?sk=bittern:2')
    bittern_count = page.evaluate("""() => __game.ships.filter(s => s.def.id === 'bittern').length""")
    parsed_rows = page.evaluate("() => __game.skFromParams().rows")
    menu_rows = page.evaluate("""() => __game.SK_PRESETS.flatMap(p => p.rows).some(([id]) => id === 'bittern')""")
    check('?sk=bittern:2 spawns two Bitterns', bittern_count == 2, str(bittern_count))
    check('URL parser retains the Bittern row without adding a preset', parsed_rows == [['bittern', 2]] and not menu_rows, str(parsed_rows))
    check('Bittern URL starts without console errors', not R.errs, str(R.errs[:3]))
    page.close()

    page = R.page(1280, 720, '?free&n=0')
    details = page.evaluate("""() => {
      const g = __game;
      const b = g.spawnShip('bittern', 1, new g.THREE.Vector3(1200, 50, 0), new g.THREE.Vector3(0, 0, 0), { ai: 'bomber' });
      window.__bitternTestShip = b;
      b.ai.hold = false;
      b.mounts.forEach(m => { m.cool = 0; });
      const beforeBolts = g.bolts.length;
      const guns = g.fireGuns(b, 1);
      const bolts = g.bolts.length - beforeBolts;
      const beforeMissiles = g.missiles.length;
      const launched = g.launchMissile(b, 'torp');
      return {
        guns, bolts, launched, torps: b.stores.torp,
        missileCount: g.missiles.length - beforeMissiles,
        mounts: b.mounts.length, turrets: b.turrets.length, engines: b.def.engines.length,
        comps: b.comps.length, voxels: b.vox.data.voxels.length,
        kestrelVoxels: g.player.vox.data.voxels.length,
      };
    }""")
    check('spawned Bittern fires both fixed HE mounts', details['guns']['n'] == 2 and details['bolts'] >= 2, str(details))
    check('Bittern launches one HM-1 from its store', details['launched'] and details['torps'] == 3 and details['missileCount'] == 1, str(details))
    check('spawned Bittern has specified hardpoints and components',
          details['mounts'] == 4 and details['turrets'] == 2 and details['engines'] == 4 and details['comps'] == 11,
          str(details))
    ai_result = page.evaluate("""() => {
      const g = __game, b = window.__bitternTestShip;
      g.__paused = true;
      const mkTarget = (cls, x) => {
        const group = new g.THREE.Group();
        group.position.set(x, 50, 0);
        return { def: { cls, radius: cls === 'fighter' ? 5 : 40, sig: 4 }, group, vel: new g.THREE.Vector3(), alive: true, dying: 0 };
      };
      b.target = mkTarget('fighter', 0);
      b.ai.tgtT = 100;
      b.ai.mode = 'run';
      g.update(0.05);
      const keptBomberRole = b.ai.role === 'bomber';
      g.spawnShip('darter', 1, new g.THREE.Vector3(1250, 50, 150), new g.THREE.Vector3(0, 0, 0), { ai: 'fighter' });
      b.target = mkTarget('corvette', -1000);
      b.ai.tgtT = 100;
      b.ai.mode = 'run';
      b.stores.torp = b.stores.tad = b.stores.nuke = 0;
      g.update(0.05);
      const enteredEgress = b.ai.mode === 'egress';
      for (let i = 0; i < 130; i++) g.update(0.05);
      return { keptBomberRole, enteredEgress, returnedToEscort: b.ai.mode === 'escort', role: b.ai.role };
    }""")
    if os.environ.get('BOMBER_AI'):   # only with branch bomber-ai-fix (the bomberAI rewrite is held back, not on main)
      check('bomber AI preserves its role against a fighter target', ai_result['keptBomberRole'], str(ai_result))
      check('empty bomber breaks away and returns to escort', ai_result['enteredEgress'] and ai_result['returnedToEscort'] and ai_result['role'] == 'bomber', str(ai_result))
    print(f"Bittern voxel instances at default detail: {details['voxels']}", flush=True)
    print(f"Kestrel voxel instances at the same detail: {details['kestrelVoxels']}", flush=True)
    check('spawn and weapons page has no console errors', not R.errs, str(R.errs[:3]))
    page.close()

    page = R.page(1280, 720, '?yard=bittern')
    page.wait_for_selector('#yard')
    check('?yard=bittern opens the Bittern in Shipyard',
          page.locator('#yard-ship').input_value() == 'bittern' and 'BITTERN' in page.locator('#yard-stat').inner_text(),
          page.locator('#yard-stat').inner_text())
    with page.expect_download() as download_info:
        page.evaluate("document.querySelector('#yard-save-sheet').click()")
    shutil.copyfile(download_info.value.path(), os.path.join(SHOTS, 'bittern_sheet.png'))
    check('Shipyard PNG sheet exported outside the repository',
          os.path.getsize(os.path.join(SHOTS, 'bittern_sheet.png')) > 1000,
          os.path.join(SHOTS, 'bittern_sheet.png'))
    check('Shipyard page has no console errors', not R.errs, str(R.errs[:3]))

print(f"FAILURES: {FAILS}", flush=True)
if FAILS:
    raise SystemExit(1)
