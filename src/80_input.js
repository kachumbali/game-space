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
// subsystem targeting: N cycles through the live subsystems of the current target (aim point for the gun pipper)
let subSel = null, subFor = null, subHit = null;
function liveSubs(t) { return t ? t.comps.filter(c => c.hp > 0 && c.role !== 'power') : []; }
function cycleSub() {
  if (!target || !target.alive) return;
  const l = liveSubs(target);
  if (!l.length) return;
  const i = l.findIndex(c => c.id === subSel);
  subSel = i + 1 < l.length ? l[i + 1].id : (i < 0 ? l[0].id : null);
  subFor = target; sfx('click');
}
function subComp(t) {
  if (!t || subFor !== t) { subSel = null; subFor = t; return null; }
  const c = subSel && t.comps.find(c => c.id === subSel && c.hp > 0);
  if (!c) subSel = null;
  return c || null;
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
  if (rdlgOpen || optsOpen) return;
  if (e.repeat) return;
  if (comsKey(e)) { e.preventDefault(); return; }
  keys.add(e.code);
  if (!player) return;
  switch (e.code) {
    case 'KeyV': setView(view === 'cockpit' ? 'chase' : 'cockpit'); break;
    case 'KeyF': fmSet(FM_ORDER[(FM_ORDER.indexOf(flightMode) + 1) % FM_ORDER.length]); break;
    case 'Backspace': matchSpeed(player); e.preventDefault(); break;
    case 'KeyC': stick.x = stick.y = 0; break;
    case 'KeyJ': comsToggle(); break;
    case 'KeyL': plogDownload(); break;
    case 'KeyR': if (!e.ctrlKey && !e.metaKey) askRestart(); break;
    case 'KeyT': if (player.alive) cycleTarget(); break;
    case 'KeyY': targetCrosshair(); break;
    case 'KeyN': cycleSub(); break;
    case 'KeyG': if (player.alive) cycleMissile(player); break;
    case 'KeyD': if (player.alive && state === 'play') dockTry(); break;   // tactical docking at a tender (owner 2026-10-22)
    case 'Escape': pauseToggle(); break;   // S1: real pause (Esc exits pointer lock; Esc again resumes)
    case 'KeyZ': if (player.alive && state === 'play') { if (!deployCM(player)) log(player.stores.flare > 0 ? 'COUNTERMEASURES CYCLING' : 'NO FLARES', '#ff5a4a'); } break;
    case 'KeyK': radarIdx = (radarIdx + 1) % RADAR_RANGES.length; break;
    case 'KeyH': { const h = document.getElementById('help'); h.style.display = h.style.display === 'block' ? 'none' : 'block'; break; }
    case 'KeyM': AUDIO.muted = !AUDIO.muted; if (AUDIO.master) AUDIO.master.gain.value = sfxGain(); break;
    case 'Enter': case 'NumpadEnter': playerFireMissile(); break;
    case 'Digit1': player.fireMask = 1; break;
    case 'Digit2': player.fireMask = 2; break;
    case 'Digit3': player.fireMask = 3; break;
    case 'Digit4': case 'Digit5': case 'Digit6': powerKey(player, PW_KEYS[+e.code.slice(5) - 4]); break;
    case 'Digit7': powerKey(player, null); break;
    case 'KeyB': if (composer) bloomOn = !bloomOn; break;
    case 'KeyP': setQuality(QORDER[(QORDER.indexOf(qualityName) + 1) % QORDER.length]); break;
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
  if (isTouch || rdlgOpen) return;
  if (state === 'brief' || $id('brief').style.display === 'flex') return;
  if (document.pointerLockElement !== canvas) { lockPointer(); return; }
  if (e.button === 0) mouseFire = true;
  if (e.button === 2) playerFireMissile();
});
addEventListener('mouseup', e => { mouseFire = mouseFire && !rdlgOpen; if (e.button === 0) mouseFire = false; });
addEventListener('mousemove', e => {
  if (rdlgOpen) return;
  if (document.pointerLockElement !== canvas) return;
  stick.x = Math.max(-1, Math.min(1, stick.x + e.movementX * 0.003 * AOPT.sens));
  stick.y = Math.max(-1, Math.min(1, stick.y + e.movementY * 0.003 * AOPT.sens * (AOPT.invY ? -1 : 1)));
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
  hold('bpause', () => pauseToggle(), () => {});   // S1 touch parity: the pause button
  hold('brad', () => { radarIdx = (radarIdx + 1) % RADAR_RANGES.length; }, () => {});   // S2 touch parity: radar range (desktop key K)
  hold('bview', () => setView(view === 'cockpit' ? 'chase' : 'cockpit'), () => {});
  hold('btgt', () => { if (player && player.alive) cycleTarget(); }, () => {});
  hold('bytgt', () => targetCrosshair(), () => {});
  hold('bsub', () => cycleSub(), () => {});
  hold('bsel', () => { if (player && player.alive) cycleMissile(player); }, () => {});
  const thr = $('thr');
  const setThr = e => {
    const r = thr.getBoundingClientRect();
    if (player) player.throttle = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
  };
  let lastThrTap = 0;                                  // double-tap the throttle slider = match the target's speed (touch binding for BACKSPACE)
  thr.addEventListener('pointerdown', e => { touchStarted = true; thr.setPointerCapture(e.pointerId); const now = performance.now(); if (now - lastThrTap < 320) matchSpeed(player); else setThr(e); lastThrTap = now; });
  thr.addEventListener('pointermove', e => { if (e.buttons || e.pressure > 0) setThr(e); });
  addEventListener('pointerdown', () => { touchStarted = true; });
}

// power allocation: 4 weapons / 5 shields / 6 engines each move one point there from the largest other system, 7 = balance
function powerKey(s, k) {
  if (!s || !s.alive) return;
  if (k === null) powerReset(s); else if (!powerShift(s, k)) { log(`${PW_NAMES[k]} AT LIMIT`, '#ff5a4a'); return; }
  sfx('click'); log(`POWER  WPN ${s.pw.w}  SHD ${s.pw.s}  ENG ${s.pw.e}`, '#ffd24a');
}
{ // touch / mouse: tap a bar of the power widget; tap the title to balance
  const ets = document.getElementById('ets');
  ets.addEventListener('pointerdown', e => {
    const r = e.target.closest('[data-pw]'); if (!r) return;
    e.stopPropagation(); e.preventDefault();
    powerKey(player, r.dataset.pw === '=' ? null : r.dataset.pw);
  });
}

function changeDetail(d) {
  const n = clamp(detailIdx + d, 0, DETAIL_STEPS.length - 1);
  if (n === detailIdx) return;
  detailIdx = n;
  for (const s of ships) if (s.alive) { s.lodDrop = 0; buildVox(s); }
}

// graphics preset at run time (sky size and antialiasing need a reload with ?q=)
function setQuality(name) {
  const Q = QUALITY[name]; if (!Q) return;
  qualityName = name;
  pixelIdx = PIXEL_STEPS.indexOf(Q.px); resize();
  changeDetail(Q.det - detailIdx);
  if (composer) bloomOn = Q.bloom;
  log(`GRAPHICS ${name.toUpperCase()}: voxels ${DETAIL_STEPS[detailIdx]}, pixels ${Q.px < 1 ? '2x supersampled' : Q.px + 'x'}` + ((Q.aa || Q.sky > 1024) ? ' (reload with ?q=' + name + ' for MSAA and sky size)' : ''), '#9adcff');
}

// device preset (options panel): graphics values + LOD level. Sky size and MSAA are fixed at load: saved, applied after a reload.
function setDevice(name, reload) {
  GFX.device = name; gfxSave();
  const D = DEVICES[deviceName()];
  qualityName = deviceName();
  pixelIdx = PIXEL_STEPS.indexOf(D.px); resize();
  if (composer) bloomOn = D.bloom;
  setLod(D.lod, true);
  changeDetail(D.det - detailIdx);
  log(`DEVICE ${name === 'auto' ? 'AUTO (' + D.label + ')' : D.label}: voxels ${DETAIL_STEPS[detailIdx]}, LOD ${lodLevel.toUpperCase()}` + ((D.aa || D.sky > 1024) ? ' (reload for MSAA and sky size)' : ''), '#9adcff');
}
function setLod(level, keep) {
  if (!(level in LOD_LEVELS)) return;
  lodLevel = level; GFX.lod = level; gfxSave();
  if (!keep) log(`LOD ${level.toUpperCase()}`, '#9adcff');
  for (const s of ships) if (s.alive && (s.lodDrop | 0)) { s.lodDrop = 0; buildVox(s); }   // re-evaluated by lodTick
}

// phones: smaller HUD fonts and controls
function setPhone() {
  const ph = isTouch && Math.min(innerWidth, innerHeight) < 520;
  document.body.classList.toggle('phone', ph);
  FS = ph ? 0.78 : 1;
}
addEventListener('resize', setPhone); addEventListener('orientationchange', setPhone);
setPhone();

// ---- R: confirm before restarting (restart mission / restart segment / cancel) ---------------------------
let rdlgOpen = false;
function askRestart() {
  if (rdlgOpen) return;
  const el = $id('rdlg'), M = game.mission, mission = game.mode === 'mission' && M, sk = game.mode === 'skirmish', sur = game.mode === 'survival';
  rdlgOpen = true; document.exitPointerLock?.();
  const seg = mission && game.seg;
  el.innerHTML = `<div class="panel"><h2>RESTART?</h2>` + (mission
    ? `<button id="rd1">RESTART MISSION <small>[M]</small></button>${seg ? '<button id="rd2">RESTART THIS SEGMENT <small>[S]</small></button>' : ''}`
    : `<button id="rd1">RESTART ${sk ? 'SKIRMISH' : sur ? 'GAUNTLET' : 'FREE FLIGHT'} <small>[M]</small></button>`) + `<button class="alt" id="rd3">MAIN MENU</button><button class="alt" id="rd0">CANCEL <small>[ESC]</small></button></div>`;
  el.style.display = 'flex';
  const close = (noLock) => { el.style.display = 'none'; rdlgOpen = false; window.removeEventListener('keydown', el._keys, true); if (noLock !== true && !isTouch && state === 'play') lockPointer(); };
  $id('rd0').onclick = close;
  $id('rd1').onclick = () => { close(true); keys.clear(); restoreCrew(); if (mission) startMission(M); else if (sk) startSkirmish(game.sk); else if (sur) { startSurvival(sv.cfg); launchLock(); } else resetGame(); };
  $id('rd3').onclick = () => { close(true); keys.clear(); openMenu(); };
  const r2 = $id('rd2'); if (r2) r2.onclick = () => { close(true); keys.clear(); restoreCrew(); startMission(M, seg); };
  el._keys = ev => {
    if (ev.code === 'KeyM') $id('rd1').onclick(); else if (ev.code === 'KeyS' && r2) r2.onclick();
    else if (ev.code === 'Escape' || ev.code === 'KeyC' || ev.code === 'KeyN') close(); else return;
    ev.preventDefault(); ev.stopPropagation(); window.removeEventListener('keydown', el._keys, true);
  };
  window.addEventListener('keydown', el._keys, true);
}
