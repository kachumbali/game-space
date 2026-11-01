#!/usr/bin/env python3
"""Balance harness (v0.3 M1): seeded time-to-kill matrix and the capital-beam-vs-fighter duel.  READ-ONLY measurement, no balance numbers are changed.

Modes
  ceiling   every shipboard weapon vs every target class with a PERFECT STATIONARY FIRING SOLUTION (a ceiling, not a duel result).
            The real pipeline does the work: fireGuns/fireMount (fixed guns), updateTurrets (turret guns/beams: cadence, energy, beam focus ramp),
            launchMissile + updateMissiles + blastAt (ordnance), spineFire (XL), all through applyHit (shield -> armour -> structure, DMGX, EXPOSED parts).
            Output per cell: time-to-kill from the first shot, rounds fired, hits landed, energy spent, pool damage fraction when it does not die.
  capbeam   an AI Kestrel (skill 3) flies at a capital (Halberd / Exeter / Gulper); seconds until the fighter dies. N seeded runs per cell.
  report    turn the two JSON files into docs/BALANCE_BASELINE.md

Seeds: each seed is one page load (`?seed=N`, mulberry32), all cells of that seed run inside it. Rules of the rig (also printed in the report):
  * the target is a fresh ship, AI frozen (game state 'cine' with no cine running), turrets/mounts/stores removed, hull facing the shooter (head-on),
    the shooter sits at the origin, the target dead ahead at max(350, R + 300) m (clamped under the weapon reach). No countermeasures, no PD.
  * the shooter is a Kestrel (fixed guns, missiles), a Bittern top turret slot whose weapon is swapped (turret weapons), an Exeter / Bullfrog (XL).
  * fighter-doctrine target filters (pdOnly, bigOnly) are lifted for the run: they are AI target selection, not damage.
  * time starts at the first shot (turret slew-in and AI think delay excluded). Energy = shots x weapon energy (the capacitor is kept full).

Usage:  GS_PORT=8801 GS_TEST_DIR=/tmp/gs_ttk1 python3 tools/tests/ttk_matrix.py ceiling --seeds 20 --jobs 4 --out docs/data/ttk_ceiling.json
        python3 tools/tests/ttk_matrix.py capbeam --runs 20 --out docs/data/ttk_capbeam.json
        python3 tools/tests/ttk_matrix.py report --ceiling docs/data/ttk_ceiling.json --capbeam docs/data/ttk_capbeam.json --out docs/BALANCE_BASELINE.md
"""
import argparse, json, math, os, statistics, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
DB = json.load(open(os.path.join(REPO, 'data', 'db.json')))

TARGETS = [  # (id, class label)
    ('merlin', 'light'), ('darter', 'light'), ('kestrel', 'medium'), ('leaper', 'medium'),
    ('bittern', 'heavy/bomber'), ('toad', 'heavy/bomber'), ('reaver', 'heavy/bomber'),
    ('halberd', 'corvette'), ('gulper', 'corvette'), ('exeter', 'frigate'), ('bullfrog', 'capital')]
SKIP = {'nuke', 'flare'}
FIGHTERS = {'merlin', 'darter', 'kestrel', 'leaper', 'bittern', 'toad', 'reaver'}
W = DB['weapons']
def wmode(wid):
    w = W[W[wid].get('base', wid)]
    if w['kind'] == 'msl': return 'msl'
    if w['kind'] == 'spine': return 'spine'
    if w.get('turret'): return 'turret'
    return 'mount'
WEAPONS = [wid for wid in W if wid not in SKIP]
WEAPON_ORDER = ['cannon', 'dgun', 'rotary', 'fang', 'he', 'fmag', 'rail', 'rodg', 'spit', 'spitcannon', 'flaser', 'lance',
                'pd', 'thorn', 'sting', 'laser', 'laserM', 'acidT', 'mdl', 'lanceL', 'ir', 'tick', 'rf', 'torp', 'tad', 'mdxl', 'spine']
WEAPONS = [w for w in WEAPON_ORDER if w in WEAPONS] + [w for w in WEAPONS if w not in WEAPON_ORDER]

