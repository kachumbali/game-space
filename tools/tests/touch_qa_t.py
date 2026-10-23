"""Touch-control QA at the two owner-requested iPad/phone viewport sizes."""
import json
import os
import time

from lib import Runner

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SHOTS = os.path.join(os.path.dirname(__file__), 'touch_qa_shots')
SIZES = [(844, 390, 'landscape'), (390, 844, 'portrait')]
checks = []
findings = {}


def check(label, passed, detail=''):
    checks.append((label, bool(passed), detail))
    print(('PASS ' if passed else 'FAIL ') + label + (f' — {detail}' if detail else ''), flush=True)


def touch_at(page, x, y, hold=0.12):
    cdp = page.context.new_cdp_session(page)
    point = {'x': x, 'y': y, 'id': 1, 'radiusX': 1, 'radiusY': 1, 'force': 1}
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point]})
    try:
        time.sleep(hold)
    finally:
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        cdp.detach()


def tap(page, selector, hold=0.12):
    box = page.locator(selector).bounding_box()
    if not box:
        raise RuntimeError(f'{selector} has no visible bounding box')
    touch_at(page, box['x'] + box['width'] / 2, box['y'] + box['height'] / 2, hold)


def control_metrics(page):
    return page.evaluate("""() => {
      const controls = [...document.querySelectorAll('.tbtn, #thr, #ets .er')]
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => {
          const r = el.getBoundingClientRect();
          return {id: el.id || el.dataset.pw || el.className,
            x:r.x, y:r.y, right:r.right, bottom:r.bottom, w:r.width, h:r.height};
        });
      const overlaps = [];
      for (let i=0; i<controls.length; i++) for (let j=i+1; j<controls.length; j++) {
        const a=controls[i], b=controls[j];
        const w=Math.min(a.right,b.right)-Math.max(a.x,b.x);
        const h=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);
        if (w>0.5 && h>0.5) overlaps.push({a:a.id,b:b.id,area:+(w*h).toFixed(1)});
      }
      return {controls, overlaps, width:innerWidth, height:innerHeight};
    }""")


def layout_summary(metrics, small, outside):
    compact = [
        {'id': c['id'], 'xy': [round(c['x'], 1), round(c['y'], 1)],
         'wh': [round(c['w'], 1), round(c['h'], 1)]}
        for c in small
    ]
    return {'controls': len(metrics['controls']), 'under_44px': compact,
            'outside_viewport': [c['id'] for c in outside],
            'overlaps': metrics['overlaps']}


def setup_game(page):
    return page.evaluate("""() => {
      const g=__game, T=g.THREE, p=g.player;
      g.state='play';
      p.group.position.set(0,0,0); p.group.quaternion.identity();
      p.vel.set(0,0,0); p.throttle=0; p.fireMask=3;
      for (const m of p.mounts) m.cool=0;
      for (const s of g.ships) if (s.team===1) s.alive=false;
      const e1=g.spawnShip('darter',1,new T.Vector3(0,0,-420),new T.Vector3(),{ai:'fighter',hold:true,id:'qa-target-1'});
      const e2=g.spawnShip('darter',1,new T.Vector3(0,0,-700),new T.Vector3(),{ai:'fighter',hold:true,id:'qa-target-2'});
      e1.ai.hold=e2.ai.hold=true;
      g.target=e1; p.target=e1;
      const wid=g.selectedMissile(p);
      if (wid) p.stores[wid]=2;
      window.__qaMissile=wid;
      g.updateHud();
      return {player:p.def.id, missile:wid, stores:{...p.stores}, hostiles:g.hostileList().length};
    }""")


