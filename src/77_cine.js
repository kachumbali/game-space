// ======================================================================
//  TRANSITS — autopilot legs between areas of operation, with Wing-Commander-style cinematic cameras.
//  Mission scripts trigger one with {transit:{to, dur, area, lines:[[t, from, text],...]}}.
//  While a transit runs the sim is real-time (not slowed), hostiles are cleared, the fleet flies in formation
//  along the flagship's heading, and the camera cuts between flyby / orbit / chase / bow / arrival shots.
// ======================================================================
const CINE_SPEED = 95;
let cine = null;
const _ca = new THREE.Vector3(), _cb = new THREE.Vector3(), _cs = new THREE.Vector3(), _cu = new THREE.Vector3(0, 1, 0), _cq = new THREE.Quaternion();
const fadeEl = document.getElementById('fade'), capEl = document.getElementById('cap');

function startTransit(tr) {
  const A = game.anchor;
  if (!A || !A.alive) return;
  for (const s of ships) if (s.team === 1) s.alive = false;
  for (const m of missiles) m.dead = true;
  bolts.length = 0; decoys.length = 0;
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(A.group.quaternion).normalize();
  const side = new THREE.Vector3().crossVectors(fwd, _cu).normalize();
  const dur = tr.dur || 26;
  // navigation beacon ahead of the fleet
  const beacon = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(60 + i * 38, 1.6, 6, 48), new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.8 - i * 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
    beacon.add(r);
  }
  beacon.add(new THREE.Mesh(new THREE.SphereGeometry(7, 12, 8), new THREE.MeshBasicMaterial({ color: 0xbfffee })));
  beacon.position.copy(A.group.position).addScaledVector(fwd, CINE_SPEED * dur + 120);
  beacon.lookAt(A.group.position);
  scene.add(beacon);
  for (const s of ships) if (s.alive && s.team === 0) { s.group.quaternion.copy(A.group.quaternion); s.group.visible = true; }
  cine = { t: 0, dur, tr, li: 0, fwd, side, beacon, fov: camera.fov, shot: -1, prevView: view };
  // shot list as fractions of the leg
  cine.shots = [['flyby', 0.26], ['orbit', 0.22], ['chase', 0.2], ['bow', 0.16], ['arrive', 0.16]];
  state = 'cine';
  document.body.classList.add('cine');
  if (capEl) capEl.textContent = '';
  sfx('jump');
}

function cineDrive(s, dt) {
  const c = cine; if (!c) return;
  const cap = s.def.cls !== 'fighter';
  s.vel.copy(c.fwd).multiplyScalar(CINE_SPEED);
  if (!cap) {                                   // fighters weave a little in formation
    const k = time * 0.9 + (s.spawnT || 0) * 3.1 + (s.def.length || 1);
    s.vel.addScaledVector(c.side, Math.sin(k) * 12); s.vel.y += Math.cos(k * 0.7) * 5;
    _cq.copy(game.anchor.group.quaternion);
    s.group.quaternion.copy(_cq); s.group.rotateZ(Math.sin(k) * 0.4);
  }
  s.throttle = 0.6;
}

