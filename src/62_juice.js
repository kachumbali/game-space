// ======================================================================
//  FEEL PACK (v0.2, owner request 2026-10-30; UX_REVIEW R6, R7, R5):
//  hitmarkers (shield / armour / hull / subsystem / kill), directional damage arcs round the reticle, kill banners with a chain
//  multiplier, style bonuses (missile kill, point blank, ace), hit-stop on kills, medals, and the sounds that go with them.
//  Everything is event driven: weapon code sets hitSrc / hitKind just before applyHit, applyHit (65_combat) reports the outcome
//  to juiceHit, destroy() reports kills to juiceKill, compEvent() subsystem kills to juiceComp. Nothing here changes damage.
//  Touch: nothing to bind (it is all feedback). AI: the AI ignores it. Help line: the legend under the key map (00_head.html).
//  No floating damage numbers on purpose (docs/UX_REVIEW.md: wrong genre register).
// ======================================================================
let hitSrc = null, hitKind = null;                    // who is shooting, with what class of weapon ('gun' | 'beam' | 'missile' | 'nuke')
const killHooks = [];                                 // other parts register fn(ship, killedByPlayer) at load time (loot drops, survival perks)
const FUN = {
  chainWindow: 6,                                     // sim seconds between kills that keep a chain alive (about 16 s real time at 37.5% sim speed)
  chainMax: 4,                                        // score multiplier cap; multiplier = 1 + 0.5 per extra kill in the chain
  hitStopKill: 0.05, hitStopBig: 0.16,                // real seconds the sim crawls after a kill / a capital kill
  pointBlank: 150,                                    // m: a fighter killed this close gets the POINT BLANK style bonus
};
const juice = {};
function juiceReset() {
  Object.assign(juice, {
    marks: [], arcs: [], banners: [],
    chain: 0, chainT: 0, bestChain: 0, mult: 1,
    score: 0, bonus: 0, kills: 0, missileKills: 0, subKills: 0, capKills: 0, aceKills: 0, hullHits: 0, friendlyLost: 0, hadWing: false,
    hitStop: 0, tickT: -9, scoreMul: 1,
  });
}
juiceReset();
const CHAIN_NAMES = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'RAMPAGE', 'RAMPAGE', 'UNSTOPPABLE', 'UNSTOPPABLE'];

// ---- sounds (same synth as the rest of the game) ----------------------------------------------------------
SFX.hitmark = () => tone(1900, 1500, 0.03, 'square', 0.05);
SFX.hitshield = () => tone(1300, 900, 0.04, 'sine', 0.06);
SFX.kill = () => { const k = Math.min(juice.chain, 8); tone(520 + 40 * k, 780 + 60 * k, 0.10, 'triangle', 0.18); tone(780 + 60 * k, 1170 + 80 * k, 0.14, 'triangle', 0.14, 0.07); };
SFX.subkill = () => { tone(300, 90, 0.18, 'sawtooth', 0.14); tone(900, 1500, 0.06, 'square', 0.07, 0.02); };
SFX.pickup = () => { tone(700, 1400, 0.10, 'sine', 0.14); tone(1050, 2100, 0.12, 'sine', 0.1, 0.06); };
SFX.perk = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.18, 'triangle', 0.14, i * 0.07));
SFX.wave = () => { tone(110, 90, 0.5, 'sawtooth', 0.2); tone(165, 140, 0.5, 'sawtooth', 0.12, 0.1); };
SFX.ace = () => { tone(220, 110, 0.6, 'sawtooth', 0.22); tone(233, 117, 0.6, 'sawtooth', 0.18, 0.05); };