# ------------------------------------------------------------------------------------------------ page-side rig
RIG = r"""
window.__rig = (() => {
  const g = __game, T = g.THREE, WP = g.WEAPONS, SH = g.SHIPS;
  const CAP = 120;                                   // sim seconds per gun/beam cell
  const reach = w => w.range || (w.v && w.life ? w.v * w.life : 1500);
  const dist = (tid, w) => { const R = SH[tid].radius; return Math.max(60, Math.min(Math.max(350, R + 300), 0.9 * reach(w))); };
  const pool = s => s.structure + s.shield.fore + s.shield.aft;
  const pool0 = s => s.def.structure + s.def.shield.fore + s.def.shield.aft;
  const gone = s => !s.alive || s.dying > 0;
  function park() { const P = g.player; P.team = 0; P.group.position.set(0, 0, 400000); P.vel.set(0, 0, 0); g.state = 'cine'; }
  function wipe() {
    for (const s of g.ships) if (s !== g.player) { s.alive = false; s.dying = 0; }
    for (const b of g.bolts) b.life = 0;
    for (const m of g.missiles) m.dead = true;
    g.update(0.001);
    g.update(0.001);
  }
  function mkTarget(tid, d, side) {
    const t = g.spawnShip(tid, 1, new T.Vector3(0, 0, -d), new T.Vector3(0, 0, 0));
    t.vel.set(0, 0, 0); t.turrets = []; t.mounts = []; t.stores = {}; t.mod = {}; t.ai.hold = true;
    if (side) t.group.rotateY(Math.PI / 2);                               // broadside to the shooter
    const h = SH[tid].half; t.jit = 0.5 * Math.min(h[0], h[1]); t.d0 = d; t.q0 = t.group.quaternion.clone();
    return t;
  }
  // 'perfect solution' = the aim point is on the hull every step, but position (+-50% of the smaller half-extent) and aspect (+-35 deg yaw, +-20 deg pitch, any roll) are re-drawn
  // each step. A frozen target is not a fair ceiling: dead-centre rounds dig a voxel tunnel and later rounds / beams fly through it (a Kestrel beam-lit head-on stops taking hits after 19).
  const _e = new T.Euler(), _q = new T.Quaternion(), rr = a => (Math.random() * 2 - 1) * a;
  const jitter = t => {
    t.group.position.set(rr(t.jit), rr(t.jit), -t.d0);
    _e.set(rr(0.35), rr(0.6), rr(Math.PI), 'YXZ'); t.group.quaternion.copy(t.q0).multiply(_q.setFromEuler(_e));      // random aspect within about +-35 deg yaw / +-20 deg pitch of head-on, any roll
  };
  function mkShooter(hull) {
    const s = g.spawnShip(hull, 2, new T.Vector3(0, 0, 0), null);
    s.vel.set(0, 0, 0); s.energyMax = 1e9; s.energy = 1e9; s.mod = {}; s.stores = {};
    return s;
  }
  const out = (t, extra) => Object.assign({ pool0: pool0(t) }, extra);
  function result(t, tFirst, now, shots, hits, en, extra) {
    const dead = gone(t);
    return Object.assign({ killed: dead, ttk: dead ? +(now - tFirst).toFixed(3) : null, t: +(now - tFirst).toFixed(2), shots, hits, energy: +en.toFixed(1),
      frac: +Math.max(0, 1 - Math.max(0, pool(t)) / pool0(t)).toFixed(4) }, extra || {});
  }
  function runMount(wid, tid) {
    const w = WP[wid]; park(); wipe();
    const d = dist(tid, w), t = mkTarget(tid, d), s = mkShooter('kestrel');
    s.mounts = [{ w: wid, pos: [0, 0, -3], grp: 1, cool: 0 }]; s.ammo = { [wid]: 1e9 }; s.turrets = [];
    const k = Math.ceil(w.cd / 0.02), dt = w.cd / k;
    let now = 0, tFirst = null, shots = 0;
    while (now < CAP && !gone(t)) {
      const r = g.fireGuns(s, 1); if (r && r.n) { shots += r.n; if (tFirst === null) tFirst = now; }
      s.energy = 1e9; jitter(t); g.update(dt); now += dt;
      if (tFirst !== null && now - tFirst > 20 && 1 - pool(t) / pool0(t) < 0.004) break;
    }
    if (tFirst === null) tFirst = 0;
    const res = result(t, tFirst, now, shots, t.hitsTaken || 0, shots * (w.energy || 0), { d: Math.round(d), track: null });
    wipe(); return res;
  }
  function runTurret(wid, tid) {
    const w = WP[wid]; park(); wipe();
    const saved = { pdOnly: w.pdOnly, bigOnly: w.bigOnly }; w.pdOnly = false; w.bigOnly = false;
    const d = dist(tid, w), t = mkTarget(tid, d), s = mkShooter('bittern');
    s.mounts = [];
    const T0 = s.turrets.find(x => x.comp === 'tur1'); s.turrets = [T0];
    T0.w = w; T0.wid = wid; T0.def = Object.assign({}, T0.def, { w: wid }); T0.cool = 0; T0.thinkT = 0; T0.ammo = Infinity; T0.dry = false;
    const k = Math.ceil(Math.max(w.cd, 0.04) / 0.02), dt = Math.max(w.cd, 0.04) / k;
    let now = 0, tFirst = null;
    while (now < CAP && !gone(t)) {
      s.energy = 1e9; jitter(t); g.update(dt); now += dt;
      if (tFirst === null && T0.fired > 0) tFirst = now - dt;
      if (tFirst !== null && now - tFirst > 20 && 1 - pool(t) / pool0(t) < 0.004) break;
      if (tFirst === null && now > 6) break;                         // never acquired (arc / range)
    }
    const shots = T0.fired;
    const res = tFirst === null ? { killed: false, ttk: null, t: 0, shots: 0, hits: 0, energy: 0, frac: 0, noacq: true, d: Math.round(d) }
      : result(t, tFirst, now, shots, t.hitsTaken || 0, shots * (w.energy || 0), { d: Math.round(d) });
    w.pdOnly = saved.pdOnly; w.bigOnly = saved.bigOnly;
    wipe(); return res;
  }
  function runMissile(wid, tid, side, salvo, gap, jit) {
    // salvo > 1: that many missiles are launched `gap` s apart (one lock, as a bomber would), then the rig waits for all of them to resolve before the next salvo
    const w = WP[wid]; park(); wipe(); salvo = salvo || 1; gap = gap || 0.9;
    const d = Math.min(SH[tid].radius + 700, 0.8 * w.range + SH[tid].radius), t = mkTarget(tid, d, side), s = mkShooter('kestrel');
    s.mounts = []; s.turrets = []; s.stores = { [wid]: 999 };
    let now = 0, n = 0, hits = 0; const per = [];
    while (n < 60 && !gone(t) && now < 900) {
      const before = pool(t), ms = [];
      for (let k = 0; k < salvo && n < 60; k++) {
        if (jit) jitter(t);      // same re-drawn position / aspect as the gun rig, so seeds differ (default: the fixed head-on / broadside geometry of the baseline)
        s.lock = { tgt: t, wid, p: 1, state: 'locked', d, ang: 0 };
        if (!g.launchMissile(s, wid)) break;
        n++; ms.push(g.missiles[g.missiles.length - 1]);
        if (k < salvo - 1) { for (let u = 0; u < Math.round(gap / 0.025); u++) { g.update(0.025); now += 0.025; } }
      }
      if (!ms.length) break;
      let guard = 0;
      while (ms.some(m => !m.dead) && guard < 2400) { g.update(0.025); now += 0.025; guard++; }
      const dealt = Math.max(0, before - Math.max(0, pool(t))); per.push(+dealt.toFixed(1));
      if (dealt > 0) hits++;
      g.update(0.025); now += 0.025;
    }
    const dead = gone(t);
    const res = { killed: dead, ttk: dead ? +now.toFixed(2) : null, t: +now.toFixed(2), shots: n, hits, energy: 0, frac: +Math.max(0, 1 - Math.max(0, pool(t)) / pool0(t)).toFixed(4), per: per.slice(0, 12), d: Math.round(d) };
    wipe(); return res;
  }
  function runSpine(wid, tid) {
    const w = WP[wid]; park(); wipe();
    const hull = wid === 'spine' ? 'bullfrog' : 'exeter';
    const d = Math.max(700, SH[tid].radius + 800), t = mkTarget(tid, d), s = mkShooter(hull);
    s.turrets = []; s.mounts = s.mounts.filter(m => m.store === 'spine'); s.stores = { spine: 999 };
    if (!s.spine) g.spineInit(s);
    s.spine.mag = 999;
    let now = 0, n = 0, hits = 0; const per = [];
    const C = w.charge;
    while (n < 14 && !gone(t)) {
      const before = pool(t), h0 = t.hitsTaken || 0;
      const rec = g.spineFire(s); n++;
      g.update(0.02); now += 0.02;
      hits += (t.hitsTaken || 0) > h0 ? 1 : 0; per.push(+Math.max(0, before - Math.max(0, pool(t))).toFixed(1));
      if (gone(t)) break;
      for (let u = 0; u < 60; u++) { g.update(0.5); now += 0.5; }     // the 30 s cooldown (shield regen runs)
    }
    const res = { killed: gone(t), ttk: gone(t) ? +(C + (n - 1) * w.cd).toFixed(1) : null, t: +now.toFixed(1), shots: n, hits, energy: n * w.energy, frac: +Math.max(0, 1 - Math.max(0, pool(t)) / pool0(t)).toFixed(4), per: per.slice(0, 8), d: Math.round(d) };
    wipe(); return res;
  }
  function cell(wid, tid, aspect, salvo, jit) {
    const m = WP[wid].kind === 'msl' ? 'msl' : WP[wid].kind === 'spine' ? 'spine' : WP[wid].turret ? 'turret' : 'mount';
    return m === 'msl' ? runMissile(wid, tid, aspect === 'side', salvo || 1, 0.9, jit) : m === 'spine' ? runSpine(wid, tid) : m === 'turret' ? runTurret(wid, tid) : runMount(wid, tid);
  }
  // ---- capital beam duel: AI Kestrel (skill 3) flies at a capital -----------------------------------------------------
  function duel(capId, variant, seed) {
    park(); wipe(); g.state = 'play';
    for (const b of g.bolts) b.life = 0;
    const cap = g.spawnShip(capId, 1, new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -5000), { skill: 3 });
    cap.mod.take = 0.02;                                     // the capital stays up (shields and turrets stay live); the fighter is the measured side
    cap.vel.set(0, 0, 0);
    if (variant === 'beams') {
      cap.turrets = cap.turrets.filter(x => x.w.kind === 'beam');
      cap.mounts = cap.mounts.filter(m => WP[m.w].kind === 'beam' || m.store);
    }
    const nBeam = cap.turrets.filter(x => x.w.kind === 'beam').length + cap.mounts.filter(m => WP[m.m || m.w].kind === 'beam').length;
    const dir = new T.Vector3(); do { dir.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.6, Math.random() - 0.5); } while (dir.lengthSq() < 0.01);
    dir.normalize();
    const R = SH[capId].radius, d0 = Math.max(1400, R + 1100);
    const k = g.spawnShip('kestrel', 0, dir.clone().multiplyScalar(d0), cap.group.position.clone(), { skill: 3 });
    let now = 0, tHit = null, tBeam = null, beamSteps = 0;
    while (now < 150 && k.alive && !k.dying) {
      g.update(0.05); now += 0.05;
      if (tHit === null && (k.hitsTaken || 0) > 0) tHit = now;
      if (Math.abs(k.lastHit - g.time) < 1e-9 && k.lastKind === 'beam') { beamSteps++; if (tBeam === null) tBeam = now; }      // a beam pulse landed in this step
      if (!cap.alive) break;
    }
    const res = { died: !(k.alive && !k.dying), t: +now.toFixed(2), tHit: tHit === null ? null : +tHit.toFixed(2), dead_after_hit: (tHit !== null && !(k.alive && !k.dying)) ? +(now - tHit).toFixed(2) : null,
      tBeam: tBeam === null ? null : +tBeam.toFixed(2), dead_after_beam: (tBeam !== null && !(k.alive && !k.dying)) ? +(now - tBeam).toFixed(2) : null, beamSteps,
      hits: k.hitsTaken || 0, hull: +(k.structure / k.def.structure).toFixed(2), capAlive: cap.alive, nBeam, d0: Math.round(d0), kind: k.lastKind || null };
    g.state = 'cine'; wipe(); return res;
  }
  const reseed = n => { let a = n >>> 0 || 1; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  return { cell, duel, CAP, reseed };
})();
"""

