// ======================================================================
//  BULLFROG — FROGG 600 m spine carrier (docs/BULLFROG.md): spine lance (charge, telegraph, cooldown), heavy lance / acid / thorn turrets,
//  36-fighter hangar, AI role 'lancer', Gulper escort rules, fighter keep-out of the spine corridor, jump spool.
//  Everything here is looked up at run time (parts 60/65/70 call the functions below); the only load-time use of earlier parts is WEAPONS.
//  Test seam: globalThis.__bf.
// ======================================================================
// weapons defined in data/db.json (merged into DB.weapons)
const BF = {
  spineDelay: 15, charge: 6, freeze: 1.5, cd: 30, fizzleCd: 8, lockHold: 3, range: 3200, bandIn: 2300, bandOut: 2400, bandMin: 1200, bandFar: 1500,
  hangarInterval: 4.5, hangarCap: 12, emergencyInterval: 1.5, spoolT: 20, corridorHalf: 0.12,
  manifest: { D: 6, L: 5, S: 2, T: 2, R: 3 }, kind: { D: 'darter', L: 'leaper', S: 'spitter', T: 'toad', R: 'reaver' },
  seq: ['D', 'L', 'D', 'R', 'L', 'D', 'T', 'L', 'S', 'R'],
};
const _bv = new THREE.Vector3(), _bw = new THREE.Vector3(), _bf = new THREE.Vector3(), _bu = new THREE.Vector3(), _br = new THREE.Vector3(), _bfm = new THREE.Vector3(), _be = new THREE.Vector3();
const bfLog = [];      // shot / launch / event log for tests
const isBullfrog = s => s.ai && s.ai.role === 'lancer';
const bfHostile = (s, e) => e.alive && !e.dying && e.team !== s.team;
const bfBig = e => e.def.cls === 'capital' || e.def.cls === 'frigate';
// XL mains (FROGG spine, Exeter mass driver) are mounts with store:'spine'; the weapon entry carries the whole cycle (charge/lockT/cd/delay/...)
const spineMountOf = s => s.def.mounts.find(m => m.store === 'spine');
const spineW = s => WEAPONS[spineMountOf(s).w];

