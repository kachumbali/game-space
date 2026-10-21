// ======================================================================
//  INPUT
// ======================================================================
const keys = new Set();
const stick = { x: 0, y: 0 };
let mouseFire = false, touchStarted = false, radarIdx = 1;
const RADAR_RANGES = [1500, 3000, 6000];
const msg = document.getElementById('msg');

function setView(v) { view = v; document.body.classList.toggle('chase', v === 'chase'); if (player) player.group.visible = v === 'chase'; }
function hostileList() {
  return ships.filter(s => s.team === 1 && s.alive && !s.dying)
    .sort((a, b) => a.group.position.distanceTo(player.group.position) - b.group.position.distanceTo(player.group.position));
}
function cycleTarget() {
  const list = hostileList();
  if (!list.length) return;
  const i = list.indexOf(target);
  target = list[(i + 1) % list.length]; manualTarget = true; sfx('click');
}
function targetCrosshair() {
  if (!player || !player.alive) return;
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  let best = null, ba = 0.6;
  for (const s of hostileList()) {
    const a = f.angleTo(s.group.position.clone().sub(player.group.position).normalize());
    if (a < ba) { ba = a; best = s; }
  }
  if (best) { target = best; manualTarget = true; sfx('click'); }
}
function playerFireMissile() {
  if (!player || !player.alive || state !== 'play') return;
  const wid = selectedMissile(player);
  if (!wid) return;
  if (player.stores[wid] <= 0) { log('RACK EMPTY', '#ff5a4a'); return; }
  if (player.lock.p < 1 && !WEAPONS[wid].torp) { log('NO LOCK: DUMB-FIRED', '#ffd24a'); }
  launchMissile(player, wid);
}

addEventListener('keydown', e => {
  if (e.repeat) return;
  keys.add(e.code);
  if (!player) return;
  switch (e.code) {
    case 'KeyV': setView(view === 'cockpit' ? 'chase' : 'cockpit'); break;
    case 'KeyF': flightMode = flightMode === 'arcade' ? 'newton' : 'arcade'; break;
    case 'KeyC': stick.x = stick.y = 0; break;
    case 'KeyR': if (!e.ctrlKey && !e.metaKey) resetGame(); break;
    case 'KeyT': if (player.alive) cycleTarget(); break;
    case 'KeyY': targetCrosshair(); break;
    case 'KeyG': if (player.alive) cycleMissile(player); break;
    case 'KeyZ': if (player.alive && state === 'play') { if (!deployCM(player)) log(player.stores.flare > 0 ? 'COUNTERMEASURES CYCLING' : 'NO FLARES', '#ff5a4a'); } break;
    case 'KeyK': radarIdx = (radarIdx + 1) % RADAR_RANGES.length; break;
    case 'KeyH': { const h = document.getElementById('help'); h.style.display = h.style.display === 'block' ? 'none' : 'block'; break; }
    case 'KeyM': AUDIO.muted = !AUDIO.muted; if (AUDIO.master) AUDIO.master.gain.value = AUDIO.muted ? 0 : 0.55; break;
    case 'Enter': case 'NumpadEnter': playerFireMissile(); break;
    case 'Digit1': player.fireMask = 1; break;
    case 'Digit2': player.fireMask = 2; break;
    case 'Digit3': player.fireMask = 3; break;
    case 'KeyB': if (composer) bloomOn = !bloomOn; break;
    case 'BracketLeft': pixelIdx = Math.max(0, pixelIdx - 1); resize(); break;
    case 'BracketRight': pixelIdx = Math.min(PIXEL_STEPS.length - 1, pixelIdx + 1); resize(); break;
    case 'Minus': changeDetail(-1); break;
    case 'Equal': changeDetail(1); break;
  }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('contextmenu', e => e.preventDefault());
msg.addEventListener('pointerdown', () => { if (state === 'dead' && game.mode === 'free') resetGame(); });
addEventListener('mousedown', e => {
  if (isTouch) return;
  if (state === 'brief' || $id('brief').style.display === 'flex') return;
  if (document.pointerLockElement !== canvas) { canvas.requestPointerLock?.(); return; }
  if (e.button === 0) mouseFire = true;
  if (e.button === 2) playerFireMissile();
});
addEventListener('mouseup', e => { if (e.button === 0) mouseFire = false; });
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  stick.x = Math.max(-1, Math.min(1, stick.x + e.movementX * 0.003));
  stick.y = Math.max(-1, Math.min(1, stick.y + e.movementY * 0.003));
});

// ---- touch controls (phones/tablets) ----
if (isTouch) {
  document.body.classList.add('touch');
  const $ = id => document.getElementById(id);
  const zone = $('stickzone'), base = $('stickbase'), knob = $('stickknob');
  let sid = null, ox = 0, oy = 0;
  const R = 60;
  zone.addEventListener('pointerdown', e => {
    if (sid !== null) return;
    sid = e.pointerId; ox = e.clientX; oy = e.clientY; touchStarted = true;
    zone.setPointerCapture(sid);
    base.style.display = knob.style.display = 'block';
    base.style.left = knob.style.left = ox + 'px'; base.style.top = knob.style.top = oy + 'px';
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== sid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const l = Math.hypot(dx, dy);
    if (l > R) { dx *= R / l; dy *= R / l; }
    stick.x = dx / R; stick.y = dy / R;
    knob.style.left = (ox + dx) + 'px'; knob.style.top = (oy + dy) + 'px';
  });
  const endStick = e => {
    if (e.pointerId !== sid) return;
    sid = null; stick.x = stick.y = 0; base.style.display = knob.style.display = 'none';
  };
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);
  const hold = (id, on, off) => {
    const el = $(id);
    el.addEventListener('pointerdown', e => { touchStarted = true; el.setPointerCapture(e.pointerId); el.classList.add('on'); on(); });
    const up = () => { el.classList.remove('on'); off(); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  hold('bfire', () => { mouseFire = true; }, () => { mouseFire = false; });
  hold('bmsl', () => playerFireMissile(), () => {});
  hold('bflr', () => { if (player && player.alive) deployCM(player); }, () => {});
  hold('bboost', () => keys.add('ShiftLeft'), () => keys.delete('ShiftLeft'));
  hold('brl', () => keys.add('KeyQ'), () => keys.delete('KeyQ'));
  hold('brr', () => keys.add('KeyE'), () => keys.delete('KeyE'));
  hold('bview', () => setView(view === 'cockpit' ? 'chase' : 'cockpit'), () => {});
  hold('btgt', () => { if (player && player.alive) cycleTarget(); }, () => {});
  hold('bytgt', () => targetCrosshair(), () => {});
  hold('bsel', () => { if (player && player.alive) cycleMissile(player); }, () => {});
  const thr = $('thr');
  const setThr = e => {
    const r = thr.getBoundingClientRect();
    if (player) player.throttle = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
  };
  thr.addEventListener('pointerdown', e => { touchStarted = true; thr.setPointerCapture(e.pointerId); setThr(e); });
  thr.addEventListener('pointermove', e => { if (e.buttons || e.pressure > 0) setThr(e); });
  addEventListener('pointerdown', () => { touchStarted = true; });
}

function changeDetail(d) {
  const n = clamp(detailIdx + d, 0, DETAIL_STEPS.length - 1);
  if (n === detailIdx) return;
  detailIdx = n;
  for (const s of ships) if (s.alive) buildVox(s);
}
