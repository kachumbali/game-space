// ======================================================================
//  UPDATE
// ======================================================================
const _dq = new THREE.Quaternion();
const _eu = new THREE.Euler();
let gunMsgT = 0;

function updatePlayer(dt) {
  const s = player;
  const kb = (a, b) => (keys.has(a) ? 1 : 0) - (keys.has(b) ? 1 : 0);
  const pitch = clamp(-stick.y + kb('ArrowUp', 'ArrowDown'), -1, 1);
  const yaw = clamp(-stick.x + kb('ArrowLeft', 'ArrowRight'), -1, 1);
  const roll = kb('KeyQ', 'KeyE');
  const tm = turnMul(s);
  _eu.set(pitch * 1.6 * 2.85 * tm * dt, yaw * 1.1 * 2.85 * tm * dt, roll * 2.2 * 2.85 * tm * dt, 'XYZ');
  s.group.quaternion.multiply(_dq.setFromEuler(_eu)).normalize();
  s.throttle = clamp(s.throttle + kb('KeyW', 'KeyS') * 0.6 * dt, 0, 1);
  const ab = keys.has('ShiftLeft') || keys.has('ShiftRight');
  flightModels[flightMode](s, { throttle: s.throttle, thrust: kb('KeyW', 'KeyS'), ab, brake: keys.has('KeyX') }, dt);
  if ((keys.has('Space') || mouseFire) && state === 'play') {
    const r = fireGuns(s, s.fireMask);
    if (r.any && !r.n && time - gunMsgT > 1.5) {
      // distinguish cooldown from a real problem
      const blocked = s.mounts.filter(m => !m.store && (s.fireMask & (1 << (m.grp - 1)))).every(m => {
        const w = WEAPONS[m.w], c = compOf(s, m.comp);
        return (c && c.hp <= 0) || (w.ammo && !(s.ammo[m.w] > 0)) || (w.energy && s.energy < w.energy);
      });
      if (blocked) {
        gunMsgT = time;
        const dead = s.mounts.every(m => { const c = compOf(s, m.comp); return c && c.hp <= 0; });
        log(dead ? 'GUNS OFFLINE' : (s.energy < 9 ? 'CAPACITOR EMPTY' : 'GUNS DRY'), '#ff5a4a');
      }
    }
  }
}

function updateShieldsAndFx(s, dt) {
  const sg = compFactor(s, 'shield');
  for (const f of ['fore', 'aft']) {
    const cap = s.def.shield[f] * sg;
    if (s.shield[f] > cap) s.shield[f] = cap;
    if (s.def.shieldRegen && time - s.lastHit > 4 && s.shield[f] < cap)
      s.shield[f] = Math.min(cap, s.shield[f] + s.def.shieldRegen * dt * sg * powerMul(s) * pwF(s, 's'));
  }
  s.energy = Math.min(s.energyMax || 100, s.energy + (s.def.energyRegen || 17) * powerMul(s) * pwF(s, 'w') * dt);
  if (s.shieldFx && s.shieldFx.material.opacity > 0) s.shieldFx.material.opacity = Math.max(0, s.shieldFx.material.opacity - dt * 1.2);
  // smoke / fire from damaged components
  s.group.updateMatrixWorld(true);
  for (const c of s.comps) {
    const st = compState(c);
    if (st === 0) continue;
    if (Math.random() < dt * (st === 2 ? 14 : 8) * (s.def.cls === 'fighter' ? 1 : 2)) {
      const wp = s.group.localToWorld(_cp.set(c.pos[0], c.pos[1], c.pos[2]).clone());
      smokeAt(wp, 1, 2);
      if (st === 2 && Math.random() < 0.5) fireAt(wp, 1, 3);
      if (Math.random() < 0.15) sparksAt(wp, 2, 8);
    }
  }
  const sp = s.vel.length();
  for (const f of s.flames) {
    const c = compOf(s, f.comp);
    const ok = c.hp > 0 && s.dying <= 0;
    f.mesh.visible = ok;
    if (!ok) continue;
    const fl = clamp(sp / (s.def.maxSpeed * 0.9), 0.25, 2.2) * (s.ab ? 1.5 : 1) * (compState(c) === 1 ? 0.6 + Math.random() * 0.6 : 1);
    const kr = f.r / 0.42, len = (1.0 + fl * 1.6) * clamp(f.r * 2.4, 0.7, 7);
    f.mesh.scale.set(kr, kr, len);
    f.mesh.position.z = f.z + len * 0.5 - 0.15;
  }
}

