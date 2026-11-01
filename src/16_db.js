// ======================================================================
//  DATABASE  - ship, weapon and armour technical data (single source of truth: data/db.json)
//  build.py embeds data/db.json here. Edit the JSON, not this file; geometry (prims) stays in 30_/31_ships_*.js.
//  Colours are "#rrggbb" strings in the JSON and become ints here for the keys below.
// ======================================================================
//  Dev override: ?db=data/db.json (any relative URL) fetches that file instead of the embedded copy, so a number edit needs a reload, not a rebuild.
//  The fetch is awaited here at module top level (module scripts support top-level await), so every later part sees the final DB at load time.
const DB_EMBEDDED = /*@DB@*/null;
let DB_SRC = 'embedded';
const DB = await (async () => {
  const u = new URLSearchParams(location.search).get('db');
  if (!u) return DB_EMBEDDED;
  try {
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    delete j.notes; delete j._about;                 // same as build.py: design notes are not runtime data
    DB_SRC = u;
    console.info('[db] using override', u);
    return j;
  } catch (e) {
    console.warn('[db] override ' + u + ' failed (' + e.message + '), using the embedded db');
    return DB_EMBEDDED;
  }
})();
(function hexify(o) {
  const HEXKEYS = ['flameColor', 'color', 'flame'];
  for (const k in o) {
    const v = o[k];
    if (v && typeof v === 'object') hexify(v);
    else if (typeof v === 'string' && HEXKEYS.includes(k) && /^#[0-9a-fA-F]{6}$/.test(v)) o[k] = parseInt(v.slice(1), 16);
  }
})(DB);
// ---- tuning: combat balance constants (db.tuning) ----
const TUNE = DB.tuning;

// ---- marks (docs/MARKS_SCHEMA.md): an entry with `base` + `mods` is a variant of another ship / weapon. It is resolved once here into a complete
// ordinary def (deep copy of the base with the mods applied, id/name/mark set), so the rest of the game never sees the delta form.
// mods: { "dotted.path": {mul|add|set: v} }; path segments are object keys or array indices, '*' = every element/key.
function markApply(obj, path, op) {
  const seg = path.split('.');
  (function go(o, i) {
    const k = seg[i], last = i === seg.length - 1;
    const keys = k === '*' ? (Array.isArray(o) ? o.map((_, n) => n) : Object.keys(o)) : [Array.isArray(o) ? +k : k];
    for (const key of keys) {
      if (last) {
        const v = o[key], r6 = x => Math.round(x * 1e6) / 1e6;
        if ('set' in op) o[key] = op.set;
        else if (typeof v !== 'number') throw new Error(`db mark: ${path} is not a number on the base`);
        else if ('mul' in op) o[key] = r6(v * op.mul);
        else if ('add' in op) o[key] = r6(v + op.add);
      } else if (o[key] && typeof o[key] === 'object') go(o[key], i + 1);
    }
  })(obj, 0);
}
function markResolve(table, kind) {
  for (const id of Object.keys(table)) {
    const e = table[id];
    if (!e.base) continue;
    const b = table[e.base];
    if (!b || b.base) throw new Error(`db ${kind}.${id}: base ${e.base} missing or itself a variant`);
    const d = JSON.parse(JSON.stringify(b));
    for (const p in e.mods || {}) markApply(d, p, e.mods[p]);
    d.id = id; d.base = e.base; d.mark = e.mark;
    d.name = e.name || (b.name + ' ' + e.mark);
    table[id] = d;
  }
}
markResolve(DB.weapons, 'weapons');      // weapons first: a ship mark may swap a mount to a weapon mark
markResolve(DB.ships, 'ships');

// ---- power: ships.<id>.power = { plantMW, capacitorMJ } -> the energy fields the sim reads ----
// Balanced ETS split (4/4/4) gives each of the three buses (weapons / shields / engines) one third of plant output, so the weapons-bus
// capacitor refills at plantMW / 3 per sim-second. 1 energy unit = 1 MJ, 1 energy unit per second = 1 MW. (Step 1 of the power model:
// balance-neutral back-fit, values reproduce the former hand-authored energyRegen / energyMax; fighters used code defaults 17 / 100.)
const POWER_BUSES = 3;
for (const id in DB.ships) {
  const s = DB.ships[id];
  s.energyRegen = s.power.plantMW / POWER_BUSES;
  s.energyMax = s.power.capacitorMJ;
}

