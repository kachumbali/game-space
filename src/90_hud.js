// ======================================================================
//  HUD
// ======================================================================
const hudTxt = document.getElementById('hudtxt');
const bracket = document.getElementById('bracket');
const brTxt = document.getElementById('brtxt');
const radar = document.getElementById('radar');
const rctx = radar.getContext('2d');
const dmgCv = document.getElementById('dmg');
const dctx = dmgCv.getContext('2d');
const tgtEl = document.getElementById('tgt');
const logEl = document.getElementById('log');
const hitEl = document.getElementById('hit');
const _inv = new THREE.Quaternion();
const _rel = new THREE.Vector3();
const sil = {};
const hpCol = r => (r <= 0 ? '#ff4a3a' : r <= 0.5 ? '#ffd24a' : '#6fff8a');

function silhouette(def) {
  if (sil[def.id]) return sil[def.id];
  const cv = document.createElement('canvas'); cv.width = 150; cv.height = 170;
  const c = cv.getContext('2d');
  const D = voxelize(def, 28);
  const sc = Math.min(58 / def.half[0], 64 / def.half[2]);
  c.fillStyle = '#3d5058';
  for (const v of D.voxels) c.fillRect(75 + v.x * sc - D.vs * sc * 0.5, 88 + v.z * sc - D.vs * sc * 0.5, D.vs * sc + 0.6, D.vs * sc + 0.6);
  sil[def.id] = { cv, sc };
  return sil[def.id];
}

function drawDamage() {
  dctx.clearRect(0, 0, 150, 170);
  const p = player;
  if (!p || !p.alive) return;
  const { cv, sc } = silhouette(p.def);
  dctx.drawImage(cv, 0, 0);
  const cx = 75, cy = 88, hx = p.def.half[0] * sc, hz = p.def.half[2] * sc;
  // shields (arcs) + armour (bars)
  for (const [f, a0, a1] of [['fore', -2.6, -0.54], ['aft', 0.54, 2.6]]) {
    const pct = p.def.shield[f] ? p.shield[f] / p.def.shield[f] : 0;
    dctx.strokeStyle = `rgba(90,200,255,${0.15 + 0.85 * pct})`; dctx.lineWidth = 4;
    dctx.beginPath(); dctx.arc(cx, cy, 78, a0, a1); dctx.stroke();
  }
  const bar = (pct, x, y, w, h) => { dctx.fillStyle = hpCol(pct <= 0.01 ? 0 : pct < 0.4 ? 0.4 : 1); dctx.fillRect(x, y, Math.max(0, w), Math.max(0, h)); };
  const ap = k => p.armor[k] / p.def.armor[k];
  bar(ap('fore'), cx - 35 * ap('fore'), cy - hz - 9, 70 * ap('fore'), 3);
  bar(ap('aft'), cx - 35 * ap('aft'), cy + hz + 6, 70 * ap('aft'), 3);
  bar(ap('left'), cx - hx - 9, cy - 35 * ap('left'), 3, 70 * ap('left'));
  bar(ap('right'), cx + hx + 6, cy - 35 * ap('right'), 3, 70 * ap('right'));
  for (const c of p.comps) {
    const r = Math.max(0, c.hp) / c.max;
    const x = cx + c.pos[0] * sc, y = cy + c.pos[2] * sc, rad = Math.max(3.2, c.r * sc * 0.5);
    dctx.fillStyle = hpCol(r); dctx.globalAlpha = 0.85;
    dctx.beginPath(); dctx.arc(x, y, rad, 0, 7); dctx.fill();
    dctx.globalAlpha = 1;
    if (r <= 0) { dctx.strokeStyle = '#000'; dctx.lineWidth = 1.5; dctx.beginPath(); dctx.moveTo(x - rad, y - rad); dctx.lineTo(x + rad, y + rad); dctx.moveTo(x + rad, y - rad); dctx.lineTo(x - rad, y + rad); dctx.stroke(); }
  }
}

let lastTgtHtml = '';
function updateTargetPanel(nd) {
  let html = '';
  if (target && target.alive) {
    const t = target, d = t.def;
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const pc = (cur, max) => max ? Math.round(100 * sum(cur) / sum(max)) : 0;
    const sys = t.comps.map(c => `<span style="color:${hpCol(Math.max(0, c.hp) / c.max)}">${c.id.replace(/^(eng|gun)([LR])$/, (m, a, b) => a.toUpperCase().slice(0, 3) + b).slice(0, 5).toUpperCase()}</span>`).join(' ');
    html = `<b>${d.name}</b>  ${nd.toFixed(0)} m\nSHD ${pc(t.shield, d.shield)}%  ARM ${pc(t.armor, d.armor)}%  STR ${Math.round(100 * t.structure / d.structure)}%\n${sys}`;
  }
  if (html !== lastTgtHtml) { tgtEl.innerHTML = html; lastTgtHtml = html; }
}

