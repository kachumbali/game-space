// ======================================================================
//  SUBSYSTEM EFFECTS (v0.3 M5)  -  what a damaged / destroyed component does to the ship. Table: docs/SUBSYSTEM_EFFECTS.md
//  Grades follow compState(): 0 ok, 1 damaged (<= 50% hp), 2 destroyed. Every row is [ok, damaged, destroyed]. The grade of a role is the MEAN
//  grade of its components (two engines, one dead = 1.0), linearly interpolated between the rows. All effects live in shared functions
//  (lockUpdate, abTick, fireMount, updateTurrets, updateShieldsAndFx, tenderTick), so AI ships obey them exactly like the player.
//  Older continuous effects (engine speed/turn, shield cap/regen, powerMul, gun gating) stay in 50_state / 65_combat and are listed in the doc.
// ======================================================================
const SUBSYS = {
  radar:    { lockRange: [1, 0.65, 0.35], lockTime: [1, 1.5, 2.6], sensor: [1, 0.6, 0] },   // sensor = share of the 6 km radar range; 0 = scope offline (RF seekers need a live radar)
  engine:   { abPool: [1, 0.7, 0.35], abBoost: [1, 0.75, 0.4], abRegen: [1, 0.7, 0.4] },     // afterburner pool, boost (top speed and accel gain), refill rate
  power:    { energyCap: [1, 0.8, 0.6] },                                                    // capacitor size (regen and shield regen: powerMul; destroyed reactor = ship lost)
  radiator: { energyRegen: [1, 0.85, 0.65] },                                                // heat-limited capacitor refill
  gun:      { cd: [1, 1.35, 1.35] },                                                         // per mount: cooldown multiplier (destroyed gates the mount)
  turret:   { cd: [1, 1.4, 1.4], track: [1, 0.6, 0.6] },                                     // per turret: cooldown and slew-rate multipliers (destroyed = dead turret)
  bay:      { service: [1, 0.5, 0] },                                                        // tender rearm rate and dock clearance (0 = no docking)
};
const SENSOR_MAX = 6000;                          // longest radar range setting (RADAR_RANGES), the reach a healthy scope shows
const subGrade = (arr, m) => { const i = Math.min(1, Math.floor(m)); return arr[i] + (arr[i + 1] - arr[i]) * (m - i); };
function subMean(s, role) {
  if (role === 'radar' && s.blindUntil > time) return 2;                       // nuclear flash blinds sensors
  let n = 0, t = 0;
  for (const c of s.comps) if (c.role === role) { n++; t += compState(c); }
  return n ? t / n : 0;
}
const subEff = (s, role, key) => subGrade(SUBSYS[role][key], subMean(s, role));
const compEff = (c, role, key) => (c ? subGrade(SUBSYS[role][key], compState(c)) : 1);
const abMaxOf = s => (s.def.abMax || 0) * pwF(s, 'e') * (s.mod?.ab ?? 1) * subEff(s, 'engine', 'abPool');
const abSpdOf = s => 1 + (s.def.abSpd - 1) * subEff(s, 'engine', 'abBoost');
const abAccOf = s => 1 + (s.def.abAcc - 1) * subEff(s, 'engine', 'abBoost');
const energyCapOf = s => (s.energyMax || 100) * subEff(s, 'power', 'energyCap');
// contacts further away than this are not shown by a damaged scope (Infinity = healthy; a dead scope keeps the old 1200 m visual range)
function sensorLimit(s) { const e = subEff(s, 'radar', 'sensor'); return e >= 0.999 ? Infinity : Math.max(1200, SENSOR_MAX * e); }

// ---- HUD cues: one short line per degraded role ("RADAR DAMAGED - LOCK RANGE 65%, LOCK TIME x1.5") ----
const subPct = v => Math.round(v * 100) + '%';
const SUB_NAMES = { radar: 'RADAR', engine: 'ENGINES', power: 'POWER', radiator: 'RADIATORS', gun: 'GUNS', turret: 'TURRETS', bay: 'BAYS', shield: 'SHIELDS', dock: 'DOCK' };
const SUB_SHORT = { radar: 'RDR', engine: 'ENG', power: 'PWR', radiator: 'RAD', gun: 'GUN', turret: 'TUR', bay: 'BAY', shield: 'SHD', dock: 'DCK' };
function subWorst(s, role, key, low) {            // the worst single component's multiplier (guns and turrets act per component)
  let w = 1;
  for (const c of s.comps) if (c.role === role) { const v = compEff(c, role, key); w = low ? Math.min(w, v) : Math.max(w, v); }
  return w;
}
const SUB_FX = {                                  // role -> effect labels for its cue (first two go into the flash line)
  radar: s => [`LOCK RANGE ${subPct(subEff(s, 'radar', 'lockRange'))}`, `LOCK TIME x${subEff(s, 'radar', 'lockTime').toFixed(1)}`, subEff(s, 'radar', 'sensor') <= 0 ? 'SCOPE OFF' : `SCOPE ${subPct(subEff(s, 'radar', 'sensor'))}`],
  engine: s => { const f = compFactor(s, 'engine'); return [`SPEED ${subPct(0.3 + 0.7 * f)}`, `TURN ${subPct(0.45 + 0.55 * f)}`, `BOOST ${subPct(subEff(s, 'engine', 'abPool') * subEff(s, 'engine', 'abBoost'))}`]; },
  power: s => [`ENERGY CAP ${subPct(subEff(s, 'power', 'energyCap'))}`, `RECHARGE ${subPct(powerMul(s))}`],
  radiator: s => [`RECHARGE ${subPct(subEff(s, 'radiator', 'energyRegen'))}`],
  gun: s => [`FIRE RATE ${subPct(1 / subWorst(s, 'gun', 'cd'))}`],
  turret: s => [`FIRE RATE ${subPct(1 / subWorst(s, 'turret', 'cd'))}`, `TRACK ${subPct(subWorst(s, 'turret', 'track', true))}`],
  bay: s => [`SERVICE ${subPct(subEff(s, 'bay', 'service'))}`],
  shield: s => [`SHIELD CAP ${subPct(compFactor(s, 'shield'))}`],
};
const subCue = (s, role) => (SUB_FX[role] ? SUB_FX[role](s) : []);
function subCueText(s, c, st) { const fx = subCue(s, c.role); return `${c.name} ${st === 2 ? 'DESTROYED' : 'DAMAGED'}` + (fx.length ? ' - ' + fx.slice(0, 2).join(', ') : ''); }
// degraded roles of ship s, worst first: [{ role, st (1 damaged, 2 all destroyed), n, bad, m (mean grade), fx }]
function subDegraded(s) {
  const out = [];
  for (const role of Object.keys(SUB_FX)) {
    let n = 0, bad = 0, dead = 0;
    for (const c of s.comps) if (c.role === role) { n++; const k = compState(c); if (k) bad++; if (k === 2) dead++; }
    if (s.blindUntil > time && role === 'radar') { n = Math.max(n, 1); bad = Math.max(bad, 1); dead = n; }
    if (!n || !bad) continue;
    out.push({ role, st: dead === n ? 2 : 1, n, bad, m: subMean(s, role), fx: subCue(s, role) });
  }
  return out.sort((a, b) => b.m - a.m);
}
