const fs = require('fs'), vm = require('vm'), assert = require('assert');
class V {
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  applyQuaternion(){return this;}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}
  distanceTo(v){return Math.sqrt(this.distanceToSquared(v));}
}
const ctx={THREE:{Vector3:V,Quaternion:class{}},document:{getElementById:()=>({insertAdjacentHTML(){}})},
 TUNE:{drone:{leashFighters:2000}},ships:[],player:null,time:10,Math,
 sense(){},isCapital:s=>s.def.cls!=='fighter',fighterAI(s){s.action='fight';},
 plogN(){},plogEvent(){},log(){},droneRadio(){},hostilesOf:s=>ctx.ships.filter(t=>t.team!==s.team),
 turnToward(){},aiFly(){},clamp:(x,a,b)=>Math.max(a,Math.min(b,x))};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/56_drones.js','utf8'),ctx);
const ship=(team,cls,x)=>({team,alive:true,dying:false,def:{cls,radius:10,maxSpeed:100},group:{position:new V(x,0,0),quaternion:{}},vel:{length:()=>0},ai:{t:0,tgtT:0,mslT:0,cmT:0,evadeT:0}});
const c=ship(0,'corvette',0), d=ship(0,'fighter',0), f=ship(1,'fighter',1800), far=ship(1,'fighter',2200), cap=ship(1,'capital',100);
c.drones=[d];c.stores={drone:0};d.ctrl=c;d.dOrder='fighters';ctx.ships=[c,d,f,far,cap];
ctx.droneAI(d,.1);assert.strictEqual(d.target,f);assert.equal(d.action,'fight');
d.action='';d.group.position.x=2100;ctx.droneAI(d,.1);assert.equal(d.target,null);assert.notEqual(d.action,'fight');
d.group.position.x=0;c.group.position.x=-500;d.ai.tgtT=0;ctx.droneAI(d,.1);assert.equal(d.target,null);
c.group.position.x=0;f.alive=false;d.ai.tgtT=0;ctx.droneAI(d,.1);assert.equal(d.target,null);
const d2=ship(0,'fighter',0); d2.ctrl=c; c.drones.push(d2);
ctx.droneOrder(c,'fighters'); assert.equal(d.dOrder,'protect'); assert.equal(d2.dOrder,'fighters');
ctx.droneOrder(c,'engage',cap);assert.strictEqual(d.dTgt,cap);ctx.droneOrder(c,'return');assert.equal(d.dOrder,'return');
console.log('fighter preference, carrier-relative leash, moving carrier, no targets and orders: OK');
