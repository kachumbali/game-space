// Test the runtime burst helper and the actual database, with negative controls.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync('src/60_weapons.js', 'utf8');
const helper = source.slice(source.indexOf('function burstCooldown('), source.indexOf('function fireMount('));
const c = {}; vm.createContext(c); vm.runInContext(helper, c);
const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
const hp = {merlin:35,darter:24,leaper:35,spitter:48,reaver:95,toad:140,kite6:10,drone:10,gulper:480,halberd:460,exeter:1800,destroyer:2700,bullfrog:3200};
for (const [id, n] of Object.entries(hp)) assert.equal(db.ships[id].structure, n, id);
const w = db.weapons.pdS, s = {};
assert.equal(w.dmg, db.weapons.pd.dmg / 2);
assert.equal(w.dmgMsl, db.weapons.pd.dmgMsl / 2);
assert.equal(w.ammo, db.weapons.pd.ammo / 2);
for (let i=0;i<9;i++) assert.equal(c.burstCooldown(s,w,0.075),0.075);
assert.equal(c.burstCooldown(s,w,0.075),1.075);
assert.equal(c.burstCooldown(s,w,0.075),0.075);
assert.equal(c.burstCooldown({},db.weapons.pd,0.075),0.075); // continuous negative control
for (const id of ['falchion','bittern']) assert(db.ships[id].turrets.every(t=>t.w==='pdS'));
assert(db.ships.halberd.turrets.some(t=>t.w==='pd'));
assert.equal(db.ships.gulper.turrets.filter(t=>t.w==='thorn').length,3);
assert(db.ships.gulper.turrets.some(t=>t.w==='thorn' && t.side<0));
console.log('v0.5 HP, battery and burst controls: OK');