# ------------------------------------------------------------------------------------------------ drivers
def run_ceiling_seed(seed, cells, R, salvo=1, jit=False, pg=None):
    own = pg is None
    if own:
        pg = R.page(320, 180, f'?free&n=0&wing=0&seed={seed}&q=low')
        pg.wait_for_timeout(500)
        pg.evaluate('()=>{__paused=true}')
        pg.evaluate(RIG)
    else:
        pg.evaluate('s=>__rig.reseed(s)', seed)      # --inpage: one page load for all seeds, the PRNG is re-seeded between them (same mulberry32)
    out = {}
    for wid, tid in cells:
        for asp in (['head', 'side'] if (wmode(wid) == 'msl' and tid not in FIGHTERS) else ['head']):
            t0 = time.time()
            r = pg.evaluate('([w,t,a,n,j])=>__rig.cell(w,t,a,n,j)', [wid, tid, asp, salvo if wmode(wid) == 'msl' else 1, jit])
            out[f'{wid}|{tid}' + ('|side' if asp == 'side' else '') + (f'|salvo{salvo}' if salvo > 1 and wmode(wid) == 'msl' else '')] = r
            print(f'seed {seed} {wid:10s} {tid:9s} {asp:4s} killed={r["killed"]} ttk={r["ttk"]} shots={r["shots"]} frac={r["frac"]} ({time.time()-t0:.1f}s)', flush=True)
    if own: pg.close()
    return out

