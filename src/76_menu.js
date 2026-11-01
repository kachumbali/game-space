// ======================================================================
//  MAIN MENU + SKIRMISH (quick-test mode)
//  Menu: CAMPAIGN / SKIRMISH / FREE FLIGHT / OPTIONS / CREDITS, drawn into the #brief overlay (state stays 'brief', the
//  last mission's world is the backdrop). Skirmish: a configurable fight from `cfg` (setup screen, ?sk= URL form or
//  __game.startSkirmish(cfg)); game.mode = 'skirmish'. Win = enemy force dead (or endless respawn), lose = player down.
//  Part 76 only calls other parts at run time, so there are no load-time dependencies on later parts.
// ======================================================================
const SK_ENEMY = ['darter', 'leaper', 'spitter', 'toad', 'reaver', 'gulper', 'halberd', 'exeter', 'bullfrog', 'hivecarrier'];
const SK_PRESETS = [
  { id: 'w1', name: 'WAVES 1', rows: [['leaper', 1]] },
  { id: 'w2', name: 'WAVES 2', rows: [['darter', 1], ['leaper', 1]] },
  { id: 'w3', name: 'WAVES 3', rows: [['darter', 1], ['leaper', 1], ['spitter', 1]] },
  { id: 'w5', name: 'WAVES 5', rows: [['darter', 1], ['leaper', 1], ['spitter', 1], ['toad', 1], ['reaver', 1]] },
  { id: 'heavy', name: 'HEAVY', rows: [['reaver', 2], ['spitter', 2]] },
  { id: 'gulper', name: 'GULPER', rows: [['gulper', 1], ['reaver', 1], ['darter', 2]] },
  { id: 'halberd', name: 'VS HALBERD', rows: [['halberd', 1]] },
  { id: 'exeter', name: 'VS EXETER', rows: [['exeter', 1]] },
  { id: 'bullfrog', name: 'BULLFROG', rows: [['bullfrog', 1]], warn: true },
  { id: 'bullfrog2', name: 'BULLFROG + 2 GULPER', rows: [['bullfrog', 1], ['gulper', 2]], warn: true },
  { id: 'hive', name: 'HIVE CARRIER (UNARMED)', rows: [['hivecarrier', 1]], warn: true },
];
const SK_PLAYER = [['kestrel', 'KESTREL (multirole fighter)'], ['merlin', 'MERLIN (light fighter)'], ['bittern', 'BITTERN (torpedo bomber)'], ['tern', 'TERN (unarmed resupply shuttle)']];
const SK_WING = SK_PLAYER.filter(x => x[0] !== 'tern');   // the shuttle has no weapons, so it is not offered as a wingman   // skirmish: your ship and your wingmen's ship
const SK_RANGES = [['CLOSE', 800], ['MEDIUM', 2000], ['FAR', 4000], ['VERY FAR', 10000]];
const SK_DEFAULT = { ship: 'kestrel', wship: 'kestrel', wing: 0, rows: [['leaper', 2]], skill: 3, wskill: 3, fm: 'arcade', missiles: true, respawn: false, range: 2000, look: 'lilypad', ally: 'none' };
let skCfg = { ...SK_DEFAULT, rows: SK_DEFAULT.rows.map(r => [...r]) };
try { const j = JSON.parse(localStorage.getItem('gs_sk') || 'null'); if (j && Array.isArray(j.rows)) skCfg = skNorm(j); } catch (e) { /* storage unavailable */ }
function skSave() { try { localStorage.setItem('gs_sk', JSON.stringify(skCfg)); } catch (e) { /* ignore */ } }
function skNorm(c) {
  const o = { ...SK_DEFAULT, ...c };
  o.rows = (c.rows || SK_DEFAULT.rows).map(r => Array.isArray(r) ? [r[0], r[1]] : [r.t, r.n]).filter(r => SHIPS[r[0]] && r[1] > 0).map(r => [r[0], Math.min(20, r[1] | 0)]);
  if (!o.rows.length) o.rows = SK_DEFAULT.rows.map(r => [...r]);
  o.wing = clamp(o.wing | 0, 0, 3); o.skill = clamp(o.skill | 0 || 3, 1, 5); o.wskill = clamp(o.wskill | 0 || 3, 1, 5);
  if (!SHIPS[o.ship] || !SK_PLAYER.some(x => x[0] === o.ship)) o.ship = 'kestrel';
  if (!SHIPS[o.wship] || !SK_WING.some(x => x[0] === o.wship)) o.wship = 'kestrel';
  o.fm = ['newton', 'sim'].includes(o.fm) ? o.fm : 'arcade'; o.missiles = !!o.missiles; o.respawn = !!o.respawn;
  o.range = clamp(+o.range || 2000, 300, 12000); if (!LOOKS[o.look]) o.look = 'lilypad';
  o.ally = ['halberd', 'exeter'].includes(o.ally) ? o.ally : 'none';
  return o;
}
// URL form: ?sk=darter:3,leaper:2&sk_skill=3&sk_wing=2  (also sk_ship=kestrel|merlin|bittern|tern, sk_wship=kestrel|merlin|bittern, sk_wskill, sk_fm, sk_msl=0|1, sk_respawn=1, sk_range, sk_look, sk_ally)
function skFromParams() {
  const rows = (params.get('sk') || '').split(',').map(s => s.trim()).filter(Boolean).map(s => { const [t, n] = s.split(':'); return [t, n === undefined ? 1 : parseInt(n) || 1]; });
  const g = (k, d) => params.has(k) ? params.get(k) : d;
  return skNorm({
    rows: rows.length ? rows : SK_DEFAULT.rows, ship: g('sk_ship', 'kestrel'), wship: g('sk_wship', 'kestrel'), skill: +g('sk_skill', 3), wskill: +g('sk_wskill', 3), wing: +g('sk_wing', 0), fm: g('sk_fm', 'arcade'),
    missiles: g('sk_msl', '1') !== '0', respawn: params.has('sk_respawn') && g('sk_respawn', '1') !== '0', range: +g('sk_range', 2000), look: g('sk_look', 'lilypad'), ally: g('sk_ally', 'none'),
  });
}