// ---------------------------------------------------------------- spine
function spineInit(s) {
  return (s.spine = { st: 'cool', t: 0, cd: spineW(s).delay ?? BF.spineDelay, tgt: null, aimPt: new THREE.Vector3(), shots: [], want: false, toneT: 0, fx: null, holdT: 0, C: spineW(s).charge, mag: spineW(s).mag ?? Infinity, startedAt: -99 });
}
function spineMuzzle(s, out) { const m = spineMountOf(s); s.group.updateMatrixWorld(true); return s.group.localToWorld(out.set(m.pos[0], m.pos[1], m.pos[2])); }
// friendly (any class, own fighters included) on the nose line within range: the ray is `bw` m wide, add its width and the other ship's radius
function spineCorridorClear(s) {
  spineMuzzle(s, _bfm);
  const R = spineW(s).range + 100;
  _bf.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  for (const f of ships) {
    if (f === s || !f.alive || f.dying || f.team !== s.team) continue;
    _bv.copy(f.group.position).sub(_bfm);
    const along = _bv.dot(_bf);
    if (along < -f.def.radius || along > R) continue;
    if (_bv.addScaledVector(_bf, -along).length() < f.def.radius * 0.9 + 3 + 10) return false;
  }
  for (const m of missiles) {
    if (m.dead || m.team !== s.team) continue;
    _bv.copy(m.pos).sub(_bfm);
    const along = _bv.dot(_bf);
    if (along > 0 && along < R && _bv.addScaledVector(_bf, -along).length() < 25) return false;
  }
  return true;
}
function spineFxGet(s) {
  if (s.spine.fx) return s.spine.fx;
  const m = spineMountOf(s), W = spineW(s), lc = new THREE.Color(W.color).lerp(new THREE.Color(0xffffff), 0.35);
  const mk = (geo, col, op) => { const x = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); x.frustumCulled = false; x.visible = false; s.group.add(x); return x; };
  const fx = { glow: mk(new THREE.SphereGeometry(1, 12, 8), W.color, 0.7), line: mk(new THREE.BoxGeometry(1, 1, 1), lc, 0.8), beam: mk(new THREE.BoxGeometry(1, 1, 1), W.color, 0.8), core: mk(new THREE.BoxGeometry(1, 1, 1), 0xffffff, 1), fireT: -99, beamLen: 0 };
  fx.glow.position.set(m.pos[0], m.pos[1], m.pos[2]);
  return (s.spine.fx = fx);
}
function spineFxUpdate(s) {
  const sp = s.spine, fx = spineFxGet(s), m = spineMountOf(s), W = spineW(s), charging = sp.st === 'charge' || sp.st === 'lock';
  fx.glow.visible = charging && sp.t > 0.3;
  if (fx.glow.visible) { const k = sp.t / sp.C; fx.glow.scale.setScalar(2 + 16 * k * k + (sp.st === 'lock' ? 2 * Math.sin(time * 30) : 0)); fx.glow.material.opacity = 0.35 + 0.5 * k; }
  fx.line.visible = sp.st === 'lock';                                     // thin aim line from the freeze on
  if (fx.line.visible) { const L = sp.lineLen || W.range; fx.line.scale.set(0.9, 0.9, L); fx.line.position.set(m.pos[0], m.pos[1], m.pos[2] - L / 2); }
  const age = time - fx.fireT;
  fx.beam.visible = fx.core.visible = age >= 0 && age < 0.8;
  if (fx.beam.visible) {
    const L = fx.beamLen, f = 1 - age / 0.8;
    fx.beam.scale.set(W.bw * (0.5 + 0.5 * f), W.bw * (0.5 + 0.5 * f), L); fx.beam.position.set(m.pos[0], m.pos[1], m.pos[2] - L / 2); fx.beam.material.opacity = 0.7 * f;
    fx.core.scale.set(3, 3, L); fx.core.position.copy(fx.beam.position);
  }
}
// ray along the nose line from the muzzle; first ship whose hull it crosses takes the hit (fighters: distance test, others: five voxel traces across the 12 m width)
function spineFire(s) {
  const sp = s.spine, W = spineW(s);
  spineMuzzle(s, _bfm);
  _bf.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  _br.set(1, 0, 0).applyQuaternion(s.group.quaternion); _bu.set(0, 1, 0).applyQuaternion(s.group.quaternion);
  _be.copy(_bfm).addScaledVector(_bf, W.range);
  let best = null, bestD = 1e9, bestLocal = null;
  for (const o of ships) {
    if (!o.alive || o === s || o.dying) continue;
    if (!segSphere(_bfm, _be, o.group.position, o.def.radius + W.bw)) continue;
    if (o.def.cls === 'fighter') {
      _bv.copy(o.group.position).sub(_bfm);
      const along = _bv.dot(_bf);
      if (along < 0 || along > W.range) continue;
      if (_bv.addScaledVector(_bf, -along).length() < W.bw / 2 + 0.5 * o.def.radius && along < bestD) { bestD = along; best = o; bestLocal = new THREE.Vector3(); }
    } else {
      for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = _bw.copy(_bfm).addScaledVector(_br, ox * W.bw * 0.4).addScaledVector(_bu, oy * W.bw * 0.4);
        const b = _bv.copy(a).addScaledVector(_bf, W.range);
        const h = traceShip(o, a, b);
        if (!h) continue;
        const d = o.group.localToWorld(h.clone()).sub(_bfm).dot(_bf);
        if (d < bestD) { bestD = d; best = o; bestLocal = h; }
      }
    }
  }
  const fx = spineFxGet(s);
  fx.fireT = time; fx.beamLen = best ? bestD : W.range;
  sfx(W.sfx, 0, 1); sfx('boom', 0, 1.2);
  const rec = { t: +time.toFixed(1), tgt: sp.tgt ? sp.tgt.def.id : null, hit: best ? best.def.id : null, hitTeam: best ? best.team : null, hitPlayer: best === player };
  if (best) {
    const wp = best.group.localToWorld(bestLocal.clone()), fr = best.team === s.team;
    rec.str0 = Math.round(best.structure); rec.sh0 = Math.round(best.shield.fore + best.shield.aft);
    if (!fr) { best.lastAttacker = s; } else if (best === player) friendlyNote(s, best);
    hitSrc = s; hitKind = 'beam'; applyHit(best, bestLocal, W.dmg * (fr ? FF.bolt : 1), wp, W.dt, W.pierce, true);
    if (best.alive && best.vox && best.def.cls !== 'fighter') { chip(best, bestLocal, 5, 10, false); flashAt(wp, 40, 0.6); sparksAt(wp, 60, 40); fireAt(wp, 20, 14); }
    rec.str1 = Math.round(best.structure); rec.dead = !best.alive || best.dying > 0;
    if (best === player) shake = 1;
  }
  sp.shots.push(rec); bfLog.push({ ev: 'spine', by: s.callsign || 'BF', ...rec });
  sp.mag--;
  return rec;
}
// per-frame spine machine; lancerAI supplies s.spine.tgt / want. Returns an aim point while charging (the ship keeps turning onto it until the freeze)
function spineStep(s, dt) {
  const sp = s.spine || spineInit(s), m = spineMountOf(s), W = WEAPONS[m.w], em = compOf(s, m.comp);
  const slow = em && em.hp / em.max < 0.5 ? 1.5 : 1;
  sp.C = W.charge * slow;
  if (!em || em.hp <= 0) { sp.st = 'off'; spineFxUpdate(s); return null; }
  let aim = null;
  if (sp.st === 'cool') { sp.cd -= dt; if (sp.cd <= 0) sp.st = 'ready'; }
  else if (sp.st === 'charge' || sp.st === 'lock') {
    const t = sp.tgt;
    sp.t += dt;
    if (!t || !t.alive || t.dying) { sp.st = 'cool'; sp.cd = W.fizzleCd ?? BF.fizzleCd; bfLog.push({ ev: 'fizzle', why: 'target gone', t: +time.toFixed(1) }); }
    else if (sp.st === 'charge') {
      const rem = Math.max(0, sp.C - sp.t);
      aim = sp.aimPt.copy(t.group.position).addScaledVector(_bv.copy(t.vel).sub(s.vel), Math.min(8, rem));
      if (sp.t >= sp.C - W.lockT) {
        const err = aimError(s, aim), dist = s.group.position.distanceTo(t.group.position);
        const tol = clamp(0.45 * t.def.radius / Math.max(1, dist), 0.012, 0.04);
        if (err > tol) { sp.st = 'cool'; sp.cd = W.fizzleCd ?? BF.fizzleCd; bfLog.push({ ev: 'fizzle', why: 'aim ' + err.toFixed(3) + '>' + tol.toFixed(3), t: +time.toFixed(1) }); aim = null; }
        else { sp.st = 'lock'; sp.holdT = 0; sp.lineLen = Math.min(W.range, dist + t.def.radius); aim = null; }
      }
    }
    if (sp.st === 'lock') {
      if (sp.t >= sp.C) {
        if (!spineCorridorClear(s)) { sp.holdT += dt; if (sp.holdT > (W.lockHold ?? BF.lockHold)) { sp.st = 'cool'; sp.cd = 10; bfLog.push({ ev: 'fizzle', why: 'friendly in line', t: +time.toFixed(1) }); } }
        else { spineFire(s); sp.st = 'cool'; sp.cd = W.cd * slow; }
      }
    }
    if (sp.st === 'charge' || sp.st === 'lock') spineWarn(s, sp, dt);
  }
  spineFxUpdate(s);
  return aim;
}
// HUD / sound: charging at the player, at a friendly of the player, or with the player near the nose line
function spineWarn(s, sp, dt) {
  const p = player; if (!p || !p.alive || s.team === p.team) return;
  const t = sp.tgt; let kind = null;
  if (t === p) kind = 'you';
  else if (t && t.team === p.team) kind = 'ally';
  else {
    _bf.set(0, 0, -1).applyQuaternion(s.group.quaternion);
    _bv.copy(p.group.position).sub(s.group.position);
    const d = _bv.length();
    if (d < 4000 && _bv.angleTo(_bf) < (spineW(s).corridorHalf ?? BF.corridorHalf)) kind = 'near';
  }
  if (!kind) return;
  const wn = spineW(s).warnName || 'SPINE';
  warnState.spine = { t: time, kind, lock: sp.st === 'lock', prog: Math.min(1, sp.t / sp.C), name: t ? (t.callsign || t.def.name) : '?', wn };
  if (sp.warnLogT === undefined || time - sp.warnLogT > 8) { sp.warnLogT = time; log(kind === 'ally' ? `${wn} CHARGING AT ${warnState.spine.name}` : `${wn} CHARGING`, '#ff5a4a'); sfx('alarm'); }
  sp.toneT -= dt;
  if (sp.toneT <= 0) { const k = warnState.spine.prog; tone(300 + 900 * k, 320 + 1000 * k, 0.12, 'sawtooth', 0.09); sp.toneT = Math.max(0.1, 0.55 - 0.45 * k); }
}

