// ======================================================================
//  MAIN MENU + SKIRMISH (quick-test mode)
//  Menu: CAMPAIGN / SHIPYARD / SKIRMISH / FREE FLIGHT / OPTIONS / CREDITS, drawn into the #brief overlay (state stays 'brief', the
//  last mission's world is the backdrop). Skirmish: a configurable fight from `cfg` (setup screen, ?sk= URL form or
//  __game.startSkirmish(cfg)); game.mode = 'skirmish'. Win = enemy force dead (or endless respawn), lose = player down.
//  Part 76 only calls other parts at run time, so there are no load-time dependencies on later parts.
// ======================================================================
const SK_ENEMY = ['darter', 'leaper', 'spitter', 'toad', 'reaver', 'gulper', 'halberd', 'exeter', 'carrier', 'bullfrog', 'hivecarrier'];
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
const SK_PLAYER = [['kestrel', 'KESTREL (multirole fighter)'], ['falchion', 'FALCHION (two-seat heavy fighter)'], ['merlin', 'MERLIN (light fighter)'], ['bittern', 'BITTERN (torpedo bomber)'], ['tern', 'TERN (unarmed resupply shuttle)'], ['sar', 'PETREL SAR CUTTER (unarmed rescue ship)']];
const SK_WING = [...SK_PLAYER.filter(x => x[0] !== 'tern' && x[0] !== 'sar'), ['kite6', 'KITE-6 (loyal wingman)']];
const SK_FRIENDLY = Object.values(SHIPS).filter(s => s.fac === 'human' && !s.mark && !s.drone && s.id !== 'drone').map(s => s.id);
// Starting ships, including the player and wingmen. Missile and launched-craft limits remain independent.
const SK_LIMITS = { phone: 20, tablet: 32, laptop: 48, desktop: 48, max: 48 };
const skLimit = () => SK_LIMITS[deviceName()] || 48;
const skCount = rows => rows.reduce((n, r) => n + r[1], 0);
const SK_RANGES = [['CLOSE', 800], ['MEDIUM', 2000], ['FAR', 4000], ['VERY FAR', 10000]];
const SK_DEFAULT = { ship: 'kestrel', wship: 'kestrel', wing: 0, rows: [['leaper', 2]], friendly: [], skill: 3, wskill: 3, fm: 'arcade', missiles: true, respawn: false, range: 2000, look: 'lilypad', ally: 'none' };
let skCfg = { ...SK_DEFAULT, rows: SK_DEFAULT.rows.map(r => [...r]) };
try { const j = JSON.parse(localStorage.getItem('gs_sk') || 'null'); if (j && Array.isArray(j.rows)) skCfg = skNorm(j); } catch (e) { /* storage unavailable */ }
function skSave() { try { localStorage.setItem('gs_sk', JSON.stringify(skCfg)); } catch (e) { /* ignore */ } }
function skNorm(c) {
  const o = { ...SK_DEFAULT, ...c };
  const rows = (items, allowed) => items.map(r => Array.isArray(r) ? [r[0], r[1]] : [r.t, r.n]).filter(r => allowed(r[0]) && r[1] > 0).map(r => [r[0], Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number(r[1])))]);
  o.rows = rows(c.rows || SK_DEFAULT.rows, id => !!SHIPS[id]);
  o.friendly = rows(Array.isArray(c.friendly) ? c.friendly : (c.ally && c.ally !== 'none' ? [[c.ally, 1]] : []), id => SK_FRIENDLY.includes(id));
  o.wing = clamp(o.wing | 0, 0, 3); o.skill = clamp(o.skill | 0 || 3, 1, 5); o.wskill = clamp(o.wskill | 0 || 3, 1, 5);
  if (!SHIPS[o.ship] || !SK_PLAYER.some(x => x[0] === o.ship)) o.ship = 'kestrel';
  if (!SHIPS[o.wship] || !SK_WING.some(x => x[0] === o.wship)) o.wship = 'kestrel';
  o.fm = ['newton', 'sim'].includes(o.fm) ? o.fm : 'arcade'; o.missiles = !!o.missiles; o.respawn = !!o.respawn;
  o.range = clamp(+o.range || 2000, 300, 12000); if (!LOOKS[o.look]) o.look = 'lilypad';
  o.ally = 'none'; // legacy ally is migrated to friendly rows once
  let remaining = Math.max(0, skLimit() - 1 - o.wing);
  o.clamped = !!c.clamped;
  for (const key of ['rows', 'friendly']) {
    o[key] = o[key].map(([id, count]) => { const n = Math.min(count, remaining); remaining -= n; if (n < count) o.clamped = true; return [id, n]; }).filter(r => r[1] > 0);
  }
  return o;
}
// URL form: ?sk=darter:3,leaper:2&skh=exeter:1,kestrel:6&sk_skill=3&sk_wing=2  (also sk_ship=kestrel|falchion|merlin|bittern|tern|sar, sk_wship=kestrel|falchion|merlin|bittern, sk_wskill, sk_fm, sk_msl=0|1, sk_respawn=1, sk_range, sk_look, sk_ally)
function skFromParams() {
  const rows = (params.get('sk') || '').split(',').map(s => s.trim()).filter(Boolean).map(s => { const [t, n] = s.split(':'); return [t, n === undefined ? 1 : parseInt(n) || 1]; });
  const friendly = (params.get('skh') || '').split(',').map(s => s.trim()).filter(Boolean).map(s => { const [t, n] = s.split(':'); return [t, n === undefined ? 1 : parseInt(n) || 1]; });
  const g = (k, d) => params.has(k) ? params.get(k) : d;
  return skNorm({
    rows: rows.length ? rows : SK_DEFAULT.rows, ...(params.has('skh') ? { friendly } : {}), ship: g('sk_ship', 'kestrel'), wship: g('sk_wship', 'kestrel'), skill: +g('sk_skill', 3), wskill: +g('sk_wskill', 3), wing: +g('sk_wing', 0), fm: g('sk_fm', 'arcade'),
    missiles: g('sk_msl', '1') !== '0', respawn: params.has('sk_respawn') && g('sk_respawn', '1') !== '0', range: +g('sk_range', 2000), look: g('sk_look', 'lilypad'), ally: g('sk_ally', 'none'),
  });
}