let lastLog = '';
function updateLog() {
  const live = logs.filter(l => time - l.t < 5);
  const h = live.map(l => `<div style="color:${l.color};opacity:${clamp(5 - (time - l.t), 0, 1)}">${l.text}</div>`).join('');
  if (h !== lastLog) { logEl.innerHTML = h; lastLog = h; }
}

function updateHud() {
  const p = player, alive = p && p.alive;
  const enemies = ships.filter(s => s.team === 1 && s.alive);
  hudTxt.textContent =
    `SPD ${alive ? p.vel.length().toFixed(0) : 0}  THR ${alive ? Math.round(p.throttle * 100) : 0}%  ${flightMode.toUpperCase()}\n` +
    `VOX ${DETAIL_STEPS[detailIdx]}  PX ${PIXEL_STEPS[pixelIdx]}x  BLOOM ${composer && bloomOn ? 'ON' : 'OFF'}\n` +
    `WAVE ${wave}  KILLS ${kills}  FROGGS ${enemies.length}`;
  drawDamage();
  hitEl.style.opacity = hitFlash;

  const engaged = isTouch ? touchStarted : document.pointerLockElement === canvas;
  msg.style.display = state === 'dead' ? 'flex' : (engaged ? 'none' : 'flex');
  if (state === 'dead') msg.textContent = isTouch ? 'HULL BREACH\ntap here to relaunch' : 'HULL BREACH\npress R to relaunch';
  else msg.textContent = isTouch ? 'GAME SPACE\ntouch to take controls' : 'GAME SPACE\nclick to take controls';
  if (isTouch && alive) document.querySelector('#thr>i').style.height = (p.throttle * 100) + '%';

  // radar (forward = up); degraded with radar damage
  const rf = alive ? compFactor(p, 'radar') : 1;
  rctx.clearRect(0, 0, 160, 160);
  rctx.strokeStyle = '#8fffd0'; rctx.globalAlpha = 0.5;
  rctx.beginPath(); rctx.arc(80, 80, 78, 0, Math.PI * 2); rctx.stroke();
  rctx.beginPath(); rctx.arc(80, 80, 39, 0, Math.PI * 2); rctx.stroke();
  rctx.globalAlpha = 1;
  let nd = 0;
  if (alive) {
    _inv.copy(p.group.quaternion).invert();
    if (rf <= 0) {
      rctx.fillStyle = '#ff5a4a'; rctx.font = '12px monospace'; rctx.fillText('RADAR OFFLINE', 36, 84);
      for (let i = 0; i < 40; i++) { rctx.fillStyle = 'rgba(143,255,208,.25)'; rctx.fillRect(Math.random() * 160, Math.random() * 160, 2, 2); }
    } else {
      for (const e of enemies) {
        _rel.copy(e.group.position).sub(p.group.position).applyQuaternion(_inv);
        const R = 800, jit = rf <= 0.5 ? 18 : 0;
        const sx = 80 + clamp(_rel.x / R, -1, 1) * 76 + (Math.random() - 0.5) * jit;
        const sy = 80 + clamp(_rel.z / R, -1, 1) * 76 + (Math.random() - 0.5) * jit;
        const sy2 = sy - clamp(_rel.y / R, -1, 1) * 24;
        if (rf <= 0.5 && Math.random() < 0.4) continue;
        rctx.strokeStyle = 'rgba(255,90,90,.5)';
        rctx.beginPath(); rctx.moveTo(sx, sy); rctx.lineTo(sx, sy2); rctx.stroke();
        rctx.fillStyle = e === target ? '#ffd24a' : '#ff5a5a'; rctx.fillRect(sx - 2, sy2 - 2, 4, 4);
      }
    }
  }
  rctx.fillStyle = '#8fffd0'; rctx.fillRect(78, 78, 4, 4);

  bracket.style.display = 'none';
  if (alive && target && target.alive) {
    nd = target.group.position.distanceTo(p.group.position);
    const v = target.group.position.clone().project(camera);
    if (v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1) {
      bracket.style.display = 'block';
      bracket.style.left = ((v.x + 1) / 2 * innerWidth) + 'px';
      bracket.style.top = ((1 - v.y) / 2 * innerHeight) + 'px';
      brTxt.textContent = `${target.def.name} ${nd.toFixed(0)}m`;
    }
  }
  updateTargetPanel(nd);
  updateLog();
}