// ---------------------------------------------------------------- hangar
function hangarInit(s) {
  const cfg = s.hangarCfg || {};
  const mk = (id, comp, off) => { const man = {}; for (const k in BF.manifest) man[k] = Math.round(BF.manifest[k] * (cfg.count ?? 36) / 36); return { id, comp, man, t: off, cur: 0, lost: false, launched: 0 }; };
  return (s.hangar = { bays: [mk('A', 'bayA', 0), mk('B', 'bayB', (cfg.interval ?? BF.hangarInterval) / 2)], out: [], open: false, launched: 0, lostManifest: 0, cap: cfg.cap ?? BF.hangarCap, interval: cfg.interval ?? BF.hangarInterval, emergency: false, log: [] });
}
function bayLeft(b) { let n = 0; for (const k in b.man) n += b.man[k]; return n; }
function hangarPick(s, b) {
  const hs = ships.filter(e => bfHostile(s, e));
  const capitalNear = hs.some(e => bfBig(e) && e.group.position.distanceTo(s.group.position) < 4000);
  const corvette = hs.some(e => e.def.cls === 'corvette');
  const okC = c => b.man[c] > 0 && (c !== 'T' || capitalNear) && (c !== 'S' || corvette);
  for (let i = 0; i < BF.seq.length; i++) { const c = BF.seq[(b.cur + i) % BF.seq.length]; if (okC(c)) { b.cur = (b.cur + i + 1) % BF.seq.length; return c; } }
  for (const c of ['D', 'L', 'R', 'S']) if (b.man[c] > 0) return c;       // leftovers (spitters with no corvette in sight)
  return null;
}
function hangarLaunch(s, b, cls) {
  const bay = compOf(s, b.comp), H = s.hangar;
  b.man[cls]--; b.launched++; H.launched++;
  if (compState(bay) === 1 && Math.random() < 0.1) { H.log.push({ t: +time.toFixed(1), lostOnRail: cls }); return null; }      // damaged bay: 10% lost on the rail
  s.group.updateMatrixWorld(true);
  const pos = s.group.localToWorld(new THREE.Vector3(bay.pos[0], -(s.def.half[1] + 14), bay.pos[2]));
  const f = makeShip(BF.kind[cls], s.team, pos, s.group.quaternion.clone(), { grp: s.grp, skill: s.skill });
  f.vel.copy(s.vel).addScaledVector(_bv.set(0, -1, 0).applyQuaternion(s.group.quaternion), 30);
  f.carrier = s; f.hitCool = 2; f.ai.mode = 'attack';
  bfLog.push({ ev: 'launch', t: +time.toFixed(1), bay: b.id, cls });
  return f;
}
function hangarUpdate(s, dt) {
  const H = s.hangar || hangarInit(s);
  H.out = H.out.filter(f => f.alive && !f.dying);
  for (const b of H.bays) {                                     // destroyed bay: the unlaunched manifest is lost
    const c = compOf(s, b.comp);
    if (c.hp <= 0 && !b.lost) { b.lost = true; const n = bayLeft(b); H.lostManifest += n; for (const k in b.man) b.man[k] = 0; bfLog.push({ ev: 'bayLost', bay: b.id, lost: n, t: +time.toFixed(1) }); if (n) log(`FROGG HANGAR BAY ${b.id} DESTROYED (${n} FIGHTERS LOST)`, '#9dff7a'); }
  }
  if (!H.open) {
    if (time - s.lastHit < 3 || ships.some(e => bfHostile(s, e) && e.group.position.distanceTo(s.group.position) < 4000)) { H.open = true; bfLog.push({ ev: 'bays open', t: +time.toFixed(1) }); }
    else return;
  }
  const iv = H.emergency ? BF.emergencyInterval : H.interval, cap = H.emergency ? 99 : H.cap;
  for (const b of H.bays) {
    b.t -= dt;
    const bay = compOf(s, b.comp);
    if (b.t > 0 || bay.hp <= 0 || !bayLeft(b)) continue;
    if (H.out.length >= cap) { b.t = 0; continue; }
    const cls = hangarPick(s, b);
    if (!cls) continue;
    b.t = iv * (compState(bay) === 1 && !H.emergency ? 1.6 : 1);
    const f = hangarLaunch(s, b, cls); if (f) H.out.push(f);
  }
}