// ---- menu plumbing ---------------------------------------------------------------------------------------
let menuView = null;           // 'main' | 'missions' | 'skirmish' | 'debrief' | null (closed)
const lastMission = () => MISSIONS[MISSIONS.length - 1];
const yardShips = () => Object.values(SHIPS).filter(s => !s.mark && s.id !== 'drone').sort((a, b) => (a.fac || '').localeCompare(b.fac || '') || (a.cls || '').localeCompare(b.cls || '') || a.name.localeCompare(b.name));
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
  const nextPrologue = prologueNextIndex();
  const items = [
    ...(nextPrologue >= 0 ? [['continue', 'CONTINUE PROLOGUE', `Mission ${nextPrologue + 1} of ${PROLOGUE_MISSIONS.length} · ${PROLOGUE_MISSIONS[nextPrologue].title}`]] : []),
    ['intro', 'WATCH INTRO CUTSCENE', 'WC2-style test animation sequence [?scene=intro_test]'],
    ['prologue_opening', 'WATCH PROLOGUE OPENING', 'Replay the opening'],
    ['campaign', 'CAMPAIGNS', 'Uncharted Vanguard, then The Severed Node'],
    ['yard', 'SHIPYARD', 'Fleet technical database: inspect hulls, systems, weapons'],
    ['survival', 'GAUNTLET', 'Survive wave after wave: perks, aces, bosses, chains'],
    ['skirmish', 'SKIRMISH', 'Quick test: pick ships, waves, skill, look'],
    ['free', 'FREE FLIGHT', 'Endless FROGG waves'],
    ['options', 'OPTIONS', 'Audio, device preset, LOD [O]'],
    ['credits', 'CREDITS', 'Third-party items and licences'],
  ];
  const rk = careerRank(careerGet().xp);
  menuShell(`<div class="sub">COLONIAL DEFENCE FORCE · EAGLE FLIGHT · ${rk.name}</div><h1>${GAME_TITLE.toUpperCase()}</h1><h2>Voxel space combat against the FROGGs</h2>
    <div class="mlist">${items.map(([a, t, d]) => `<button class="mi" data-a="${a}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>
    <div class="dim keys">UP / DOWN select · ENTER confirm · O options · v${GAME_VERSION} · build ${BUILD_ID}</div>`, 'main');
  $id('brief').querySelectorAll('.mi').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  menuFocus();
}
function menuAct(a) {
  if (a === 'continue') { const i = prologueNextIndex(); if (i >= 0) { menuLeave(); startMission(PROLOGUE_MISSIONS[i]); } }
  else if (a === 'intro') { menuLeave(); startScene('intro_test'); }
  else if (a === 'prologue_opening') { menuLeave(); startScene('prologue_opening', showMainMenu); }
  else if (a === 'campaign') showCampaignList();
  else if (a === 'yard') showShipyardCatalog();
  else if (a === 'survival') showSurvivalSetup();
  else if (a === 'skirmish') showSkirmishSetup();
  else if (a === 'free') { menuLeave(); resetGame(); launchLock(); }
  else if (a === 'options') toggleOpts(true);
  else if (a === 'credits') showCredits(true);
  else if (a === 'back') showMainMenu();
  else if (a.startsWith('yard:')) showShipyardCatalog(a.slice(5));
  else if (a.startsWith('campaign:')) { const c = CAMPAIGNS.find(c => c.id === a.slice(9)); if (c && (c.id === 'prologue' || prologueUnlocked())) showMissionList(c); }
  else if (a.startsWith('mission:')) {
    const [, cid, i] = a.split(':'); const c = CAMPAIGNS.find(x => x.id === cid);
    if (c && (c.id === 'prologue' || prologueUnlocked()) && c.missions[+i]) { menuLeave(); startMission(c.missions[+i]); }
  }
}
function yardWeaponLine(wid, suffix = '') {
  const w = WEAPONS[wid];
  if (!w) return wid.toUpperCase() + suffix;
  const feed = w.ammo ? `${w.ammo} rds` : w.energy ? `${w.energy} MJ/shot` : 'reactor-fed';
  return `${w.name}${suffix} · ${w.kind || 'weapon'} · ${feed}`;
}
function yardStores(def) {
  const stores = Object.entries(def.stores || {}).filter(([, n]) => n > 0).map(([id, n]) => `${id.toUpperCase()} × ${n}`);
  return stores.length ? stores.join(' · ') : 'None carried';
}
function showShipyardCatalog(selectedId) {
  menuView = 'yard';
  const roster = yardShips();
  const def = SHIPS[selectedId] || roster.find(s => s.id === 'kestrel') || roster[0];
  const weapons = [
    ...(def.mounts || []).map(m => yardWeaponLine(m.w, m.grp ? ` · G${m.grp}` : '')),
    ...(def.turrets || []).map(t => yardWeaponLine(t.w, ` · ${t.side < 0 ? 'ventral' : 'dorsal'} turret`)),
  ];
  const components = (def.comps || []).map(c => `${c.name} (${c.hp} HP)`).join(' · ') || 'No damageable subsystems authored';
  const faction = def.fac === 'frogg' ? 'FROGG BIOFLEET' : 'COLONIAL DEFENCE FORCE';
  const speed = `${Math.round(def.maxSpeed || 0)} m/s`;
  const shields = def.shield ? `${Math.round(def.shield.fore || 0)} / ${Math.round(def.shield.aft || 0)}` : 'None';
  const plant = def.power ? `${Math.round(def.power.plantMW)} MW` : '—';
  const cap = def.power ? `${Math.round(def.power.capacitorMJ)} MJ` : '—';
  menuShell(`<div class="sub">SHIPYARD · FLEET TECHNICAL DATABASE</div><h1>INSPECT FLEET ASSETS</h1><h2>Select a hull, review its field data, then enter the voxel inspection bay.</h2>
    <div class="yardcatalog"><nav class="yardroster" aria-label="Ship roster">${roster.map(s => `<button class="yardship ${s.id === def.id ? 'on' : ''}" data-a="yard:${s.id}"><b>${s.name}</b><small>${s.fac === 'frogg' ? 'FROGG' : 'CDF'} · ${(s.role || s.cls).toUpperCase()}</small></button>`).join('')}</nav>
    <section class="yarddetail"><div class="sub">${faction} · ${(def.role || def.cls).toUpperCase()}</div><h2>${def.name}</h2>
      <div class="yardstats"><div><span>IN-GAME LENGTH</span>${Math.round(def.length)} m</div><div><span>HULL STRUCTURE</span>${Math.round(def.structure || 0)}</div><div><span>SHIELDS F / A</span>${shields}</div><div><span>TOP SPEED</span>${speed}</div><div><span>REACTOR</span>${plant}</div><div><span>CAPACITOR</span>${cap}</div></div>
      <div class="yardreadout"><div><div class="sub">ARMAMENT</div><ul>${weapons.map(w => `<li>${w}</li>`).join('') || '<li>Unarmed</li>'}</ul><div class="sub">ORDNANCE / STORES</div><div>${yardStores(def)}</div></div>
      <div><div class="sub">SUBSYSTEMS</div><div>${components}</div><div class="sub">FLIGHT / PROTECTION</div><div>Armour: ${(def.armor?.type || 'none').toUpperCase()} ${def.armor?.rating ?? '—'} · Turn: ${(def.turn || 0).toFixed(2)} · Engines: ${(def.engines || []).length}</div><div class="sub">INSPECTION NOTE</div><div>Markers in the voxel bay show engines, mounts, turrets, sensors, shields, reactor and other authored systems.</div></div></div>
      <div class="btns yardlaunch"><button id="yard_inspect">OPEN VOXEL INSPECTION BAY</button><button class="alt" id="yard_back">BACK</button></div></section></div>`, 'yard-menu');
  const el = $id('brief');
  el.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  el.querySelector('#yard_inspect').onclick = () => { location.href = `${location.pathname}?yard=${encodeURIComponent(def.id)}`; };
  el.querySelector('#yard_back').onclick = showMainMenu;
  menuFocus('.yardship.on');
}
function showCampaignList() {
  menuView = 'missions';
  menuShell(`<div class="sub">CAMPAIGNS</div><h1>SELECT CAMPAIGN</h1><h2>Choose a story arc</h2>
    <div class="mlist">${CAMPAIGNS.map(c => `<button class="mi" data-a="campaign:${c.id}" ${c.id !== 'prologue' && !prologueUnlocked() ? 'disabled' : ''}><b>${c.title}</b><span>${c.subtitle} · ${c.missions.length} missions${c.id !== 'prologue' ? (prologueUnlocked() ? ' · UNPOLISHED' : ' · LOCKED UNTIL PROLOGUE 4') : ''}</span></button>`).join('')}<button class="mi alt" data-a="back"><b>BACK</b></button></div>`, 'main');
  $id('brief').querySelectorAll('.mi').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  menuFocus();
}
function showMissionList(campaign) {
  const c = campaign || CAMPAIGNS.find(c => c.id === 'severed_node');
  menuView = 'missions';
  menuShell(`<div class="sub">CAMPAIGN · ${c.title}</div><h1>SELECT MISSION</h1><h2>Opens the briefing</h2>
    <div class="mlist">${c.missions.map((m, i) => `<button class="mi" data-a="mission:${c.id}:${i}"><b>${i + 1}. ${m.title}</b><span>${m.subtitle}</span></button>`).join('')}<button class="mi alt" data-a="campaign"><b>BACK TO CAMPAIGNS</b></button></div>`, 'main');
  $id('brief').querySelectorAll('.mi').forEach(b => { b.onclick = () => menuAct(b.dataset.a); });
  menuFocus();
}
// up/down/enter on menu lists (capture phase, after the options/credits handlers which stop propagation when they are open)
addEventListener('keydown', e => {
  if (!menuView || optsOpen || credOpen || e.ctrlKey || e.metaKey) return;
  if (menuView === 'main' || menuView === 'missions' || menuView === 'yard') {
    const L = [...$id('brief').querySelectorAll('.mi:not(:disabled)')], i = L.indexOf(document.activeElement);
    if (!L.length) return;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') L[(i + 1) % L.length].focus();
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') L[(i - 1 + L.length) % L.length].focus();
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' ) { (i >= 0 ? L[i] : L[0]).click(); }
    else if (e.code === 'Escape' && (menuView === 'missions' || menuView === 'yard')) showMainMenu();
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
  const cap = [...c.rows, ...c.friendly].some(r => ['gulper', 'halberd', 'exeter', 'bullfrog'].includes(r[0])) || c.ally !== 'none';
  const total = c.rows.reduce((a, r) => a + r[1], 0);
  const fleetRows = (fleet, kinds, prefix) => fleet.map((r, i) => `<div class="skrow"><select data-f="${prefix}t${i}" data-t="${i}" data-fleet="${prefix}">${kinds.map(k => `<option value="${k}" ${k === r[0] ? 'selected' : ''}>${SHIPS[k].name}</option>`).join('')}</select>
      <button data-f="${prefix}m${i}" data-fleet="${prefix}" data-n="${i}" data-d="-1">-</button><b>${r[1]}</b><button data-f="${prefix}p${i}" data-fleet="${prefix}" data-n="${i}" data-d="1">+</button><button data-f="${prefix}x${i}" data-fleet="${prefix}" data-x="${i}" title="remove row">x</button></div>`).join('');
  menuShell(`<div class="sub">SKIRMISH · QUICK TEST</div><h1>SETUP</h1>
    <div class="skg"><div>
      <div class="sub">YOUR SHIP</div><div class="skrow"><select data-f="ship" id="sk_ship">${SK_PLAYER.map(([k, n]) => `<option value="${k}" ${k === c.ship ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="sub">WINGMEN (HUMAN, AI)</div><div class="skrow">${skSeg('wing', [[0, 0], [1, 1], [2, 2], [3, 3]], c.wing)}</div>
      <div class="sub">WINGMEN'S SHIP</div><div class="skrow">${skSeg('wship', SK_WING.map(([k, n]) => [n.split(' ')[0], k]), c.wship)}</div>
      <div class="sub">FRIENDLY FLEET · ${skCount(c.friendly)} SHIPS</div><div class="dim">Additional ships; your ship and wingmen are separate.</div>
      ${fleetRows(c.friendly, SK_FRIENDLY, 'h')}<div class="skrow"><button data-f="hadd" data-hadd>+ ADD FRIENDLY ROW</button><button data-f="hclr" data-hclr>CLEAR</button></div>
      <div class="sub">STARTING SHIPS: ${1 + c.wing + skCount(c.friendly) + total} / ${skLimit()} · ${deviceName().toUpperCase()}</div>
      ${c.clamped ? '<div class="skwarn" role="status">Fleet exceeds this device preset’s starting ship limit; counts were clamped.</div>' : ''}
      <div class="sub">ENEMY FORCE · ${total} SHIP${total === 1 ? '' : 'S'}</div>
      <div class="skrow pre">${SK_PRESETS.map(p => `<button data-f="pre-${p.id}" data-pre="${p.id}">${p.name}</button>`).join('')}</div>
      ${fleetRows(c.rows, SK_ENEMY, '')}<div class="skrow"><button data-f="add" data-add="1">+ ADD ROW</button><button data-f="clr" data-clr="1">CLEAR</button></div>
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
    <div class="btns stick"><button data-f="go" id="sk_go">LAUNCH</button>${rescueEnabled() ? '<button id="sk_sar1">SAR: BEACONS</button><button id="sk_sar2">SAR: LAST LIGHT</button>' : ''}<button class="alt" data-f="back" id="sk_back">BACK</button></div>`, 'sk');
  const el = $id('brief'), P = el.querySelector('.panel');
  P.scrollTop = sc;
  const redo = f => { skCfg.clamped = false; skCfg = skNorm(skCfg); skSave(); showSkirmishSetup(f); };
  const fleet = el => el.dataset.fleet === 'h' ? skCfg.friendly : skCfg.rows;
  el.querySelectorAll('.seg button').forEach(b => {
    b.onclick = () => { const v = b.dataset.v; skCfg[b.dataset.k] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v); redo(b.dataset.f); };
  });
  el.querySelectorAll('[data-pre]').forEach(b => { b.onclick = () => { skCfg.rows = SK_PRESETS.find(p => p.id === b.dataset.pre).rows.map(r => [...r]); redo(b.dataset.f); }; });
  el.querySelectorAll('[data-t]').forEach(s => { s.onchange = () => { fleet(s)[+s.dataset.t][0] = s.value; redo(s.dataset.f); }; });
  el.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { const r = fleet(b)[+b.dataset.n]; r[1] = Math.max(1, r[1] + +b.dataset.d); redo(b.dataset.f); }; });
  el.querySelectorAll('[data-x]').forEach(b => { b.onclick = () => { fleet(b).splice(+b.dataset.x, 1); redo(); }; });
  el.querySelector('[data-hadd]').onclick = () => { skCfg.friendly.push(['kestrel', 1]); redo('hadd'); };
  el.querySelector('[data-hclr]').onclick = () => { skCfg.friendly = []; redo('hclr'); };
  el.querySelector('[data-add]').onclick = () => { skCfg.rows.push(['leaper', 1]); redo('add'); };
  el.querySelector('[data-clr]').onclick = () => { skCfg.rows = []; redo('clr'); };
  $id('sk_ship').onchange = e => { skCfg.ship = e.target.value; skSave(); };
  $id('sk_look').onchange = e => { skCfg.look = e.target.value; skSave(); };
  $id('sk_back').onclick = showMainMenu;
  if (rescueEnabled()) for (const [id, i] of [['sk_sar1',0],['sk_sar2',1]]) $id(id).onclick = () => { menuLeave(); startMission(SAR_MISSIONS[i]); };
  $id('sk_go').onclick = () => {
    if (!skCfg.rows.length) {
      skCfg.rows = SK_DEFAULT.rows.map(r => [...r]);
      skCfg.clamped = false; skCfg = skNorm(skCfg);
      if (skCfg.clamped) { skSave(); showSkirmishSetup('go'); return; }
    }
    skSave(); menuLeave(); startSkirmish(skCfg); launchLock();
  };
  menuFocus(focus ? `[data-f="${focus}"]` : '#sk_go');
}

