"""TERN shipyard geometry and skirmish-spawn smoke test."""
from lib import *
import json
import os
import re
import shutil

FAILS = []
SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'tern')
os.makedirs(SHOTS, exist_ok=True)


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


def voxel_count(stat):
    match = re.search(r'([\d.,\s\u00a0\u202f]+)\s+voxels', stat)
    return int(re.sub(r'\D', '', match.group(1))) if match else None


with Runner() as R:
    page = R.page(1280, 720, '?yard=tern')
    page.wait_for_selector('#yard')
    page.locator('#yard-detail').select_option('4')
    page.wait_for_timeout(500)
    definition = page.evaluate("""() => {
      const d = __game.SHIPS.tern;
      return {
        id: d.id, cls: d.cls, shuttle: d.shuttle, half: d.half,
        cargo: d.cargo, xfer: d.xfer, mounts: d.mounts.length, turrets: d.turrets.length,
        prims: d.prims.length, comps: d.comps.map(c => c.id),
        selected: document.querySelector('#yard-ship').value === 'tern'
      };
    }""")
    print('TERN shipyard definition: ' + json.dumps(definition, sort_keys=True), flush=True)
    count = voxel_count(page.locator('#yard-stat').inner_text())
    print(f'TERN mid-detail voxel count: {count}', flush=True)
    check('TERN loads directly in the Shipyard', definition['selected'] and definition['id'] == 'tern')
    check('TERN keeps the specified fighter shuttle database fields',
          definition['cls'] == 'fighter' and definition['shuttle'] is True and
          definition['cargo']['ammo'] == 3600 and definition['xfer']['hoses'] == 2)
    check('TERN is unarmed and has rendered geometry',
          definition['mounts'] == 0 and definition['turrets'] == 0 and definition['prims'] > 0)
    check('Shipyard validates the database and prims',
          not page.locator('#yard-error').inner_text() and
          page.locator('#yard-db-error').inner_text() == 'Database entry valid.')
    check('mid-detail voxel count is measurable', count is not None and count > 0, str(count))

    with page.expect_download() as download_info:
        page.evaluate("document.querySelector('#yard-save-sheet').click()")
    sheet = os.path.abspath(os.path.join(SHOTS, 'tern_shipyard_sheet.png'))
    shutil.copyfile(download_info.value.path(), sheet)
    check('Shipyard sheet saved outside the repository',
          os.path.isfile(sheet) and not sheet.startswith(os.path.abspath(REPO) + os.sep), sheet)
    check('Shipyard page has no console errors', not R.errs, str(R.errs[:5]))

with Runner() as R:
    page = R.page(1280, 720, '?sk=tern:1')
    page.wait_for_timeout(350)
    result = page.evaluate("""() => {
      const g = __game;
      g.__paused = true;
      const tern = g.ships.find(s => s.def.id === 'tern' && s.team === 1);
      if (!tern) return {spawned: false};
      for (let i = 0; i < 60; i++) g.update(0.05);
      return {
        spawned: true, alive: tern.alive,
        finitePosition: tern.group.position.toArray().every(Number.isFinite),
        team: tern.team, structure: tern.structure
      };
    }""")
    print('TERN skirmish result: ' + json.dumps(result, sort_keys=True), flush=True)
    check('TERN spawns from ?sk=tern:1 and survives skirmish updates',
          result.get('spawned') and result.get('alive') and result.get('finitePosition'),
          json.dumps(result))
    check('skirmish page has no console errors', not R.errs, str(R.errs[:5]))

print('FAILED: ' + (str(FAILS) if FAILS else 'none'), flush=True)
raise SystemExit(bool(FAILS))