function updateWarnings(dt) {
  const inc = [], p = player;
  warnState.lockedBy = 0;
  if (p && p.alive) {
    for (const m of missiles) if (!m.dead && m.target === p) inc.push(m);
    for (const s of ships) if (s.alive && s.team !== p.team && s.lock && s.lock.tgt === p && s.lock.p > 0.35) warnState.lockedBy++;
  }
  warnState.incoming = inc;
  warnState.beam = p && p.alive && time - playerTrack.last < 0.4 ? playerTrack : null;      // a hostile laser is tracking or burning us
  if (!p || !p.alive || state !== 'play') { if (AUDIO.lockGain) AUDIO.lockGain.gain.value = 0; return; }
  AUDIO.warnT -= dt;
  if (inc.length) { if (AUDIO.warnT <= 0) { sfx('alarm'); AUDIO.warnT = 0.55; } }
  else if (warnState.lockedBy) { if (AUDIO.warnT <= 0) { sfx('warn'); AUDIO.warnT = 0.5; } }
  else if (warnState.beam) { const B = warnState.beam; if (AUDIO.warnT <= 0) { tone(B.live ? 1500 : 900 + 500 * B.prog, B.live ? 1500 : 900 + 500 * B.prog, 0.05, 'square', 0.07); AUDIO.warnT = B.live ? 0.1 : 0.4 - 0.28 * B.prog; } }
  // own lock tone
  const L = p.lock;
  if (AUDIO.lockGain) AUDIO.lockGain.gain.value = L.state === 'locked' ? 0.05 : 0;
  if (L.state === 'locking') { AUDIO.lockT -= dt; if (AUDIO.lockT <= 0) { tone(880 + 500 * L.p, 880 + 500 * L.p, 0.06, 'sine', 0.08); AUDIO.lockT = 0.45 - 0.33 * L.p; } }
}

function briefCamera(dt) {
  const a = game.anchor ? game.anchor.group.position : new THREE.Vector3();
  const t = time * 0.12, k = game.anchor ? game.anchor.def.radius / 38 : 1;
  camera.position.set(a.x + Math.cos(t) * 110 * k, a.y + (28 + Math.sin(t * 0.7) * 12) * k, a.z + (30 + Math.sin(t) * 110) * k);
  camera.lookAt(a.x + 10, a.y + 6, a.z - 2);
  camera.updateMatrixWorld(true);
}

function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt * 2.2);
  hitFlash = Math.max(0, hitFlash - dt * 2.5);
  if (state === 'brief') { briefCamera(dt); updateEnv(); return; }
  for (const s of ships) {
    if (!s.alive) continue;
    for (const m of s.mounts) m.cool -= dt;
    s.cmCool -= dt; s.hitCool -= dt;
    if (s.dying > 0) {
      updateDying(s, dt);
      if (!s.alive) continue;
      s.vel.multiplyScalar(Math.exp(-0.2 * dt));
      s.group.rotateZ(0.06 * dt); s.group.rotateX(0.03 * dt);
    } else if (state === 'cine') cineDrive(s, dt);
    else if (s === player) { if (state === 'play') updatePlayer(dt); }
    else if (state !== 'brief') aiUpdate(s, dt);
    s.group.position.addScaledVector(s.vel, dt);
    s.group.updateMatrixWorld(true);
    if (s.dying <= 0) updateTurrets(s, dt);
    updateShieldsAndFx(s, dt);
  }
  collideShips(dt);
  ships = ships.filter(s => s.alive || (disposeShip(s), false));

  lodTick(dt); comsTick(dt);
  plogTick(dt); updateBolts(dt); updateMissiles(dt); updateDecoys(dt); updateFlashes(dt);

  // free flight: endless waves
  if (game.mode === 'free' && state === 'play' && !ships.some(s => s.team === 1 && s.alive)) spawnWave();

  // target selection (player)
  if (player && player.alive) {
    if (!target || !target.alive || target.dying) { target = null; manualTarget = false; }
    if (!manualTarget) {
      let best = null, bd = 1e12;
      for (const s of ships) if (s.team === 1 && s.alive && !s.dying) {
        const d = s.group.position.distanceToSquared(player.group.position);
        if (d < bd) { bd = d; best = s; }
      }
      target = best;
    }
    player.target = target;
    lockUpdate(player, dt);
  }
  updateWarnings(dt);
  if (game.mission) missionUpdate(dt);

  for (const d of debris) {
    d.life += dt;
    const dur = d.dur || 2.4;
    const k = Math.max(0, 1 - d.life / dur);
    for (let n = 0; n < d.pos.length; n++) {
      d.pos[n].addScaledVector(d.vel[n], dt);
      _m.makeScale(k, k, k).setPosition(d.pos[n]);
      d.mesh.setMatrixAt(n, _m);
    }
    d.mesh.instanceMatrix.needsUpdate = true;
    if (d.flash) {
      const f = d.life / (d.dur > 3 ? 0.9 : 0.45);
      if (f >= 1) { scene.remove(d.flash); d.flash.geometry.dispose(); d.flash.material.dispose(); d.flash = null; }
      else { d.flash.scale.setScalar(d.size * (0.3 + f * 1.0)); d.flash.material.opacity = 1 - f; }
    }
  }
  debris = debris.filter(d => d.life < (d.dur || 2.4) || (scene.remove(d.mesh), d.mesh.dispose(), d.flash && scene.remove(d.flash), false));

  sparks.update(dt); fire.update(dt); smoke.update(dt); frag.update(dt);
  if (state === 'cine') cineCamera(dt); else updateCamera(dt);
  updateEnv();
}

function updateEnv() {
  const c = camera.position;
  updateSky(c);
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
    const eye = player.def.eye || [0, 0.7, -1.2];
    camera.position.copy(g.localToWorld(_cv.set(eye[0], eye[1], eye[2])));
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
