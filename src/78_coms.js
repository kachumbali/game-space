// ======================================================================
//  COMMS MENU (key J, touch COMMS button) — orders and requests to wingmen, capital ships, drones, and the targeted ship.
//  Orders are stored as ai.order = {type, tgt, slot} and read by pickTarget / orderFly in 70_ai.js; ai.hold blocks guns and missiles.
//  Replies are queued (sim time) and arrive through comm(). Wingmen answer in character (HAWK dry, SPARROW nervous).
//  Menu keys while open: 1-9 select, 0 / Backspace back, J / Esc close. Drone entries show only when the drone API (dronesOf, droneOrder) exists.
// ======================================================================
const coms = { open: false, stack: [], t: 0 };
const comsQ = [];
let comsEl = null;
{
  const st = document.createElement('style');
  st.textContent = `
  #coms{position:fixed;left:16px;top:50%;transform:translateY(-50%);z-index:7;min-width:250px;max-width:300px;font-size:12px;line-height:1.35;
    background:rgba(5,12,10,.82);border:1px solid #3a8a6c;border-radius:4px;padding:8px 10px;text-shadow:0 0 4px #000;display:none}
  #coms h4{margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#d8fff0;font-weight:normal;border-bottom:1px solid #2b4a40;padding-bottom:4px}
  #coms .ci{padding:4px 5px;border-radius:3px;cursor:pointer;display:flex;gap:8px}
  #coms .ci b{color:#ffd24a;font-weight:normal;width:12px;flex:none}
  #coms .ci:hover{background:rgba(143,255,208,.12)}
  #coms .ci.off{opacity:.38;cursor:default}
  #coms .ci small{opacity:.6;margin-left:auto;padding-left:8px;white-space:nowrap}
  #coms .ft{margin-top:6px;opacity:.5;font-size:10px}
  body.touch #coms{top:60px;transform:none;font-size:13px}
  body.phone #coms{font-size:10px;min-width:190px;max-width:240px;top:44px}
  body.touch.phone #coms .ci{padding:3px 4px}
  body.cine #coms,body.cine #bcom{display:none!important}
  #bcom{left:138px;bottom:10px;width:54px;height:54px;font-size:10px;transform-origin:0 100%;border-color:#ffd24a;color:#ffd24a}
  `;
  document.head.appendChild(st);
  comsEl = document.createElement('div'); comsEl.id = 'coms'; document.body.appendChild(comsEl);
  const tb = document.getElementById('touch');
  if (tb) {
    const b = document.createElement('div'); b.className = 'tbtn'; b.id = 'bcom'; b.textContent = 'COMMS'; tb.appendChild(b);
    b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); touchStarted = true; comsToggle(); });
  }
  comsEl.addEventListener('pointerdown', e => {
    const r = e.target.closest('[data-ci]'); if (!r) return;
    e.stopPropagation(); e.preventDefault();
    comsPick(+r.dataset.ci);
  });
}

// ---- helpers -----------------------------------------------------------------------------------------------
const comsWing = () => ships.filter(s => s.alive && !s.dying && player && s.team === player.team && s !== player && !isCapital(s) && !s.def.drone)
  .sort((a, b) => (a.callsign || a.def.name).localeCompare(b.callsign || b.def.name));
const comsCaps = () => ships.filter(s => s.alive && !s.dying && player && s.team === player.team && isCapital(s));
const nameOf = (s, i) => s.callsign || (s.def.name + (i != null ? ' ' + (i + 1) : ''));
const hostileTarget = () => (target && target.alive && !target.dying && player && target.team !== player.team ? target : null);
function comsSay(from, text, color, delay = 0.5) { comsQ.push({ t: time + delay + Math.random() * 0.5, from, text, color }); }
const pct = (a, b) => Math.round(100 * Math.max(0, a) / Math.max(1, b));