// ---- menu plumbing ---------------------------------------------------------------------------------------
let menuView = null;           // 'main' | 'missions' | 'skirmish' | 'debrief' | null (closed)
const lastMission = () => MISSIONS[MISSIONS.length - 1];
function menuShell(html, cls) {
  const el = $id('brief');
  el.innerHTML = `<div class="panel menu ${cls || ''}">${html}</div>`;
  el.style.display = 'flex';
  document.exitPointerLock?.();
  return el;
}
function menuFocus(sel) {
  const el = (sel && $id('brief').querySelector(sel)) || $id('brief').querySelector('.mi, [data-f]');
  if (el) el.focus({ preventScroll: false });
}
function menuLeave() { menuView = null; $id('brief').style.display = 'none'; }
function launchLock() { if (!isTouch) lockPointer(); touchStarted = true; audioInit(); }
// back to the backdrop world + main menu (used by the restart dialog, briefing and debriefs)
function openMenu(view) {
  startMission(lastMission());          // builds the backdrop world, shows the briefing; the menu then replaces it
  if (view === 'skirmish') showSkirmishSetup(); else if (view === 'survival') showSurvivalSetup(); else showMainMenu();
}
function showMainMenu() {
  menuView = 'main';
  const items = [
    ['intro', 'WATCH INTRO CUTSCENE', 'WC2-style test animation sequence [?scene=intro_test]'],
    ['campaign', 'CAMPAIGN / MISSIONS', 'Briefed sorties: Lilypad to The Spine'],
    ['survival', 'GAUNTLET', 'Survive wave after wave: perks, aces, bosses, chains'],
    ['skirmish', 'SKIRMISH', 'Quick test: pick ships, waves, skill, look'],
    ['free', 'FREE FLIGHT', 'Endless FROGG waves'],
    ['options', 'OPTIONS', 'Audio, device preset, LOD [O]'],
    ['credits', 'CREDITS', 'Third-party items and licences'],
  ];
  const rk = careerRank(careerGet().xp);
  menuShell(`<div class="sub">COLONIAL DEFENCE FORCE · EAGLE FLIGHT · ${rk.name}</div><h1>${GAME_TITLE.toUpperCase()}</h1><h2>Voxel space combat against the FROGGs</h2>
    <div class="mlist">${items.map(([a, t, d]) => `<button class="mi" data-a="${a}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>
    <div class="dim keys">UP / DOWN select · ENTER confirm · O options · v${GAME_VERSION}</div>`, 'main');
  $id('brief').querySelectorAll('.mi').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  menuFocus();
}
function menuAct(a) {
  if (a === 'intro') { menuLeave(); startScene('intro_test'); }
  else if (a === 'campaign') showMissionList();
  else if (a === 'survival') showSurvivalSetup();
  else if (a === 'skirmish') showSkirmishSetup();
  else if (a === 'free') { menuLeave(); resetGame(); launchLock(); }
  else if (a === 'options') toggleOpts(true);
  else if (a === 'credits') showCredits(true);
  else if (a === 'back') showMainMenu();
  else if (a.startsWith('m')) { menuLeave(); startMission(MISSIONS[+a.slice(1)]); }
}
function showMissionList() {
  menuView = 'missions';
  menuShell(`<div class="sub">CAMPAIGN</div><h1>SELECT MISSION</h1><h2>Opens the briefing</h2>
    <div class="mlist">${MISSIONS.map((m, i) => `<button class="mi" data-a="m${i}"><b>${i + 1}. ${m.title}</b><span>${m.subtitle}</span></button>`).join('')}<button class="mi alt" data-a="back"><b>BACK</b></button></div>`, 'main');
  $id('brief').querySelectorAll('.mi').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  menuFocus();
}
// up/down/enter on menu lists (capture phase, after the options/credits handlers which stop propagation when they are open)
addEventListener('keydown', e => {
  if (!menuView || optsOpen || credOpen || e.ctrlKey || e.metaKey) return;
  if (menuView === 'main' || menuView === 'missions') {
    const L = [...$id('brief').querySelectorAll('.mi')], i = L.indexOf(document.activeElement);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') L[(i + 1) % L.length].focus();
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') L[(i - 1 + L.length) % L.length].focus();
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' ) { (i >= 0 ? L[i] : L[0]).click(); }
    else if (e.code === 'Escape' && menuView === 'missions') showMainMenu();
    else if (e.code === 'KeyO' || e.code === 'KeyR') return;           // O is handled by the options listener; keep R from opening the restart dialog
    else return;
  } else if (menuView === 'skirmish') {
    if (e.code === 'Escape') showMainMenu(); else if (e.code === 'KeyR') { /* swallow */ } else return;
  } else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
addEventListener('keydown', e => { if (menuView && e.code === 'KeyR' && !optsOpen && !credOpen) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

// ---- skirmish setup screen ---------------------------------------------------------------------------------
function skSeg(k, vals, cur) {
  return `<span class="seg">${vals.map(([lab, v]) => `<button data-f="${k}-${v}" data-k="${k}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${lab}</button>`).join('')}</span>`;
}
function showSkirmishSetup(focus) {
  menuView = 'skirmish';
  const c = skCfg;
  const sc = $id('brief').querySelector('.panel')?.scrollTop || 0;
  const heavy = c.rows.some(r => r[0] === 'hivecarrier');
  const bfw = c.rows.some(r => r[0] === 'bullfrog');
  const cap = c.rows.some(r => ['gulper', 'halberd', 'exeter', 'bullfrog'].includes(r[0])) || c.ally !== 'none';
  const total = c.rows.reduce((a, r) => a + r[1], 0);
  const rows = c.rows.map((r, i) => `<div class="skrow"><select data-f="t${i}" data-t="${i}">${SK_ENEMY.map(k => `<option value="${k}" ${k === r[0] ? 'selected' : ''}>${SHIPS[k].name}</option>`).join('')}</select>
      <button data-f="m${i}" data-n="${i}" data-d="-1">-</button><b>${r[1]}</b><button data-f="p${i}" data-n="${i}" data-d="1">+</button><button data-f="x${i}" data-x="${i}" title="remove row">x</button></div>`).join('');
  menuShell(`<div class="sub">SKIRMISH · QUICK TEST</div><h1>SETUP</h1>
    <div class="skg"><div>
      <div class="sub">YOUR SHIP</div><div class="skrow"><select data-f="ship" id="sk_ship">${SK_PLAYER.map(([k, n]) => `<option value="${k}" ${k === c.ship ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="sub">WINGMEN (HUMAN, AI)</div><div class="skrow">${skSeg('wing', [[0, 0], [1, 1], [2, 2], [3, 3]], c.wing)}</div>
      <div class="sub">WINGMEN'S SHIP</div><div class="skrow">${skSeg('wship', SK_WING.map(([k, n]) => [n.split(' ')[0], k]), c.wship)}</div>
      <div class="sub">ESCORT CAPITAL (YOUR SIDE)</div><div class="skrow">${skSeg('ally', [['NONE', 'none'], ['HALBERD', 'halberd'], ['EXETER', 'exeter']], c.ally)}</div>
      <div class="sub">ENEMY FORCE · ${total} SHIP${total === 1 ? '' : 'S'}</div>
      <div class="skrow pre">${SK_PRESETS.map(p => `<button data-f="pre-${p.id}" data-pre="${p.id}">${p.name}</button>`).join('')}</div>
      ${rows}<div class="skrow"><button data-f="add" data-add="1">+ ADD ROW</button><button data-f="clr" data-clr="1">CLEAR</button></div>
      ${heavy ? '<div class="skwarn">WARNING: HIVE CARRIER is 2.5 km long and by far the heaviest model (coarse voxels, long build, low frame rate on weak GPUs). Not verified on real hardware.</div>' : ''}
      ${bfw ? '<div class="skwarn">WARNING: BULLFROG is 600 m with a 3.2 km spine lance, 26 turrets and 36 fighters (about 40-60k voxels plus up to 12 airborne fighters at once). Not verified on real hardware.</div>' : ''}
      ${cap && !heavy ? '<div class="skwarn lo">Corvette and frigate models are heavy to voxelise (Halberd ~35k, Gulper ~78k instances); loading takes a moment.</div>' : ''}
    </div><div>
      <div class="sub">ENEMY SKILL (1 ROOKIE - 5 ACE)</div><div class="skrow">${skSeg('skill', [1, 2, 3, 4, 5].map(v => [v, v]), c.skill)}</div>
      <div class="sub">FRIENDLY FLIGHT MODEL</div><div class="skrow">${skSeg('fm', [['ARCADE', 'arcade'], ['SIM (TIE)', 'sim'], ['NEWTON', 'newton']], c.fm)}</div>
      <div class="sub">ENEMY MISSILES</div><div class="skrow">${skSeg('missiles', [['ON', true], ['OFF', false]], c.missiles)}</div>
      <div class="sub">ENDLESS RESPAWN</div><div class="skrow">${skSeg('respawn', [['ON', true], ['OFF', false]], c.respawn)}</div>
      <div class="sub">STARTING RANGE</div><div class="skrow">${skSeg('range', SK_RANGES.map(([l, v]) => [`${l} ${v / 1000 < 1 ? v + ' m' : v / 1000 + ' km'}`, v]), c.range)}</div>
      <div class="sub">ENVIRONMENT</div><div class="skrow"><select data-f="look" id="sk_look">${Object.keys(LOOKS).map(k => `<option value="${k}" ${k === c.look ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}</select></div>
    </div></div>
    <div class="btns stick"><button data-f="go" id="sk_go">LAUNCH</button><button class="alt" data-f="back" id="sk_back">BACK</button></div>`, 'sk');
  const el = $id('brief'), P = el.querySelector('.panel');
  P.scrollTop = sc;
  const redo = f => { skSave(); showSkirmishSetup(f); };
  el.querySelectorAll('.seg button').forEach(b => {
    b.onclick = () => { const v = b.dataset.v; skCfg[b.dataset.k] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v); redo(b.dataset.f); };
  });
  el.querySelectorAll('[data-pre]').forEach(b => { b.onclick = () => { skCfg.rows = SK_PRESETS.find(p => p.id === b.dataset.pre).rows.map(r => [...r]); redo(b.dataset.f); }; });
  el.querySelectorAll('[data-t]').forEach(s => { s.onchange = () => { skCfg.rows[+s.dataset.t][0] = s.value; redo(s.dataset.f); }; });
  el.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { const r = skCfg.rows[+b.dataset.n]; r[1] = clamp(r[1] + +b.dataset.d, 1, 20); redo(b.dataset.f); }; });
  el.querySelectorAll('[data-x]').forEach(b => { b.onclick = () => { skCfg.rows.splice(+b.dataset.x, 1); redo(); }; });
  el.querySelector('[data-add]').onclick = () => { skCfg.rows.push(['leaper', 1]); redo('add'); };
  el.querySelector('[data-clr]').onclick = () => { skCfg.rows = []; redo('clr'); };
  $id('sk_ship').onchange = e => { skCfg.ship = e.target.value; skSave(); };
  $id('sk_look').onchange = e => { skCfg.look = e.target.value; skSave(); };
  $id('sk_back').onclick = showMainMenu;
  $id('sk_go').onclick = () => {
    if (!skCfg.rows.length) { skCfg.rows = SK_DEFAULT.rows.map(r => [...r]); }
    skSave(); menuLeave(); startSkirmish(skCfg); launchLock();
  };
  menuFocus(focus ? `[data-f="${focus}"]` : '#sk_go');
}

// ---- skirmish game ----------------------------------------------------------------------------------------
function startSkirmish(cfgIn) {
  const cfg = skNorm(cfgIn || {});
  game.sk = cfg;
  menuView = null; $id('brief').style.display = 'none';
  if (cine) cancelTransit();
  document.body.classList.remove('cine'); cine = null;
  plogReset('skirmish');
  clearWorld();
  comms.length = 0; objectives.length = 0;
  game.mode = 'skirmish'; game.mission = null; game.mstate = null; game.anchor = null; game.seg = null;
  game.skS = { t: 0, ended: false, endT: 0, result: null, why: '', respawnT: -1, shown: false, spawned: 0 };
  applyLook(cfg.look);
  wave = 0; state = 'play'; flightMode = cfg.fm;
  const p = makeShip(cfg.ship, 0, new THREE.Vector3(), new THREE.Quaternion(), { player: true, callsign: 'MEOW', id: 'player' });
  p.shots = 0; p.hitsLanded = 0;
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
  for (let i = 0; i < cfg.wing; i++) {
    const pos = p.group.position.clone().addScaledVector(pf, -80).add(new THREE.Vector3((i - (cfg.wing - 1) / 2) * 60, (i % 2) * 25, 0));
    makeShip(cfg.wship, 0, pos, new THREE.Quaternion(), { callsign: 'WING' + (i + 1), ai: 'fighter', skill: cfg.wskill, fm: cfg.fm });
  }
  if (cfg.ally !== 'none') {
    const a = makeShip(cfg.ally, 0, p.group.position.clone().addScaledVector(pf, -700), new THREE.Quaternion(), { callsign: cfg.ally.toUpperCase(), id: 'ally', ai: 'capital', hold: true });
    a.vel.set(0, 0, -4);
  }
  for (const s of ships) if (s !== p) s.vel.copy(p.vel);
  skSpawnForce();
  log('SKIRMISH: ' + cfg.rows.map(r => r[1] + ' ' + SHIPS[r[0]].name).join(', '), '#ffd080');
  return game;
}
const _pf2 = new THREE.Vector3();
function skSpawnForce() {
  const cfg = game.sk, pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  wave++; game.skS.spawned++;
  let n = 0;
  for (const [kind, count] of cfg.rows) for (let i = 0; i < count; i++, n++) {
    const def = SHIPS[kind], big = def.cls !== 'fighter';
    const dir = new THREE.Vector3().randomDirection().multiplyScalar(0.5).addScaledVector(pf, 0.8).normalize();
    const dist = cfg.range + (big ? def.radius : 0) + (big ? 0 : (n % 6) * 40);
    const pos = player.group.position.clone().addScaledVector(dir, dist);
    const e = spawnShip(kind, 1, pos, player.group.position, { grp: 'W', skill: cfg.skill, fm: cfg.fm, ai: big && kind !== 'gulper' && def.ai?.role !== 'lancer' ? 'capital' : undefined });
    if (kind === 'gulper') { const bfs = ships.find(x => x.team === 1 && x.ai.role === 'lancer'); if (bfs) { e.ai.escort = bfs; e.group.position.copy(bfs.group.position).addScaledVector(_pf2.set(0, 0, -1).applyQuaternion(bfs.group.quaternion), 750).addScaledVector(_pf2.set(1, 0, 0).applyQuaternion(bfs.group.quaternion), (i % 2 ? -1 : 1) * 575); } }
    if (!cfg.missiles) for (const k of MSL_ORDER) if (k in e.stores) e.stores[k] = 0;
  }
}
function skirmishUpdate(dt) {
  const S = game.skS; if (!S) return;
  if (S.ended) { S.endT += dt; if (S.endT > (S.result === 'win' ? 3 : 2.5) && !S.shown) { S.shown = true; showSkirmishDebrief(); } return; }
  S.t += dt;
  if (state === 'dead') return skEnd('lose', 'MEOW DOWN');
  if (state !== 'play') return;
  if (ships.some(s => s.team === 1 && s.alive)) { S.respawnT = -1; return; }
  if (game.sk.respawn) { if (S.respawnT < 0) S.respawnT = 3; S.respawnT -= dt; if (S.respawnT <= 0) { S.respawnT = -1; skSpawnForce(); log(`WAVE ${wave}`, '#ffd080'); } }
  else skEnd('win', 'ENEMY FORCE DESTROYED');
}
function skEnd(result, why) {
  const S = game.skS; if (S.ended) return;
  S.ended = true; S.result = result; S.why = why; S.endT = 0;
  if (result === 'win') state = 'done';
}
function showSkirmishDebrief() {
  const S = game.skS, p = player, win = S.result === 'win';
  const acc = p && p.shots ? Math.round(100 * (p.hitsLanded || 0) / p.shots) : 0;
  const rows = Object.keys(killLog).map(k => `<div>${SHIPS[k].name} <b>x ${killLog[k]}</b></div>`).join('') || '<div class="dim">none</div>';
  menuShell(`<div class="sub">SKIRMISH DEBRIEF</div><h1 class="${win ? 'ok' : 'bad'}">${win ? 'VICTORY' : 'DEFEAT'}</h1><h2>${S.why}${game.sk.respawn ? ' (endless respawn)' : ''}</h2>
    <div class="cols"><div><div class="sub">KILLS</div>${rows}</div>
    <div><div class="sub">REPORT</div><div>Kills <b>${kills}</b></div><div>Time <b>${Math.floor(S.t / 60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}</b></div><div>Accuracy <b>${acc}%</b></div><div>Hull damage taken <b>${Math.round(p ? p.dmgTaken || 0 : 0)}</b></div>${game.sk.respawn ? `<div>Waves <b>${S.spawned}</b></div>` : ''}</div></div>
    <div class="btns"><button id="sk_re" data-f="re">RESTART</button><button class="alt" id="sk_set">SETUP</button><button class="alt" id="sk_menu">MAIN MENU</button></div>`, 'sk');
  menuView = 'debrief';
  $id('sk_re').onclick = () => { startSkirmish(game.sk); launchLock(); };
  $id('sk_set').onclick = () => { skCfg = skNorm(game.sk); openMenu('skirmish'); };
  $id('sk_menu').onclick = () => openMenu();
  menuFocus('#sk_re');
}
