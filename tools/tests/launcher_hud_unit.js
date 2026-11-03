const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('src/90_hud.js','utf8');
const code=src.slice(src.indexOf('function launcherHudText('),src.indexOf('let launcherHudEl'));
const c={};vm.createContext(c);vm.runInContext(code,c);
const ship={alive:true,comps:[{id:'a',hp:100,max:100},{id:'b',hp:100,max:100},{id:'c',hp:0,max:100}],
 launcherMagazine:{ir:5,rf:3,torp:2},launcherRuntime:[
 {role:'missile',comp:'a',ready:1,timer:0,allowed:['ir','rf']},
 {role:'missile',comp:'b',ready:0,timer:2.1,allowed:['ir','rf']},
 {role:'torpedo',comp:'c',ready:1,timer:0,allowed:['torp']} ]};
assert.equal(c.launcherHudText(ship,false),'');
const text=c.launcherHudText(ship,true);
assert(text.includes('MISSILE 1/2 READY'));assert(text.includes('RELOAD 3s×1'));assert(text.includes('IR 5 RF 3'));
assert(text.includes('TORPEDO 0/1 READY · 1 LOADED · 1 DAMAGED'));assert(text.includes('TORP 2'));
ship.alive=false;assert.equal(c.launcherHudText(ship,true),'');
assert.equal(c.launcherHudText({alive:true},true),'');
console.log('launcher HUD ready, reload, magazines, damaged and disabled controls: OK');
