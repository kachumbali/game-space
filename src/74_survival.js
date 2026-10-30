// ======================================================================
//  GAUNTLET (survival mode, v0.2) + difficulty + career rank.
//  The loop: fight a wave -> a wave director builds the next one (events, aces, bosses every 5th) -> after each clear pick 1 of 3 perks ->
//  go again until you die. Score = kills x chain multiplier x difficulty x mutators, banked per run, best per difficulty saved.
//  Everything numeric below is a first guess, not balanced by seeded runs (AGENTS.md: balance claims need >= 20 seeded runs).
//  Feature-freeze conditions (AGENTS.md): touch = setup buttons and tappable perk cards, nothing else to bind; AI default = the AI ignores
//  perks and pods, wingmen simply fly; help line = the legend under the key map (00_head.html).
//  Part 74 calls other parts only at run time (menuShell, spawnShip, comm ...), so there are no load-time dependencies on later parts.
// ======================================================================
const DIFFS = {
  easy:   { name: 'EASY',   skill: -1, count: 0.7,  take: 0.7,  score: 0.8,  blurb: 'fewer, softer enemies; you take 30% less damage' },
  normal: { name: 'NORMAL', skill: 0,  count: 1,    take: 1,    score: 1,    blurb: 'the designed tuning' },
  hard:   { name: 'HARD',   skill: 1,  count: 1.25, take: 1.2,  score: 1.25, blurb: 'more and better pilots; you take 20% more damage' },
  ace:    { name: 'ACE',    skill: 2,  count: 1.5,  take: 1.4,  score: 1.6,  blurb: 'a crowd of aces; you take 40% more damage' },
};
let diffName = 'normal';
try { const d = localStorage.getItem('gs_diff'); if (DIFFS[d]) diffName = d; } catch (e) { /* storage unavailable */ }
const diffCfg = () => DIFFS[diffName] || DIFFS.normal;
function diffSet(n) { if (!DIFFS[n]) return; diffName = n; try { localStorage.setItem('gs_diff', n); } catch (e) { /* ignore */ } }

const MUTATORS = {
  glass:  { name: 'GLASS',   score: 1.3, desc: 'every ship has about half the hull and shields, you take +50% damage' },
  swarm:  { name: 'SWARM',   score: 1.2, desc: '1.8x as many enemies, each 40% softer' },
  aces:   { name: 'ACES',    score: 1.5, desc: 'every enemy pilot is skill 5' },
  scarce: { name: 'SCARCE',  score: 1.3, desc: 'half your missiles and flares, 40% fewer pods' },
  newton: { name: 'NEWTON',  score: 1.6, desc: 'Newtonian flight for everyone' },
};
const SV_ACE_NAMES = ['CROAKER', 'MIREWARDEN', 'GLIMMERBACK', 'SKULLFLOP', 'BLIGHTTONGUE', 'NIGHTHOP', 'VEXFANG', 'DREDGESPAWN', 'SLUDGEMAW', 'THORNTOAD'];
const SV_TAUNTS = ['Hss. Fresh meat for the brood.', 'Your wing will sing when it burns.', 'Little flyer. Little light. Mine.', 'The pond remembers every hull you broke.', 'Run. It makes the hunt sweeter.', 'I have eaten better pilots than you.'];

