// ======================================================================
//  UPDATE
// ======================================================================
const _dq = new THREE.Quaternion();
const _eu = new THREE.Euler();

function updatePlayer(dt) {
  const s = player;
  const kb = (a, b) => (keys.has(a) ? 1 : 0) - (keys.has(b) ? 1 : 0);
  const pitch = clamp(-stick.y + kb('ArrowUp', 'ArrowDown'), -1, 1);
  const yaw = clamp(-stick.x + kb('ArrowLeft', 'ArrowRight'), -1, 1);
  const roll = kb('KeyQ', 'KeyE');
  const tm = turnMul(s);
  _eu.set(pitch * 1.6 * tm * dt, yaw * 1.1 * tm * dt, roll * 2.2 * tm * dt, 'XYZ');
  s.group.quaternion.multiply(_dq.setFromEuler(_eu)).normalize();
  s.throttle = clamp(s.throttle + kb('KeyW', 'KeyS') * 0.6 * dt, 0, 1);
  const ab = keys.has('ShiftLeft') || keys.has('ShiftRight');
  flightModels[flightMode](s, { throttle: s.throttle, thrust: kb('KeyW', 'KeyS'), ab, brake: keys.has('KeyX') }, dt);
  if ((keys.has('Space') || mouseFire) && s.cool <= 0) {
    if (!fire_(s)) { s.cool = 0.5; log('GUNS OFFLINE', '#ff5a4a'); }
  }
}

function updateShieldsAndFx(s, dt) {
  const sg = compFactor(s, 'shield');
  for (const f of ['fore', 'aft']) {
    const cap = s.def.shield[f] * sg;
    if (s.shield[f] > cap) s.shield[f] = cap;
    if (s.def.shieldRegen && time - s.lastHit > 3 && s.shield[f] < cap)
      s.shield[f] = Math.min(cap, s.shield[f] + s.def.shieldRegen * dt * sg * powerMul(s));
  }
  if (s.shieldFx && s.shieldFx.material.opacity > 0) s.shieldFx.material.opacity = Math.max(0, s.shieldFx.material.opacity - dt * 1.2);
  // smoke / fire from damaged components
  s.group.updateMatrixWorld(true);
  for (const c of s.comps) {
    const st = compState(c);
    if (st === 0) continue;
    if (Math.random() < dt * (st === 2 ? 14 : 8)) {
      const wp = s.group.localToWorld(_cp.set(c.pos[0], c.pos[1], c.pos[2]).clone());
      smokeAt(wp, 1, 2);
      if (st === 2 && Math.random() < 0.5) fireAt(wp, 1, 3);
      if (Math.random() < 0.15) sparksAt(wp, 2, 8);
    }
  }
  const sp = s.vel.length();
  for (const f of s.flames) {
    const c = compOf(s, f.comp);
    const ok = c.hp > 0;
    f.mesh.visible = ok;
    if (!ok) continue;
    const fl = clamp(sp / (s.def.maxSpeed * 0.9), 0.25, 2.2) * (s === player && keys.has('ShiftLeft') ? 1.5 : 1) * (compState(c) === 1 ? 0.6 + Math.random() * 0.6 : 1);
    const kr = f.r / 0.42, len = (1.0 + fl * 1.6) * clamp(f.r * 2.4, 0.7, 7);
    f.mesh.scale.set(kr, kr, len);
    f.mesh.position.z = f.z + len * 0.5 - 0.15;
  }
}