// ---- event entry points -----------------------------------------------------------------------------------
const _jv = new THREE.Vector3(), _jq = new THREE.Quaternion();
function hitAngle(from) {                             // screen angle (canvas, radians, y down) of a world point seen from the camera; behind us = bottom
  _jv.copy(from).sub(camera.position);
  _jv.applyQuaternion(_jq.copy(camera.quaternion).invert());
  if (Math.hypot(_jv.x, _jv.y) < Math.abs(_jv.z) * 0.15 && _jv.z > 0) return Math.PI / 2;
  return Math.atan2(-_jv.y, _jv.x);
}
function juiceHit(s, src, out, dmg, wp) {
  const p = player; if (!p) return;
  if (s === p) {
    if (out === 'hull' || out === 'comp' || out === 'kill') juice.hullHits++;
    if (AOPT.purist) return;                                      // we were hit: where from
    const from = src && src.group ? src.group.position : wp;
    juice.arcs.push({ t: time, ang: hitAngle(from), out, big: clamp(dmg / 14, 0.35, 1) });
    if (juice.arcs.length > 8) juice.arcs.shift();
    return;
  }
  if (src === p && s.team !== p.team && out !== 'kill' && !AOPT.purist) {   // our shot landed
    const kind = out === 'comp' ? 'sub' : out;
    juice.marks.push({ t: time, kind });
    if (juice.marks.length > 6) juice.marks.shift();
    if (time - juice.tickT > 0.05) { juice.tickT = time; sfx(out === 'shield' ? 'hitshield' : 'hitmark', 0, 0.8); }
  }
}
function juiceComp(s, c, st) {                        // a subsystem of someone else's ship was destroyed by us
  if (st !== 2 || !player || s.team === player.team || hitSrc !== player) return;
  // Campaign sorties are military operations, not score attacks. Component
  // kills still affect the target; they simply do not create arcade rewards.
  if (game.mode === 'mission') return;
  juice.subKills++; juice.score += 40; juice.bonus += 40;
  if (AOPT.purist) return;
  juice.marks.push({ t: time, kind: 'sub' });
  juice.banners.push({ t: time, text: c.name + ' DESTROYED', sub: '+40', col: '#ffb060', big: false });
  sfx('subkill', 0, 0.9);
}
function juiceKill(s) {
  const p = player;
  if (s.team !== 1) { if (p && s !== p && s.team === p.team && !s.def.drone) juice.friendlyLost++; if (s === p) juice.chain = 0; return; }
  const killer = s.lastAttacker;
  const mine = !!p && (killer === p || (killer && killer.ctrl === p));
  for (const f of killHooks) f(s, mine);
  if (!mine) return;
  const big = s.def.cls !== 'fighter';
  juice.kills++; if (big) juice.capKills++;
  // Keep a factual sortie kill count for the debrief, but never turn a
  // campaign mission into a chain/score/buff loop.
  if (game.mode === 'mission') { juice.chain = 0; juice.mult = 1; return; }
  juice.chain = (time < juice.chainT ? juice.chain : 0) + 1;
  juice.chainT = time + FUN.chainWindow * (p.mod?.chainT ?? 1);
  juice.bestChain = Math.max(juice.bestChain, juice.chain);
  const mult = Math.min(FUN.chainMax, 1 + 0.5 * (juice.chain - 1));
  juice.mult = mult;
  const base = ((typeof SCORE !== 'undefined' && SCORE[s.def.id]) || 100) * (s.ace ? 5 : 1);
  const tags = []; let extra = 0;
  if (s.lastKind === 'missile' || s.lastKind === 'nuke') { extra += base * 0.5; tags.push('MISSILE'); juice.missileKills++; }
  if (s.ace) { tags.push('ACE DOWN'); juice.aceKills++; }
  if (!big && p.group.position.distanceTo(s.group.position) < FUN.pointBlank) { extra += base * 0.25; tags.push('POINT BLANK'); }
  const gain = Math.round((base + extra) * mult * (p.mod?.score ?? 1) * juice.scoreMul);
  juice.score += gain; juice.bonus += Math.max(0, gain - Math.round(base));
  if (AOPT.purist) return;                               // sim purist: the score is still kept for the debrief, nothing is shown or heard
  if (CHAIN_NAMES[Math.min(juice.chain, 8)]) tags.unshift(CHAIN_NAMES[Math.min(juice.chain, 8)]);
  juice.banners.push({ t: time, text: `+${gain}  ${s.ace ? s.callsign : s.def.name.replace('FROGG ', '')}`, sub: tags.join(' · '), col: s.ace ? '#ffd24a' : big ? '#ff9a5a' : '#c8fff0', big: big || s.ace });
  if (juice.banners.length > 4) juice.banners.shift();
  juice.marks.push({ t: time, kind: 'kill' });
  sfx(s.ace ? 'ace' : 'kill', 0, 1);
  juice.hitStop = Math.max(juice.hitStop, big ? FUN.hitStopBig : FUN.hitStopKill);
  if (big) shake = Math.min(1, shake + 0.45);
}
killHooks.length = 0;
function juiceTick(dt) {
  if (!juice.hadWing && player && ships.some(s => s.team === player.team && s !== player && s.def.cls === 'fighter' && !s.def.drone)) juice.hadWing = true;
  if (juice.chain && time > juice.chainT) { juice.chain = 0; juice.mult = 1; }
  const keep = (a, life) => { while (a.length && time - a[0].t > life) a.shift(); };
  keep(juice.marks, 0.4); keep(juice.arcs, 1.1); keep(juice.banners, 2.2);
}
// medals for a debrief; stats = {acc, shots}; returns [[name, why]]
function juiceMedals(acc, shots, kills) {
  const m = [], j = juice;
  if (j.kills >= 5) m.push(['ACE', j.kills + ' kills this sortie']);
  if (j.bestChain >= 5) m.push(['CHAIN MASTER', 'chain of ' + j.bestChain]);
  if (shots >= 40 && acc >= 35) m.push(['SHARPSHOOTER', acc + '% on ' + shots + ' shots']);
  if (j.hullHits === 0 && j.kills >= 3) m.push(['UNTOUCHED', 'no hull damage']);
  if (j.missileKills >= 3) m.push(['MISSILE MASTER', j.missileKills + ' missile kills']);
  if (j.subKills >= 3) m.push(['SURGEON', j.subKills + ' subsystems taken out']);
  if (j.capKills >= 1) m.push(['CAPITAL BREAKER', j.capKills + ' capital ship' + (j.capKills > 1 ? 's' : '')]);
  if (j.aceKills >= 1) m.push(['ACE HUNTER', j.aceKills + ' enemy ace' + (j.aceKills > 1 ? 's' : '')]);
  if (j.hadWing && j.friendlyLost === 0 && kills > 0) m.push(['WING LEADER', 'no wingman lost']);
  return m;
}
function juiceDebriefHtml(acc, shots, kills) {
  const medals = juiceMedals(acc, shots, kills);
  return `<div class="sub">STYLE</div><div>Style bonus <b>+${juice.bonus}</b></div><div>Best chain <b>${juice.bestChain}</b></div>`
    + (medals.length ? medals.map(([n, w]) => `<div class="medal"><b>${n}</b> <span class="dim">${w}</span></div>`).join('') : '<div class="dim">no medals this time</div>');
}

