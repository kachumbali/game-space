"""Shipyard acceptance checks and non-committed layout screenshots.
Usage: python3 yard_t.py. Set GS_PORT / GS_TEST_DIR to run beside another test run."""
from lib import *
import json
import os
import struct
import sys

FAILS = []


def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)
    if not ok:
        FAILS.append(name)


SHOTS = os.path.join(os.environ.get('GS_SHOTS', '/tmp/gs_shots'), 'yard')
os.makedirs(SHOTS, exist_ok=True)

with Runner() as R:
    page = R.page(1280, 720, '?yard=kestrel')
    page.wait_for_selector('#yard')
    check('?yard=kestrel loads without console errors', not R.errs, str(R.errs[:3]))

    original_prims = page.locator('#yard-prims').input_value()
    original_stat = page.locator('#yard-stat').inner_text()
    page.locator('#yard-prims').fill('[]')
    page.wait_for_timeout(600)
    empty_stat = page.locator('#yard-stat').inner_text()
    check('valid prim edit changes voxel count', '0 voxels' in empty_stat and empty_stat != original_stat, empty_stat)

    page.locator('#yard-prims').fill('[')
    page.wait_for_timeout(500)
    parse_error = page.locator('#yard-error').inner_text()
    check('invalid prim edit shows inline error', bool(parse_error), parse_error)
    check('invalid edit retains last good model', page.locator('#yard-stat').inner_text() == empty_stat)

    helper_source = """[
      tap([0,0,0], 0.5, [1,1], [1,1], 0xff8800, {sh:'h', lod:1}),
      box([0,0,2], [1,1,0.5], 0x00ffaa),
      ell([2,0,0], [0.4,0.5,0.6], 0xabcdef),
      seg([-2,0,0], [-2,0,1], 0.2, 0.1, 0xff00ff),
      ...chain([[3,0,0],[3,0,1],[3,1,2]], [0.2,0.1,0.05], 0xeeeeee),
      ...ringSegs(4,0,0,1,0.5,4,0.1,0x778899),
      ...rungs(6,0,0,2,3,0.4,0.2,0.1,0x997755)
    ]"""
    page.locator('#yard-prims').fill(helper_source)
    page.wait_for_timeout(600)
    helper_error = page.locator('#yard-error').inner_text()
    check('editor accepts tap, box, ell, seg, chain, ringSegs, and rungs helper calls', not helper_error, helper_error)

    page.locator('#yard-prims').fill(original_prims)
    page.wait_for_timeout(500)
    page.evaluate("""() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__yardClipboard = text; } }
    })""")
    page.evaluate("document.querySelector('#yard-copy-prims').click()")
    helper_export = page.evaluate('window.__yardClipboard')
    check('helper-call export includes constructor syntax', all(call in helper_export for call in ('tap(', 'box(', 'ell(', 'seg(')))
    page.locator('#yard-prims').fill(helper_export)
    page.wait_for_timeout(600)
    check('helper-call export parses back in the editor', not page.locator('#yard-error').inner_text())

    page.locator('#yard-prims-format').select_option('json')
    page.evaluate("document.querySelector('#yard-copy-prims').click()")
    prims_export = page.evaluate('window.__yardClipboard')
    try:
        prims_parsed = json.loads(prims_export)
        prims_ok = isinstance(prims_parsed, list)
    except (TypeError, json.JSONDecodeError):
        prims_ok = False
    check('Copy prims JS export parses back', prims_ok)

    page.evaluate("document.querySelector('#yard-copy-db').click()")
    entry_export = page.evaluate('window.__yardClipboard')
    try:
        entry = json.loads(entry_export)
        entry_ok = isinstance(entry, dict)
    except (TypeError, json.JSONDecodeError):
        entry_ok = False
    check('Copy db entry export parses back', entry_ok)

    if entry_ok:
        original_entry = json.loads(entry_export)
        entry['mounts'][0]['comp'] = 'yard_missing_component'
        page.locator('#yard-db-entry').fill(json.dumps(entry))
        page.wait_for_timeout(350)
        db_error = page.locator('#yard-db-error').inner_text()
        check('database validator flags missing mount component', 'missing component yard_missing_component' in db_error, db_error)
    else:
        check('database validator flags missing mount component', False, 'DB export did not parse')

    with page.expect_download() as download_info:
        page.evaluate("document.querySelector('#yard-save-sheet').click()")
    download = download_info.value
    with open(download.path(), 'rb') as png:
        header = png.read(24)
    dimensions = struct.unpack('>II', header[16:24]) if header[:8] == b'\x89PNG\r\n\x1a\n' else (0, 0)
    check('PNG sheet exports at 900x540', dimensions == (900, 540), str(dimensions))

    page.locator('#yard-ship').select_option('halberd')
    page.wait_for_timeout(500)
    halberd_size = page.locator('#yard-size').inner_text()
    halberd_authored_distance = page.evaluate('Math.hypot(...__game.camera.position.toArray())')
    page.locator('#yard-in-game-scale').check()
    page.wait_for_timeout(150)
    halberd_game_size = page.locator('#yard-size').inner_text()
    halberd_game_distance = page.evaluate('Math.hypot(...__game.camera.position.toArray())')
    check('authored and scaleShip in-game sizes are shown', 'Authored: 64 m' in halberd_size and 'in game: 128 m' in halberd_size, halberd_size)
    check('in-game scale preview scales model framing', 'preview: in-game (2×)' in halberd_game_size and halberd_game_distance > halberd_authored_distance * 1.9, halberd_game_size)
    page.locator('#yard-in-game-scale').evaluate('(element) => element.click()')
    check('in-game scale preview can return to authored scale', 'preview: authored (1×)' in page.locator('#yard-size').inner_text())

    page.locator('#yard-ship').select_option('bullfrog')
    page.wait_for_timeout(800)
    bullfrog_fit = page.evaluate("""() => {
      const camera = __game.camera, half = __game.SHIPS.bullfrog.half;
      const corners = [];
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      for (const x of [-half[0], half[0]]) for (const y of [-half[1], half[1]]) for (const z of [-half[2], half[2]]) {
        const p = new __game.THREE.Vector3(x, y, z).project(camera);
        corners.push(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1);
      }
      return { allFit: corners.every(Boolean), distance: camera.position.length() };
    }""")
    check('initial camera framing fits the 600 m Bullfrog hull', bullfrog_fit['allFit'], str(bullfrog_fit))
    page.evaluate("() => __game.camera.position.multiplyScalar(1.2)")
    page.evaluate("document.querySelector('#yard-frame').click()")
    framed_distance = page.evaluate('Math.hypot(...__game.camera.position.toArray())')
    check('frame ship restores a full-hull camera distance', framed_distance < bullfrog_fit['distance'] * 1.1)
    for button, expected in [
        ('#yard-view-front', lambda p: p['z'] < 0 and abs(p['x']) < 0.01),
        ('#yard-view-side', lambda p: p['x'] > 0 and abs(p['z']) < 0.01),
        ('#yard-view-top', lambda p: p['y'] > 0 and abs(p['y']) > abs(p['x']) + abs(p['z'])),
        ('#yard-view-quarter', lambda p: p['x'] > 0 and p['y'] > 0 and p['z'] > 0),
    ]:
        page.evaluate("(selector) => document.querySelector(selector).click()", button)
        position = page.evaluate('({x:__game.camera.position.x,y:__game.camera.position.y,z:__game.camera.position.z})')
        check(f'{button} sets the requested camera view', expected(position), str(position))

    page.evaluate("document.querySelector('#yard-panel-toggle').click()")
    collapsed = page.evaluate("""() => ({
      hidden: getComputedStyle(document.querySelector('#yard-controls')).display === 'none',
      canvasVisible: getComputedStyle(document.querySelector('#c')).display !== 'none',
      expanded: document.querySelector('#yard-panel-toggle').getAttribute('aria-expanded')
    })""")
    check('left panel collapses while leaving the ship canvas visible', collapsed['hidden'] and collapsed['canvasVisible'] and collapsed['expanded'] == 'false', str(collapsed))
    page.evaluate("document.querySelector('#yard-panel-toggle').click()")

    for template in ('kestrel', 'halberd', 'exeter'):
        page.locator('#yard-template').select_option(template)
        page.evaluate("document.querySelector('#yard-new-template').click()")
        page.wait_for_timeout(700)
        template_state = page.evaluate("""() => {
          const entry = JSON.parse(document.querySelector('#yard-db-entry').value);
          const prims = JSON.parse(document.querySelector('#yard-prims').value);
          return {id:entry.id, primCount:prims.length, arrays:['comps','mounts','turrets','engines'].every(key => Array.isArray(entry[key]) && entry[key].length === 0)};
        }""")
        check(f'{template} template copies prims into an empty database entry', template_state['id'] == '' and template_state['primCount'] > 0 and template_state['arrays'], str(template_state))
    template_entry = json.loads(page.locator('#yard-db-entry').input_value())
    template_entry['id'] = 'Bad ID'
    page.locator('#yard-db-entry').fill(json.dumps(template_entry))
    page.wait_for_timeout(350)
    invalid_id_error = page.locator('#yard-db-error').inner_text()
    check('new-template id validation rejects invalid ids', 'id must use lowercase letters' in invalid_id_error, invalid_id_error)
    template_entry['id'] = 'kestrel'
    page.locator('#yard-db-entry').fill(json.dumps(template_entry))
    page.wait_for_timeout(350)
    duplicate_id_error = page.locator('#yard-db-error').inner_text()
    check('new-template id validation rejects existing ids', 'id kestrel already exists' in duplicate_id_error, duplicate_id_error)
    template_entry['id'] = 'yard_brief6_test'
    page.locator('#yard-db-entry').fill(json.dumps(template_entry))
    page.wait_for_timeout(350)
    check('new-template id validation accepts a unique slug', page.locator('#yard-db-error').inner_text() == 'Database entry valid.')

    drag = page.evaluate("""() => {
      const canvas = document.querySelector('#c'), camera = __game.camera;
      const before = camera.position.clone();
      canvas.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 71, pointerType: 'mouse', clientX: 700, clientY: 300}));
      canvas.dispatchEvent(new PointerEvent('pointermove', {pointerId: 71, pointerType: 'mouse', clientX: 760, clientY: 330}));
      canvas.dispatchEvent(new PointerEvent('pointerup', {pointerId: 71, pointerType: 'mouse', clientX: 760, clientY: 330}));
      return camera.position.distanceTo(before) > 0.1;
    }""")
    check('turntable camera orbits on drag', drag)
    pinch = page.evaluate("""() => {
      const canvas = document.querySelector('#c'), camera = __game.camera;
      const send = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, {pointerId: id, pointerType: 'touch', clientX: x, clientY: y}));
      const before = camera.position.length();
      send('pointerdown', 81, 600, 300);
      send('pointerdown', 82, 700, 300);
      send('pointermove', 82, 800, 300);
      send('pointerup', 81, 600, 300);
      send('pointerup', 82, 800, 300);
      return Math.abs(camera.position.length() - before) > 0.1;
    }""")
    check('two-pointer pinch changes camera distance', pinch)
    page.mouse.move(700, 300)
    wheel_before = page.evaluate('Math.hypot(...__game.camera.position.toArray())')
    page.mouse.wheel(0, 120)
    page.wait_for_timeout(100)
    wheel_after = page.evaluate('Math.hypot(...__game.camera.position.toArray())')
    check('wheel changes camera distance', abs(wheel_after - wheel_before) > 0.1)

    if entry_ok:
        page.locator('#yard-db-entry').fill(json.dumps(original_entry, indent=2))
        page.wait_for_timeout(350)
    page.locator('#yard-prims').fill(original_prims)
    page.wait_for_timeout(500)
    if page.locator('#yard-in-game-scale').is_checked():
        page.locator('#yard-in-game-scale').evaluate('(element) => element.click()')
    page.locator('#yard-ship').select_option('kestrel')
    page.wait_for_timeout(500)
    page.locator('#yard-prims').evaluate('(element) => { element.scrollTop = 0; element.blur(); }')
    page.locator('#yard-db-entry').evaluate('(element) => { element.scrollTop = 0; element.blur(); }')
    page.locator('.ypanel').evaluate('(element) => { element.scrollTop = 0; }')
    for width, height in [(1280, 720), (844, 390), (390, 844)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(150)
        page.screenshot(path=os.path.join(SHOTS, f'yard_{width}x{height}.png'))
    check('yard page has no browser errors', not R.errs, str(R.errs[:3]))

print('FAILED: ' + (str(FAILS) if FAILS else 'none'))
sys.exit(1 if FAILS else 0)