function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt * 2.2);
  hitFlash = Math.max(0, hitFlash - dt * 2.5);
  for (const s of ships) {
    if (!s.alive) continue;
    s.cool -= dt;
    if (s === player) { if (state === 'play') updatePlayer(dt); }
    else if (state === 'play') aiUpdate(s, dt);
    s.group.position.addScaledVector(s.vel, dt);
    s.group.updateMatrixWorld(true);
    updateShieldsAndFx(s, dt);
  }
  ships = ships.filter(s => s.alive || (disposeShip(s), false));

  for (const b of bolts) {
    b.prev.copy(b.pos);
    b.pos.addScaledVector(b.vel, dt);
    b.mesh.position.copy(b.pos);
    b.life -= dt;
    for (const s of ships) {
      if (!s.alive || s.team === b.team) continue;
      if (!segSphere(b.prev, b.pos, s.group.position, s.def.radius)) continue;
      const hit = traceShip(s, b.prev, b.pos);
      if (!hit) continue;
      const wp = s.group.localToWorld(hit.clone());
      applyHit(s, hit, b.dmg, wp);
      b.life = 0; break;
    }
  }
  bolts = bolts.filter(b => b.life > 0 || (scene.remove(b.mesh), false));

  if (state === 'play' && !ships.some(s => s.team === 1 && s.alive)) spawnWave();

  // target selection
  if (player && player.alive) {
    if (!target || !target.alive) { target = null; manualTarget = false; }
    if (!manualTarget) {
      let best = null, bd = 1e12;
      for (const s of ships) if (s.team === 1 && s.alive) {
        const d = s.group.position.distanceToSquared(player.group.position);
        if (d < bd) { bd = d; best = s; }
      }
      target = best;
    }
  }

  for (const d of debris) {
    d.life += dt;
    const k = Math.max(0, 1 - d.life / 2.4);
    for (let n = 0; n < d.pos.length; n++) {
      d.pos[n].addScaledVector(d.vel[n], dt);
      _m.makeScale(k, k, k).setPosition(d.pos[n]);
      d.mesh.setMatrixAt(n, _m);
    }
    d.mesh.instanceMatrix.needsUpdate = true;
    if (d.flash) {
      const f = d.life / 0.45;
      if (f >= 1) { scene.remove(d.flash); d.flash.geometry.dispose(); d.flash.material.dispose(); d.flash = null; }
      else { d.flash.scale.setScalar(d.size * (0.3 + f * 1.0)); d.flash.material.opacity = 1 - f; }
    }
  }
  debris = debris.filter(d => d.life < 2.4 || (scene.remove(d.mesh), d.mesh.dispose(), d.flash && scene.remove(d.flash), false));

  sparks.update(dt); fire.update(dt); smoke.update(dt); frag.update(dt);
  updateCamera(dt);

  // environment follows the camera
  const c = camera.position;
  stars.position.copy(c); sky.position.copy(c);
  planet.position.copy(c).addScaledVector(PLANET_DIR, 3200);
  const dp = dustGeo.attributes.position.array;
  for (let i = 0; i < DUST_N; i++) {
    for (let a = 0; a < 3; a++) {
      const cc = a === 0 ? c.x : a === 1 ? c.y : c.z;
      const v = dp[i * 3 + a];
      dp[i * 3 + a] = ((v - cc + DUST_R) % (2 * DUST_R) + 2 * DUST_R) % (2 * DUST_R) - DUST_R + cc;
    }
  }
  dustGeo.attributes.position.needsUpdate = true;
}

const _cv = new THREE.Vector3();
function updateCamera(dt) {
  if (!player || !player.alive) return;
  const g = player.group;
  if (view === 'cockpit') {
    camera.position.copy(g.localToWorld(_cv.set(0, 0.7, -1.2)));
    camera.quaternion.copy(g.quaternion);
  } else {
    const t = g.localToWorld(_cv.set(0, 2.8, 12.5));
    camera.position.lerp(t, 1 - Math.exp(-9 * dt));
    camera.quaternion.slerp(g.quaternion, 1 - Math.exp(-12 * dt));
  }
  if (shake > 0) {
    const a = shake * 0.02;
    camera.rotateX((Math.random() - 0.5) * a); camera.rotateY((Math.random() - 0.5) * a); camera.rotateZ((Math.random() - 0.5) * a * 1.5);
  }
  camera.updateMatrixWorld(true);
}