const PERKS = [
  { id: 'hot',    name: 'HOT ROUNDS',        k: 'H', w: 10,  max: 4, desc: 'Weapon damage +15%.', mod: { dmg: 1.15 } },
  { id: 'trig',   name: 'HAIR TRIGGER',      k: 'T', w: 10,  max: 4, desc: 'Fire rate +18%.', mod: { rof: 1.18 } },
  { id: 'cap',    name: 'FAST CAPACITORS',   k: 'C', w: 9,   max: 4, desc: 'Capacitor recharge +35%, shots cost 15% less energy.', mod: { energy: 1.35, eff: 0.85 } },
  { id: 'shd',    name: 'SHIELD HARMONICS',  k: 'S', w: 9,   max: 4, desc: 'Shield recharge +40%, capacity +20%.', mod: { shield: 1.4, shieldCap: 1.2 }, once: p => { for (const f of ['fore', 'aft']) p.shield[f] = p.def.shield[f] * (p.mod.shieldCap ?? 1); } },
  { id: 'arm',    name: 'REACTIVE ARMOUR',   k: 'A', w: 6,   max: 3, desc: 'Damage taken -12%.', mod: { take: 0.88 } },
  { id: 'lung',   name: 'LONG LUNGS',        k: 'L', w: 8,   max: 3, desc: 'Afterburner pool +40%.', mod: { ab: 1.4 } },
  { id: 'frame',  name: 'LIGHTER FRAME',     k: 'F', w: 8,   max: 3, desc: 'Speed +7%, turn rate +10%.', mod: { speed: 1.07, turn: 1.1 } },
  { id: 'seek',   name: 'SEEKER UPGRADE',    k: 'K', w: 6,   max: 3, desc: 'Missile lock 45% faster; +1 of each missile now.', mod: { lock: 1.45 }, once: p => { for (const k in p.def.stores || {}) if (k !== 'flare' && k !== 'drone' && p.def.stores[k] > 0) p.stores[k] = Math.min(p.def.stores[k] + 2, (p.stores[k] | 0) + 1); } },
  { id: 'salv',   name: 'SALVAGE TECH',      k: 'V', w: 6,   max: 3, desc: 'Pods fly to you from 60% further; 30% more drops.', mod: { magnet: 1.6, drop: 1.3 } },
  { id: 'repair', name: 'FIELD REPAIRS',     k: 'R', w: 6,   max: 3, desc: 'Every kill repairs 3% hull.' },
  { id: 'chainx', name: 'CHAIN REACTION',    k: 'X', w: 5,   max: 3, desc: 'Kills detonate: 70 m blast, 18 damage per level.' },
  { id: 'flare',  name: 'FLARE FOUNTAIN',    k: 'Z', w: 7,   max: 2, desc: '+12 flares; they pop automatically when a missile closes in.', once: p => { p.stores.flare = (p.stores.flare | 0) + 12; } },
  { id: 'bounty', name: 'BOUNTY HUNTER',     k: 'B', w: 6,   max: 3, desc: 'Score +25%.', mod: { score: 1.25 } },
  { id: 'links',  name: 'CHAIN LINKS',       k: 'N', w: 7,   max: 2, desc: 'Chain timer +50%.', mod: { chainT: 1.5 } },
  { id: 'wing',   name: 'CALL IN SUPPORT',   k: 'W', w: 2.5, max: 2, desc: 'A Kestrel wingman joins you now.', once: () => svAddWing() },
  { id: 'glass',  name: 'GLASS CANNON',      k: 'G', w: 2.5, max: 2, desc: 'Damage +40%, damage taken +25%.', mod: { dmg: 1.4, take: 1.25 } },
  { id: 'wind',   name: 'SECOND WIND',       k: 'Y', w: 2,   max: 1, desc: 'Once per run: at 18% hull you are restored to 60% hull and full shields.' },
];
const perkRarity = pk => (pk.w >= 8 ? 'COMMON' : pk.w >= 5 ? 'UNCOMMON' : 'RARE');

// ---- config, persistence --------------------------------------------------------------------------------------
const SV_DEFAULT = { diff: 'normal', wing: 0, mut: [], daily: false, seed: 0, look: 'lilypad' };
let svCfg = { ...SV_DEFAULT };
try { const j = JSON.parse(localStorage.getItem('gs_sv') || 'null'); if (j) svCfg = svNorm(j); } catch (e) { /* storage unavailable */ }
function svNorm(c) {
  const o = { ...SV_DEFAULT, ...c };
  if (!DIFFS[o.diff]) o.diff = 'normal';
  o.wing = clamp(o.wing | 0, 0, 2); o.mut = (o.mut || []).filter(k => MUTATORS[k]); o.daily = !!o.daily; o.seed = o.seed | 0;
  if (typeof LOOKS !== 'undefined' && !LOOKS[o.look]) o.look = 'lilypad';
  return o;
}
function svSave() { try { localStorage.setItem('gs_sv', JSON.stringify(svCfg)); } catch (e) { /* ignore */ } }
const todaySeed = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function mulberry(seed) { let s = (seed >>> 0) || 1; return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function svBest() { try { return JSON.parse(localStorage.getItem('gs_svbest') || '{}'); } catch (e) { return {}; } }
function svBestSave(key, score, wave) {
  const b = svBest(), o = b[key] || { score: 0, wave: 0 }; let nb = false;
  if (score > o.score) { o.score = score; nb = true; } if (wave > o.wave) o.wave = wave;
  b[key] = o; try { localStorage.setItem('gs_svbest', JSON.stringify(b)); } catch (e) { /* ignore */ }
  return nb;
}
const RANKS = [['CADET', 0], ['ENSIGN', 150], ['LIEUTENANT', 500], ['LT. COMMANDER', 1200], ['COMMANDER', 2400], ['CAPTAIN', 4500], ['COMMODORE', 8000], ['ADMIRAL', 14000]];
function careerGet() { try { return { xp: 0, runs: 0, kills: 0, ...JSON.parse(localStorage.getItem('gs_career') || '{}') }; } catch (e) { return { xp: 0, runs: 0, kills: 0 }; } }
function careerAdd(xp, kills) {
  const c = careerGet(); c.xp += Math.round(xp); c.runs += 1; c.kills += kills | 0;
  try { localStorage.setItem('gs_career', JSON.stringify(c)); } catch (e) { /* ignore */ }
  return c;
}
function careerRank(xp) { let r = RANKS[0][0], next = RANKS[1][1], i = 0; for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k][1]) { r = RANKS[k][0]; i = k; next = RANKS[k + 1] ? RANKS[k + 1][1] : null; } return { name: r, level: i, next }; }

