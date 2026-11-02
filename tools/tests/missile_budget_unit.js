// Exercise actual device-cap helper with off/on and boundary controls.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('src/60_weapons.js','utf8');
const code=src.slice(src.indexOf('function missileLiveCap('),src.indexOf('function launchMissile('));
const c={TUNE:{ordnance:{enabled:false,liveCap:{phone:20,tablet:32,desktop:48}}},deviceName:()=>c.device,device:'phone'};
vm.createContext(c);vm.runInContext(code,c);
assert.equal(c.missileLiveCap(),Infinity);
c.TUNE.ordnance.enabled=true;
for(const [device,cap] of [['phone',20],['tablet',32],['desktop',48],['laptop',48],['max',48]]) {c.device=device;assert.equal(c.missileLiveCap(),cap);}
assert.notEqual(c.missileLiveCap(),20); // desktop-class must not use phone cap
console.log('missile budget device controls: OK');
