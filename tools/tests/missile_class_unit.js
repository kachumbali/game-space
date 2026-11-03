// Execute the game helper with every class plus exempt and non-missile controls.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const db=JSON.parse(fs.readFileSync('data/db.json','utf8'));
const src=fs.readFileSync('src/60_weapons.js','utf8');
const code=src.slice(src.indexOf('function missileClassFactors('),src.indexOf('function blastAt('));
const c={TUNE:db.tuning};vm.createContext(c);vm.runInContext(code,c);
for(const id of ['ir','rf','tick']) for(const cls of ['fighter','corvette','frigate','capital']) {
 const r=c.missileClassFactors(db.weapons[id],cls);
 assert.equal(r.damage,db.tuning.missile.dmgCls[cls]);assert.equal(r.pierce,db.tuning.missile.pierceCls[cls]);
}
for(const id of ['torp','tad','nuke']) for(const cls of ['fighter','corvette','frigate','capital']) {
 const r=c.missileClassFactors(db.weapons[id],cls);assert.equal(db.weapons[id].classScale,false);assert.equal(r.damage,1);assert.equal(r.pierce,1);
}
assert.equal(c.missileClassFactors({kind:'proj',dmg:9},'capital').damage,1);
assert.equal(c.missileClassFactors(db.weapons.ir,'unknown').damage,1);
console.log('missile class factors and exemption controls: OK');
