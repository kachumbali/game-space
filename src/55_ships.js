// ---- ships ------------------------------------------------------------
function makeShip(defId, team, pos, quat, opts = {}) {
  const def = SHIPS[defId];
  const s = {
    def, team, group: new THREE.Group(), vel: new THREE.Vector3(), throttle: 0.5,
    id: opts.id || null, callsign: opts.callsign || null, grp: opts.grp || null, pilot: opts.pilot || null, vital: !!opts.vital, hold: !!opts.hold,
    shield: { ...def.shield }, abl: {}, structure: def.structure,
    comps: def.comps.map(c => ({ ...c, max: c.hp })), dmgEvents: [],
    lastHit: -99, alive: true, dying: 0, dyT: 0, vox: null, flames: [], shieldFx: null, hitCool: 0, cmCool: 0,
    target: null, lastAttacker: null, kills: 0, dmgTaken: 0, spawnT: time,
    fm: opts.fm || 'arcade', blindUntil: 0, energy: 100, skill: clamp(Math.round(opts.skill ?? def.ai?.skill ?? 3), 1, 5),
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
  for (const s of ships) disposeShip(s);
  for (const m of missiles) { scene.remove(m.mesh); }
  for (const f of flashes) scene.remove(f.m);
  for (const d of debris) { scene.remove(d.mesh); d.mesh.dispose(); if (d.flash) scene.remove(d.flash); }
  ships = []; bolts = []; debris = []; missiles = []; decoys = []; flashes = []; target = null; manualTarget = false; player = null;
  for (const k in killLog) delete killLog[k];
  shake = 0; hitFlash = 0; logs.length = 0; kills = 0; time = 0;
  stick.x = stick.y = 0;
}

// free flight
function resetGame() {
  clearWorld();
  game.mode = 'free'; game.mission = null; wave = 0; state = 'play';
  makeShip('kestrel', 0, new THREE.Vector3(), new THREE.Quaternion(), { player: true, callsign: 'ECHO', id: 'player' });
  benchSetup();
  spawnWave();
}

// ---- test-bench flags for free flight (laptop testing) -------------------------------------------------------
//   ?free&n=10        FROGG fighters per wave (default: the built-in wave table)
//   ?free&wing=4      N AI Kestrel wingmen;  &wskill=1..5 their pilot skill (default 3);  &fskill=1..5 FROGG skill
//   ?free&frigate     the Exeter (jump frigate) joins the human side, 700 m astern
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
  if (params.has('nuke')) player.stores.nuke = Math.max(1, +params.get('nuke') || 1);
}
