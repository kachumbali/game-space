// ======================================================================
//  HUD — overlay canvas (reticle, brackets, lock, lead pipper, warnings), 3D radar, weapon + target panels
// ======================================================================
const hudTxt = document.getElementById('hudtxt');
const radar = document.getElementById('radar');
const rctx = radar.getContext('2d');
const ov = document.getElementById('ov');
const octx = ov.getContext('2d');
const dmgCv = document.getElementById('dmg');
const dctx = dmgCv.getContext('2d');
const tgtEl = document.getElementById('tgt');
const logEl = document.getElementById('log');
const hitEl = document.getElementById('hit');
const objEl = document.getElementById('objs');
const commEl = document.getElementById('comm');
const wpnEl = document.getElementById('wpn');
const warnEl = document.getElementById('warn');
const _inv = new THREE.Quaternion();
const _rel = new THREE.Vector3();
const _hp = new THREE.Vector3(), _hf = new THREE.Vector3(), _hv = new THREE.Vector3();
const sil = {};
const hpCol = r => (r <= 0 ? '#ff4a3a' : r <= 0.5 ? '#ffd24a' : '#6fff8a');
let ovW = 1, ovH = 1, ovDpr = 1;
function sizeOverlay() {
  ovDpr = Math.min(2, globalThis.devicePixelRatio || 1);
  ovW = innerWidth; ovH = innerHeight;
  ov.width = Math.round(ovW * ovDpr); ov.height = Math.round(ovH * ovDpr);
}
sizeOverlay(); globalThis.__hudReady = true;

function silhouette(def) {
  if (sil[def.id]) return sil[def.id];
  const cv = document.createElement('canvas'); cv.width = 150; cv.height = 170;
  const c = cv.getContext('2d');
  const D = voxelize(def, def.cls === 'fighter' ? 72 : 64);
  const sc = Math.min(58 / def.half[0], 64 / def.half[2]);
  c.fillStyle = '#5d7a84';
  for (const v of D.voxels) c.fillRect(75 + v.x * sc - D.vs * sc * 0.5, 88 + v.z * sc - D.vs * sc * 0.5, D.vs * sc + 0.6, D.vs * sc + 0.6);
  // hull outline: the silhouette dilated by one pixel in 8 directions, tinted, minus the silhouette itself (cached per hull)
  const ol = document.createElement('canvas'); ol.width = 150; ol.height = 170;
  const o = ol.getContext('2d');
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) o.drawImage(cv, dx, dy);
  o.globalCompositeOperation = 'source-in'; o.fillStyle = 'rgba(160,255,215,.95)'; o.fillRect(0, 0, 150, 170);
  o.globalCompositeOperation = 'destination-out'; o.drawImage(cv, 0, 0);
  sil[def.id] = { cv, sc, ol };
  return sil[def.id];
}

function drawDamage() {
  dctx.clearRect(0, 0, 150, 170);
  const p = player;
  if (!p || !p.alive) return;
  const { cv, sc, ol } = silhouette(p.def);
  dctx.drawImage(cv, 0, 0);
  const cx = 75, cy = 88, hx = p.def.half[0] * sc, hz = p.def.half[2] * sc;
  for (const [f, a0, a1] of [['fore', -2.6, -0.54], ['aft', 0.54, 2.6]]) {
    const pct = p.def.shield[f] ? p.shield[f] / p.def.shield[f] : 0;
    dctx.strokeStyle = `rgba(90,200,255,${0.15 + 0.85 * pct})`; dctx.lineWidth = 4;
    dctx.beginPath(); dctx.arc(cx, cy, 78, a0, a1); dctx.stroke();
  }
  const bar = (pct, x, y, w, h) => { dctx.fillStyle = hpCol(pct <= 0.01 ? 0 : pct < 0.4 ? 0.4 : 1); dctx.fillRect(x, y, Math.max(0, w), Math.max(0, h)); };
  // armour does not deplete (FS2 style); only ablative shows its rate-cap headroom per facing
  const AR = ARMOR[p.def.armor.type], Rc = AR && AR.rate ? AR.rate * p.def.structure : 0;
  const ap = k => { const bk = p.abl[k]; return Rc && bk ? Math.max(0, 1 - Math.max(0, bk.v - Rc * (time - bk.t)) / (Rc * 1.5)) : 1; };
  bar(ap('fore'), cx - 35 * ap('fore'), cy - hz - 9, 70 * ap('fore'), 3);
  bar(ap('aft'), cx - 35 * ap('aft'), cy + hz + 6, 70 * ap('aft'), 3);
  bar(ap('left'), cx - hx - 9, cy - 35 * ap('left'), 3, 70 * ap('left'));
  bar(ap('right'), cx + hx + 6, cy - 35 * ap('right'), 3, 70 * ap('right'));
  drawCompZones(p, cx, cy, sc, cv);
  dctx.drawImage(ol, 0, 0);                         // hull outline on top of the zones
}