// ---- drawing (called from drawOverlay, 90_hud.js) ---------------------------------------------------------
function drawJuice(c, p, cx, cy) {
  if (AOPT.purist) return;
  const f = FS || 1;
  // directional damage arcs: the red segment sits on the side the fire came from
  const R = Math.min(ovW, ovH) * 0.2;
  for (const a of juice.arcs) {
    const age = time - a.t, k = 1 - age / 1.1; if (k <= 0) continue;
    c.strokeStyle = a.out === 'shield' ? `rgba(90,200,255,${0.8 * k})` : `rgba(255,60,40,${0.95 * k})`;
    c.lineWidth = (5 + 9 * a.big) * f; c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy, R, a.ang - 0.38, a.ang + 0.38); c.stroke();
  }
  c.lineCap = 'butt';
  // hitmarkers: four ticks round the reticle
  for (const m of juice.marks) {
    const age = time - m.t, k = 1 - age / 0.4; if (k <= 0) continue;
    const big = m.kind === 'kill', r0 = (big ? 16 : 14) + (1 - k) * (big ? 22 : 8), len = (big ? 12 : 7) * f;
    c.strokeStyle = m.kind === 'kill' ? `rgba(255,70,50,${k})` : m.kind === 'sub' ? `rgba(255,170,60,${k})` : m.kind === 'shield' ? `rgba(110,210,255,${k})` : m.kind === 'armor' ? `rgba(200,210,215,${k})` : `rgba(255,255,255,${k})`;
    c.lineWidth = (big ? 3.5 : 2.5) * f;
    c.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.moveTo(cx + sx * r0, cy + sy * r0); c.lineTo(cx + sx * (r0 + len), cy + sy * (r0 + len)); }
    c.stroke();
  }
  // chain readout and kill banners ABOVE the reticle (the space below it belongs to the power widget and the radar); newest nearest the reticle
  c.textAlign = 'center';
  let y = cy - 62 * f;
  if (juice.chain >= 2 && time < juice.chainT) {
    const left = clamp((juice.chainT - time) / (FUN.chainWindow * (p.mod?.chainT ?? 1)), 0, 1);
    c.font = `bold ${Math.round(15 * f)}px monospace`; c.fillStyle = '#ffd24a';
    c.fillText(`CHAIN x${juice.chain}   SCORE x${juice.mult.toFixed(1)}`, cx, y);
    c.fillStyle = 'rgba(255,210,74,.25)'; c.fillRect(cx - 60 * f, y + 5 * f, 120 * f, 3 * f);
    c.fillStyle = '#ffd24a'; c.fillRect(cx - 60 * f, y + 5 * f, 120 * f * left, 3 * f);
    y -= 26 * f;
  }
  for (let i = juice.banners.length - 1; i >= 0; i--) {
    const b = juice.banners[i], age = time - b.t, k = clamp(1 - (age - 1.2) / 1.0, 0, 1); if (k <= 0) continue;
    c.globalAlpha = k;
    c.font = `${b.big ? 'bold ' : ''}${Math.round((b.big ? 17 : 13) * f)}px monospace`; c.fillStyle = b.col;
    c.fillText(b.text, cx, y);
    if (b.sub) { c.font = `${Math.round(10 * f)}px monospace`; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText(b.sub, cx, y + 12 * f); }
    y -= (b.sub ? 34 : 22) * f; c.globalAlpha = 1;
  }
  c.textAlign = 'left';
}
