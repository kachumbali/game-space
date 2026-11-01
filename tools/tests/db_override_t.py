# Dev db override (?db=<relative url>) and marks: edit a temp copy of data/db.json, load it with ?db=, assert the in-game values changed
# WITHOUT rebuilding index.html. Also checks marks resolution (base + mods -> complete def) and that tools/validate_db.py accepts / rejects marks.
# Run: python3 db_override_t.py   (GS_PORT / GS_TEST_DIR to run beside another test)
import copy, json, os, subprocess, sys
from lib import *
bad = 0
def check(name, ok, info=''):
    global bad
    print(('PASS ' if ok else 'FAIL ') + name, info, flush=True)
    if not ok: bad += 1
VALIDATE = os.path.join(REPO, 'tools', 'validate_db.py')
raw = json.load(open(os.path.join(REPO, 'data', 'db.json')))

def variant(fn):
    d = copy.deepcopy(raw); fn(d); return d
def mod(d):
    d['weapons']['cannon']['dmg'] = 7
    d['tuning']['dmgx']['kin'][0] = 0.5
    d['tuning']['regen']['shieldDelay'] = 9
    d['weapons']['cannon_2'] = {'base': 'cannon', 'mark': 'II', 'mods': {'dmg': {'mul': 1.1}, 'cd': {'mul': 0.92}}}
    d['ships']['kestrel_2']['mods']['mounts.0.w'] = {'set': 'cannon_2'}
    d['ships']['kestrel_2']['mods']['maxSpeed'] = {'mul': 1.2}
mod_db = variant(mod)
SP_DB = os.path.join(SP, 'db_t.json')
os.makedirs(SP, exist_ok=True)
json.dump(mod_db, open(SP_DB, 'w'))

G = """()=>{const g=__game;return {cannon:g.WEAPONS.cannon.dmg,kin:g.DMGX.kin[0],src:g.DB_SRC,ks:g.SHIPS.kestrel.maxSpeed,k2:g.SHIPS.kestrel_2&&{
  id:g.SHIPS.kestrel_2.id,name:g.SHIPS.kestrel_2.name,mark:g.SHIPS.kestrel_2.mark,base:g.SHIPS.kestrel_2.base,v:g.SHIPS.kestrel_2.maxSpeed,
  w0:g.SHIPS.kestrel_2.mounts[0].w,np:g.SHIPS.kestrel_2.prims.length,sh:g.SHIPS.kestrel_2.shield.fore,turn:g.SHIPS.kestrel_2.turn},
  c2:g.WEAPONS.cannon_2&&{name:g.WEAPONS.cannon_2.name,dmg:g.WEAPONS.cannon_2.dmg,cd:g.WEAPONS.cannon_2.cd},kp:g.SHIPS.kestrel.prims.length,kturn:g.SHIPS.kestrel.turn}}"""

with Runner() as R:
    pg = R.page(640, 360, '?free&go'); pg.wait_for_timeout(800)
    b = pg.evaluate(G)
    check('embedded db by default', b['src'] == 'embedded' and b['cannon'] == 3 and b['kin'] == 0.7, b)
    base_w = pg.evaluate("()=>JSON.stringify(__game.WEAPONS)")
    k2 = b['k2']
    check('embedded kestrel_2 resolved into a complete def', k2 and k2['id'] == 'kestrel_2' and k2['name'] == 'KESTREL II' and k2['mark'] == 'II' and k2['base'] == 'kestrel'
          and abs(k2['v'] - b['ks'] * 1.1) < 1e-6 and k2['np'] == b['kp'] and abs(k2['turn'] - b['kturn']) < 1e-9, k2)
    # an ordinary def: spawn it, fly, shoot
    r = pg.evaluate("""()=>{const g=__game;__paused=true;const T=g.THREE;const s=g.makeShip('kestrel_2',0,new T.Vector3(0,0,-400),new T.Quaternion(),{callsign:'MK2'});
      g.spawnShip('leaper',1,new T.Vector3(0,0,-1200),null,{});for(let i=0;i<200;i++)g.update(0.05);return {alive:s.alive,name:s.def.name,v:s.def.maxSpeed}}""")
    check('kestrel_2 spawns and the sim steps', r['alive'] and r['name'] == 'KESTREL II', r)
    check('no console errors (embedded)', not R.errs, R.errs[:3])