// in-character one-liners; kind = ack | refuse | status-style text built by caller
const VOICE = {
  HAWK: { attack: 'Engaging your target.', all: 'Weapons free.', protect: 'On your wing, covering.', defend: 'Falling back to the capital.', form: 'Forming up.', hold: 'Weapons hold.', free: 'Weapons free.', rtb: 'Returning to base.', none: 'Nothing on my scope to hit.' },
  SPARROW: { attack: 'Uh, copy, going in on it!', all: 'Weapons free, okay, okay.', protect: 'I got your six. Sort of.', defend: 'Protecting the ship, copy.', form: 'On your wing, sir.', hold: 'Holding fire. Holding.', free: 'Guns hot!', rtb: 'Heading home, thank god. I mean, copy.', none: 'I do not see it.' },
};
const GENERIC = { attack: 'Engaging.', all: 'Weapons free.', protect: 'Covering you.', defend: 'Defending the capital.', form: 'Forming up.', hold: 'Weapons hold.', free: 'Weapons free.', rtb: 'Returning to base.', none: 'No target.' };
const voice = (s, k) => (VOICE[s.callsign] || GENERIC)[k];

function setOrder(list, type, tgt) {
  list.forEach((s, i) => { s.ai.order = type === 'all' ? null : { type, tgt, slot: i, t: time }; if (type === 'all') { s.ai.hold = false; s.ai.tgtT = 0; } else s.ai.tgtT = 0; });
}
function wingStatus(s) {
  const m = missileIds(s).map(id => `${id.toUpperCase()} ${s.stores[id] | 0}`).join(' ');
  const fire = s.ai.hold ? ', weapons hold' : '';
  return `hull ${pct(s.structure, s.def.structure)}%, shields ${Math.round(s.shield.fore + s.shield.aft)}, ${m || 'no missiles'}, flares ${s.stores.flare | 0}${fire}.`;
}
function ordersFor(list, label) {
  const one = list.length === 1 ? list[0] : null;
  const tgt = hostileTarget();
  const hold = list.every(s => s.ai.hold);
  const send = (type, tg) => () => {
    setOrder(list, type, tg);
    for (const s of list) comsSay(nameOf(s), voice(s, type), undefined);
  };
  return {
    title: 'ORDERS: ' + label,
    items: [
      { label: 'ATTACK MY TARGET', hint: tgt ? tgt.def.name.replace('FROGG ', '') : 'no target', on: !!tgt, fn: send('attack', tgt) },
      { label: 'ENGAGE AT WILL', fn: send('all') },
      { label: 'PROTECT ME', fn: send('protect') },
      { label: 'DEFEND CAPITAL', on: comsCaps().length > 0, fn: send('defend') },
      { label: 'FORM ON ME', hint: 'hold fire', fn: send('form') },
      { label: hold ? 'WEAPONS FREE' : 'WEAPONS HOLD', fn: () => { for (const s of list) { s.ai.hold = !hold; comsSay(nameOf(s), voice(s, hold ? 'free' : 'hold')); } } },
      { label: 'RETURN TO BASE', fn: send('rtb') },
      { label: 'STATUS REPORT', fn: () => { for (const s of list) comsSay(nameOf(s), (s.ai.order ? '[' + s.ai.order.type.toUpperCase() + '] ' : '') + wingStatus(s), undefined, 0.4); } },
    ],
  };
}