def run_capbeam_seed(seed, caps, variants, R):
    pg = R.page(320, 180, f'?free&n=0&wing=0&seed={seed}&q=low')
    pg.wait_for_timeout(500)
    pg.evaluate('()=>{__paused=true}')
    pg.evaluate(RIG)
    out = {}
    for cap in caps:
        for var in variants:
            r = pg.evaluate('([c,v,s])=>__rig.duel(c,v,s)', [cap, var, seed])
            out[f'{cap}|{var}'] = r
            print(f'seed {seed} {cap:8s} {var:6s} {r}', flush=True)
    pg.close()
    return out

def child(args):
    sys.path.insert(0, HERE)
    from lib import Runner
    res = {}
    with Runner() as R:
        pg0 = None
        if args.inpage and args.mode == 'ceiling':
            pg0 = R.page(320, 180, f'?free&n=0&wing=0&seed={args.seed_list[0]}&q=low'); pg0.wait_for_timeout(500)
            pg0.evaluate('()=>{__paused=true}'); pg0.evaluate(RIG)
        for seed in args.seed_list:
            if args.mode == 'ceiling':
                cells = [(w, t) for w in args.weapons for t in args.targets]
                res[str(seed)] = run_ceiling_seed(seed, cells, R, args.salvo, args.jitter, pg0)
            else:
                res[str(seed)] = run_capbeam_seed(seed, args.caps, args.variants, R)
            json.dump(res, open(args.out, 'w'))
    return res

