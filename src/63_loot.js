// ======================================================================
//  SALVAGE PODS (v0.2): enemy kills drop glowing pods; fly through one to use it. Five kinds:
//    SHD shield cells (+60% of max)      REP hull patch (+22% structure, damaged subsystems +35% of max)
//    MSL missile reload (+1 of each, one over the stock)   AMO ammunition + capacitor refill
//    OVR overdrive (12 s: +35% fire rate, +20% damage, free energy, +5% speed)  <- rare
//  Why: a dogfight that only drains you is a loss you postpone; pods give a reason to keep flying, and a reason to take a risk.
//  Drop rule: fighters 22% (a pity timer forces one every 5th kill), capital ships 3 pods, aces always; the type is weighted by what
//  the pilot is short of. Pods inside the magnet radius drift to the pilot. Only the player collects (AI default: ignore). Touch: pods are
//  collected by flying through them, so there is nothing to bind. Radar shows them as diamonds; the overlay marks them within 2.5 km.
//  ship.mod is rebuilt by recalcMods(s) from s.modBase (perks, difficulty) times the live buffs (overdrive).
// ======================================================================
const LOOT = {
  SHD: { name: 'SHIELD CELL', col: 0x4ac8ff, hex: '#4ac8ff', letter: 'S' },
  REP: { name: 'HULL PATCH', col: 0x6bff8a, hex: '#6bff8a', letter: 'R' },
  MSL: { name: 'MISSILE RELOAD', col: 0xffa040, hex: '#ffa040', letter: 'M' },
  AMO: { name: 'AMMO + CAPACITOR', col: 0xffe45a, hex: '#ffe45a', letter: 'A' },
  OVR: { name: 'OVERDRIVE', col: 0xff5af0, hex: '#ff5af0', letter: 'O' },
};
const LOOT_CFG = { life: 34, collectR: 30, magnetR: 130, dropFighter: 0.22, pity: 5, overdriveT: 12, maxPods: 14 };
const lootPods = [];
const lootState = { dry: 0 };
const _lg = new THREE.OctahedronGeometry(1, 0), _lh = new THREE.SphereGeometry(1, 10, 8);