// ---------------------------------------------------------------- AI
function lancerPick(s) {
  const ai = s.ai, cur = s.target;
  const valid = cur && cur.alive && !cur.dying && cur.team !== s.team;
  const nose = _bf.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  let forced = false;
  if (valid && cur.def.cls === 'fighter') for (const e of ships) if (bfHostile(s, e) && bfBig(e)) { _bv.copy(e.group.position).sub(s.group.position); const d = _bv.length(); if (d < 2500 && _bv.angleTo(nose) < 0.35) forced = true; }
  if (valid && time - (ai.tgtSince ?? -99) < 20 && !forced) return cur;
  let best = null, bs = 1e12;
  for (const e of ships) {
    if (!bfHostile(s, e)) continue;
    _bv.copy(e.group.position).sub(s.group.position);
    const d = _bv.length(), th = _bv.angleTo(nose);
    const w = bfBig(e) ? 0.5 : e.def.cls === 'corvette' ? 0.8 : e.def.ai?.role === 'bomber' ? 1.4 : 4;
    const sc = d * w * (1 + 1.5 * th / Math.PI);
    if (sc < bs) { bs = sc; best = e; }
  }
  ai.tgtSince = time;
  return best;
}
function bfSpoolCheck(s) {
  const hp = s.structure / s.def.structure, g = id => compOf(s, id).hp <= 0;
  return hp < 0.25 || (g('shieldF') && g('shieldA') && hp < 0.4) || (g('spine') && g('L1') && hp < 0.5);
}
function lancerAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  const sp = s.spine || spineInit(s), H = s.hangar || hangarInit(s);
  if (ai.mslT > 12 && !ai.bfInit) { ai.bfInit = true; ai.mslT = 12; }
  if (!ai.bfInit) { ai.bfInit = true; ai.mslT = 12; }
  // ---- jump spool (6.6)
  if (ai.mode !== 'spool' && bfSpoolCheck(s)) { ai.mode = 'spool'; ai.spoolT = 0; H.emergency = true; H.open = true; bfLog.push({ ev: 'spool', t: +time.toFixed(1), str: Math.round(100 * s.structure / s.def.structure) }); log('FROGG BULLFROG IS SPOOLING A JUMP', '#ffd24a'); }
  hangarUpdate(s, dt);
  spineStep(s, dt);
  if (ai.mode === 'spool') {
    ai.spoolT += dt;
    let foe = null, bd = 1e12;
    for (const e of ships) if (bfHostile(s, e) && !e.def.drone) { const d = e.group.position.distanceTo(ep) * (bfBig(e) ? 0.5 : 1); if (d < bd) { bd = d; foe = e; } }
    if (foe) { _bv.copy(ep).sub(foe.group.position).normalize().multiplyScalar(2000).add(ep); turnToward(s, _bv, dt, 1); }
    aiFly(s, { throttle: 1 }, dt);
    if (ai.spoolT >= BF.spoolT && !ai.noJump) {
      flashAt(ep, s.def.radius * 2, 1); sfx('jump'); log('FROGG BULLFROG JUMPED OUT', '#9dff7a'); bfLog.push({ ev: 'jump', t: +time.toFixed(1) });
      s.jumped = true; s.alive = false; return;
    }
    return;
  }
  sp.tgt = t; sp.want = false;
  if (!t) { aiFly(s, { throttle: 0.1 }, dt); return; }
  const dist = ep.distanceTo(t.group.position), big = t.def.cls !== 'fighter';
  const lp = leadPoint(s, t, 1e6).clone();
  // ---- movement state machine
  let thr = 0.1;
  if (big) {
    if (ai.mode === 'spool' || ai.mode === 'attack' || ai.mode === 'hold') ai.mode = dist > BF.bandIn ? 'close' : 'station';
    if (ai.mode === 'close' && dist < BF.bandIn) ai.mode = 'station';
    else if (ai.mode === 'station' && dist > BF.bandOut) ai.mode = 'close';
    else if (ai.mode === 'station' && dist < BF.bandMin) ai.mode = 'open';
    else if (ai.mode === 'open' && dist > BF.bandFar) ai.mode = 'station';
    thr = ai.mode === 'close' ? 0.7 : ai.mode === 'station' ? 0.15 : 0;
  } else ai.mode = 'hold';
  // ---- spine: start a charge (needs a slug in the magazine)
  if (sp.st === 'ready' && big && dist < spineW(s).range * 0.95 && s.energy >= spineW(s).energy && sp.mag > 0) {
    sp.want = true;
    const tm = s.def.turn * turnMul(s), err = aimError(s, lp);
    if (err / tm <= 4.5 && spineCorridorClear(s)) {
      s.energy -= spineW(s).energy; sp.st = 'charge'; sp.t = 0; sp.startedAt = time; sp.warnLogT = undefined;
      bfLog.push({ ev: 'charge', t: +time.toFixed(1), tgt: t.def.id, dist: Math.round(dist) });
    }
  }
  const aim = sp.st === 'charge' ? sp.aimPt : lp;
  if (sp.st !== 'lock') turnToward(s, aim, dt, 1);
  aiFly(s, { throttle: sp.st === 'lock' ? Math.min(thr, 0.15) : thr }, dt);
  // ---- Tadpoles: capital / corvette target, solid lock, 350 < d < 0.7 x range, nothing of ours already guided at it, long reload
  const tubes = compOf(s, 'tubes');
  if (big && tubes.hp > 0 && s.stores.tad > 0) {
    s.sel = missileIds(s).indexOf('tad');
    lockUpdate(s, dt * skillV(s, 'react'));
    const d = s.lock.d;
    if (s.lock.state === 'locked' && ai.mslT <= 0 && s.lock.tgt === t && d < WEAPONS.tad.range * 0.7 && d > 350 && Math.random() < dt * 0.8) {
      if (!missiles.some(m => !m.dead && m.team === s.team && m.target === t)) {
        launchMissile(s, 'tad'); ai.mslT = 18 + Math.random() * 8; s.tadsLaunched = (s.tadsLaunched || 0) + 1;
      }
    }
  }
}

