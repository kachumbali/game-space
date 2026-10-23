"""HECLA Shipyard, voxel-budget, spawn, and AI-approach checks."""
from lib import *
import json
import os
import re
import shutil
import sys

FAILS = []
SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'hecla')
os.makedirs(SHOTS, exist_ok=True)


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


def parse_stat(stat):
    match = re.search(r'([\d.,\s\u00a0\u202f]+)\s+voxels', stat)
    if not match:
        return None, None
    count = int(re.sub(r'\D', '', match.group(1)))
    build = re.search(r'·\s*([\d.,]+)\s*ms', stat)
    return count, float(build.group(1).replace(',', '.')) if build else None


with Runner() as R:
    page = R.page(1280, 720, '?yard=hecla')
    page.wait_for_selector('#yard')
    definition = page.evaluate("""() => {
      const d = __game.SHIPS.hecla;
      return {
        id: d.id, length: d.length, half: d.half, radius: d.radius,
        resMul: d.resMul, resCap: d.resCap, noDetail: d.noDetail,
        reactorCount: d.comps.filter(c => c.role === 'power').length,
        heclaSelected: document.querySelector('#yard-ship').value === 'hecla'
      };
    }""")
    print('Shipyard definition: ' + json.dumps(definition, sort_keys=True), flush=True)
    check('HECLA loads directly from ?yard=hecla', definition['heclaSelected'] and definition['id'] == 'hecla')
    check('HECLA is the measured 1 km envelope',
          definition['length'] == 1000 and definition['half'] == [145, 50, 500] and definition['radius'] == 520,
          json.dumps(definition))
    check('database has one main reactor', definition['reactorCount'] == 1, str(definition['reactorCount']))

    quality_steps = page.evaluate('() => __game.DETAIL_STEPS')
    measurements = []
    for index, step in enumerate(quality_steps):
        page.locator('#yard-detail').select_option(str(index))
        page.wait_for_timeout(450)
        stat = page.locator('#yard-stat').inner_text()
        count, build_ms = parse_stat(stat)
        measurements.append({'index': index, 'step': step, 'voxels': count, 'build_ms': build_ms})
        print('VOXEL ' + json.dumps(measurements[-1], sort_keys=True), flush=True)
    check('all eight quality levels produce measurable voxels',
          all(row['voxels'] and row['voxels'] > 0 for row in measurements),
          json.dumps(measurements))
    check('low-quality HECLA budget stays below 25,000',
          measurements[2]['voxels'] is not None and measurements[2]['voxels'] <= 25000,
          str(measurements[2]))
    check('maximum-quality HECLA budget stays below 30,000',
          measurements[7]['voxels'] is not None and measurements[7]['voxels'] <= 30000,
          str(measurements[7]))
    check('Shipyard has no prim or DB validation errors',
          not page.locator('#yard-error').inner_text() and
          page.locator('#yard-db-error').inner_text() == 'Database entry valid.')

    page.locator('#yard-detail').select_option('4')
    page.wait_for_timeout(400)
    frame_time = page.evaluate("""async () => {
      const values = [];
      let previous;
      for (let i = 0; i < 16; i++) {
        const now = await new Promise(requestAnimationFrame);
        if (previous !== undefined) values.push(now - previous);
        previous = now;
      }
      values.sort((a, b) => a - b);
      return {
        samples: values.length,
        median_ms: values[Math.floor(values.length * 0.5)],
        p95_ms: values[Math.floor(values.length * 0.95)],
        max_ms: values[values.length - 1]
      };
    }""")
    print('Shipyard rendered-frame intervals: ' + json.dumps(frame_time, sort_keys=True), flush=True)
    check('Shipyard frame-time sample collected', frame_time['samples'] >= 12, str(frame_time))

    page.evaluate("""() => {
      for (const id of ['yard-comp-markers', 'yard-mount-markers', 'yard-turret-markers', 'yard-engine-markers']) {
        const control = document.getElementById(id);
        control.checked = false;
        control.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }""")
    with page.expect_download() as download_info:
        page.evaluate("document.querySelector('#yard-save-sheet').click()")
    download = download_info.value
    sheet = os.path.abspath(os.path.join(SHOTS, 'hecla_shipyard_sheet.png'))
    shutil.copyfile(download.path(), sheet)
    check('Shipyard sheet saved outside the repository',
          os.path.isfile(sheet) and not sheet.startswith(os.path.abspath(REPO) + os.sep), sheet)
    check('Shipyard page has no console errors', not R.errs, str(R.errs[:5]))