def spawn_jobs(args, seeds):
    jobs = max(1, args.jobs)
    chunks = [seeds[i::jobs] for i in range(jobs)]
    procs = []
    base_port = int(os.environ.get('GS_PORT', '8800'))
    for i, ch in enumerate(chunks):
        if not ch: continue
        env = dict(os.environ, GS_PORT=str(base_port + i), GS_TEST_DIR=f'/tmp/gs_ttk_{base_port + i}')
        sd = env['GS_TEST_DIR']
        os.makedirs(sd, exist_ok=True)
        nm = sd + '/node_modules'
        if not os.path.exists(nm) and os.path.isdir('/tmp/gs_test/node_modules'): os.symlink('/tmp/gs_test/node_modules', nm)
        part = f'{args.out}.part{i}'
        cmd = [sys.executable, os.path.abspath(__file__), args.mode, '--child', '--seed-list', ','.join(map(str, ch)), '--out', part,
               '--salvo', str(args.salvo), *(['--jitter'] if args.jitter else []), *(['--inpage'] if args.inpage else []), '--weapons', ','.join(args.weapons), '--targets', ','.join(args.targets), '--caps', ','.join(args.caps), '--variants', ','.join(args.variants)]
        procs.append((subprocess.Popen(cmd, env=env), part))
    for p, _ in procs: p.wait()
    merged = {}
    for _, part in procs:
        if os.path.exists(part): merged.update(json.load(open(part))); os.remove(part)
    json.dump(merged, open(args.out, 'w'))
    return merged

# ------------------------------------------------------------------------------------------------ report
def pct(x): return f'{100*x:.0f}%'
def med(v): return statistics.median(v) if v else None
def fmt_t(v):
    if v is None: return '-'
    return f'{v:.1f}' if v < 100 else f'{v:.0f}'

def cell_stats(runs):
    """runs: list of per-seed results for one cell"""
    n = len(runs); k = [r for r in runs if r['killed']]
    out = {'n': n, 'kills': len(k)}
    if k:
        out['ttk'] = statistics.mean(r['ttk'] for r in k); out['ttk_min'] = min(r['ttk'] for r in k); out['ttk_max'] = max(r['ttk'] for r in k)
        out['shots'] = statistics.mean(r['shots'] for r in k); out['hits'] = statistics.mean(r['hits'] for r in k); out['energy'] = statistics.mean(r['energy'] for r in k)
    fr = statistics.mean(r['frac'] for r in runs); tt = statistics.mean(r['t'] for r in runs)
    out['frac'] = fr; out['t_mean'] = tt
    out['noacq'] = sum(1 for r in runs if r.get('noacq'))
    out['est'] = (tt / fr) if (fr > 0 and not k) else None
    return out

def cell_str(st, what):
    if st['noacq'] == st['n']: return 'no acq'
    if st['kills'] == 0:
        if st['frac'] < 0.01: return 'immune'
        if what != 'ttk': return f'no kill ({pct(st["frac"])})'
        return f'>{st["t_mean"]:.0f} s ({pct(st["frac"])}) est {fmt_t(st["est"])}'
    if what == 'ttk': s = fmt_t(st['ttk'])
    elif what == 'shots': s = f'{st["shots"]:.0f}'
    elif what == 'energy': s = f'{st["energy"]:.0f}'
    else: s = '?'
    if st['kills'] < st['n']: s += f' ({st["kills"]}/{st["n"]})'
    return s

