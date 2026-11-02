// Execute the actual station logic without a browser. Negative cases ensure
// the stock and station assertions can fail, not merely exercise the defaults.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
const ctx = { SHIPS: db.ships, WEAPONS: db.weapons, game: { mission: null }, document: { getElementById: () => ({ insertAdjacentHTML() {} }) } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/77_ordnance.js', 'utf8'), ctx);
vm.runInContext(`
  const p = {def: SHIPS.kestrel, stores: {...SHIPS.kestrel.stores}};
  game.mission = {ordnanceStock: {ir: 3}};
  if (ordnanceApply(p) !== false) throw Error('over-stock load accepted');
  game.mission = {ordnanceStock: {ir: 4}};
  if (!ordnanceApply(p)) throw Error('valid load rejected');
  const a = ordnanceLaunchStation(p, 'ir');
  if (!a || a.id !== 'S1' || a.pos[0] !== 2.25) throw Error('wrong rail');
  p.stores.ir--;
  for (let i = 0; i < 3; i++) { ordnanceLaunchStation(p, 'ir'); p.stores.ir--; }
  p.stores.ir = 0;
  if (ordnanceLaunchStation(p, 'ir') !== undefined) throw Error('empty station fired');
  p.stores.ir = 1;
  if (!ordnanceLaunchStation(p, 'ir')) throw Error('selected rail not rearmed');
  if (!ordnanceLaunchStation(p, 'rf')) throw Error('other station lost');
`, ctx);
assert.ok(db.ships.kestrel.hardpoints.every(s => s.pos.length === 3));
console.log('ordnance station logic: OK');