// ---- styles and overlay elements (injected, no edits to the shell) --------------------------------------------------
let svBannerEl = null, svDraftEl = null;
{
  const st = document.createElement('style');
  st.textContent = `
  #svbanner{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:6;text-align:center;pointer-events:none;text-shadow:0 0 10px #000;opacity:0;transition:opacity .5s}
  #svbanner.on{opacity:1}#svbanner b{display:block;font-size:34px;letter-spacing:6px;color:#ffd24a}#svbanner span{display:block;font-size:13px;letter-spacing:3px;color:#c8fff0;margin-top:4px}
  body.phone #svbanner b{font-size:22px}body.phone #svbanner span{font-size:10px}
  #svdraft{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9;display:none;width:min(94vw,700px);box-sizing:border-box;padding:14px 16px;border-radius:10px;background:rgba(2,8,6,.55);box-shadow:0 0 0 100vmax rgba(0,0,0,.5);text-align:center;text-shadow:0 0 6px #000}
  #svdraft .svh{font-size:13px;letter-spacing:3px;color:#ffd24a;margin-bottom:10px}
  #svdraft .svc{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  #svdraft .svcard{width:200px;flex:0 1 200px;min-height:150px;padding:10px 12px;background:rgba(5,16,12,.92);border:1px solid #3a8a6c;border-radius:6px;color:#cfe;font:inherit;cursor:pointer;text-align:left;position:relative}
  #svdraft .svcard:hover,#svdraft .svcard:focus{border-color:#ffd24a;background:rgba(30,40,12,.95)}
  #svdraft .svcard i{position:absolute;right:10px;top:8px;font-style:normal;color:#ffd24a;opacity:.8;font-size:11px}
  #svdraft .svcard b{display:block;font-size:14px;color:#d8fff0;letter-spacing:1px;margin-bottom:2px}
  #svdraft .svcard em{display:block;font-style:normal;font-size:10px;letter-spacing:2px;margin-bottom:6px}
  #svdraft .svcard em.COMMON{color:#8fd8c0}#svdraft .svcard em.UNCOMMON{color:#6ac8ff}#svdraft .svcard em.RARE{color:#ff9af0}
  #svdraft .svcard p{margin:0;font-size:12px;line-height:1.4;color:#cfe}#svdraft .svcard small{display:block;margin-top:8px;opacity:.6;font-size:10px}
  #svdraft .svf{margin-top:10px;font-size:11px;opacity:.7}
  body.phone #svdraft{padding:8px 10px}body.phone #svdraft .svc{flex-wrap:nowrap;gap:6px}body.phone #svdraft .svcard{width:auto;flex:1 1 0;min-height:96px;padding:6px 7px}body.phone #svdraft .svcard b{font-size:10px}body.phone #svdraft .svcard p{font-size:9px}body.phone #svdraft .svh{font-size:10px}
  body.cine #svbanner,body.cine #svdraft{display:none!important}
  .mut{display:inline-flex;flex-direction:column;align-items:flex-start;margin:3px 6px 3px 0;padding:5px 9px;border:1px solid #3a6;border-radius:4px;background:#0c2a22;color:#cfe;font:inherit;cursor:pointer;font-size:12px;text-align:left}
  .mut.on{border-color:#ffd24a;background:#2a2a0c;color:#ffd24a}.mut small{opacity:.7;font-size:10px;max-width:220px}
  .medal{margin:2px 0}.medal b{color:#ffd24a}
  `;
  document.head.appendChild(st);
  svBannerEl = document.createElement('div'); svBannerEl.id = 'svbanner'; document.body.appendChild(svBannerEl);
  svDraftEl = document.createElement('div'); svDraftEl.id = 'svdraft'; document.body.appendChild(svDraftEl);
}
let svBannerT = 0;
function svBanner(big, small) { svBannerEl.innerHTML = `<b>${big}</b><span>${small || ''}</span>`; svBannerEl.classList.add('on'); svBannerT = 3.4; }