with Runner() as R:
    page = R.page(1280, 720, '?free&n=0&q=mid&seed=12')
    result = page.evaluate("""() => {
      const g = __game, T = g.THREE;
      g.__paused = true;
      const player = g.player;
      player.group.position.set(50000, 0, 50000);
      player.vel.set(0, 0, 0);
      const hecla = g.spawnShip('hecla', 0, new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1), {});
      const ai = g.spawnShip('darter', 1, new T.Vector3(0, 0, -700), new T.Vector3(0, 0, 1), {});
      ai.target = hecla;
      ai.ai.mode = 'attack';
      ai.group.position.set(0, 0, -700);
      ai.group.lookAt(hecla.group.position);
      ai.group.rotateY(Math.PI);
      ai.vel.set(0, 0, 0);
      ai.group.updateMatrixWorld(true);
      g.update(0.05);
      const toward = hecla.group.position.clone().sub(ai.group.position).normalize();
      const avoidDistance = hecla.def.radius * 1.2 + 30;
      const D = hecla.vox.data, solid = hecla.vox.solid;
      const nearest = p => {
        const i = Math.floor((p[0] + D.hx) / D.vs);
        const j = Math.floor((p[1] + D.hy) / D.vs);
        const k = Math.floor((p[2] + D.hz) / D.vs);
        let best = Infinity;
        for (let x = i - 2; x <= i + 2; x++) for (let y = j - 2; y <= j + 2; y++) for (let z = k - 2; z <= k + 2; z++) {
          if (x < 0 || y < 0 || z < 0 || x >= D.nx || y >= D.ny || z >= D.nz) continue;
          if (!solid[(x * D.ny + y) * D.nz + z]) continue;
          const d = Math.hypot(
            -D.hx + (x + 0.5) * D.vs - p[0],
            -D.hy + (y + 0.5) * D.vs - p[1],
            -D.hz + (z + 0.5) * D.vs - p[2]
          );
          if (d < best) best = d;
        }
        return best;
      };
      const turretDistances = hecla.def.turrets.map(t => nearest(t.pos));
      const componentDistances = hecla.def.comps.map(c => nearest(c.pos));
      return {
        hecla: hecla.def.id,
        radius: hecla.def.radius,
        avoidDistance,
        instances: hecla.vox.body.count + hecla.vox.glow.count,
        voxelSize: D.vs,
        turretBaseMaxDistance: Math.max(...turretDistances),
        unsupportedTurretBases: turretDistances.filter(d => d > D.vs).length,
        componentMaxDistance: Math.max(...componentDistances),
        unsupportedComponents: componentDistances.filter(d => d > D.vs).length,
        aiTarget: ai.target && ai.target.def.id,
        aiDistance: ai.group.position.distanceTo(hecla.group.position),
        approachSpeed: ai.vel.dot(toward)
      };
    }""")
    print('Spawn / AI approach: ' + json.dumps(result, sort_keys=True), flush=True)
    check('HECLA spawns in-game with a non-empty voxel model',
          result['hecla'] == 'hecla' and result['instances'] > 0, str(result))
    check('all turret bases are within one voxel of supporting hull',
          result['unsupportedTurretBases'] == 0, str(result))
    check('all database components are within one voxel of the model',
          result['unsupportedComponents'] == 0, str(result))
    check('AI target remains outside the scaled avoidance margin',
          result['aiTarget'] == 'hecla' and result['aiDistance'] > result['avoidDistance'],
          str(result))
    check('AI approaches HECLA instead of steering away',
          result['approachSpeed'] > 0, str(result))

    frame_time = page.evaluate("""async () => {
      const values = [];
      let previous;
      for (let i = 0; i < 16; i++) {
        const now = await new Promise(requestAnimationFrame);
        if (previous !== undefined) values.push(now - previous);
        previous = now;
      }
      values.sort((a, b) => a - b);
      return {
        samples: values.length,
        median_ms: values[Math.floor(values.length * 0.5)],
        p95_ms: values[Math.floor(values.length * 0.95)],
        max_ms: values[values.length - 1]
      };
    }""")
    print('In-game rendered-frame intervals: ' + json.dumps(frame_time, sort_keys=True), flush=True)
    check('in-game frame-time sample collected', frame_time['samples'] >= 12, str(frame_time))
    check('spawn page has no console errors', not R.errs, str(R.errs[:5]))

print('FAILED: ' + (str(FAILS) if FAILS else 'none'))
sys.exit(1 if FAILS else 0)
