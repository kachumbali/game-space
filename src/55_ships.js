// ---- ships ------------------------------------------------------------
function makeShip(defId, team, pos, quat, opts = {}) {
  const def = SHIPS[defId];
  const s = {
    def, team, group: new THREE.Group(), vel: new THREE.Vector3(), throttle: 0.5,
    id: opts.id || null, callsign: opts.callsign || null, grp: opts.grp || null, pilot: opts.pilot || null, vital: !!opts.vital, hold: !!opts.hold,
    shield: { ...def.shield }, abl: {}, structure: def.structure,
    comps: def.comps.map(c => ({ ...c, max: c.hp })), dmgEvents: [],
    lastHit: -99, alive: true, dying: 0, dyT: 0, vox: null, flames: [], shieldFx: null, hitCool: 0, cmCool: 0,
    target: null, lastAttacker: null, kills: 0, drones: [], droneKills: 0, dronesLost: 0, dmgTaken: 0, spawnT: time,
    fm: opts.fm || (flightMode === 'sim' ? 'sim' : 'arcade'), pw: { w: 4, s: 4, e: 4 }, mod: {}, abFuel: def.abMax || 0, abLock: false, ab: false, blindUntil: 0, energy: def.energyMax || 100, energyMax: def.energyMax || 100, skill: clamp(Math.round(opts.skill ?? def.ai?.skill ?? 3), 1, 5),
    ai: { role: opts.ai || def.ai?.role || 'fighter', aggr: def.ai?.aggr ?? 0.8, mode: 'attack', t: 0, aim: new THREE.Vector3(), tgtT: 0, mslT: 8 + Math.random() * 10, cmT: 0, evadeT: 0, dir: Math.random() < 0.5 ? 1 : -1 },
  };
  if (pos) s.group.position.copy(pos);
  if (quat) s.group.quaternion.copy(quat);
  for (const e of def.engines) {
    const f = new THREE.Mesh(flameGeo, flameMat(def.flameColor));
    f.position.set(e.pos[0], e.pos[1], e.pos[2]);
    s.group.add(f);
    s.flames.push({ mesh: f, comp: e.comp, z: e.pos[2], r: e.r || 0.4 });
  }
  if (def.shield.fore + def.shield.aft > 0) {
    const m = new THREE.Mesh(shieldGeo, new THREE.MeshBasicMaterial({
      color: 0x5ac8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    m.scale.set(def.half[0] * 0.95, Math.max(def.half[1], 1.7) * 1.25, def.half[2] * 0.97);
    s.group.add(m); s.shieldFx = m;
  }
  scene.add(s.group);
  ships.push(s);
  if (opts.player) player = s;
  buildVox(s);
  initArmament(s);
  s.group.visible = !(s === player && view === 'cockpit');
  return s;
}
function disposeShip(s) {
  scene.remove(s.group);
  disposeVox(s);
  if (s.shieldFx) { s.shieldFx.geometry !== shieldGeo && s.shieldFx.geometry.dispose(); s.shieldFx.material.dispose(); }
}

// place a ship at pos heading for `toward` (point) at its cruise speed
function spawnShip(defId, team, pos, toward, opts = {}) {
  const q = new THREE.Quaternion();
  const s = makeShip(defId, team, pos, q, opts);
  if (toward) { s.group.lookAt(toward); s.group.rotateY(Math.PI); }
  s.vel.set(0, 0, -1).applyQuaternion(s.group.quaternion).multiplyScalar(s.def.aiSpeed || s.def.maxSpeed * 0.4);
  s.throttle = (s.def.aiSpeed || s.def.maxSpeed * 0.4) / s.def.maxSpeed;
  return s;
}

// ---- endless free-flight waves (testing / practice) ----
function spawnWave() {
  wave++;
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  const kinds = [];
  if (params.has('n')) {
    const F = ['darter', 'leaper', 'darter', 'spitter', 'leaper', 'darter', 'leaper', 'darter'];
    for (let i = 0; i < +params.get('n'); i++) kinds.push(F[i % F.length]);
  } else {
    const n = Math.min(wave + 1, 5);
    for (let i = 0; i < n; i++) kinds.push(i % 3 === 2 ? 'darter' : 'leaper');
    if (wave >= 2) kinds.push('spitter');
    if (wave >= 3) kinds.push('toad');
    if (wave >= 4) kinds.push('reaver');
    if (wave % 5 === 0) kinds.push('gulper');
  }
  for (const kind of kinds) {
    const dir = new THREE.Vector3().randomDirection();
    if (wave === 1) dir.multiplyScalar(0.5).addScaledVector(pf, 0.8);
    dir.normalize();
    const dist = (kind === 'gulper' ? 1500 : 650) + Math.random() * 250;
    const pos = player.group.position.clone().addScaledVector(dir, dist);
    spawnShip(kind, 1, pos, player.group.position, { grp: 'W', skill: +(params.get('fskill') || 3), fm: params.get('aifm') || 'arcade' });
  }
  log(`WAVE ${wave}: ${kinds.length} FROGG CONTACTS`, '#ffd080');
}

function clearWorld() {
  beamsClear();
  for (const s of ships) disposeShip(s);
  for (const m of missiles) { scene.remove(m.mesh); }
  for (const f of flashes) scene.remove(f.m);
  for (const d of debris) { scene.remove(d.mesh); d.mesh.dispose(); if (d.flash) scene.remove(d.flash); }
  ships = []; bolts = []; debris = []; missiles = []; decoys = []; flashes = []; target = null; manualTarget = false; player = null;
  for (const k in killLog) delete killLog[k];
  shake = 0; hitFlash = 0; logs.length = 0; kills = 0; time = 0;
  juiceReset(); lootClear();
  stick.x = stick.y = 0;
}

// free flight
function resetGame() {
  plogReset("free");
  clearWorld();
  game.mode = 'free'; game.mission = null; wave = 0; state = 'play';
  makeShip('kestrel', 0, new THREE.Vector3(), new THREE.Quaternion(), { player: true, callsign: 'MEOW', id: 'player' });
  benchSetup();
  spawnWave();
}

// ---- test-bench flags for free flight (laptop testing) -------------------------------------------------------
//   ?free&n=10        FROGG fighters per wave (default: the built-in wave table)
//   ?free&wing=4      N AI Kestrel wingmen;  &wskill=1..5 their pilot skill (default 3);  &fskill=1..5 FROGG skill
//   ?free&frigate     the Exeter (jump frigate) joins the human side, 700 m astern
//   ?free&drones=N    the player carries N drones (launches up to the control limit, 1 for a fighter; &dlimit=N raises it; &nolaunch keeps them aboard)
//   ?free&nuke=2      the player carries N 0.1 kT warheads (cycle missiles with G; proximity burst 120 m)
//   ?free&aifm=newton AI ships fly under Newtonian rules
function benchSetup() {
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  const nW = +(params.get('wing') || 0), ws = +(params.get('wskill') || 3);
  for (let i = 0; i < nW; i++) {
    const p = player.group.position.clone().addScaledVector(pf, -80).add(new THREE.Vector3((i - (nW - 1) / 2) * 60, (i % 2) * 25, 0));
    const w = makeShip('kestrel', 0, p, new THREE.Quaternion(), { callsign: 'WING' + (i + 1), ai: 'fighter', skill: ws, fm: params.get('aifm') || 'arcade' });
    w.vel.copy(player.vel);
  }
  if (params.has('frigate')) {
    const f = makeShip('exeter', 0, player.group.position.clone().addScaledVector(pf, -700), new THREE.Quaternion(), { callsign: 'EXETER', id: 'exeter', ai: 'capital', hold: true });
    f.vel.set(0, 0, -4);
  }
  if (params.has('drones')) {            // ?drones=N stock (fighter control limit is 1: &dlimit=N overrides); launched at once unless &nolaunch
    player.stores.drone = Math.max(0, +params.get('drones') || 0);
    if (params.has('dlimit')) player.dlimit = Math.max(0, +params.get('dlimit') || 0);
    if (!params.has('nolaunch')) launchDrones(player, 99);
  }
  if (params.has('nuke')) player.stores.nuke = Math.max(1, +params.get('nuke') || 1);
  if (params.has('nukeKt')) player.nukeKt = Math.min(10, Math.max(0.1, +params.get('nukeKt') || 0.5));   // tactical yield dial, kT (owner 2026-10-22): 0.1 minimum, 10 max in-game
}

// ---- distance LOD: ships whose apparent radius (rad) falls below the level's thresholds are rebuilt 1-3 detail steps lower (hysteresis 25%).
// One rebuild per call so a swarm turning at once does not stall a frame; voxelize() caches every resolution it has built.
let lodScan = 0;
function lodTick(dt) {
  const T = LOD_LEVELS[lodLevel];
  lodScan -= dt; if (lodScan > 0) return;
  lodScan = 0.25;
  for (const s of ships) {
    if (!s.alive || s.dying > 0 || !s.vox) continue;
    let nd = 0;
    if (T) {
      const ang = s.def.radius / Math.max(1, s.group.position.distanceTo(camera.position));
      for (let i = 0; i < T.length; i++) if (ang < T[i] * ((s.lodDrop | 0) > i ? 1.25 : 1)) nd = i + 1;
      nd = Math.min(nd, detailIdx);
    }
    if (nd !== (s.lodDrop | 0)) { s.lodDrop = nd; buildVox(s); return; }
  }
}

// ---- fleet tender service (owner decision 2026-10-22: tender ships resupply the magazine rule) ----
// Rearms friendly ships within `def.serviceR`: gun ammo pools toward `ammoMax`, missile/flare stores toward the def, XL slugs toward the weapon's magazine.
// Binding rule kept (AGENTS.md, "docking does not repair"): rearm is not repair - no structure, component or shield restoration.
function tenderTick(dt) {
  for (const t of ships) {
    if (!t.alive || !t.def.tender) continue;
    const R = t.def.serviceR || 600;
    for (const s of ships) {
      if (s === t || !s.alive || s.dying > 0 || s.team !== t.team) continue;
      if (s.group.position.distanceTo(t.group.position) > R) continue;
      const m = (dock && dock.phase === 'docked' && dock.t === t && s === player) ? 1 : 0.5;  // docked: full cassette rate; hovering AI: the slow shuttle trickle (docs/SHIP_CLASSES.md 4)
      for (const k in s.ammoMax) s.ammo[k] = Math.min(s.ammoMax[k], s.ammo[k] + 40 * m * dt);
      for (const T of s.turrets) {
        if (!Number.isFinite(T.ammo)) continue;
        T.ammo = Math.min(T.w.ammo, T.ammo + 40 * m * dt);
        if (T.dry && T.ammo > 0) {
          T.dry = false;
          if (!T.dead) for (const mat of T.mats) mat.color.multiplyScalar(1 / 0.55);
        }
      }
      for (const k in s.def.stores || {}) s.stores[k] = Math.min(s.def.stores[k], s.stores[k] + 0.5 * m * dt);
      if (s.spine) { const M = spineW(s).mag ?? Infinity; s.spine.mag = Math.min(M, s.spine.mag + dt * m / 3); }
    }
  }
}

// ---- tactical docking (owner decision 2026-10-22): TIE-fighter-style rearm at a Tender ----
// Approach a friendly tender within 500 m and press D: the ship auto-docks to a service-boom cradle, holds
// position while ammo cassettes and missile racks go in, and undocks on D again or automatically when full.
// Major-ship docking does not exist in tactical play - the strategic fleet tender's dockings are scripted
// (docs/SHIP_CLASSES.md). Rearm is still not repair (AGENTS.md).
const DOCK_R = 500, DOCK_PT = new THREE.Vector3(36, 2, -56);      // starboard service-boom cradle, tender-local
let dock = null;
function rearmFrac(s) {
  let f = 1;
  for (const k in s.ammoMax) f = Math.min(f, s.ammo[k] / s.ammoMax[k]);
  for (const k in s.def.stores || {}) f = Math.min(f, s.stores[k] / s.def.stores[k]);
  if (s.spine && isFinite(spineW(s).mag ?? Infinity)) f = Math.min(f, s.spine.mag / spineW(s).mag);
  return f;
}
function dockTry() {
  if (state !== 'play' || !player || !player.alive) return;
  if (dock) {                                                     // undock: release with a push away along the boom
    const t = dock.t;
    dock = null;
    player.vel.copy(t.vel).addScaledVector(player.group.position.clone().sub(t.group.position).normalize(), 40);
    log('UNDOCKED', '#ffd24a'); sfx('click');
    return;
  }
  let best = null, bd = DOCK_R;
  for (const t of ships) {
    if (!t.alive || !t.def.tender || t.team !== player.team) continue;
    const d = player.group.position.distanceTo(t.group.position);
    if (d < bd) { bd = d; best = t; }
  }
  if (!best) { log('NO TENDER IN DOCKING RANGE', '#ff5a4a'); return; }
  dock = { t: best, phase: 'approach', t0: time };
  log('DOCKING CLEARANCE GRANTED', '#ffd24a'); sfx('click');
}
function dockTick(dt) {
  if (!dock) return;
  if (!dock.t.alive || dock.t.dying > 0) { dock = null; log('DOCK LOST - TENDER DESTROYED', '#ff5a4a'); return; }
  const wpt = dock.t.group.localToWorld(DOCK_PT.clone());
  if (dock.phase === 'approach') {
    player.vel.multiplyScalar(Math.exp(-2.2 * dt));
    player.group.position.lerp(wpt, 1 - Math.exp(-2.5 * dt));
    player.group.quaternion.slerp(dock.t.group.quaternion, 1 - Math.exp(-2.5 * dt));
    if (time - dock.t0 > 25) { dock = null; log('DOCKING ABORTED - TOO SLOW', '#ff5a4a'); return; }
    if (player.group.position.distanceTo(wpt) < 8) {
      dock.phase = 'docked'; player.vel.copy(dock.t.vel);
      log('DOCKED - REARMING (D TO UNDOCK)', '#ffd24a');
    }
    return;
  }
  // docked: the tender has the ship - position and velocity are its, controls are suspended
  player.group.position.copy(wpt);
  player.vel.copy(dock.t.vel);
  player.group.quaternion.slerp(dock.t.group.quaternion, 1 - Math.exp(-3 * dt));
  if (rearmFrac(player) >= 0.999) {
    const t = dock.t;
    player.vel.copy(t.vel).addScaledVector(player.group.position.clone().sub(t.group.position).normalize(), 40);
    dock = null;
    log('REARM COMPLETE', '#ffd24a'); sfx('click');
  }
}
