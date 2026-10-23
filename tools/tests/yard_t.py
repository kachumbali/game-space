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

    page.locator('#yard-prims').fill(original_prims)
    page.wait_for_timeout(500)
    page.evaluate("""() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__yardClipboard = text; } }
    })""")
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
    page.evaluate("document.querySelector('#yard-ship').dispatchEvent(new Event('change', {bubbles:true}))")
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
