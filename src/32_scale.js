// ======================================================================
//  SHIP SCALING  (uniform: prims, hit zones, engines, mounts, turrets, extents)
//  Ship defs are authored at any size; this rescales them to the target length.
// ======================================================================
function scaleShip(def, newLength) {
  const k = newLength / def.length;
  const v = a => a.map(x => x * k);
  def.length = newLength; def.radius *= k; def.half = v(def.half);
  if (def.launch) def.launch = v(def.launch);
  for (const p of def.prims) {
    for (const f of ['c', 'a', 'b', 'h0', 'h1', 'box']) if (p[f]) p[f] = v(p[f]);
    if (p.t === 'ell') p.r = v(p.r);
    for (const f of ['hz', 'ra', 'rb', 'px']) if (typeof p[f] === 'number') p[f] *= k;
    if (p.rib) p.rib = [p.rib[0] * k, p.rib[1]];
    p._ = null;
  }
  for (const e of def.engines || []) { e.pos = v(e.pos); e.r *= k; }
  for (const m of def.mounts || []) m.pos = v(m.pos);
  for (const t of def.turrets || []) t.pos = v(t.pos);
  for (const c of def.comps || []) { c.pos = v(c.pos); c.r *= k; }
}
// ---- marks (docs/MARKS_SCHEMA.md): DB.ships.<id> variants were already resolved into complete defs in 16_db.js; here they get the base ship's geometry
// (prims deep-copied, because scaleShip below rewrites prims in place) so they are ordinary SHIPS entries from here on.
for (const id in DB.ships) {
  const e = DB.ships[id];
  if (!e.base) continue;
  if (!SHIPS[e.base]) throw new Error(`db mark ${id}: base ship ${e.base} has no model`);
  SHIPS[id] = { ...e, prims: JSON.parse(JSON.stringify(SHIPS[e.base].prims)) };
}
const SCALE_TO = { halberd: 128, gulper: 146, hivecarrier: 2500 };    // hive carrier 2.5 km (owner scale ladder: carriers 2-3 km)
for (const id in SHIPS) { const k = SCALE_TO[SHIPS[id].base || id]; if (k) scaleShip(SHIPS[id], k); }

// human-testing tweak: fighters turn 2.85x faster (sim runs at 0.375x, so ~1.07x real time) (applies to player and AI alike)
for (const id in SHIPS) if (SHIPS[id].cls === 'fighter') SHIPS[id].turn *= TUNE.fighter.turnMul;
// FROGG pilots are neuro-slaved with very high G tolerance (owner 2026-10-21): their fighters turn and accelerate harder, so they re-engage fast
for (const id in SHIPS) if (SHIPS[id].cls === 'fighter' && SHIPS[id].fac === 'frogg') { SHIPS[id].turn *= TUNE.fighter.froggTurnMul; SHIPS[id].accel *= TUNE.fighter.froggAccelMul; }

// afterburner pool (seconds of burn): humans 20 s, refill ~25 s; FROGG fighters (neuro-slaved, bio-fuel) get 1.8x the pool, 2x the refill, and a stronger burn (owner 2026-10-22)
for (const id in SHIPS) {
  const d = SHIPS[id];
  if (d.cls !== 'fighter') { d.abMax = 0; continue; }
  const ab = TUNE.afterburner[d.fac === 'frogg' ? 'frogg' : 'human'];
  d.abMax = ab.max; d.abRegen = ab.regen; d.abSpd = ab.spd; d.abAcc = ab.acc;
}