// ---- menu tree -----------------------------------------------------------------------------------------------
function comsRoot() {
  const w = comsWing(), caps = comsCaps(), tgt = target && target.alive ? target : null;
  const items = [];
  items.push({ label: 'WINGMEN', hint: String(w.length), on: w.length > 0, sub: () => ({
    title: 'WINGMEN',
    items: [{ label: 'ALL WINGMEN', sub: () => ordersFor(w, 'ALL') }, ...w.map((s, i) => ({ label: nameOf(s, i), hint: pct(s.structure, s.def.structure) + '%' + (s.ai.order ? ' ' + s.ai.order.type : ''), sub: () => ordersFor([s], nameOf(s, i)) }))],
  }) });
  items.push({ label: 'CAPITAL / CONTROL', hint: String(caps.length), on: caps.length > 0 || !!game.mission, sub: () => ({
    title: 'CAPITAL / CONTROL',
    items: [
      ...caps.map((c, i) => ({ label: nameOf(c, i), sub: () => capMenu(c) })),
      ...(game.mission ? [{ label: 'CONTROL: SITREP', fn: sitrep }] : []),
    ],
  }) });
  if (typeof dronesOf === 'function') {
    const n = dronesOf(player).length;
    items.push({ label: 'DRONES', hint: n + (player.stores.drone != null ? ' / ' + player.stores.drone + ' stock' : ''), sub: droneMenu });
  }
  items.push({ label: 'TARGET', hint: tgt ? tgt.def.name.replace('FROGG ', '') : 'none', on: !!tgt, sub: targetMenu });
  return { title: 'COMMS', items };
}
function capMenu(c) {
  const tgt = hostileTarget(), w = comsWing();
  return {
    title: nameOf(c),
    items: [
      { label: 'STATUS', fn: () => comsSay(nameOf(c), `Hull ${pct(c.structure, c.def.structure)}%, shields F${Math.round(c.shield.fore)} A${Math.round(c.shield.aft)}, ${hostilesOf(c).filter(e => !isCapital(e)).length} fighters and ${hostilesOf(c).filter(isCapital).length} capitals on the board.`, '#ffd080') },
      { label: 'FOCUS FIRE ON MY TARGET', on: !!tgt, hint: tgt ? tgt.def.name.replace('FROGG ', '') : 'no target', fn: () => { c.target = tgt; c.ai.tgtT = 14; comsSay(nameOf(c), 'Copy, ' + tgt.def.name + ' marked. Guns tracking.', '#ffd080'); } },
      { label: 'REQUEST FIGHTER COVER', on: w.length > 0, fn: () => { setOrder(w, 'defend'); comsSay(nameOf(c), 'Flight, defend the ship.', '#ffd080'); for (const s of w) comsSay(nameOf(s), voice(s, 'defend'), undefined, 1.2); } },
      { label: 'REQUEST SPEED CHANGE', hint: c.vital ? 'holds station' : '', on: false, fn: () => {} },
    ],
  };
}
function sitrep() {
  const en = ships.filter(s => s.alive && !s.dying && s.team === 1);
  const open = objectives.filter(o => o.state === 'open').map(o => o.text);
  comsSay('CONTROL', `${en.length} hostile contacts (${en.filter(isCapital).length} capital). ` + (open.length ? 'Open: ' + open.join('; ') : 'No open objectives.'), '#ffd080', 0.8);
}
function droneMenu() {
  const d = dronesOf(player), ord = o => () => { droneOrder(player, o, hostileTarget()); log('DRONES: ' + o.toUpperCase(), '#7fe0ff'); };
  const tgt = hostileTarget();
  return {
    title: 'DRONES (' + d.length + ')',
    items: [
      { label: 'LAUNCH', on: typeof launchDrones === 'function', fn: () => { const n = launchDrones(player, 99); log(n ? `${n} DRONES LAUNCHED` : 'NO DRONES TO LAUNCH', '#7fe0ff'); } },
      { label: 'ENGAGE MY TARGET', on: !!tgt && d.length > 0, fn: ord('engage') },
      { label: 'ENGAGE ALL', on: d.length > 0, fn: ord('all') },
      { label: 'PROTECT ME', on: d.length > 0, fn: ord('protect') },
      { label: 'SCOUT AHEAD', on: d.length > 0, fn: ord('scout') },
      { label: 'RAM TARGET', on: !!tgt && d.length > 0, hint: 'one way', fn: ord('ram') },
      { label: 'RETURN', on: d.length > 0, fn: ord('return') },
    ],
  };
}
function targetMenu() {
  const t = target, friendly = t.team === player.team;
  const wing = comsWing().includes(t);
  const items = [
    { label: 'HAIL', fn: () => {
      if (friendly) comsSay(nameOf(t), wing ? 'Go ahead, ' + (player.callsign || 'lead') + '.' : 'Copy, ' + (player.callsign || 'friendly') + ', all quiet on this end.', undefined, 0.6);
      else log(t.def.fac === 'frogg' ? 'HAIL: no answer, only a low carrier wave' : 'HAIL: no reply', '#aab8c0');
    } },
    { label: 'IDENTIFY', fn: () => {
      if (compFactor(player, 'radar') < 0.01) { log('SENSORS DEGRADED', '#ff5a4a'); return; }
      const d = t.group.position.distanceTo(player.group.position);
      log(`${t.def.name} (${t.def.role || t.def.cls}) ${d.toFixed(0)} m  hull ${pct(t.structure, t.def.structure)}%  shield ${Math.round(t.shield.fore + t.shield.aft)}  armour ${ARMOR[t.def.armor.type].name}`, '#9adcff');
    } },
  ];
  if (friendly && !wing && !isCapital(t)) items.push({ label: 'REQUEST ASSIST', hint: 'on my target', on: !!hostileTarget(), fn: () => {
    const h = hostileTarget(); if (!h) return;
    setOrder([t], 'attack', h); comsSay(nameOf(t), 'Roger, on it.');
  } });
  if (friendly && isCapital(t)) items.push({ label: 'CAPITAL MENU', sub: () => capMenu(t) });
  return { title: 'TARGET: ' + t.def.name.replace('FROGG ', ''), items };
}

