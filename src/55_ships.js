// ---- ships ------------------------------------------------------------
function makeShip(defId, team, pos, quat) {
  const def = SHIPS[defId];
  const s = {
    def, team, group: new THREE.Group(), vel: new THREE.Vector3(), throttle: 0.5,
    shield: { ...def.shield }, armor: { ...def.armor }, structure: def.structure,
    comps: def.comps.map(c => ({ ...c, max: c.hp })), dmgEvents: [],
    lastHit: -99, cool: 0, alive: true, vox: null, flames: [], shieldFx: null,
    ai: { mode: 'attack', t: 0, aim: new THREE.Vector3() },
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
  if (team === 0) player = s;
  buildVox(s);
  s.group.visible = !(s === player && view === 'cockpit');
  return s;
}
function disposeShip(s) {
  scene.remove(s.group);
  disposeVox(s);
  if (s.shieldFx) { s.shieldFx.geometry !== shieldGeo && s.shieldFx.geometry.dispose(); s.shieldFx.material.dispose(); }
}

function spawnWave() {
  wave++;
  const nRaid = Math.min(wave + 1, 5), nReav = Math.max(0, Math.min(Math.floor(wave / 3), 2));
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  const kinds = [...Array(nRaid).fill('leaper'), ...Array(nReav).fill('reaver')];
  for (const kind of kinds) {
    const dir = new THREE.Vector3().randomDirection();
    if (wave === 1) dir.multiplyScalar(0.5).addScaledVector(pf, 0.8);
    dir.normalize();
    const pos = player.group.position.clone().addScaledVector(dir, 450 + Math.random() * 250);
    const e = makeShip(kind, 1, pos, new THREE.Quaternion());
    e.group.lookAt(player.group.position);
    e.group.rotateY(Math.PI);
    e.vel.set(0, 0, -1).applyQuaternion(e.group.quaternion).multiplyScalar(e.def.aiSpeed);
  }
  log(`WAVE ${wave}: ${kinds.length} FROGG CONTACTS`, '#ffd080');
}

function resetGame() {
  for (const s of ships) disposeShip(s);
  for (const b of bolts) scene.remove(b.mesh);
  for (const d of debris) { scene.remove(d.mesh); d.mesh.dispose(); if (d.flash) scene.remove(d.flash); }
  ships = []; bolts = []; debris = []; target = null; manualTarget = false;
  wave = 0; kills = 0; state = 'play'; shake = 0; hitFlash = 0; logs.length = 0;
  makeShip('kestrel', 0, new THREE.Vector3(), new THREE.Quaternion());
  stick.x = stick.y = 0;
  spawnWave();
}
