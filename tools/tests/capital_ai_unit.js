const fs=require('fs'),vm=require('vm'),assert=require('assert');
const db=JSON.parse(fs.readFileSync('data/db.json','utf8'));
class V {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
 clone(){return new V(this.x,this.y,this.z);} copy(a){Object.assign(this,{x:a.x,y:a.y,z:a.z});return this;}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;} length(){return Math.hypot(this.x,this.y,this.z);}
 normalize(){const n=this.length()||1;this.x/=n;this.y/=n;this.z/=n;return this;}
 addScaledVector(v,n){this.x+=v.x*n;this.y+=v.y*n;this.z+=v.z*n;return this;}
 distanceTo(v){return this.clone().sub(v).length();} distanceToSquared(v){return this.distanceTo(v)**2;}
 applyQuaternion(){return this;} angleTo(v){const n=this.length()*v.length();return Math.acos(Math.max(-1,Math.min(1,(this.x*v.x+this.y*v.y+this.z*v.z)/n)));}
}
const ctx={TUNE:db.tuning,WEAPONS:db.weapons,THREE:{Vector3:V},SHIPS:{kestrel:{}},player:null,ships:[],missiles:[],traceShip:()=>null,segSphere:()=>false,
 launcherReconcile:()=>{},torpsStillNeeded:()=>9,plogN:()=>{},dronesOf:s=>s.drones,
 launchDrones:(s,n)=>{for(let i=0;i<n;i++)s.drones.push({alive:true});s.stores.drone-=n;},
 makeShip:(id,team,pos)=>({id,team,alive:true,dying:0,group:{position:pos},vel:new V()})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/71_capital_ordnance.js','utf8'),ctx);
const cfg=ctx.TUNE.ordnance.ai;ctx.TUNE.ordnance.enabled=true;
const turret=(id,hp=100)=>({wid:'pd',w:{kind:'proj'},comp:id,ammo:5,dead:false});
const target={alive:true,dying:0,team:1,def:{cls:'capital',radius:10},group:{position:new V(0,0,-1000)},turrets:[turret('a'),turret('b')],comps:[{id:'a',hp:100},{id:'b',hp:100}]};
let pd=ctx.capitalPdStats(target,cfg);assert.equal(pd.capacity,2);assert(!ctx.capitalSalvoAllowed(3,pd,cfg));assert(ctx.capitalSalvoAllowed(4,pd,cfg));
target.comps[0].hp=0;pd=ctx.capitalPdStats(target,cfg);assert.equal(pd.live,1);assert(!ctx.capitalSalvoAllowed(1,pd,cfg));
target.comps[1].hp=0;pd=ctx.capitalPdStats(target,cfg);assert(ctx.capitalSalvoAllowed(1,pd,cfg));
const cells=Array.from({length:4},(_,i)=>({id:`T${i}`,comp:`T${i}`,role:'torpedo',wid:'torp',ready:1,timer:0,cap:1,allowed:['torp']}));
const owner={alive:true,dying:0,team:0,def:{fac:'human',half:[20,20,100],ordnancePlan:{stores:{drone:7},droneLimit:6,hangar:{total:1,airborneCap:1,interval:6,bayComponents:['bay'],manifest:{kestrel:1}}}},
 group:{position:new V(),quaternion:{clone(){return this;}},updateMatrixWorld(){},localToWorld:v=>v}, vel:new V(), stores:{torp:4},drones:[],comps:cells.map(c=>({id:c.comp,hp:100,max:100})).concat({id:'bay',hp:100,max:100,pos:[0,0,0]}),launcherRuntime:cells,launcherMagazine:{}};
ctx.ships=[owner,target];for(const c of cells)c.pos=[0,0,0];
assert(ctx.capitalClearShot(owner,cells[0],target,3));ctx.traceShip=()=>({});assert(!ctx.capitalClearShot(owner,cells[0],target,3));ctx.traceShip=()=>null;
const friend={alive:true,dying:0,team:0,def:{radius:10},group:{position:new V(0,0,-500)}};ctx.ships.push(friend);ctx.segSphere=()=>true;
assert(!ctx.capitalClearShot(owner,cells[0],target,3));ctx.segSphere=()=>false;ctx.ships.pop();
const shots=[];ctx.fireLauncher=(s,c,w,t)=>{shots.push(c.id);c.ready=0;return true;};
let C=ctx.capitalPrepare(owner);C.contact=true;ctx.capitalHangarAI(owner,C,0);assert.equal(C.hangar.out.length,1);ctx.capitalHangarAI(owner,C,10);assert.equal(C.hangar.out.length,1);
ctx.capitalFireRole(owner,C,'torpedo',2);assert.equal(shots.length,1);ctx.capitalFireRole(owner,C,'torpedo',0.4);assert.equal(shots.length,2);
ctx.capitalFireRole(owner,C,'torpedo',0.4);ctx.capitalFireRole(owner,C,'torpedo',0.4);assert.equal(shots.length,4);
cells[0].ready=1;C.torpedo.queue=[cells[0].id];C.torpedo.target=target;C.torpedo.wait=0;
owner.comps.find(c=>c.id===cells[0].comp).hp=0;ctx.capitalFireRole(owner,C,'torpedo',0.1);assert.equal(C.torpedo.queue,null);
owner.comps.find(c=>c.id===cells[0].comp).hp=100;ctx.capitalFireRole(owner,C,'torpedo',2);assert.equal(shots.length,5);
assert.equal(owner.stores.drone,7);assert.equal(owner.dlimit,6);
ctx.TUNE.ordnance.enabled=false;const old=owner.capitalOrdnance;ctx.capitalOrdnanceAI(owner,1);assert.strictEqual(owner.capitalOrdnance,old);
console.log('PD hold, live health, committed salvo, friendly/self hull clearance, hangar cap and feature flag: OK');