// ---- skirmish game ----------------------------------------------------------------------------------------
function startSkirmish(cfgIn) {
  const input = cfgIn || {};
  const cfg = skNorm({ ...input, rows: input.rows?.length ? input.rows : SK_DEFAULT.rows });
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
  const p = makeShip(cfg.ship, 0, new THREE.Vector3(), new THREE.Quaternion(), { player: true, callsign: rosterEnabled() ? rosterLoad().player.callsign : 'MEOW', id: 'player' });
  quickNukeLoad(p);
  nukeTestParams(p);                                   // ?nuke=N &nukeKt=Y work in skirmish too
  p.shots = 0; p.hitsLanded = 0;
  const pf = new THREE.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
  for (let i = 0; i < cfg.wing; i++) {
    const pos = p.group.position.clone().addScaledVector(pf, -80).add(new THREE.Vector3((i - (cfg.wing - 1) / 2) * 60, (i % 2) * 25, 0));
    const wing = makeShip(cfg.wship, 0, pos, new THREE.Quaternion(), { callsign: 'WING' + (i + 1), ai: 'fighter', skill: cfg.wskill, fm: cfg.fm });
    if (wing.def.drone) { wing.ctrl = p; wing.dOrder = 'protect'; wing.dIdx = i; p.drones.push(wing); }
  }
  skSpawnRows(cfg.friendly, 0);
  skSpawnForce();
  log('SKIRMISH: ' + cfg.rows.map(r => r[1] + ' ' + SHIPS[r[0]].name).join(', '), '#ffd080');
  return game;
}
const _pf2 = new THREE.Vector3();
function skSpawnForce() {
  wave++; game.skS.spawned++;
  skSpawnRows(game.sk.rows, 1);
}
function skSpawnRows(rows, team) {
  const cfg = game.sk, pf = new THREE.Vector3(0, 0, -1).applyQuaternion(player.group.quaternion);
  let n = 0;
  for (const [kind, count] of rows) for (let i = 0; i < count; i++, n++) {
    const def = SHIPS[kind], big = def.cls !== 'fighter';
    const dir = new THREE.Vector3().randomDirection().multiplyScalar(0.5).addScaledVector(pf, team ? 0.8 : -0.8).normalize();
    const dist = cfg.range + (big ? def.radius : 0) + (big ? 0 : (n % 6) * 40);
    const pos = player.group.position.clone().addScaledVector(dir, dist);
    const e = spawnShip(kind, team, pos, team ? player.group.position : player.group.position.clone().addScaledVector(pf, cfg.range * 2), { grp: team ? 'W' : 'H', skill: team ? cfg.skill : cfg.wskill, fm: cfg.fm, ai: big && kind !== 'gulper' && def.ai?.role !== 'lancer' ? 'capital' : undefined });
    if (!team && TUNE.ordnance?.enabled && e.launcherRuntime && def.ordnancePlan) capitalPrepare(e);
    if (team && kind === 'gulper') { const bfs = ships.find(x => x.team === 1 && x.ai.role === 'lancer'); if (bfs) { e.ai.escort = bfs; e.group.position.copy(bfs.group.position).addScaledVector(_pf2.set(0, 0, -1).applyQuaternion(bfs.group.quaternion), 750).addScaledVector(_pf2.set(1, 0, 0).applyQuaternion(bfs.group.quaternion), (i % 2 ? -1 : 1) * 575); } }
    if (team && !cfg.missiles) for (const k of MSL_ORDER) if (k in e.stores) e.stores[k] = 0;
  }
}
function skirmishUpdate(dt) {
  const S = game.skS; if (!S) return;
  if (S.ended) { S.endT += dt; if (S.endT > (S.result === 'win' ? 3 : 2.5) && !S.shown) { S.shown = true; showSkirmishDebrief(); } return; }
  S.t += dt;
  if (state === 'dead') return skEnd('lose', player?.rescueCapsule?.outcome === 'recovered' ? `${player.callsign} RECOVERED; AIRCRAFT LOST` : `${player?.callsign || (rosterEnabled() ? rosterLoad().player.callsign : 'MEOW')} DOWN`);
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
  reportArchive(S.result);
  reportControls($id('brief').querySelector('.panel'), S.result);
  $id('sk_re').onclick = () => { startSkirmish(game.sk); launchLock(); };
  $id('sk_set').onclick = () => { skCfg = skNorm(game.sk); openMenu('skirmish'); };
  $id('sk_menu').onclick = () => openMenu();
  menuFocus('#sk_re');
}