// ---- state machine + rendering -------------------------------------------------------------------------------
const comsNode = () => (coms.stack.length ? coms.stack[coms.stack.length - 1]() : comsRoot());
function comsRender() {
  if (!coms.open) { comsEl.style.display = 'none'; return; }
  const n = comsNode();
  comsEl.innerHTML = `<h4>${n.title}${coms.stack.length ? '' : '  [J]'}</h4>` + n.items.map((it, i) =>
    `<div class="ci${it.on === false ? ' off' : ''}" data-ci="${i + 1}"><b>${i + 1}</b><span>${it.label}</span>${it.hint ? `<small>${it.hint}</small>` : ''}</div>`).join('') +
    `<div class="ft">${isTouch ? 'tap an entry · tap COMMS to close' : '0 back · J close'}</div>`;
  comsEl.style.display = 'block';
}
function comsToggle(force) {
  const want = force !== undefined ? force : !coms.open;
  if (want && !(player && player.alive && state === 'play')) return;
  coms.open = want; coms.stack = []; coms.t = time;
  comsRender();
}
function comsPick(i) {
  if (!coms.open) return;
  const n = comsNode(), it = n.items[i - 1];
  if (!it || it.on === false) return;
  coms.t = time;
  if (it.sub) { coms.stack.push(it.sub); comsRender(); return; }
  sfx('click'); it.fn && it.fn();
  comsToggle(false);
}
function comsKey(e) {       // returns true when the key was consumed
  if (!coms.open) return false;
  if (e.code === 'KeyJ' || e.code === 'Escape') { comsToggle(false); return true; }
  if (e.code === 'Digit0' || e.code === 'Backspace') { if (coms.stack.length) { coms.stack.pop(); comsRender(); } else comsToggle(false); return true; }
  const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
  if (m) { comsPick(+m[2]); return true; }
  return false;
}
function comsTick(dt) {
  for (let i = comsQ.length - 1; i >= 0; i--) {
    if (comsQ[i].t <= time) { const q = comsQ.splice(i, 1)[0]; comm(q.from, q.text, q.color); }
  }
  if (coms.open) {
    if (!(player && player.alive) || state !== 'play' || time - coms.t > 12) comsToggle(false);
    else if (Math.floor(time * 2) !== coms._r) { coms._r = Math.floor(time * 2); comsRender(); }     // keep hints / health live
  }
}
