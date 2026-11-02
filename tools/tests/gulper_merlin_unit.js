// Positive and negative controls for the candidate lead solver and Merlin data.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync('data/db.json','utf8'));
const merlin=data.ships.merlin;
assert.equal(merlin.maxSpeed,262.5); assert.equal(merlin.aiSpeed,140);
assert.equal(merlin.aiSpeed,175*0.8); // previous normal attack cruise
const src=fs.readFileSync('src/70_ai.js','utf8');
const code=src.slice(src.indexOf('function projectileInterceptTime('),src.indexOf('function projectileInterceptPoint('));
const c={};vm.createContext(c);vm.runInContext(code,c);
const V=(x,y,z)=>({x,y,z,dot(o){return this.x*o.x+this.y*o.y+this.z*o.z;}});
assert.equal(c.projectileInterceptTime(V(100,0,0),V(0,0,0),50),2);
assert.equal(c.projectileInterceptTime(V(100,0,0),V(10,0,0),50),2.5);
assert.equal(c.projectileInterceptTime(V(100,0,0),V(60,0,0),50),null);
assert.equal(data.ships.gulper.ai.interceptLead,undefined); // candidates are harness-only
console.log('Gulper/Merlin data and lead controls: OK');