// ---- fighters launched from a Bullfrog: keep out of the spine corridor; after the carrier is gone fight on 30 s, then break contact
function bfFighterHook(s, dt) {
  const c = s.carrier; if (!c) return false;
  const ep = s.group.position;
  if (!c.alive) {
    s.orphanT = (s.orphanT || 0) + dt;
    if (s.orphanT < 30) return false;
    let foe = null, bd = 1e12;
    for (const e of ships) if (bfHostile(s, e)) { const d = e.group.position.distanceTo(ep); if (d < bd) { bd = d; foe = e; } }
    if (!foe || bd > 3000) { s.cleanT = (s.cleanT || 0) + dt; if (s.cleanT > 5) { s.alive = false; } }
    if (foe) { _bv.copy(ep).sub(foe.group.position).normalize().multiplyScalar(800).add(ep); turnToward(s, _bv, dt, 1); }
    aiFly(s, { throttle: 1, ab: true }, dt);
    return true;
  }
  const sp = c.spine;
  if (!sp || !(sp.st === 'charge' || sp.st === 'lock' || (sp.st === 'ready' && sp.want))) return false;
  spineMuzzle(c, _bfm);
  _bf.set(0, 0, -1).applyQuaternion(c.group.quaternion);
  _bv.copy(ep).sub(_bfm);
  const along = _bv.dot(_bf);
  if (along < -40 || along > 3500) return false;
  _bw.copy(_bv).addScaledVector(_bf, -along);
  const per = _bw.length();
  if (per > along * BF.corridorHalf + 40) return false;
  if (per < 1) _bw.set(0, 1, 0).applyQuaternion(c.group.quaternion); else _bw.multiplyScalar(1 / per);
  _bv.copy(ep).addScaledVector(_bw, 600).addScaledVector(_bf, 100);
  turnToward(s, _bv, dt, 1.2);
  aiFly(s, { throttle: 1, ab: s.abFuel > s.def.abMax * 0.3 }, dt);
  return true;
}

