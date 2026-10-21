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
scaleShip(SHIPS.halberd, 128);
scaleShip(SHIPS.gulper, 146);
scaleShip(SHIPS.hivecarrier, 2500);   // hive carrier 2.5 km (owner scale ladder: carriers 2-3 km)

// human-testing tweak: fighters turn 2.85x faster (sim runs at 0.375x, so ~1.07x real time) (applies to player and AI alike)
for (const id in SHIPS) if (SHIPS[id].cls === 'fighter') SHIPS[id].turn *= 2.85;
// FROGG pilots are neuro-slaved with very high G tolerance (owner 2026-10-21): their fighters turn and accelerate harder, so they re-engage fast
for (const id in SHIPS) if (SHIPS[id].cls === 'fighter' && SHIPS[id].fac === 'frogg') { SHIPS[id].turn *= 1.5; SHIPS[id].accel *= 1.3; }
