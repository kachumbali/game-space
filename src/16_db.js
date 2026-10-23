// ======================================================================
//  DATABASE  - ship, weapon and armour technical data (single source of truth: data/db.json)
//  build.py embeds data/db.json here. Edit the JSON, not this file; geometry (prims) stays in 30_/31_ships_*.js.
//  Colours are "#rrggbb" strings in the JSON and become ints here for the keys below.
// ======================================================================
const DB = /*@DB@*/null;
(function hexify(o) {
  const HEXKEYS = ['flameColor', 'color', 'flame'];
  for (const k in o) {
    const v = o[k];
    if (v && typeof v === 'object') hexify(v);
    else if (typeof v === 'string' && HEXKEYS.includes(k) && /^#[0-9a-fA-F]{6}$/.test(v)) o[k] = parseInt(v.slice(1), 16);
  }
})(DB);
