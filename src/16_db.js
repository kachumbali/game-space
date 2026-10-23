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