function recalcMods(s) {                              // s.mod = s.modBase x live buffs (every key multiplies; missing = 1)
  const out = {}, add = o => { if (o) for (const k in o) out[k] = (out[k] ?? 1) * o[k]; };
  add(s.modBase);
  if (s.buffs) for (const k in s.buffs) if (s.buffs[k].until > time) add(s.buffs[k].mod);
  s.mod = out;
}
function lootSpawn(pos, type, vel) {
  if (lootPods.length >= LOOT_CFG.maxPods) { const o = lootPods.shift(); lootRemove(o); }
  const L = LOOT[type], g = new THREE.Group();
  const core = new THREE.Mesh(_lg, new THREE.MeshBasicMaterial({ color: new THREE.Color(L.col).multiplyScalar(2.6) }));
  core.scale.set(3.4, 5, 3.4);
  const halo = new THREE.Mesh(_lh, new THREE.MeshBasicMaterial({ color: L.col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(13);
  g.add(core); g.add(halo); g.position.copy(pos); scene.add(g);
  const o = { type, pos: g.position, vel: (vel || new THREE.Vector3()).clone().multiplyScalar(0.25), born: time, g, core, halo, col: L.hex };
  lootPods.push(o);
  return o;
}
function lootRemove(o) { scene.remove(o.g); o.core.material.dispose(); o.halo.material.dispose(); }
function lootClear() { for (const o of lootPods) lootRemove(o); lootPods.length = 0; lootState.dry = 0; }
function lootPick(p) {                                // weighted by what the pilot is short of
  const sh = (p.shield.fore + p.shield.aft) / Math.max(1, p.def.shield.fore + p.def.shield.aft);
  const hull = p.structure / p.def.structure;
  let ms = 1, mn = 0; for (const k in p.def.stores || {}) if (k !== 'flare' && k !== 'drone' && p.def.stores[k] > 0) { ms += p.stores[k] / p.def.stores[k]; mn++; }
  const msl = mn ? (ms - 1) / mn : 1;
  let am = 1; for (const k in p.ammoMax) am = Math.min(am, p.ammo[k] / p.ammoMax[k]);
  const w = { SHD: 0.5 + 2.5 * (1 - sh), REP: 0.4 + 3 * (1 - hull), MSL: 0.4 + 2 * (1 - msl), AMO: 0.4 + 2.2 * (1 - am), OVR: 0.35 + (juice.chain >= 3 ? 0.4 : 0) };
  let t = 0; for (const k in w) t += w[k];
  let r = Math.random() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'SHD';
}
function lootOnKill(s, mine) {
  if (AOPT.purist) return;                               // sim purist: no pods
  const p = player; if (!p || !p.alive || (game.mode === 'mission' && s.team !== 1)) return;
  if (s.team !== 1 || p.group.position.distanceTo(s.group.position) > 2200) return;
  const big = s.def.cls !== 'fighter';
  let n = 0;
  if (big) n = 3; else if (s.ace) n = 2; else { lootState.dry++; if (Math.random() < LOOT_CFG.dropFighter * (p.mod?.drop ?? 1) || lootState.dry >= LOOT_CFG.pity) n = 1; }
  if (!n) return;
  lootState.dry = 0;
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let t = s.ace && i === 0 ? 'OVR' : lootPick(p); if (used.has(t) && n > 1) t = lootPick(p); used.add(t);
    const off = new THREE.Vector3().randomDirection().multiplyScalar(i ? 28 : 0);
    lootSpawn(s.group.position.clone().add(off), t, s.vel);
  }
}
killHooks.push(lootOnKill);

function lootApply(p, type) {
  const d = p.def; let msg = LOOT[type].name;
  if (type === 'SHD') { for (const f of ['fore', 'aft']) p.shield[f] = Math.min(d.shield[f] * (p.mod?.shieldCap ?? 1), p.shield[f] + d.shield[f] * 0.6); }
  else if (type === 'REP') {
    p.structure = Math.min(d.structure, p.structure + d.structure * 0.22);
    for (const c of p.comps) if (c.hp > 0 && c.hp < c.max) c.hp = Math.min(c.max, c.hp + c.max * 0.35);
  } else if (type === 'MSL') {
    for (const k in d.stores || {}) if (k !== 'flare' && k !== 'drone' && d.stores[k] > 0) p.stores[k] = Math.min(d.stores[k] + 1, (p.stores[k] | 0) + 1);
    if (d.stores && d.stores.flare) p.stores.flare = Math.min(d.stores.flare, (p.stores.flare | 0) + 6);
  } else if (type === 'AMO') {
    for (const k in p.ammoMax) p.ammo[k] = p.ammoMax[k];
    for (const T of p.turrets || []) if (Number.isFinite(T.ammo)) T.ammo = T.w.ammo;
    p.energy = p.energyMax || 100;
  } else if (type === 'OVR') {
    (p.buffs ||= {}).ovr = { until: time + LOOT_CFG.overdriveT, mod: { rof: 1.35, dmg: 1.2, eff: 0.02, speed: 1.05 } };
    recalcMods(p); msg += ` ${LOOT_CFG.overdriveT}s`;
  }
  juice.banners.push({ t: time, text: '+ ' + msg, sub: '', col: LOOT[type].hex, big: false });
  sfx('pickup', 0, 1);
  if (typeof lootHooks !== 'undefined') for (const f of lootHooks) f(type);
}
const lootHooks = [];
const _lp = new THREE.Vector3();
function lootTick(dt) {
  const p = player;
  if (p && p.buffs) { let changed = false; for (const k in p.buffs) if (p.buffs[k].until <= time) { delete p.buffs[k]; changed = true; } if (changed) recalcMods(p); }
  for (let i = lootPods.length - 1; i >= 0; i--) {
    const o = lootPods[i], age = time - o.born;
    o.pos.addScaledVector(o.vel, dt); o.vel.multiplyScalar(Math.exp(-0.6 * dt));
    o.core.rotation.y += dt * 2.2; o.core.rotation.x += dt * 0.7;
    o.halo.scale.setScalar(13 * (1 + 0.12 * Math.sin(time * 5 + i)));
    const left = LOOT_CFG.life - age;
    o.g.visible = left > 6 || Math.floor(time * 6) % 2 === 0;       // blinks for the last 6 s
    if (left <= 0) { lootRemove(o); lootPods.splice(i, 1); continue; }
    if (!p || !p.alive || state !== 'play') continue;
    const d = o.pos.distanceTo(p.group.position), mr = LOOT_CFG.magnetR * (p.mod?.magnet ?? 1);
    if (d < mr) {                                     // magnet: closer = faster
      const sp = (50 + (mr - d) * 1.4) * dt;
      o.pos.addScaledVector(_lp.copy(p.group.position).sub(o.pos).normalize(), Math.min(d, sp));
    }
    if (d < LOOT_CFG.collectR) { lootApply(p, o.type); lootRemove(o); lootPods.splice(i, 1); }
  }
}
// overlay markers: a diamond with the pod letter and the distance, within 2.5 km
function drawLoot(c, p) {
  const f = FS || 1;
  for (const o of lootPods) {
    const d = o.pos.distanceTo(p.group.position); if (d > 2500 || !o.g.visible) continue;
    const q = project(o.pos); if (!q.front || q.x < 20 || q.x > ovW - 20 || q.y < 20 || q.y > ovH - 20) continue;
    const z = 8 * f, L = LOOT[o.type];
    c.strokeStyle = o.col; c.fillStyle = o.col; c.lineWidth = 2 * f;
    c.beginPath(); c.moveTo(q.x, q.y - z); c.lineTo(q.x + z, q.y); c.lineTo(q.x, q.y + z); c.lineTo(q.x - z, q.y); c.closePath(); c.stroke();
    c.font = `bold ${Math.round(10 * f)}px monospace`; c.textAlign = 'center'; c.fillText(L.letter, q.x, q.y + 3.5 * f);
    c.font = `${Math.round(9 * f)}px monospace`; c.fillText(d.toFixed(0), q.x, q.y + z + 11 * f);
  }
  c.textAlign = 'left';
}
