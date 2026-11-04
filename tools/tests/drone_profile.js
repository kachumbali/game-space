// Target selection microbenchmark: 24 drones, 40 hostile fighters, 1,000 AI ticks.
const fs=require('fs'), vm=require('vm'), cp=require('child_process'), {performance}=require('perf_hooks');
class V { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} copy(v){Object.assign(this,v);return this;} distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;} distanceTo(v){return Math.sqrt(this.distanceToSquared(v));} }
function sample(code){
 const c={THREE:{Vector3:V,Quaternion:class{}},document:{getElementById:()=>({insertAdjacentHTML(){}})},TUNE:{drone:{leashFighters:2000,returnFraction:.8,resumeFraction:.5}},ships:[],player:null,time:0,Math,sense(){},isCapital:s=>s.def.cls!=='fighter',fighterAI(){},plogN(){},hostilesOf:s=>c.ships.filter(e=>e.alive&&!e.dying&&e.team!==s.team)};
 vm.createContext(c);vm.runInContext(code,c);
 const carrier={alive:true,team:0,def:{cls:'corvette'},group:{position:new V()},drones:[]};
 for(let i=0;i<40;i++)c.ships.push({alive:true,team:1,def:{cls:'fighter'},group:{position:new V(600+i*20,0,0)}});
 for(let i=0;i<24;i++){const d={alive:true,team:0,def:{cls:'fighter'},group:{position:new V(i,0,0)},ai:{t:0,tgtT:0,mslT:0,cmT:0,evadeT:0},ctrl:carrier,dOrder:'all'};carrier.drones.push(d);}
 const start=performance.now();for(let i=0;i<1000;i++){c.time=i*.05;for(const d of carrier.drones)c.droneAI(d,.05);}
 return performance.now()-start;
}
const before=cp.execFileSync('git',['show',(process.env.DRONE_BASE || '70ae06f')+':src/56_drones.js'],{encoding:'utf8'}),after=fs.readFileSync('src/56_drones.js','utf8');
for(let i=0;i<5;i++) console.log(JSON.stringify({run:i+1,before_ms:+sample(before).toFixed(2),after_ms:+sample(after).toFixed(2)}));
