// Run the actual objective helpers against both successful and lost ships.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync('src/75_mission.js', 'utf8');
const convoyCode = source.slice(source.indexOf('function convoyStart('), source.indexOf('function condMet('));
const alive = id => ({id, alive:true, dying:0, group:{visible:true}});
const ctx = {ships:[alive('a'), alive('b')]};
vm.createContext(ctx); vm.runInContext(convoyCode, ctx);
vm.runInContext(`
  const s = {};
  convoyStart(s, {id:'evac', duration:10, ships:[{id:'a',capacity:100},{id:'b',capacity:200}]});
  convoyAdvance(s.convoy, 9);
  if (s.convoy.passengers !== 0 || s.convoy.entries[0].status !== 'spooling') throw Error('departed early');
  ships[1].alive = false;
  convoyAdvance(s.convoy, 1);
  if (s.convoy.passengers !== 100 || convoyOutcome(s.convoy) !== 'partial') throw Error('partial evacuation');
  const all = {entries:[{status:'escaped'}, {status:'escaped'}]};
  const none = {entries:[{status:'lost'}, {status:'lost'}]};
  if (convoyOutcome(all) !== 'win' || convoyOutcome(none) !== 'lose') throw Error('outcome control');
  const reserve = {}, pilot = {stores:{}};
  if ('nuke' in pilot.stores || !releaseNuclearReserve(reserve, pilot) || pilot.stores.nuke !== 1) throw Error('release');
  pilot.stores.nuke = 0;
  if (releaseNuclearReserve(reserve, pilot) || pilot.stores.nuke !== 0) throw Error('reserve released twice');
`, ctx);
const retreat = fs.readFileSync('src/77_retreat.js', 'utf8');
assert.ok(retreat.includes('nuclearRelease: true'));
console.log('retreat objective logic: OK');