function cineShot(name, k, c) {
  const A = game.anchor, ap = A.group.position, R = A.def.radius, P = player ? player.group.position : ap;
  const f = c.fwd, sd = c.side;
  switch (name) {
    case 'flyby':      // static telephoto camera ahead of and beside the fleet; it sweeps past
      if (!c.fixed) c.fixed = ap.clone().addScaledVector(f, R * 5.2).addScaledVector(sd, R * 1.5).addScaledVector(_cu, R * 0.35);
      camera.position.copy(c.fixed); camera.fov = 38;
      _ca.copy(ap).addScaledVector(f, -R * 0.2); camera.lookAt(_ca); break;
    case 'orbit': {
      const a = 0.4 + k * 1.5;
      _ca.copy(ap).addScaledVector(sd, Math.cos(a) * R * 2.6).addScaledVector(f, Math.sin(a) * R * 2.6).addScaledVector(_cu, R * (0.5 + 0.3 * k));
      camera.position.copy(_ca); camera.fov = 52; camera.lookAt(_cb.copy(ap).addScaledVector(f, R * 0.1)); break;
    }
    case 'chase':
      camera.position.copy(P).addScaledVector(f, -30).addScaledVector(_cu, 7).addScaledVector(sd, 16 - 12 * k); camera.fov = 68;
      camera.lookAt(_ca.copy(P).addScaledVector(f, 80)); break;
    case 'bow':        // ahead of the flagship, looking back along the fleet
      camera.position.copy(ap).addScaledVector(f, R * 1.9).addScaledVector(sd, R * (0.7 - 0.4 * k)).addScaledVector(_cu, R * 0.25); camera.fov = 48;
      camera.lookAt(_ca.copy(ap).addScaledVector(f, R * 0.2)); break;
    case 'arrive':     // behind the wing, beacon dead ahead; FOV widens as the drives spool down
      camera.position.copy(P).addScaledVector(f, -22).addScaledVector(_cu, 5); camera.fov = 60 + 40 * k * k;
      camera.lookAt(_ca.copy(P).addScaledVector(f, 400)); break;
  }
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
}

function cineCamera(dt) {
  const c = cine; if (!c) return;
  let acc = 0, idx = c.shots.length - 1, k = 1;
  for (let i = 0; i < c.shots.length; i++) {
    const d = c.shots[i][1] * c.dur;
    if (c.t < acc + d) { idx = i; k = (c.t - acc) / d; break; }
    acc += d;
  }
  if (idx !== c.shot) { c.shot = idx; c.fixed = null; }
  cineShot(c.shots[idx][0], clamp(k, 0, 1), c);
}

function cineUpdate(dt) {
  const c = cine; if (!c) return;
  c.t += dt;
  const lines = c.tr.lines || [];
  while (c.li < lines.length && c.t >= lines[c.li][0]) { comm(lines[c.li][1], lines[c.li][2]); c.li++; }
  c.beacon.rotation.z += dt * 0.6;
  if (capEl) {
    const left = Math.max(0, Math.ceil(c.dur - c.t));
    capEl.innerHTML = `AUTOPILOT · ${c.tr.to}<span>ETA 0:${String(left).padStart(2, '0')} · ${isTouch ? 'TAP' : 'SPACE'} TO SKIP</span>`;
  }
  if (c.t >= c.dur) endTransit();
}

function endTransit() {
  const c = cine; if (!c) return;
  scene.remove(c.beacon);
  c.beacon.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  camera.fov = c.fov; camera.updateProjectionMatrix();
  document.body.classList.remove('cine');
  if (capEl) capEl.textContent = '';
  // relocate the "area": scenery changes, drives drop back to patrol speed
  const area = game.mission.areas && game.mission.areas[c.tr.area];
  if (area) applyArea(area);
  for (const s of ships) {
    if (!s.alive || s.team !== 0) continue;
    s.vel.copy(c.fwd).multiplyScalar(s.def.cls === 'fighter' ? 60 : 4);
    s.group.quaternion.copy(game.anchor.group.quaternion);
    s.group.visible = !(s === player && view === 'cockpit');
  }
  if (player) { player.throttle = 0.4; player.group.quaternion.copy(game.anchor.group.quaternion); }
  game.mstate.area = c.tr.area;
  cine = null;
  state = 'play';
  if (fadeEl) { fadeEl.style.transition = 'none'; fadeEl.style.opacity = '1'; requestAnimationFrame(() => { fadeEl.style.transition = 'opacity 1.1s'; fadeEl.style.opacity = '0'; }); }
  if (area) comm('CONTROL', area.arrive || `Arrived at ${area.name}.`);
  sfx('jump');
}
function skipTransit() { if (state === 'cine' && cine && cine.t > 1.2) cine.t = cine.dur; }

// per-area scenery: sky / planet / sun look (see LOOKS in 41_sky.js)
function applyArea(a) {
  if (a.look) applyLook(a.look);
  game.mstate.areaName = a.name;
}
addEventListener('pointerdown', () => skipTransit());
addEventListener('keydown', e => { if (state === 'cine' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) { skipTransit(); e.preventDefault(); } });