with Runner() as R:
    pg = R.page(640, 360, '?free&go&db=data/db.json'); pg.wait_for_timeout(800)
    r = pg.evaluate(G); w = pg.evaluate("()=>JSON.stringify(__game.WEAPONS)")
    check('?db=data/db.json is used and equals the embedded copy', r['src'] == 'data/db.json' and w == base_w and r['cannon'] == 3, r['src'])
    check('?free&go still reaches play with the override', pg.evaluate("()=>__game.state") == 'play', pg.evaluate("()=>__game.state"))
    check('no console errors (override)', not R.errs, R.errs[:3])

with Runner() as R:
    pg = R.page(640, 360, '?free&go&db=db_t.json'); pg.wait_for_timeout(800)
    r = pg.evaluate(G)
    check('?db= edited weapon damage reaches WEAPONS (no rebuild)', r['cannon'] == 7 and r['src'] == 'db_t.json', r)
    check('?db= edited tuning reaches the game', r['kin'] == 0.5, r['kin'])
    check('weapon mark resolved: cannon_2 = cannon x1.1 dmg, x0.92 cd, name suffix', r['c2'] and abs(r['c2']['dmg'] - 7.7) < 1e-6 and abs(r['c2']['cd'] - 0.0782) < 1e-6 and r['c2']['name'] == 'MK-20 CANNON II', r['c2'])
    check('ship mark swaps mount weapon and edited delta applies', r['k2']['w0'] == 'cannon_2' and abs(r['k2']['v'] - r['ks'] * 1.2) < 1e-6, r['k2'])
    # the edited number is what actually flies: fire the player's guns and read the bolt damage
    f = pg.evaluate("""()=>{const g=__game;__paused=true;const p=g.player;for(let i=0;i<20;i++)g.update(0.05);const n0=g.bolts.length;g.fireGuns(p,p.fireMask);
      return {n:g.bolts.length-n0,dmg:(g.bolts.find(b=>b.wid==='cannon')||{}).dmg}}""")
    check('fired bolt carries the edited damage', f['n'] > 0 and f['dmg'] == 7, f)
    check('no console errors (edited override)', not R.errs, R.errs[:3])

with Runner() as R:
    pg = R.page(640, 360, '?free&go&db=nope_missing.json'); pg.wait_for_timeout(800)
    r = pg.evaluate(G)
    check('missing override file falls back to the embedded db', r['src'] == 'embedded' and r['cannon'] == 3, r['src'])

# validator: accepts the edited copy, rejects broken marks
def val(d):
    p = os.path.join(SP, 'db_v.json'); json.dump(d, open(p, 'w'))
    c = subprocess.run([sys.executable, VALIDATE, p], capture_output=True, text=True)
    return c.returncode, c.stdout
rc, out = val(mod_db)
check('validate_db accepts the edited copy with weapon + ship marks', rc == 0, out.strip().splitlines()[:3])
def mk(**kw):
    def f(d):
        e = d['ships']['kestrel_2']
        for k, v in kw.items():
            if v is None: e.pop(k, None)
            else: e[k] = v
    return f
cases = {
    'missing base': mk(base='nonexistent'),
    'unknown entry key': mk(bogus=1),
    'bad mark numeral': mk(mark='V'),
    'wrong name suffix': mk(name='KESTREL MK2'),
    'delta outside band': mk(mods={'maxSpeed': {'mul': 1.6}}),
    'unknown path': mk(mods={'maxSpeeed': {'mul': 1.1}}),
    'geometry in mods': mk(mods={'half.0': {'mul': 1.1}}),
    'two ops': mk(mods={'maxSpeed': {'mul': 1.1, 'add': 1}}),
}
for name, fn in cases.items():
    rc, out = val(variant(fn))
    check(f'validate_db rejects: {name}', rc == 1, out.strip().splitlines()[1:2])
def torp(d):
    d['weapons']['torp_2'] = {'base': 'torp', 'mark': 'II', 'mods': {'range': {'mul': 1.02}}}
rc, out = val(variant(torp)); check('validate_db rejects a torpedo mark without +8..12% range', rc == 1, out.strip().splitlines()[1:2])
def torp_ok(d):
    d['weapons']['torp_2'] = {'base': 'torp', 'mark': 'II', 'mods': {'range': {'mul': 1.1}, 'life': {'mul': 1.1}, 'vmax': {'mul': 1.03}, 'hp': {'mul': 1.1}}}
rc, out = val(variant(torp_ok)); check('validate_db accepts a good torpedo mark', rc == 0, out.strip().splitlines()[:2])
print('FAILURES:', bad)
sys.exit(1 if bad else 0)