// WC2-style damage schematic: every component is a zone shaped by its role (engine nacelle, gun barrel, turret ring, shield band, sensor oval,
// reactor block), clipped to the hull silhouette so it reads as the hull section lighting up. Colour = health (green / amber / red / dead hatch),
// a white flash when the component was just hit, and a label on anything damaged.
const dzc = document.createElement('canvas'); dzc.width = 150; dzc.height = 170;
const dzx = dzc.getContext('2d');
const zoneCol = r => (r <= 0 ? [90, 20, 16] : r <= 0.33 ? [255, 74, 58] : r <= 0.66 ? [255, 190, 60] : [90, 240, 140]);
function zoneShape(t, c, x, y, k, hx) {         // t = a 2D context (after beginPath) or a Path2D: both take the same calls
  const r = Math.max(2.2, c.r * k), role = c.role;
  if (role === 'engine') t.roundRect(x - r * 0.95, y - r * 0.8, r * 1.9, r * 3.0, 1.5);
  else if (role === 'gun') t.roundRect(x - Math.max(1.6, r * 0.55), y - r * 3.2, Math.max(3.2, r * 1.1), r * 4.4, 1);
  else if (role === 'turret') t.arc(x, y, Math.max(3, r), 0, 7);
  else if (role === 'shield') t.ellipse(x, y, Math.min(hx * 0.8, r * 3.4), Math.max(3, r * 1.3), 0, 0, 7);
  else if (role === 'radar') t.ellipse(x, y, Math.max(3.5, r * 1.4), Math.max(3, r * 0.9), 0, 0, 7);
  else if (role === 'power') t.roundRect(x - r * 0.95, y - r * 0.95, r * 1.9, r * 1.9, 3);
  else t.roundRect(x - r, y - r * 0.8, r * 2, r * 1.6, 2);
}
const zonePath = (c, x, y, k, hx) => { dzx.beginPath(); zoneShape(dzx, c, x, y, k, hx); };
function drawCompZones(p, cx, cy, sc, cv) {
  const hx = p.def.half[0] * sc;
  dzx.clearRect(0, 0, 150, 170);
  dzx.globalCompositeOperation = 'source-over'; dzx.drawImage(cv, 0, 0);
  dzx.globalCompositeOperation = 'source-atop';
  const rows = [];
  for (const c of p.comps) {
    const r = Math.max(0, c.hp) / c.max;
    if (c._hpSeen != null && c.hp < c._hpSeen - 1e-6) c._flash = time;
    c._hpSeen = c.hp;
    const x = cx + c.pos[0] * sc, y = cy + c.pos[2] * sc;
    const fl = c._flash != null && time - c._flash < 0.45 ? 1 - (time - c._flash) / 0.45 : 0;
    const col = zoneCol(r);
    dzx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${r <= 0 ? 0.9 : 0.62})`;
    zonePath(c, x, y, sc, hx); dzx.fill();
    if (r <= 0) {                                                     // dead: diagonal hatch
      dzx.save(); zonePath(c, x, y, sc, hx); dzx.clip();
      dzx.strokeStyle = 'rgba(0,0,0,.75)'; dzx.lineWidth = 1;
      for (let q = -12; q < 12; q += 3) { dzx.beginPath(); dzx.moveTo(x + q - 8, y + 8); dzx.lineTo(x + q + 8, y - 8); dzx.stroke(); }
      dzx.restore();
    }
    if (fl > 0) { dzx.fillStyle = `rgba(255,255,255,${0.85 * fl})`; zonePath(c, x, y, sc, hx); dzx.fill(); }
    rows.push({ c, r, x, y, col });
  }
  dctx.drawImage(dzc, 0, 0);
  // zone outlines on top (not clipped), then labels for damaged systems (worst first, at most 4)
  dctx.lineWidth = 1;
  for (const o of rows) {
    const P = new Path2D(); zoneShape(P, o.c, o.x, o.y, sc, hx);
    dctx.strokeStyle = `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${o.r <= 0 ? 0.9 : 0.8})`;
    dctx.stroke(P);
  }
  dctx.font = '8px monospace';
  const placed = [];
  rows.filter(o => o.r < 0.99).sort((a, b) => a.r - b.r).slice(0, 4).forEach(o => {
    const txt = shortName(o.c) + (o.r <= 0 ? ' X' : ' ' + Math.round(o.r * 100)), w = dctx.measureText(txt).width;
    let right = o.x >= cx;
    if (right && o.x + 10 + w > 148) right = false; else if (!right && o.x - 10 - w < 2) right = true;      // keep the label on the canvas
    const tx = right ? o.x + 10 : o.x - 10;
    let ty = o.y + 3;
    while (placed.some(q => q.right === right && Math.abs(q.y - ty) < 9)) ty += 9;                               // no overlapping labels
    placed.push({ right, y: ty });
    dctx.textAlign = right ? 'left' : 'right';
    dctx.fillStyle = 'rgba(0,0,0,.7)'; dctx.fillRect(right ? tx - 1 : tx - w - 1, ty - 8, w + 2, 10);
    dctx.fillStyle = `rgb(${o.col[0]},${o.col[1]},${o.col[2]})`;
    dctx.fillText(txt, tx, ty);
  });
}

const shortName = c => c.name.replace('ENGINE', 'ENG').replace('SHIELD', 'SHD').replace('REACTOR', 'RCT').replace('CANNON', 'CAN').replace('LASER', 'LAS').replace('PLASMA', 'PLS').replace('TORP RACK', 'TORP').replace(' GLAND', '').replace('ACID ', '').slice(0, 7);
let lastTgtHtml = '';
function updateTargetPanel(nd, closure) {
  let html = '';
  if (target && target.alive) {
    const t = target, d = t.def;
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const pc = (cur, max) => max ? Math.round(100 * sum(cur) / sum(max)) : 0;
    const sel = subComp(t);
    const sys = t.comps.map(c => `<span style="color:${hpCol(Math.max(0, c.hp) / c.max)}">${sel === c ? '[' + shortName(c) + ']' : shortName(c)}</span>`).join(' ');
    const radarOk = !player || compFactor(player, 'radar') > 0.01;
    html = `<b>${d.name}</b> <span style="opacity:.7">${d.role}</span> <span style="opacity:.6">SKL ${t.skill | 0}</span>\n${radarOk ? nd.toFixed(0) : '???'} m   closing ${closure >= 0 ? '+' : ''}${closure.toFixed(0)} m/s\nSHD ${pc(t.shield, d.shield)}%  ARM ${ARMOR[d.armor.type].name} ${Math.round(100 * d.armor.rating)}%  STR ${Math.round(100 * Math.max(0, t.structure) / d.structure)}%\n${sys}`;
  }
  if (html !== lastTgtHtml) { tgtEl.innerHTML = html; lastTgtHtml = html; }
}

let lastLog = '';
function updateLog() {
  const live = logs.filter(l => time - l.t < 5);
  const h = live.map(l => `<div style="color:${l.color};opacity:${clamp(5 - (time - l.t), 0, 1)}">${l.text}</div>`).join('');
  if (h !== lastLog) { logEl.innerHTML = h; lastLog = h; }
}
let lastObj = '', lastComm = '';
function updateObjComm() {
  const h = objectives.length ? '<div style="opacity:.6;letter-spacing:2px">OBJECTIVES</div>' + objectives.map(o => `<div class="${o.state}">${o.state === 'done' ? '✔' : o.state === 'failed' ? '✘' : '▸'} ${o.text}</div>`).join('') : '';
  if (h !== lastObj) { objEl.innerHTML = h; lastObj = h; }
  const live = comms.filter(c => time - c.t < 9);
  const hc = live.map(c => `<div style="opacity:${clamp(9 - (time - c.t), 0, 1)}"><b style="color:${c.color}">${c.from}:</b>${c.text}</div>`).join('');
  if (hc !== lastComm) { commEl.innerHTML = hc; lastComm = hc; }
}

// ---- weapon panel --------------------------------------------------------------------------------------
const rglEl = document.getElementById('rgl'), rgrEl = document.getElementById('rgr');
let lastRg = '';
function updateRadarSide() {
  const p = player;
  if (!p || !p.alive) { rglEl.innerHTML = rgrEl.innerHTML = ''; lastRg = ''; return; }
  const en = clamp(p.energy / 100, 0, 1), ec = en < 0.25 ? '#ff5a4a' : en < 0.5 ? '#ffd24a' : '#7dffb0';
  const cur = selectedMissile(p), ids = missileIds(p);
  const tag = { ir: 'IR', rf: 'RF', torp: 'TORP', tick: 'TICK', tad: 'TAD' };
  const l = `<div class="chip ${p.ammo.cannon < 1 ? 'zero' : ''}">GUN ${p.ammo.cannon | 0}</div><br><div class="chip">PLS ${Math.round(p.energy)}</div>`;
  const r = ids.map(id => `<div class="chip ${id === cur ? 'sel' : ''} ${p.stores[id] < 1 ? 'zero' : ''}">${id === cur ? '▶' : ''}${tag[id] || id.toUpperCase()} ×${p.stores[id] | 0}</div>`).join('<br>') + `<br><div class="chip ${p.stores.flare < 1 ? 'zero' : ''}">CM ×${p.stores.flare | 0}</div>`;
  const h = l + '|' + r;
  if (h !== lastRg) { rglEl.innerHTML = l; rgrEl.innerHTML = r; lastRg = h; }
}
let lastWpn = '';
function updateWeaponPanel() {
  const p = player;
  if (!p || !p.alive) { wpnEl.innerHTML = ''; return; }
  const m = k => p.fireMask & k;
  const cn = p.ammo.cannon | 0, en = Math.round(p.energy);
  const bar = (f, n = 10) => '█'.repeat(Math.round(f * n)) + '░'.repeat(n - Math.round(f * n));
  const cls = (on, ok = true) => (on ? 'sel' : 'dim') + (ok ? '' : ' bad');
  const ids = missileIds(p), cur = selectedMissile(p);
  let h = `<div class="${m(1) ? 'sel' : 'dim'}">1 CANNON ${String(cn).padStart(3, ' ')}</div>`;
  h += `<div class="${m(2) ? 'sel' : 'dim'}">2 PLASMA ${bar(p.energy / 100, 8)} ${en}%</div>`;
  for (const id of ids) h += `<div class="${id === cur ? 'sel' : 'dim'}">${id === cur ? '▶' : ' '} ${WEAPONS[id].name} ×${p.stores[id]}</div>`;
  h += `<div>FLARES ×${p.stores.flare | 0}${p.cmCool > 0 ? ' …' : ''}</div>`;
  h += droneHudLine(p);
  const L = p.lock;
  const lt = !cur ? '' : L.state === 'locked' ? '<span style="color:#ff5a4a">● LOCKED</span>' : L.state === 'locking' ? `<span style="color:#ffd24a">LOCKING ${Math.round(L.p * 100)}%</span>` :
    L.state === 'range' ? 'OUT OF RANGE' : L.state === 'seek' ? 'SEEKING' : 'NO TARGET';
  h += `<div>${lt}</div>`;
  if (h !== lastWpn) { wpnEl.innerHTML = h; lastWpn = h; }
}

// ---- overlay helpers ------------------------------------------------------------------------------------
const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
function project(wp) {   // -> {x,y,front} in CSS px
  _hp.copy(wp);
  _hf.set(0, 0, -1).applyQuaternion(camera.quaternion);
  const behind = _hv.copy(wp).sub(camera.position).dot(_hf) <= 0;
  _hp.project(camera);
  return { x: (_hp.x + 1) / 2 * ovW, y: (1 - _hp.y) / 2 * ovH, front: !behind };
}
function pxPerRad() { return ovH / 2 / TAN_HALF; }
function bracketBox(c, x, y, s, col, lw = 2) {
  const k = s * 0.35;
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    c.moveTo(x + sx * s, y + sy * (s - k)); c.lineTo(x + sx * s, y + sy * s); c.lineTo(x + sx * (s - k), y + sy * s);
  }
  c.stroke();
}
function edgeArrow(c, x, y, front, col, label) {
  // clamp a screen point (possibly behind the camera) to the screen edge with an arrow
  const cx = ovW / 2, cy = ovH / 2;
  let dx = x - cx, dy = y - cy;
  if (!front) { dx = -dx; dy = -dy; if (Math.abs(dx) + Math.abs(dy) < 1) dy = 1; }
  const m = 38, k = Math.min((cx - m) / Math.max(1e-3, Math.abs(dx)), (cy - m) / Math.max(1e-3, Math.abs(dy)));
  const px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx);
  c.save(); c.translate(px, py); c.rotate(a);
  c.fillStyle = col; c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -9); c.lineTo(-3, 0); c.lineTo(-8, 9); c.closePath(); c.fill();
  c.restore();
  if (label) { c.fillStyle = col; c.font = `${Math.round(11 * FS)}px monospace`; c.textAlign = 'center'; c.fillText(label, px - Math.cos(a) * 26, py - Math.sin(a) * 26 + 4); }
}
// time for a projectile of speed v (fired from shooter, inheriting 0.9 of its velocity) to reach a moving target
function interceptPoint(sp, sv, tp, tv, v) {
  const r = _hv.copy(tp).sub(sp);
  const rv = _hf.copy(tv).addScaledVector(sv, -0.9);
  const a = rv.dot(rv) - v * v, b = 2 * r.dot(rv), cc = r.dot(r);
  let t;
  if (Math.abs(a) < 1e-4) t = -cc / b;
  else {
    const disc = b * b - 4 * a * cc;
    if (disc < 0) return null;
    const t1 = (-b + Math.sqrt(disc)) / (2 * a), t2 = (-b - Math.sqrt(disc)) / (2 * a);
    t = Math.min(t1 > 0 ? t1 : 1e9, t2 > 0 ? t2 : 1e9);
  }
  if (!(t > 0) || t > 6) return null;
  return tp.clone().addScaledVector(tv, t).addScaledVector(sv, -0.9 * t);
}


const _sp = new THREE.Vector3(), _sp2 = new THREE.Vector3(), _vv = new THREE.Vector3();
// Newtonian flight: transparent vector projections (the nose and the velocity no longer agree, so show where we are really going).
// prograde (ring + three prongs) / retrograde (ring + X) of our velocity, a faint line from the nose to prograde with the drift angle,
// and, with a target, the same pair for the velocity RELATIVE to it (cyan): prograde = where we drift relative to it, retrograde = burn toward it to match speed.
function drawVectors(c, p, cx, cy) {
  const f = _vv.set(0, 0, -1).applyQuaternion(p.group.quaternion).clone();
  const mark = (v, col, label, retro) => {
    const sp = v.length(); if (sp < 1.5) return;
    const dir = v.clone().divideScalar(sp);
    const far = p.group.position.clone().addScaledVector(dir, 3000);
    const q = project(far), n = retro ? -1 : 1;
    const drift = Math.round(f.angleTo(dir) * 57.3);
    c.save(); c.globalAlpha = 0.55; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2;
    if (q.front && q.x > 0 && q.x < ovW && q.y > 0 && q.y < ovH) {
      if (!retro) { c.globalAlpha = 0.22; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(q.x, q.y); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.55; }
      c.beginPath(); c.arc(q.x, q.y, 11, 0, 7);
      if (retro) { c.moveTo(q.x - 8, q.y - 8); c.lineTo(q.x + 8, q.y + 8); c.moveTo(q.x + 8, q.y - 8); c.lineTo(q.x - 8, q.y + 8); }
      else { c.moveTo(q.x - 11, q.y); c.lineTo(q.x - 20, q.y); c.moveTo(q.x + 11, q.y); c.lineTo(q.x + 20, q.y); c.moveTo(q.x, q.y - 11); c.lineTo(q.x, q.y - 20); }
      c.stroke();
      c.font = `${Math.round(10 * FS)}px monospace`; c.textAlign = 'left';
      c.fillText(label + ' ' + sp.toFixed(0) + (retro ? '' : '  ' + drift + '°'), q.x + 16, q.y + 22);
    } else { c.globalAlpha = 0.7; edgeArrow(c, q.x, q.y, q.front, col, label + ' ' + sp.toFixed(0) + ' ' + drift + '°'); }
    c.restore();
  };
  mark(p.vel, '#8fffd0', 'VEL', false);
  mark(_rel.copy(p.vel).negate(), '#8fffd0', 'RETRO', true);
  if (target && target.alive) {
    const rv = p.vel.clone().sub(target.vel);
    mark(rv, '#6ae0ff', 'REL', false);                       // where we are drifting relative to the target
    mark(rv.clone().negate(), '#6ae0ff', 'MATCH', true);     // burn toward this to cancel the relative velocity
  }
}

function drawOverlay(alive) {
  octx.setTransform(ovDpr, 0, 0, ovDpr, 0, 0);
  octx.clearRect(0, 0, ovW, ovH);
  if (!alive || state === 'brief') return;
  const c = octx, p = player, cx = ovW / 2, cy = ovH / 2;
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
  // reticle
  c.strokeStyle = 'rgba(143,255,208,.85)'; c.lineWidth = 2;
  c.beginPath(); c.arc(cx, cy, 13, 0, 7);
  c.moveTo(cx - 24, cy); c.lineTo(cx - 17, cy); c.moveTo(cx + 17, cy); c.lineTo(cx + 24, cy);
  c.moveTo(cx, cy - 24); c.lineTo(cx, cy - 17); c.moveTo(cx, cy + 17); c.lineTo(cx, cy + 24); c.stroke();
  c.fillStyle = 'rgba(143,255,208,.9)'; c.fillRect(cx - 1.5, cy - 1.5, 3, 3);
  if (flightMode === 'newton') drawVectors(c, p, cx, cy);
  // seeker cone of the selected missile
  const wid = selectedMissile(p), L = p.lock;
  if (wid) {
    const w = WEAPONS[wid], r = Math.tan(w.lockCone) * pxPerRad() / 1;
    c.setLineDash([6, 8]); c.strokeStyle = L.state === 'locked' ? 'rgba(255,90,70,.8)' : 'rgba(255,210,74,.45)'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.setLineDash([]);
  }
  const radarOk = compFactor(p, 'radar') > 0.01;
  const cls = { fighter: 0, gunship: 0, bomber: 0 };
  // contacts
  for (const s of ships) {
    if (!s.alive || s === p) continue;
    const d = s.group.position.distanceTo(p.group.position);
    const hostile = s.team !== p.team;
    if (!radarOk && d > 1200) continue;
    const pr = project(s.group.position);
    const col = hostile ? '#ff5a5a' : '#6ac8ff';
    const size = clamp(s.def.radius * 2 / (d * TAN_HALF * 2) * ovH * 0.55, 7, 160);
    if (s === target) continue;
    if (pr.front && pr.x > -50 && pr.x < ovW + 50 && pr.y > -50 && pr.y < ovH + 50) {
      if (hostile) {
        c.strokeStyle = 'rgba(255,90,90,.75)'; c.lineWidth = 1.5; c.beginPath();
        c.moveTo(pr.x, pr.y - size); c.lineTo(pr.x + size, pr.y); c.lineTo(pr.x, pr.y + size); c.lineTo(pr.x - size, pr.y); c.closePath(); c.stroke();
        if (size > 14 || d < 1500) { c.fillStyle = 'rgba(255,140,140,.85)'; c.font = `${Math.round(10 * FS)}px monospace`; c.textAlign = 'left'; c.fillText(`${s.def.name.replace('FROGG ', '')} ${d.toFixed(0)}`, pr.x + size + 4, pr.y + 3); }
      } else {
        bracketBox(c, pr.x, pr.y, Math.max(8, size), 'rgba(106,200,255,.7)', 1.5);
        c.fillStyle = 'rgba(140,215,255,.9)'; c.font = `${Math.round(10 * FS)}px monospace`; c.textAlign = 'left';
        c.fillText(`${s.callsign || s.def.name} ${d.toFixed(0)}`, pr.x + Math.max(8, size) + 4, pr.y + 3);
      }
    }
  }
  // current target: brackets, lock ring, lead pipper, edge arrow
  if (target && target.alive) {
    const t = target, tpos = t.group.position, d = tpos.distanceTo(p.group.position);
    const pr = project(tpos);
    const size = clamp(t.def.radius * 2 / (d * TAN_HALF * 2) * ovH * 0.6, 16, ovH * 0.45);
    const locked = L.tgt === t && L.state === 'locked', locking = L.tgt === t && L.state === 'locking';
    const col = locked ? '#ff3a2a' : locking ? '#ffd24a' : '#ff8a6a';
    if (pr.front && pr.x > 0 && pr.x < ovW && pr.y > 0 && pr.y < ovH) {
      bracketBox(c, pr.x, pr.y, size, col, 2.5);
      c.fillStyle = col; c.font = `${Math.round(11 * FS)}px monospace`; c.textAlign = 'center';
      c.fillText(`${t.def.name} ${radarOk ? d.toFixed(0) + 'm' : ''}`, pr.x, pr.y + size + 15);
      if (locking) { const rr = size * (1.9 - 0.9 * L.p); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(pr.x, pr.y, rr, 0, 7); c.stroke(); }
      if (locked) {
        const blink = Math.floor(time * 6) % 2;
        c.strokeStyle = col; c.lineWidth = 3; c.beginPath();
        c.moveTo(pr.x, pr.y - size * 0.55); c.lineTo(pr.x + size * 0.55, pr.y); c.lineTo(pr.x, pr.y + size * 0.55); c.lineTo(pr.x - size * 0.55, pr.y); c.closePath(); c.stroke();
        if (blink) c.fillText('LOCK', pr.x, pr.y - size - 8);
      }
      // subsystem hit zones (large targets, or whenever one is selected)
      if (size > 34 && d < 2500) {
        t.group.updateMatrixWorld();
        const selc = subComp(t);
        for (const cp of t.comps) {
          if (cp.role === 'power' && cp !== selc) continue;
          _sp2.set(cp.pos[0], cp.pos[1], cp.pos[2]); t.group.localToWorld(_sp2);
          const q = project(_sp2); if (!q.front) continue;
          const rr = clamp(cp.r * 2 / (_sp2.distanceTo(camera.position) * TAN_HALF * 2) * ovH * 0.5, 3, 40);
          const dead = cp.hp <= 0, f = Math.max(0, cp.hp) / cp.max;
          const cc = dead ? 'rgba(120,120,120,.5)' : f > 0.5 ? '#6fff8a' : f > 0.25 ? '#ffd24a' : '#ff5a4a';
          const sel = selc === cp, flash = subHit && subHit.id === cp.id && time - subHit.t < 0.35;
          c.strokeStyle = cc; c.lineWidth = sel ? 2 : 1; c.globalAlpha = sel ? 1 : 0.55;
          c.beginPath(); c.arc(q.x, q.y, rr, 0, 7); c.stroke();
          if (flash) { c.fillStyle = '#fff'; c.globalAlpha = 0.8; c.beginPath(); c.arc(q.x, q.y, rr, 0, 7); c.fill(); }
          if (sel) { c.globalAlpha = 1; c.fillStyle = cc; c.font = `${Math.round(10 * FS)}px monospace`; c.textAlign = 'left'; c.fillText(`${cp.name} ${Math.round(f * 100)}%`, q.x + rr + 4, q.y + 3); }
          c.globalAlpha = 1;
        }
      }
      // gun lead pipper (primary cannon speed)
      const gv = WEAPONS.cannon.v;
      const sc = subComp(t);
      if (sc) { t.group.updateMatrixWorld(); _sp.set(sc.pos[0], sc.pos[1], sc.pos[2]); t.group.localToWorld(_sp); }
      const ip = interceptPoint(p.group.position, p.vel, sc ? _sp : tpos, t.vel, gv);
      if (ip && d < gv * WEAPONS.cannon.life * 0.8) {
        const lp = project(ip);
        if (lp.front) {
          c.strokeStyle = '#7dffb0'; c.lineWidth = 1.5;
          c.beginPath(); c.arc(lp.x, lp.y, 9, 0, 7); c.moveTo(lp.x - 14, lp.y); c.lineTo(lp.x - 9, lp.y); c.moveTo(lp.x + 9, lp.y); c.lineTo(lp.x + 14, lp.y);
          c.moveTo(lp.x, lp.y - 14); c.lineTo(lp.x, lp.y - 9); c.moveTo(lp.x, lp.y + 9); c.lineTo(lp.x, lp.y + 14); c.stroke();
          c.strokeStyle = 'rgba(125,255,176,.25)'; c.beginPath(); c.moveTo(pr.x, pr.y); c.lineTo(lp.x, lp.y); c.stroke();
        }
      }
    } else edgeArrow(c, pr.x, pr.y, pr.front, col, `${t.def.name.replace('FROGG ', '')} ${d.toFixed(0)}`);
  }
  // incoming missiles: red edge arrows / boxes
  for (const m of warnState.incoming) {
    const pr = project(m.pos), d = m.pos.distanceTo(p.group.position);
    const blink = Math.floor(time * 8) % 2 ? '#ff3a2a' : '#ffb0a0';
    if (pr.front && pr.x > 0 && pr.x < ovW && pr.y > 0 && pr.y < ovH) {
      c.strokeStyle = blink; c.lineWidth = 2; c.strokeRect(pr.x - 11, pr.y - 11, 22, 22);
      c.fillStyle = blink; c.font = `${Math.round(11 * FS)}px monospace`; c.textAlign = 'center'; c.fillText(`MSL ${d.toFixed(0)}`, pr.x, pr.y - 16);
    } else edgeArrow(c, pr.x, pr.y, pr.front, blink, `MSL ${d.toFixed(0)}`);
  }
  // own missiles in flight (small ticks) to follow them
  for (const m of missiles) {
    if (m.dead || m.team !== p.team) continue;
    const pr = project(m.pos);
    if (pr.front) { c.strokeStyle = 'rgba(255,210,74,.8)'; c.lineWidth = 1; c.strokeRect(pr.x - 4, pr.y - 4, 8, 8); }
  }
}

// ---- radar: forward-up, elevation stalks, range rings, hemisphere (hollow = behind) ----------------------
function drawRadar(alive) {
  const c = rctx, S = 448, cx = S / 2, cy = S / 2, R = 196;
  c.clearRect(0, 0, S, S);
  const range = RADAR_RANGES[radarIdx];
  // bezel + backing
  const g = c.createRadialGradient(cx, cy, R * 0.2, cx, cy, R + 14);
  g.addColorStop(0, 'rgba(4,26,22,.82)'); g.addColorStop(0.9, 'rgba(6,36,30,.78)'); g.addColorStop(1, 'rgba(2,12,10,.9)');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R + 12, 0, 7); c.fill();
  c.strokeStyle = 'rgba(143,255,208,.75)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.lineWidth = 1.5; c.strokeStyle = 'rgba(143,255,208,.32)';
  for (const k of [1 / 3, 2 / 3]) { c.beginPath(); c.arc(cx, cy, R * k, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke();
  // forward cone (±45°)
  c.strokeStyle = 'rgba(143,255,208,.22)'; c.beginPath();
  c.moveTo(cx, cy); c.lineTo(cx + Math.sin(0.78) * R, cy - Math.cos(0.78) * R); c.moveTo(cx, cy); c.lineTo(cx - Math.sin(0.78) * R, cy - Math.cos(0.78) * R); c.stroke();
  // sweep
  const sw = (time * 1.6) % (Math.PI * 2);
  const sg = c.createConicGradient ? c.createConicGradient(sw - Math.PI / 2, cx, cy) : null;
  if (sg) { sg.addColorStop(0, 'rgba(143,255,208,0)'); sg.addColorStop(0.9, 'rgba(143,255,208,0)'); sg.addColorStop(1, 'rgba(143,255,208,.16)'); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(143,255,208,.8)'; c.font = `${Math.round(16 * FS)}px monospace`; c.textAlign = 'center';
  c.fillText('FWD', cx, cy - R + 20); c.fillText(`${range / 1000}km`, cx, cy + R - 8);
  const p = player;
  if (alive) {
    const rf = compFactor(p, 'radar');
    if (rf <= 0) {
      c.fillStyle = '#ff5a4a'; c.font = `${Math.round(20 * FS)}px monospace`; c.fillText('RADAR OFFLINE', cx, cy + 6);
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(143,255,208,.25)'; c.fillRect(cx + (Math.random() - 0.5) * 2 * R * 0.9, cy + (Math.random() - 0.5) * 2 * R * 0.9, 3, 3); }
    } else {
      _inv.copy(p.group.quaternion).invert();
      const draw = (wp, kind, hostile, isT, label) => {
        _rel.copy(wp).sub(p.group.position).applyQuaternion(_inv);
        const dxz = Math.hypot(_rel.x, _rel.z), dist = _rel.length();
        const off = dist > range;
        const k = Math.min(1, dxz / range);
        let jit = rf <= 0.5 ? 16 : 0;
        const ang = Math.atan2(_rel.x, -_rel.z);
        const rr = off ? R - 5 : k * R;
        const sx = cx + Math.sin(ang) * rr + (Math.random() - 0.5) * jit;
        const syBase = cy - Math.cos(ang) * rr;
        const sy = syBase - clamp(_rel.y / range, -1, 1) * R * 0.38;
        if (rf <= 0.5 && Math.random() < 0.3) return;
        const behind = _rel.z > 0;
        const col = kind === 'msl' ? (hostile ? '#ff3a2a' : '#ffd24a') : hostile ? '#ff5a5a' : '#6ac8ff';
        c.globalAlpha = off ? 0.55 : 1;
        if (!off) { c.strokeStyle = hostile ? 'rgba(255,90,90,.45)' : 'rgba(106,200,255,.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx, syBase); c.lineTo(sx, sy); c.stroke(); }
        c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2.5;
        if (kind === 'msl') { c.beginPath(); c.moveTo(sx, sy - 6); c.lineTo(sx + 5, sy + 5); c.lineTo(sx - 5, sy + 5); c.closePath(); c.fill(); }
        else if (kind === 'cap') { const z = 8; if (behind) c.strokeRect(sx - z, sy - z, z * 2, z * 2); else c.fillRect(sx - z, sy - z, z * 2, z * 2); }
        else { const z = kind === 'big' ? 6 : 5; if (behind) c.strokeRect(sx - z, sy - z, z * 2, z * 2); else c.fillRect(sx - z, sy - z, z * 2, z * 2); }
        if (isT) {
          c.globalAlpha = 1; c.strokeStyle = '#ffd24a'; c.lineWidth = 2.5; c.strokeRect(sx - 12, sy - 12, 24, 24);
          if (p.lock.tgt === target && p.lock.state === 'locked') { c.strokeStyle = '#ff3a2a'; c.beginPath(); c.arc(sx, sy, 17, 0, 7); c.stroke(); }
        }
        c.globalAlpha = 1;
      };
      for (const s of ships) {
        if (!s.alive || s === p) continue;
        const hostile = s.team !== p.team;
        draw(s.group.position, s.def.cls !== 'fighter' ? 'cap' : (s.def.ai?.role === 'bomber' || s.def.id === 'reaver' || s.def.id === 'spitter') ? 'big' : 'fgt', hostile, s === target);
      }
      for (const m of missiles) if (!m.dead) draw(m.pos, 'msl', m.team !== p.team && m.target === p);
    }
  }
  c.fillStyle = '#8fffd0'; c.beginPath(); c.moveTo(cx, cy - 9); c.lineTo(cx + 7, cy + 7); c.lineTo(cx - 7, cy + 7); c.closePath(); c.fill();
}

function updateHud() {
  const p = player, alive = !!(p && p.alive);
  const enemies = ships.filter(s => s.team === 1 && s.alive);
  const S = game.mstate;
  hudTxt.textContent =
    (alive ? `SHD F${Math.round(p.shield.fore)} A${Math.round(p.shield.aft)}  ARM ${ARMOR[p.def.armor.type].name}  HULL ${Math.round(100 * Math.max(0, p.structure) / p.def.structure)}%\n` : '') +
    `SPD ${alive ? p.vel.length().toFixed(0) : 0}  THR ${alive ? Math.round(p.throttle * 100) : 0}%  ${flightMode.toUpperCase()}  AB ${alive && p.def.abMax ? Math.round(100 * p.abFuel / (p.def.abMax * pwF(p, 'e'))) : 0}%  PWR ${alive ? p.pw.w + '/' + p.pw.s + '/' + p.pw.e : '-'}\n` +
    `VOX ${DETAIL_STEPS[detailIdx]}  ${PIXEL_STEPS[pixelIdx] < 1 ? 'SS 2x' : 'PX ' + PIXEL_STEPS[pixelIdx] + 'x'}  Q ${qualityName.toUpperCase()}  LOD ${lodLevel.toUpperCase()}  BLOOM ${composer && bloomOn ? 'ON' : 'OFF'}\n` +
    (game.mode === 'mission' ? `T+${Math.floor((S?.t || 0) / 60)}:${String(Math.floor((S?.t || 0) % 60)).padStart(2, '0')}  KILLS ${kills}  FROGGS ${enemies.length}` : `WAVE ${wave}  KILLS ${kills}  FROGGS ${enemies.length}`);
  drawDamage();
  hitEl.style.opacity = hitFlash;

  const briefing = $id('brief').style.display === 'flex';
  const engaged = isTouch ? touchStarted : document.pointerLockElement === canvas;
  const showMsg = state === 'dead' ? true : (state === 'play' && !engaged && !briefing && game.mode !== 'none');
  msg.style.display = showMsg ? 'flex' : 'none';
  if (state === 'dead') msg.textContent = (game.mode === 'free') ? (isTouch ? 'HULL BREACH\ntap here to relaunch' : 'HULL BREACH\npress R to relaunch') : 'HULL BREACH';
  else msg.textContent = isTouch ? 'PAUSED\ntouch to take controls' : 'click to take controls';
  if (isTouch && alive) {
    document.querySelector('#thr>i').style.height = (p.throttle * 100) + '%';
    document.querySelector('#ten>i').style.height = clamp(p.energy / (p.energyMax || 100), 0, 1) * 100 + '%';
    const bb = $id('bboost'), ab = p.def.abMax ? Math.round(100 * p.abFuel / (p.def.abMax * pwF(p, 'e'))) : 0;
    const bt = `BOOST<br>${ab}`; if (bb._t !== bt) { bb.innerHTML = bt; bb._t = bt; }
    bb.style.opacity = p.abLock ? .45 : 1;
  }
  updateEts(p, alive);
  if (!isTouch) {                                   // desktop throttle gauge (right of the radar)
    const sp = alive ? p.vel.length() : 0, mx = p.def.maxSpeed;
    const nw = flightMode === 'newton';
    $id('tgt1').textContent = nw ? 'NEWT' : Math.round(p.throttle * 100) + '';
    $id('tgf').style.height = (nw ? 0 : p.throttle * 100) + '%';
    $id('tgs').style.bottom = Math.min(100, 100 * sp / mx) + '%';
    $id('tgab').classList.toggle('on', !!(alive && p.ab));
    $id('tgab').textContent = alive && p.def.abMax ? 'AB ' + Math.round(100 * p.abFuel / (p.def.abMax * pwF(p, 'e'))) : 'AB';
    const ef = alive ? clamp(p.energy / (p.energyMax || 100), 0, 1) : 0;
    $id('te1').textContent = Math.round(ef * 100); $id('tef').style.height = ef * 100 + '%';
    $id('tef').style.background = ef < 0.25 ? 'rgba(255,90,74,.7)' : ef < 0.5 ? 'rgba(255,210,74,.65)' : 'rgba(143,255,208,.55)';
    $id('tev').textContent = ''; $id('teab').textContent = alive && p.def.abMax ? Math.round(100 * p.abFuel / (p.def.abMax * pwF(p, 'e'))) : 0;
    $id('tgv').textContent = Math.round(sp);
  }

  drawRadar(alive);
  drawOverlay(alive);

  let nd = 0, closure = 0;
  if (alive && target && target.alive) {
    nd = target.group.position.distanceTo(p.group.position);
    closure = -_rel.copy(target.vel).sub(p.vel).dot(_hf.copy(target.group.position).sub(p.group.position).normalize());
  }
  updateTargetPanel(nd, closure);
  updateLog(); updateObjComm(); updateWeaponPanel(); updateRadarSide();
  // warnings
  let w = '';
  if (alive) {
    if (warnState.incoming.length) { const d = Math.min(...warnState.incoming.map(m => m.pos.distanceTo(p.group.position))); w = Math.floor(time * 6) % 2 ? `MISSILE INBOUND  ${d.toFixed(0)}m` : ''; }
    else if (warnState.lockedBy) w = Math.floor(time * 4) % 2 ? 'MISSILE LOCK' : '';
    else if (warnState.beam) { const B = warnState.beam; w = B.live ? 'LASER ON YOU - BREAK' : (Math.floor(time * (3 + 8 * B.prog)) % 2 ? 'LASER TRACKING ' + Math.round(B.prog * 100) + '%' : ''); }
    else if (p.shield.fore + p.shield.aft < 4 && time - p.lastHit < 3) w = 'SHIELDS DOWN';
  }
  if (w !== warnEl.textContent) warnEl.textContent = w;
}

// ---- power allocation widget -----------------------------------------------------------------------------
const etsEl = document.getElementById('ets');
let lastEts = '';
function updateEts(p, alive) {
  if (!alive) { if (lastEts) etsEl.innerHTML = lastEts = ''; return; }
  const row = k => `<div class="er" data-pw="${k}"><b>${{ w: 'WPN', s: 'SHD', e: 'ENG' }[k]}</b><i>${Array.from({ length: 12 }, (_, n) => `<s class="${n < p.pw[k] ? 'on' : ''}"></s>`).join('')}</i><span>${p.pw[k]}</span></div>`;
  const h = `<div class="et" data-pw="=">POWER ${isTouch ? '(TAP = BALANCE)' : '4 5 6 / 7 = BALANCE'}</div>` + PW_KEYS.map(row).join('');
  if (h !== lastEts) { etsEl.innerHTML = h; lastEts = h; }
}
