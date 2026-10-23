"""Merlin ship acceptance checks. Usage: python3 tools/tests/merlin_t.py."""
from lib import *
import json
import os
import re
import shutil
import sys

FAILS = []
SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'merlin')
os.makedirs(SHOTS, exist_ok=True)


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


with Runner() as R:
    page = R.page(1280, 720, '?free&n=0&q=mid&seed=8')
    page.wait_for_timeout(300)
    result = page.evaluate("""() => {
      const g = __game, T = g.THREE;
      g.__paused = true;
      const player = g.player;
      for (const s of [...g.ships]) if (s !== player) g.killShip(s);
      player.group.position.set(50000, 0, 50000);
      player.vel.set(0, 0, 0);
      player.team = 2;
      const merlins = [
        g.spawnShip('merlin', 0, new T.Vector3(-35, 0, 0), new T.Vector3(-35, 0, -1000), {skill: 3}),
        g.spawnShip('merlin', 0, new T.Vector3(35, 0, 0), new T.Vector3(35, 0, -1000), {skill: 3})
      ];
      const darters = [
        g.spawnShip('darter', 1, new T.Vector3(-35, 0, -1000), new T.Vector3(-35, 0, 0), {skill: 3}),
        g.spawnShip('darter', 1, new T.Vector3(35, 0, -1000), new T.Vector3(35, 0, 0), {skill: 3})
      ];
      const shots = new Map(merlins.map(s => [s, 0]));
      for (let i = 0; i < 1200; i++) {
        g.update(0.05);
        for (const b of g.bolts) if (shots.has(b.owner)) shots.set(b.owner, shots.get(b.owner) + 1);
      }
      const def = g.SHIPS.merlin;
      return {
        merlinShots: merlins.map(s => shots.get(s)),
        merlins: merlins.map(s => ({
          alive: s.alive,
          mounts: s.mounts.map(m => ({w: m.w, comp: m.comp, grp: m.grp})),
          components: s.comps.map(c => c.id)
        })),
        darters: darters.length,
        bounds: def.half,
        length: def.length
      };
    }""")
    print('Combat result: ' + json.dumps(result, sort_keys=True), flush=True)
    check('two Merlins and two Darters spawned', len(result['merlins']) == 2 and result['darters'] == 2)
    check('both Merlins fired MK-20 bolts over 60 sim-seconds', all(n > 0 for n in result['merlinShots']), str(result['merlinShots']))
    expected_components = {'engL', 'engR', 'gunL', 'gunR', 'shield', 'radar', 'power'}
    for index, ship in enumerate(result['merlins']):
        check(f'Merlin {index + 1} has expected components', set(ship['components']) == expected_components, str(ship['components']))
        check(f'Merlin {index + 1} has two group-1 cannons',
              ship['mounts'] == [
                  {'w': 'cannon', 'comp': 'gunL', 'grp': 1},
                  {'w': 'cannon', 'comp': 'gunR', 'grp': 1},
              ], str(ship['mounts']))
    check('Merlin stays within specified length and half-extents',
          result['length'] == 9 and result['bounds'] == [3.9, 1.6, 5], str(result['bounds']))
    check('headless combat page has no console errors', not R.errs, str(R.errs[:3]))

with Runner() as R:
    page = R.page(1280, 720, '?yard=merlin')
    page.wait_for_selector('#yard')
    page.wait_for_timeout(600)
    stat = page.locator('#yard-stat').inner_text()
    count_match = re.search(r'([\d.,\s\u00a0\u202f]+)\s+voxels', stat)
    voxel_count = int(re.sub(r'\D', '', count_match.group(1))) if count_match else 0
    print(f'Merlin mid-quality Shipyard stat: {stat}; voxel count={voxel_count}', flush=True)
    check('mid-quality Merlin voxel count is reported and below 6,000',
          count_match is not None and 0 < voxel_count < 6000, stat)
    check('Shipyard page has no console errors', not R.errs, str(R.errs[:3]))

    page.evaluate("""() => {
      for (const id of ['yard-comp-markers', 'yard-mount-markers', 'yard-engine-markers']) {
        const control = document.getElementById(id);
        control.checked = false;
        control.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }""")
    with page.expect_download() as download_info:
        page.evaluate("document.querySelector('#yard-save-sheet').click()")
    download = download_info.value
    shutil.copyfile(download.path(), os.path.join(SHOTS, 'merlin_shipyard_sheet.png'))
    check('Shipyard PNG sheet saved outside the repository',
          os.path.isfile(os.path.join(SHOTS, 'merlin_shipyard_sheet.png')))

with Runner() as R:
    page = R.page(1280, 720, '?sk=merlin:2&sk_range=1200')
    result = page.evaluate("""() => ({
      mode: __game.game.mode,
      ship: __game.player.def.id,
      enemyRows: __game.game.sk.rows,
      enemyCount: __game.ships.filter(s => s.team === 1 && s.def.id === 'merlin').length
    })""")
    print('URL skirmish result: ' + json.dumps(result, sort_keys=True), flush=True)
    check('URL skirmish parameter spawns Merlin without a preset/menu entry',
          result['mode'] == 'skirmish' and result['enemyCount'] == 2 and result['enemyRows'] == [['merlin', 2]],
          str(result))
    check('URL skirmish page has no console errors', not R.errs, str(R.errs[:3]))

print('FAILED: ' + (str(FAILS) if FAILS else 'none'))
sys.exit(1 if FAILS else 0)