def report(args):
    ceil = json.load(open(args.ceiling)) if args.ceiling else {}
    cap = json.load(open(args.capbeam)) if args.capbeam else {}
    L = []
    P = L.append
    P('# Balance baseline (v0.3 M1)\n')
    P('Status: **measured, not tuned**. Nothing in `data/db.json` was changed to produce these numbers. Generated by `tools/tests/ttk_matrix.py`; do not edit by hand, re-run the commands below.\n')
    P('All times are **sim-seconds** (real time = sim / 0.375). Headless SwiftShader, `?seed=N` mulberry32 (deterministic per seed).\n')
    P('## How it was measured\n')
    seeds = sorted(ceil.keys(), key=int)
    P('Reproduce (about 30 to 90 min on 4 jobs; weapons x targets x seeds):\n')
    P('```\nGS_PORT=8800 python3 tools/tests/ttk_matrix.py ceiling --seeds %d --jobs 3 --out docs/data/ttk_ceiling.json\nGS_PORT=8900 python3 tools/tests/ttk_matrix.py capbeam --runs 20 --out docs/data/ttk_capbeam.json\npython3 tools/tests/ttk_matrix.py report --ceiling docs/data/ttk_ceiling.json --capbeam docs/data/ttk_capbeam.json --out docs/BALANCE_BASELINE.md\n```\n' % max(1, len(seeds)))
    P('Ceiling seeds: %s. Capital-beam seeds: %s.\n' % (','.join(seeds) if seeds else '-', ','.join(sorted(cap.keys(), key=int)) if cap else '-'))
    P('**Ceiling rig** (a best case for the weapon, not a duel): shooter stationary, target stationary and head-on at max(350, R+300) m (clamped under reach), no countermeasures, no point defence, target AI frozen, shooter capacitor/magazine never empty. '
      'Time starts at the first shot (turret slew-in excluded). Guns: Kestrel fixed mount; turrets: a Bittern top turret slot with the weapon swapped in (so cadence, energy gate, aim tolerance, beam acquisition and focus ramp are the real `updateTurrets` code); '
      'missiles: launched one at a time from a locked Kestrel, the next only after the previous resolved (shield regen between them is real); XL: `spineFire` on an Exeter / Bullfrog with the 30 s cooldown run between shots (time = charge + (n-1) x cooldown). '
      'The pipeline is the game\'s own (`applyHit`: shield, armour with class threshold, structure, DMGX, EXPOSED parts, pierce, beam focus). '
      '`pdOnly` / `bigOnly` AI target filters are lifted for the run (doctrine, not damage). Gun cells are capped at %d sim-s; a cell that does not die shows `>cap s (pool damage %%) est T`, where est = linear extrapolation t / fraction and `immune` means under 1%% of the shield+structure pool in the run.\n' % 120)
    P('Cell entries marked `(k/n)` killed in k of n seeds only. Tracking: turret `track` field, rad/s converted to deg/s (head slew rate; the ship-relative lead is already perfect); missile `turn`, rad/s at full speed; fixed guns have no tracking of their own (the pilot or ship turns them).\n')

    # weapon table
    P('## Weapon reference (from db.json)\n')
    P('| id | name | mode | dmg | type | rate /s | range m | energy/shot | pierce | track deg/s | missile turn deg/s |')
    P('|---|---|---|---|---|---|---|---|---|---|---|')
    for wid in WEAPONS:
        w = W[wid]; m = wmode(wid)
        rate = ''
        if w.get('cd') and m != 'spine': rate = f'{1/w["cd"]:.2f}' if w['cd'] > 0.2 else f'{1/w["cd"]:.1f}'
        if m == 'spine': rate = f'1 / {w["cd"]:.0f} s (+{w["charge"]:.0f} s charge)'
        rng = w.get('range') or (round(w['v'] * w['life']) if w.get('v') and w.get('life') else '')
        trk = f'{math.degrees(w["track"]):.0f}' if w.get('track') else ('-' if m != 'msl' else '')
        trn = f'{math.degrees(w["turn"]):.0f}' if w.get('turn') else ''
        dm = w.get('dmg', '')
        if isinstance(dm, float): dm = round(dm, 1)
        P(f'| {wid} | {w["name"]} | {m} | {dm} | {w.get("dt", "exp" if m == "msl" else "")} | {rate} | {rng} | {w.get("energy", "")} | {w.get("pierce", "")} | {trk} | {trn} |')
    P('')

    if ceil:
        by = {}
        for sd, cells in ceil.items():
            for key, r in cells.items(): by.setdefault(key, []).append(r)
        st = {k: cell_stats(v) for k, v in by.items()}
        tnames = [t for t, _ in TARGETS]
        hdr = '| weapon | ' + ' | '.join(f'{t}' for t in tnames) + ' |'
        sep = '|---|' + '---|' * len(tnames)
        P('Target classes: ' + ', '.join(f'{t} ({c})' for t, c in TARGETS) + '.\n')
        for what, title, unit in (('ttk', 'Time to kill (sim s, mean over seeds)', ''), ('shots', 'Rounds / pulses / missiles fired per kill', ''), ('energy', 'Energy per kill (capacitor units; Kestrel capacitor is 100)', '')):
            P(f'## {title}\n'); P(hdr); P(sep)
            for wid in WEAPONS:
                if what == 'energy' and not W[wid].get('energy') and W[wid]['kind'] != 'beam' and wmode(wid) != 'spine':
                    if not any(W[wid].get('energy') for _ in [0]):
                        row = [cell_str(st[f'{wid}|{t}'], 'energy') if f'{wid}|{t}' in st and st[f'{wid}|{t}']['kills'] == 0 else ('0' if f'{wid}|{t}' in st else '') for t in tnames]
                        P(f'| {wid} | ' + ' | '.join(row) + ' |'); continue
                row = []
                for t in tnames:
                    s = st.get(f'{wid}|{t}')
                    row.append(cell_str(s, what) if s else '')
                P(f'| {wid} | ' + ' | '.join(row) + ' |')
            P('')
        P('## Spread of TTK (min-max over seeds, kills only)\n'); P(hdr); P(sep)
        for wid in WEAPONS:
            row = []
            for t in tnames:
                s = st.get(f'{wid}|{t}')
                row.append(f'{s["ttk_min"]:.1f}-{s["ttk_max"]:.1f}' if s and s['kills'] and wmode(wid) not in ('msl', 'spine') else '')
            P(f'| {wid} | ' + ' | '.join(row) + ' |')
        P('')
        P('## Missiles and torpedoes broadside (target turned 90 degrees; corvettes, frigate, capital)\n')
        P('Head-on hits on a long hull detonate at the nose, outside the 0.62 R sphere that `blastAt` measures from (hullGap is only used for R > 150), so SW-9 / LN-3 / SK-1 do nothing to a Halberd or Gulper bow-on. Broadside the same missiles do damage.\n')
        P('| weapon | halberd | gulper | exeter | bullfrog |'); P('|---|---|---|---|---|')
        for wid in WEAPONS:
            if wmode(wid) != 'msl': continue
            row = []
            for t in ('halberd', 'gulper', 'exeter', 'bullfrog'):
                k = f'{wid}|{t}|side'
                row.append(f'{cell_str(st[k], "shots")} missiles / {cell_str(st[k], "ttk")} s' if k in st and st[k]['kills'] else (cell_str(st[k], 'shots') if k in st else ''))
            P(f'| {wid} | ' + ' | '.join(row) + ' |')
        P('')
        P('## Fighter turn-rate fields, for comparison with turret tracking (deg/s)\n')
        P('`turn` in db.json x 2.85 (32_scale.js, fighters) x 1.5 more for FROGG fighters; this is the controller limit, not a measured angular rate in a fight.\n')
        P('| ship | turn field | deg/s nominal |'); P('|---|---|---|')
        for t, _ in TARGETS[:7]:
            sh = DB['ships'][t]; k = 2.85 * (1.5 if sh['fac'] == 'frogg' else 1)
            P(f'| {t} | {sh["turn"]} | {math.degrees(sh["turn"] * k):.0f} |')
        P('')
        P('## Missile / torpedo hits and damage per hit (first 12 missiles, mean over seeds, pool units = shield + structure)\n')
        P('| weapon | target | missiles to kill | pool damage per missile |'); P('|---|---|---|---|')
        for wid in WEAPONS:
            if wmode(wid) != 'msl' and wmode(wid) != 'spine': continue
            for t in tnames:
                runs = by.get(f'{wid}|{t}')
                if not runs or wmode(wid) == 'spine' and False: continue
                r = runs[0]
                P(f'| {wid} | {t} | {cell_str(st[f"{wid}|{t}"], "shots")} | {", ".join(str(x) for x in r.get("per", [])[:8])} |')
        P('')
    if cap:
        P('## Capital beams vs a manoeuvring fighter (the reported problem)\n')
        P('An AI Kestrel (skill 3, weapons free, real AI: approach, attack runs, evasion, flares, missiles) spawns at 1400 m or more from a capital in a random seeded direction and flies at it. '
          'The capital runs its real AI and turrets but takes 2% damage (`mod.take` 0.02) so it stays alive and its shields and turrets stay live. Run ends when the Kestrel dies or at 150 sim-s. '
          '`full` = the ship\'s whole armament; `beams` = beam turrets and beam mounts only (rails, rotary, PD, mass drivers removed), isolating the beam threat. '
          '"to death" = seconds from the start of the run; "after first beam hit" = seconds from the first beam pulse that landed on the Kestrel to its death (the "time under beam fire" the 3 s target is about; a pulse is 4/s on LS-2); fast kills = share of ALL runs killed within 3 s of the first beam hit (a death by guns, or a survivor, counts as not fast).\n')
        P('| capital | variant | beam weapons | runs | fighter died | to death mean | min | median | after first beam hit mean | min | median | killed within 3 s of first beam hit | within 10 s | runs with a beam hit |')
        P('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
        rows = {}
        for sd, cells in cap.items():
            for key, r in cells.items(): rows.setdefault(key, []).append(r)
        for key, runs in rows.items():
            c, v = key.split('|'); n = len(runs)
            died = [r for r in runs if r['died']]
            td = [r['t'] for r in died]; ah = [r['dead_after_beam'] for r in died if r.get('dead_after_beam') is not None]
            f3 = sum(1 for r in runs if r['died'] and r.get('dead_after_beam') is not None and r['dead_after_beam'] <= 3.0)
            f10 = sum(1 for r in runs if r['died'] and r.get('dead_after_beam') is not None and r['dead_after_beam'] <= 10.0)
            nb = sum(1 for r in runs if r.get('tBeam') is not None)
            def ms(v_):
                return (f'{statistics.mean(v_):.1f}', f'{min(v_):.1f}', f'{statistics.median(v_):.1f}') if v_ else ('-', '-', '-')
            a = ms(td); b = ms(ah)
            P(f'| {c} | {v} | {runs[0]["nBeam"]} | {n} | {len(died)}/{n} | {a[0]} | {a[1]} | {a[2]} | {b[0]} | {b[1]} | {b[2]} | {f3}/{n} ({pct(f3/n)}) | {f10}/{n} ({pct(f10/n)}) | {nb}/{n} |')
        P('')
    P('## Findings and limits (written by hand into the generator; re-check after any re-run)\n')
    P('''- **Capital beams did NOT reproduce as a 3 s fighter killer here.** Against an AI Kestrel (skill 3) 0 of 20 runs per cell died within 3 s of the first beam hit; Exeter (12 beams) kills in about 11 s median after the first beam hit with its full armament, 19 s with beams alone; a lone Halberd pair of LS-2 takes 35 s median (6 of 20 survive 150 s with beams only). The owner's report probably comes from a human pilot flying straighter and slower than the skill-3 AI, from several turrets focusing at once on a stationary or head-on fighter (the ceiling table: one LS-8 kills a Merlin in 5.7 s, a Darter in 2.2 s, a Leaper in 2.9 s; twelve of them in parallel would be roughly an order of magnitude faster; extrapolation, not measured), or from the focus ramp starting instantly after a previous target. Not measured: a human pilot, flares/afterburner use by the player.
- **Ceiling vs fighters, single beam turret:** LS-8 2.2-5.7 s on Merlin/Darter/Leaper/Toad/Reaver and 9.4 s on Kestrel, M-8 lance (L) 1.6-2.4 s on Darter/Leaper/Toad/Reaver, M-7 lance (fixed) 1.8-3.7 s. Targets want >= 3 s for any capital gun; XL spine kills a fighter in one shot (5-6 s charge) if the solution is perfect, which the AI never attempts (capitalAI skips fighters).
- **Small PD turrets (pd, thorn, sting) take 24-95 s to kill a fighter** (single turret, stationary): they are PD, not anti-fighter guns, at their present numbers.
- **Missiles are far from "1-2 hits to kill".** Per-missile mean hits to kill: Merlin 4, Darter 3-4, Kestrel 7-13, Leaper 4-5, Toad 6-8, Reaver 7-10, Bittern 16-24 (SW-9 / SK-1 / LN-3); torpedoes: Merlin 2, Darter 1, Kestrel 3, Bittern 4-7. The first missile does most of its damage to the shield; later ones are mostly absorbed by armour (composite/ablative thresholds on small blasts).
- **Fighter missiles do nothing to a corvette head-on** (blast measured from a 0.62 R sphere, so a nose hit on Halberd/Gulper is out of blast range): `immune` in the head-on table, 29-38 missiles broadside.
- **Torpedoes vs frigate:** HM-1 / ST-2 need 32 / 25 head-on (23 / 20 broadside) to kill an Exeter (pool 3300), so about 3-5% of its pool each, against a target of 10-15%. Bullfrog 42 / 35.
- **Not measured:** weapons against moving targets (hit probability, tracking-rate contests), flares/chaff/PD interception of missiles, nuke, XL tracking vs fighters (only the stationary perfect-solution shot), Bullfrog as duel capital (it launches 36 fighters), a human pilot, real-GPU timing. Spine cells use fresh 30 s cooldowns with shield regen; head-on aspect only for guns (random +-35 yaw).''')
    P('')
    open(args.out, 'w').write('\n'.join(L) + '\n')
    print('wrote', args.out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['ceiling', 'capbeam', 'report'])
    ap.add_argument('--seeds', type=int, default=20)
    ap.add_argument('--runs', type=int, default=20)
    ap.add_argument('--first-seed', type=int, default=1)
    ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--weapons', default=','.join(WEAPONS))
    ap.add_argument('--targets', default=','.join(t for t, _ in TARGETS))
    ap.add_argument('--caps', default='halberd,exeter,gulper')
    ap.add_argument('--variants', default='full,beams')
    ap.add_argument('--out', default='/tmp/ttk_out.json')
    ap.add_argument('--salvo', type=int, default=1, help='ceiling: missiles per salvo (launched 0.9 s apart), keys get a |salvoN suffix')
    ap.add_argument('--jitter', action='store_true', help='ceiling missiles: re-draw target position / aspect before every launch (seeds then differ)')
    ap.add_argument('--inpage', action='store_true', help='ceiling: load the page once and re-seed Math.random between seeds (a page load costs minutes on a loaded machine)')
    ap.add_argument('--child', action='store_true')
    ap.add_argument('--seed-list', default='')
    ap.add_argument('--ceiling'); ap.add_argument('--capbeam')
    a = ap.parse_args()
    if a.mode == 'report': return report(a)
    a.weapons = a.weapons.split(','); a.targets = a.targets.split(','); a.caps = a.caps.split(','); a.variants = a.variants.split(',')
    if a.child:
        a.seed_list = [int(x) for x in a.seed_list.split(',')]
        return child(a)
    n = a.seeds if a.mode == 'ceiling' else a.runs
    seeds = list(range(a.first_seed, a.first_seed + n))
    if a.jobs > 1: spawn_jobs(a, seeds)
    else:
        a.seed_list = seeds; child(a)

if __name__ == '__main__':
    main()