os.makedirs(SHOTS, exist_ok=True)
with Runner() as R:
    for width, height, label in SIZES:
        page = R.page(width, height, '?free&go&touch&n=0&q=low&mute', touch=True)
        request_failures = []
        page.on('requestfailed', lambda request: request_failures.append(
            {'url': request.url, 'failure': request.failure}))
        page.wait_for_timeout(800)
        setup = setup_game(page)
        metrics = control_metrics(page)
        page.screenshot(path=os.path.join(SHOTS, f'touch_{label}_{width}x{height}.png'))

        outside = [c for c in metrics['controls']
                   if c['x'] < 0 or c['y'] < 0 or c['right'] > width or c['bottom'] > height]
        small = [c for c in metrics['controls'] if c['w'] < 44 or c['h'] < 44]
        findings[label] = {
            'viewport': f'{width}x{height}',
            'controls': metrics['controls'],
            'overlaps': metrics['overlaps'],
            'outside_viewport': outside,
            'under_44px': small,
            'setup': setup,
        }
        print(f'GEOMETRY {label}: ' +
              json.dumps(layout_summary(metrics, small, outside)), flush=True)
        check(f'{label}: page/game initialized', bool(setup['player'] and setup['hostiles'] == 2), str(setup))
        check(f'{label}: touch button layout measured', len(metrics['controls']) > 0,
              f"{len(metrics['controls'])} controls; {len(metrics['overlaps'])} overlaps; "
              f"{len(small)} under 44 px; {len(outside)} outside viewport")

        player_shots_before = page.evaluate('() => __game.player.shots || 0')
        try:
            tap(page, '#bfire', 1.2)
            player_shots_after = page.evaluate('() => __game.player.shots || 0')
            check(f'{label}: FIRE touch fires guns', player_shots_after > player_shots_before,
                  f'{player_shots_before} -> {player_shots_after} shots')
        except Exception as exc:
            check(f'{label}: FIRE touch fires guns', False, str(exc))

        missile_before = page.evaluate("""() => {
          const g=__game,p=g.player,w=window.__qaMissile;
          return {w,store:w?p.stores[w]:0,count:g.missiles.length};
        }""")
        try:
            tap(page, '#bmsl')
            missile_after = page.evaluate("""() => {
              const g=__game,p=g.player,w=window.__qaMissile;
              return {store:w?p.stores[w]:0,count:g.missiles.length};
            }""")
            check(f'{label}: MSL touch launches missile',
                  missile_after['count'] > missile_before['count']
                  or missile_after['store'] < missile_before['store'],
                  f"{missile_before} -> {missile_after}")
        except Exception as exc:
            check(f'{label}: MSL touch launches missile', False, str(exc))

        target_before = page.evaluate('() => __game.target === __game.ships.find(s=>s.id==="qa-target-1")')
        try:
            tap(page, '#btgt')
            target_after = page.evaluate('() => __game.target === __game.ships.find(s=>s.id==="qa-target-2")')
            check(f'{label}: TGT touch cycles target', target_before and target_after,
                  f'first selected={target_before}, second selected={target_after}')
        except Exception as exc:
            check(f'{label}: TGT touch cycles target', False, str(exc))

        power_before = page.evaluate('() => ({...__game.player.pw})')
        try:
            tap(page, '#ets [data-pw="e"]')
            power_after = page.evaluate('() => ({...__game.player.pw})')
            check(f'{label}: power touch shifts engine allocation',
                  power_after['e'] == power_before['e'] + 1,
                  f'{power_before} -> {power_after}')
        except Exception as exc:
            check(f'{label}: power touch shifts engine allocation', False, str(exc))

        try:
            tap(page, '#bpause')
            paused = page.evaluate('() => __game.userPause')
            check(f'{label}: pause touch pauses simulation', paused,
                  f'userPause={paused}; bounds={page.locator("#bpause").bounding_box()}')
            if paused:
                tap(page, '#bpause')
                resumed = not page.evaluate('() => __game.userPause')
                check(f'{label}: pause touch resumes simulation', resumed, f'userPause={not resumed}')
        except Exception as exc:
            check(f'{label}: pause touch sequence', False, str(exc))

        try:
            page.evaluate('() => { __paused=true; __game.updateHud(); }')
            page.wait_for_timeout(60)
            before = page.locator('#radar').evaluate('(el) => el.toDataURL()')
            tap(page, '#brad')
            page.wait_for_timeout(60)
            after = page.locator('#radar').evaluate('(el) => el.toDataURL()')
            check(f'{label}: RAD touch changes displayed range', before != after,
                  'radar canvas changed' if before != after else
                  f'radar canvas unchanged; bounds={page.locator("#brad").bounding_box()}')
        except Exception as exc:
            check(f'{label}: RAD touch changes displayed range', False, str(exc))
        finally:
            page.evaluate('() => { __paused=false; }')

        try:
            fuel_before = page.evaluate("""() => {
              const p=__game.player;
              p.abFuel=p.def.abMax*__game.pwF(p,'e');
              p.throttle=0.5;
              return p.abFuel;
            }""")
            box = page.locator('#bboost').bounding_box()
            if not box:
                raise RuntimeError('#bboost has no visible bounding box')
            touch_at(page, box['x'] + box['width'] / 2, box['y'] + box['height'] / 2, 0.7)
            boost = page.evaluate('() => ({fuel:__game.player.abFuel, active:__game.player.ab})')
            check(f'{label}: BOOST touch activates afterburner',
                  boost['active'] and boost['fuel'] < fuel_before,
                  f"fuel {fuel_before:.3f} -> {boost['fuel']:.3f}; active={boost['active']}")
        except Exception as exc:
            check(f'{label}: BOOST touch activates afterburner', False, str(exc))

        dock_exists = page.locator('#bdock').count() > 0
        check(f'{label}: DOCK touch control exists', dock_exists,
              'found #bdock' if dock_exists else 'no #bdock touch control or touch binding')

        try:
            tap(page, '#bcom')
            comms_open = page.evaluate('() => __game.coms.open')
            check(f'{label}: COMMS touch opens communications', comms_open, f'coms.open={comms_open}')
            if comms_open:
                tap(page, '#bcom')
        except Exception as exc:
            check(f'{label}: COMMS touch opens communications', False, str(exc))

        page.wait_for_timeout(500)
        check(f'{label}: no browser console/page errors', not R.errs,
              f'console={R.errs[:5]}; failed requests={request_failures[:5]}')
        page.close()

print('SUMMARY ' + json.dumps({
    label: {
        'viewport': item['viewport'],
        'overlaps': item['overlaps'],
        'outside_viewport': [c['id'] for c in item['outside_viewport']],
        'under_44px': [{'id': c['id'], 'w': round(c['w'], 1), 'h': round(c['h'], 1)}
                       for c in item['under_44px']],
    }
    for label, item in findings.items()
}, sort_keys=True))
failed = [label for label, passed, _ in checks if not passed]
print('FAILED: ' + (json.dumps(failed) if failed else 'none'))
raise SystemExit(bool(failed))