// ---- Gulper escort (6.7): hold station ahead and to the side of the Bullfrog, never in the spine corridor, within a leash
function escortPick(s) {
  const bfs = s.ai.escort; if (!bfs || !bfs.alive) return null;
  let best = null, bd = 1e12, pass = 0;
  for (const phase of [0, 1, 2]) {
    for (const e of ships) {
      if (!bfHostile(s, e)) continue;
      const dB = e.group.position.distanceTo(bfs.group.position);
      const ok = phase === 0 ? (e.def.cls === 'fighter' && dB < 2200) : phase === 1 ? (e.def.cls === 'corvette' && dB < 2600) : (bfBig(e) && dB < 1500);
      if (!ok) continue;
      const d = e.group.position.distanceTo(s.group.position);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) return best;
  }
  return null;
}
function escortAI(s, dt) {
  const b = s.ai.escort; if (!b || !b.alive) return false;
  const ai = s.ai, ep = s.group.position;
  ai.escortSide ??= (ships.filter(e => e.ai && e.ai.escort === b).indexOf(s) % 2 ? -1 : 1);
  _bf.set(0, 0, -1).applyQuaternion(b.group.quaternion);
  _br.set(1, 0, 0).applyQuaternion(b.group.quaternion);
  _bv.copy(ep).sub(b.group.position);
  const along = _bv.dot(_bf), per = _bw.copy(_bv).addScaledVector(_bf, -along).length();
  const inCorr = per < 250 + s.def.radius && along > -100 && along < 3300, far = _bv.length() > 1400;
  if (!inCorr && !far) return false;
  const st = _bu.copy(b.group.position).addScaledVector(_bf, 750).addScaledVector(_br, ai.escortSide * 575);
  turnToward(s, st, dt, 1);
  aiFly(s, { throttle: 0.9 }, dt);
  return true;
}

globalThis.__bf = { resFor, blastAt, BF, spineInit, spineStep, spineFire, spineCorridorClear, hangarInit, hangarUpdate, lancerAI, lancerPick, log: bfLog, escortAI, escortPick, bfFighterHook };
