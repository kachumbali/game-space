// Test actual launchMissile dispatch before its WebGL-dependent launch path.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('src/60_weapons.js','utf8');
const code=src.slice(src.indexOf('function launchMissile('),src.indexOf('function steerMissile('));
let launches=0,capRefusals=0;
const c={TUNE:{ordnance:{enabled:true}},WEAPONS:{ir:{},nuke:{}},missiles:[],missileLiveCap:()=>0,
  plogN:()=>capRefusals++,fireLauncher:()=>{launches++;return true;}};
vm.createContext(c);vm.runInContext(code,c);
const cell={allowed:['ir'],wid:'ir',ready:1,timer:0,comp:'cell'};
const s={stores:{ir:1,nuke:1},comps:[{id:'cell',hp:100,max:100}],launcherRuntime:[cell],lock:{p:0}};c.player=s;
assert.equal(c.launchMissile(s,'ir'),true);assert.equal(launches,1);assert.equal(capRefusals,0);
assert.equal(c.launchMissile(s,'nuke'),false);assert.equal(launches,1);assert.equal(capRefusals,1);
c.TUNE.ordnance.enabled=false;assert.equal(c.launchMissile(s,'ir'),false);assert.equal(capRefusals,2);
console.log('managed cells route to runtime; unmanaged nukes and flag-off preserve legacy dispatch: OK');