// ---- run state ---------------------------------------------------------------------------------------------------
let sv = null;                                         // the live run (also game.sv); null outside survival
const svPerkN = id => (sv && sv.perks[id]) || 0;
function svRecalc() {                                  // difficulty + mutators + perks -> player.modBase -> player.mod
  const p = player; if (!p || !sv) return;
  const D = DIFFS[sv.cfg.diff], mb = {};
  const mul = (k, v) => { mb[k] = (mb[k] ?? 1) * v; };
  mul('take', D.take);
  if (sv.mut.glass) mul('take', 1.5);
  if (sv.mut.scarce) mul('drop', 0.6);
  for (const pk of PERKS) { const n = svPerkN(pk.id); if (n && pk.mod) for (const k in pk.mod) mul(k, Math.pow(pk.mod[k], n)); }
  p.modBase = mb; recalcMods(p);
}
function svAddWing() {
  if (!player) return;
  const n = ships.filter(s => s.team === 0 && s !== player && s.def.cls === 'fighter' && !s.def.drone).length;
  if (n >= 4) return;
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  const w = makeShip('kestrel', 0, player.group.position.clone().addScaledVector(pf, -90).add(new THREE.Vector3((n % 2 ? 1 : -1) * 50, 10 * n, 0)), new THREE.Quaternion(), { callsign: 'WING' + (n + 1), ai: 'fighter', skill: 4, fm: flightMode });
  w.vel.copy(player.vel);
  juice.hadWing = true;
}
function svPerkOffers(n) {
  const R = sv.rng, pool = PERKS.filter(pk => svPerkN(pk.id) < pk.max && !(pk.id === 'wing' && ships.filter(s => s.team === 0 && s !== player && s.def.cls === 'fighter' && !s.def.drone).length >= 4));
  const out = [];
  while (out.length < 3 && pool.length) {
    let tot = 0; const ws = pool.map(pk => { const w = pk.w * (perkRarity(pk) === 'RARE' ? 1 + n * 0.05 : 1); tot += w; return w; });
    let r = R() * tot, i = 0; for (; i < pool.length - 1; i++) { r -= ws[i]; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
function svApplyPerk(pk) {
  sv.perks[pk.id] = (sv.perks[pk.id] || 0) + 1; sv.picks.push(pk.id);
  svRecalc();
  if (pk.once && player && player.alive) pk.once(player);
  log('PERK: ' + pk.name, '#ffd24a');
}
// kill hooks for perks that act on kills
let svReact = false;
killHooks.push((s, mine) => {
  if (!sv || !mine || !player || !player.alive) return;
  const rp = svPerkN('repair');
  if (rp) { const p = player; p.structure = Math.min(p.def.structure, p.structure + p.def.structure * 0.03 * rp); }
  const cx = svPerkN('chainx');
  if (cx && !svReact) {
    svReact = true;
    const pos = s.group.position, dmg = 18 * cx;
    flashAt(pos, 16, 0.35); sparksAt(pos, 30, 40);
    for (const e of ships) {
      if (e === s || !e.alive || e.dying || e.team !== 1 || e.group.position.distanceTo(pos) > 70 + e.def.radius) continue;
      const lp = e.group.worldToLocal(pos.clone()); lp.clampLength(0, Math.max(1, e.def.radius * 0.5));
      e.lastAttacker = player; hitSrc = player; hitKind = 'missile';
      applyHit(e, lp, dmg, e.group.localToWorld(lp.clone()), 'exp');
    }
    svReact = false;
  }
});

// ---- the wave director ------------------------------------------------------------------------------------------
const SV_TUNE = { b0: 1.6, b1: 1.1, s0: 1, sStep: 3 };       // wave budget = (b0 + b1 n) x difficulty x swarm (fighter units); pilot skill = s0 + n/sStep + difficulty. First guess; see docs/FUN_UPDATE.md for what was measured
const SV_POOL = [['darter', 1.0, 1], ['leaper', 1.2, 1], ['spitter', 1.8, 2], ['toad', 2.0, 3], ['reaver', 2.6, 4]];   // kind, budget cost, first wave
function svCompose(n) {
  const R = sv.rng, D = DIFFS[sv.cfg.diff], M = sv.mut, pick = a => a[Math.floor(R() * a.length)];
  const cm = D.count * (M.swarm ? 1.8 : 1);
  let B = (SV_TUNE.b0 + SV_TUNE.b1 * n) * cm;
  const rows = [], add = (k, c, o) => { c = Math.round(c); if (c > 0) rows.push({ kind: k, count: c, ...(o || {}) }); };
  let name = '', sub = '', ambush = false, elite = false;
  if (n % 5 === 0) {
    const tier = n / 5;
    if (tier === 1) { add('gulper', 1); add('reaver', 2); name = 'BOSS: GULPER'; sub = 'a corvette and its escort'; B *= 0.45; }
    else if (tier === 2) { add('gulper', 2); name = 'BOSS: TWIN GULPERS'; sub = 'two corvettes, keep moving'; B *= 0.45; }
    else { add('bullfrog', Math.min(2, tier - 2)); if (tier >= 4) add('gulper', 2); name = 'BOSS: BULLFROG'; sub = 'the spine lance: do not fly in a straight line'; B *= 0.3; }
  } else if (n >= 3 && R() < 0.42) {
    const ev = pick(['AMBUSH', 'SWARM', 'BOMBERS', 'ELITE']);
    name = ev;
    if (ev === 'AMBUSH') { ambush = true; sub = 'they are behind you'; B *= 0.8; }
    else if (ev === 'SWARM') { add('darter', B / 0.7, { soft: 0.6 }); sub = 'many, and fragile'; B = 0; }
    else if (ev === 'BOMBERS') { add('toad', Math.max(2, Math.ceil(n / 3) * cm), {}); sub = 'torpedo bombers, flares ready'; B *= 0.4; }
    else { elite = true; sub = 'fewer, and every one a veteran'; B *= 0.6; }
  }
  const pool = SV_POOL.filter(x => n >= x[2]);
  const bag = {};
  while (B > 0.9) {
    const fit = pool.filter(x => x[1] <= B + 0.3); if (!fit.length) break;
    const w = fit.map(x => 1 / x[1] + 0.15 * (n >= 6 ? x[1] : 0)), tot = w.reduce((a, b) => a + b, 0);
    let r = R() * tot, i = 0; for (; i < fit.length - 1; i++) { r -= w[i]; if (r <= 0) break; }
    bag[fit[i][0]] = (bag[fit[i][0]] || 0) + 1; B -= fit[i][1];
  }
  for (const k in bag) add(k, bag[k]);
  // an ace now and then (never on a wave that already has a capital boss before wave 10)
  const bossy = n % 5 === 0 && n < 10;
  const aceP = n >= 3 && !bossy ? clamp(0.25 + 0.05 * n, 0, 0.75) : 0;
  const ace = R() < aceP ? { kind: pick(['leaper', 'spitter', 'reaver']), name: SV_ACE_NAMES[sv.aceN % SV_ACE_NAMES.length] + (sv.aceN >= SV_ACE_NAMES.length ? '-' + (1 + Math.floor(sv.aceN / SV_ACE_NAMES.length)) : '') } : null;
  if (!name) name = n === 1 ? 'FIRST CONTACT' : '';
  return { rows, name, sub, ambush, elite, ace };
}
function svSkill(n) { return clamp(SV_TUNE.s0 + Math.floor(n / SV_TUNE.sStep) + DIFFS[sv.cfg.diff].skill + (sv.mut.aces ? 5 : 0), 1, 5); }
function svSpawnWave(n) {
  const spec = svCompose(n), R = sv.rng, p = player;
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
  const rnd = () => new THREE.Vector3(R() - 0.5, (R() - 0.5) * 0.6, R() - 0.5);
  let idx = 0;
  const skill = spec.elite ? 5 : svSkill(n);
  const place = (def, i) => {
    const big = def.cls !== 'fighter';
    const dir = spec.ambush && !big ? pf.clone().multiplyScalar(-1).addScaledVector(rnd(), 0.5).normalize() : rnd().multiplyScalar(0.9).addScaledVector(pf, 0.7).normalize();
    const dist = spec.ambush && !big ? 650 + R() * 350 : (big ? 2600 + def.radius * 0.6 : 1700 + R() * 700);
    return p.group.position.clone().addScaledVector(dir, dist).add(rnd().multiplyScalar(i * 8));
  };
  const spawnOne = (kind, o) => {
    const def = SHIPS[kind], e = spawnShip(kind, 1, place(def, idx++), p.group.position, { grp: 'SV', skill: o.skill ?? skill, fm: flightMode, ai: def.cls !== 'fighter' && kind !== 'gulper' && def.ai?.role !== 'lancer' ? 'capital' : undefined });
    if (kind === 'gulper') { const bf = ships.find(x => x.team === 1 && x.ai.role === 'lancer'); if (bf) e.ai.escort = bf; }
    let take = 1;
    if (o.soft) take /= o.soft;
    if (sv.mut.swarm && def.cls === 'fighter') take /= 0.6;
    if (sv.mut.glass) take /= 0.55;
    if (o.ace) take /= 1.8;
    if (take !== 1) e.mod.take = take;
    if (o.ace) { e.ace = true; e.callsign = o.name; }
    return e;
  };
  for (const row of spec.rows) for (let i = 0; i < row.count; i++) spawnOne(row.kind, row);
  if (spec.ace) { const a = spawnOne(spec.ace.kind, { ace: true, name: spec.ace.name, skill: 5 }); sv.aceN++; sfx('ace', 0, 1); comm(spec.ace.name, SV_TAUNTS[Math.floor(R() * SV_TAUNTS.length)], '#c8ff40'); a.ace = true; }
  sv.waveSpec = spec;
  const total = ships.filter(s => s.team === 1 && s.alive).length;
  const subline = [spec.sub, spec.ace ? `ace ${spec.ace.name} among them` : '', `${total} contacts`].filter(Boolean).join(' · ');
  svBanner(`WAVE ${n}${spec.name ? ' · ' + spec.name : ''}`, subline);
  sfx('wave', 0, 1);
  if (n > 1 && (n - 1) % 3 === 0) { const keys = Object.keys(LOOKS), look = keys[(n / 3 | 0) % keys.length]; if (look) applyLook(look); }
}

// ---- run lifecycle ----------------------------------------------------------------------------------------------
function startSurvival(cfgIn) {
  const cfg = svNorm(cfgIn || svCfg);
  menuView = null; $id('brief').style.display = 'none';
  if (cine) cancelTransit();
  document.body.classList.remove('cine'); cine = null;
  plogReset('survival');
  clearWorld();
  comms.length = 0; objectives.length = 0;
  game.mode = 'survival'; game.mission = null; game.mstate = null; game.anchor = null; game.seg = null; game.sk = null; game.skS = null;
  const seed = cfg.daily ? todaySeed() : (cfg.seed || ((Math.random() * 4294967295) >>> 0));
  const mut = {}; for (const k of cfg.mut) mut[k] = true;
  sv = game.sv = { cfg, seed, rng: mulberry(seed), n: 0, phase: 'fight', t: 0, tPhase: 0, perks: {}, picks: [], mut, aceN: 0, over: false, overT: 0, shown: false, windUsed: false, flareT: 0, waveT0: 0, kills0: 0, hull0: 0, noHit: true, draft: null, fleeT: 0 };
  applyLook(cfg.look);
  wave = 0; state = 'play'; flightMode = mut.newton ? 'newton' : 'arcade';
  const p = makeShip('kestrel', 0, new THREE.Vector3(), new THREE.Quaternion(), { player: true, callsign: 'ECHO', id: 'player' });
  p.shots = 0; p.hitsLanded = 0;
  const D = DIFFS[cfg.diff];
  juice.scoreMul = D.score * cfg.mut.reduce((a, k) => a * MUTATORS[k].score, 1);
  if (mut.scarce) { for (const k in p.stores) p.stores[k] = Math.ceil(p.stores[k] / 2); }
  svRecalc();
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
  for (let i = 0; i < cfg.wing; i++) makeShip('kestrel', 0, p.group.position.clone().addScaledVector(pf, -80).add(new THREE.Vector3((i - (cfg.wing - 1) / 2) * 60, (i % 2) * 25, 0)), new THREE.Quaternion(), { callsign: 'WING' + (i + 1), ai: 'fighter', skill: 3, fm: flightMode });
  for (const s of ships) if (s !== p) s.vel.copy(p.vel);
  log(`GAUNTLET · ${D.name}${cfg.mut.length ? ' · ' + cfg.mut.map(k => MUTATORS[k].name).join('+') : ''} · seed ${seed}`, '#ffd080');
  svNextWave();
  return game;
}
function svNextWave() {
  sv.n++; wave = sv.n; sv.phase = 'fight'; sv.tPhase = 0; sv.waveT0 = time; sv.kills0 = kills; sv.hull0 = player ? player.hullHits || 0 : 0; sv.hitMark = juice.hullHits;
  svSpawnWave(sv.n);
}
function svWaveClear() {
  const n = sv.n, p = player;
  const dur = time - sv.waveT0, clean = juice.hullHits === sv.hitMark;
  const bonus = Math.round((100 * n + Math.max(0, 90 - dur) * 2 + (clean ? 250 : 0)) * juice.scoreMul);
  juice.score += bonus; juice.bonus += bonus;
  juice.banners.push({ t: time, text: `WAVE ${n} CLEAR  +${bonus}`, sub: clean ? 'NO HULL DAMAGE +250' : '', col: '#ffd24a', big: true });
  for (const f of ['fore', 'aft']) p.shield[f] = Math.max(p.shield[f], p.def.shield[f] * (p.mod.shieldCap ?? 1));       // shields come back between waves
  p.structure = Math.min(p.def.structure, p.structure + p.def.structure * 0.1);
  for (const c of p.comps) if (c.hp > 0) c.hp = Math.min(c.max, c.hp + c.max * 0.15);
  for (let i = 0; i < 2; i++) lootSpawn(p.group.position.clone().add(new THREE.Vector3((i ? 1 : -1) * 60, 10, -120)), lootPick(p), p.vel);
  sv.phase = 'draft'; sv.tPhase = 0;
  sv.draft = { offers: svPerkOffers(n), t: 18 };
  svShowDraft();
  sfx('perk', 0, 1);
}
function svShowDraft() {
  const d = sv.draft; if (!d) return;
  svDraftEl.innerHTML = `<div class="svh">WAVE ${sv.n} CLEARED · CHOOSE A PERK · <span id="svt">${Math.ceil(d.t)}</span> s</div><div class="svc">`
    + d.offers.map((pk, i) => `<button class="svcard" data-i="${i}"><i>${i + 1}</i><b>${pk.name}</b><em class="${perkRarity(pk)}">${perkRarity(pk)}</em><p>${pk.desc}</p><small>${svPerkN(pk.id) ? 'owned x' + svPerkN(pk.id) + ' -> x' + (svPerkN(pk.id) + 1) : 'new'}</small></button>`).join('')
    + `</div><div class="svf">${isTouch ? 'tap a card' : 'press 1 / 2 / 3 or click'} · the first card is taken when the timer ends</div>`;
  svDraftEl.style.display = 'block';
  svDraftEl.querySelectorAll('.svcard').forEach(b => { b.onclick = e => { e.stopPropagation(); svPick(+b.dataset.i); }; b.onpointerdown = e => e.stopPropagation(); });   // desktop keeps pointer lock: keys 1/2/3; touch taps the cards
}
function svPick(i) {
  if (!sv || sv.phase !== 'draft' || !sv.draft) return;
  const pk = sv.draft.offers[i] || sv.draft.offers[0];
  svApplyPerk(pk); sfx('perk', 0, 1);
  svDraftEl.style.display = 'none'; sv.draft = null;
  sv.phase = 'break'; sv.tPhase = 0;
}
addEventListener('keydown', e => {                     // perk draft keys: 1 / 2 / 3 (captured so they do not change the fire group)
  if (!sv || sv.phase !== 'draft' || !sv.draft || optsOpen || rdlgOpen) return;
  const m = /^(Digit|Numpad)([1-3])$/.exec(e.code);
  if (!m) return;
  svPick(+m[2] - 1); e.preventDefault(); e.stopImmediatePropagation();
}, true);

function survivalUpdate(dt) {
  if (!sv) return;
  if (svBannerT > 0) { svBannerT -= dt; if (svBannerT <= 0) svBannerEl.classList.remove('on'); }
  if (sv.over) { sv.overT += dt; if (sv.overT > 2.6 && !sv.shown) { sv.shown = true; svShowDebrief(); } return; }
  sv.t += dt; sv.tPhase += dt;
  if (state === 'dead') { svEnd(); return; }
  if (state !== 'play') return;
  const p = player; if (!p || !p.alive) return;
  // perks that act over time
  if (svPerkN('wind') && !sv.windUsed && p.structure < p.def.structure * 0.18) {
    sv.windUsed = true; p.structure = p.def.structure * 0.6;
    for (const f of ['fore', 'aft']) p.shield[f] = p.def.shield[f] * (p.mod.shieldCap ?? 1);
    for (const c of p.comps) if (c.hp > 0) c.hp = Math.max(c.hp, c.max * 0.4);
    (p.buffs ||= {}).wind = { until: time + 2.5, mod: { take: 0.001 } }; recalcMods(p);
    juice.banners.push({ t: time, text: 'SECOND WIND', sub: 'hull restored', col: '#ff9af0', big: true }); sfx('perk', 0, 1);
  }
  if (svPerkN('flare') && warnState.incoming.length && time - sv.flareT > 0.9 && (p.stores.flare | 0) > 0 && p.cmCool <= 0) {
    const m = warnState.incoming[0]; if (m && m.pos.distanceTo(p.group.position) < 380) { deployCM(p); sv.flareT = time; }
  }
  if (sv.phase === 'fight') {
    const foes = ships.filter(s => s.team === 1 && s.alive);
    // a crippled enemy that fled far away is dropped (no anchor in this mode to do it for us)
    let gone = 0;
    for (const s of foes) if (s.ai.mode === 'flee' && s.group.position.distanceTo(p.group.position) > 3200) { s.ai.fleeT = (s.ai.fleeT || 0) + dt; if (s.ai.fleeT > 6) { s.alive = false; gone++; } }
    if (!foes.length || foes.length === gone) svWaveClear();
  } else if (sv.phase === 'draft') {
    sv.draft.t -= dt;
    const el = $id('svt'); if (el) el.textContent = Math.max(0, Math.ceil(sv.draft.t));
    if (sv.draft.t <= 0) svPick(0);
  } else if (sv.phase === 'break') {
    if (sv.tPhase > 3.5) svNextWave();
  }
}
function svEnd() {
  if (sv.over) return;
  sv.over = true; sv.overT = 0; sv.phase = 'over';
  svDraftEl.style.display = 'none'; svBannerEl.classList.remove('on');
}
function svHudLine(enemies) {
  const perks = Object.keys(sv.perks).map(id => { const pk = PERKS.find(x => x.id === id); return pk.k + (sv.perks[id] > 1 ? sv.perks[id] : ''); }).join(' ');
  return `WAVE ${sv.n}  SCORE ${juice.score}  KILLS ${kills}  FROGGS ${enemies}` + (perks ? `\nPERKS ${perks}` : '');
}
function svShowDebrief() {
  const c = sv.cfg, D = DIFFS[c.diff], p = player;
  const key = (c.daily ? 'daily' + sv.seed : 'run') + ':' + c.diff;
  const newBest = svBestSave(key, juice.score, sv.n);
  const best = svBest()[key] || { score: juice.score, wave: sv.n };
  const acc = p && p.shots ? Math.round(100 * (p.hitsLanded || 0) / p.shots) : 0;
  const before = careerGet(), rb = careerRank(before.xp);
  const gain = juice.score / 10 + sv.n * 15, after = careerAdd(gain, kills), ra = careerRank(after.xp);
  const rows = Object.keys(killLog).map(k => `<div>${SHIPS[k].name} <b>x ${killLog[k]}</b></div>`).join('') || '<div class="dim">none</div>';
  const perks = Object.keys(sv.perks).map(id => { const pk = PERKS.find(x => x.id === id); return `<div>${pk.name} <b>x${sv.perks[id]}</b></div>`; }).join('') || '<div class="dim">none</div>';
  menuShell(`<div class="sub">GAUNTLET · ${D.name}${c.mut.length ? ' · ' + c.mut.map(k => MUTATORS[k].name).join(' + ') : ''}${c.daily ? ' · DAILY ' + sv.seed : ' · seed ' + sv.seed}</div>
    <h1 class="bad">DOWN ON WAVE ${sv.n}</h1><h2>${newBest ? 'NEW BEST SCORE' : 'best: ' + best.score + ' (wave ' + best.wave + ')'}</h2>
    <div class="cols"><div><div class="sub">RUN</div><div>Score <b>${juice.score}</b></div><div>Kills <b>${kills}</b></div><div>Time <b>${Math.floor(sv.t / 60)}:${String(Math.floor(sv.t % 60)).padStart(2, '0')}</b></div><div>Accuracy <b>${acc}%</b></div>
      <div class="sub">PERKS</div>${perks}</div>
    <div><div class="sub">KILLS</div>${rows}${juiceDebriefHtml(acc, p ? p.shots || 0 : 0, kills)}
      <div class="sub">CAREER</div><div>+${Math.round(gain)} XP · <b>${ra.name}</b>${ra.level > rb.level ? ' <span class="ok">PROMOTED</span>' : ''}</div></div></div>
    <div class="btns"><button id="sv_re" data-f="re">RETRY</button><button class="alt" id="sv_set">SETUP</button><button class="alt" id="sv_menu">MAIN MENU</button></div>`, 'sk');
  menuView = 'debrief';
  $id('sv_re').onclick = () => { startSurvival(sv.cfg); launchLock(); };
  $id('sv_set').onclick = () => { svCfg = svNorm(sv.cfg); openMenu('survival'); };
  $id('sv_menu').onclick = () => openMenu();
  menuFocus('#sv_re');
}

// ---- setup screen ----------------------------------------------------------------------------------------------
function showSurvivalSetup(focus) {
  menuView = 'survival';
  const c = svCfg, b = svBest();
  const cur = b['run:' + c.diff], dly = b['daily' + todaySeed() + ':' + c.diff];
  const career = careerGet(), rk = careerRank(career.xp);
  menuShell(`<div class="sub">GAUNTLET · SURVIVAL</div><h1>HOW LONG CAN YOU HOLD?</h1>
    <h2>Waves of FROGGs, aces and bosses. After each wave pick a perk. Chain kills for score. Salvage pods keep you flying.</h2>
    <div class="skg"><div>
      <div class="sub">DIFFICULTY</div><div class="skrow">${skSeg('diff', Object.keys(DIFFS).map(k => [DIFFS[k].name, k]), c.diff)}</div><div class="dim">${DIFFS[c.diff].blurb} · score x${DIFFS[c.diff].score}</div>
      <div class="sub">WINGMEN (HUMAN, AI)</div><div class="skrow">${skSeg('wing', [[0, 0], [1, 1], [2, 2]], c.wing)}</div>
      <div class="sub">RUN</div><div class="skrow">${skSeg('daily', [['RANDOM', false], ['DAILY ' + todaySeed(), true]], c.daily)}</div>
      <div class="dim">${c.daily ? 'The same waves and perk offers for everyone today.' : 'A new random seed every run.'}</div>
    </div><div>
      <div class="sub">MUTATORS (each raises the score multiplier)</div>
      <div>${Object.keys(MUTATORS).map(k => `<button class="mut ${c.mut.includes(k) ? 'on' : ''}" data-f="mut-${k}" data-mut="${k}"><b>${MUTATORS[k].name} x${MUTATORS[k].score}</b><small>${MUTATORS[k].desc}</small></button>`).join('')}</div>
      <div class="sub">RECORDS</div><div>Best (${DIFFS[c.diff].name}): ${cur ? '<b>' + cur.score + '</b> · wave ' + cur.wave : '<span class="dim">no run yet</span>'}</div>
      <div>Daily best: ${dly ? '<b>' + dly.score + '</b> · wave ' + dly.wave : '<span class="dim">not played today</span>'}</div>
      <div>Career: <b>${rk.name}</b> · ${career.xp} XP${rk.next ? ' / ' + rk.next : ''} · ${career.runs} run${career.runs === 1 ? '' : 's'}</div>
    </div></div>
    <div class="btns stick"><button data-f="go" id="sv_go">LAUNCH</button><button class="alt" data-f="back" id="sv_back">BACK</button></div>`, 'sk');
  const el = $id('brief');
  const redo = f => { svSave(); showSurvivalSetup(f); };
  el.querySelectorAll('.seg button').forEach(b => { b.onclick = () => { const v = b.dataset.v; svCfg[b.dataset.k] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v); redo(b.dataset.f); }; });
  el.querySelectorAll('[data-mut]').forEach(b => { b.onclick = () => { const k = b.dataset.mut, i = svCfg.mut.indexOf(k); if (i >= 0) svCfg.mut.splice(i, 1); else svCfg.mut.push(k); redo(b.dataset.f); }; });
  $id('sv_back').onclick = showMainMenu;
  $id('sv_go').onclick = () => { svSave(); menuLeave(); startSurvival(svCfg); launchLock(); };
  menuFocus(focus ? `[data-f="${focus}"]` : '#sv_go');
}
addEventListener('keydown', e => {                     // setup screen: Esc = back, R swallowed (the main listener swallows R for every menu view)
  if (menuView !== 'survival' || optsOpen || credOpen || e.ctrlKey || e.metaKey) return;
  if (e.code === 'Escape') { showMainMenu(); e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
// ?sv=1 starts a run at load (tests): &sv_diff=hard &sv_wing=1 &sv_mut=glass,swarm &sv_seed=123 &sv_daily=1
function svFromParams() {
  const g = (k, d) => params.has(k) ? params.get(k) : d;
  return svNorm({ diff: g('sv_diff', 'normal'), wing: +g('sv_wing', 0), mut: g('sv_mut', '').split(',').filter(Boolean), seed: +g('sv_seed', 0), daily: params.has('sv_daily') });
}
