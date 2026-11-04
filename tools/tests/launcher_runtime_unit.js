const fs=require('fs'), vm=require('vm'), assert=require('assert');
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z,isVector3:true});} clone(){return new V(this.x,this.y,this.z);} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}}
const TUNE={ordnance:{enabled:true}}; let blocked=false,last=null;
const ctx={TUNE,THREE:{Vector3:V},launchMissile:(s,w,opts)=>{if(blocked || !(s.stores[w]>0))return false;last=opts;s.stores[w]--;return true;}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/57_launchers.js','utf8'),ctx);
const bank={id:'RM',role:'missile',kind:'reloadable',count:2,positions:[[1,2,3],[-1,2,3]],mountRadius:2,mountHp:100,cap:1,reload:5,stores:['ir','rf']};
function ship(){return {alive:true,dying:0,team:0,def:{fac:'human',launchers:[bank],ordnancePlan:{stores:{ir:3,rf:1}}},stores:{},comps:[],group:{updateMatrixWorld(){},localToWorld:v=>v}};}
const s=ship();ctx.initLaunchers(s);assert.equal(s.launcherRuntime.length,2);assert.equal(s.launcherMagazine.ir,1);assert.equal(s.launcherMagazine.rf,1);
const [a,b]=s.launcherRuntime,t={alive:true,team:1,group:{position:new V(11,2,3)}};
assert.equal(ctx.fireLauncher(s,a,'ir',t),true);assert.equal(s.stores.ir,2);assert.equal(a.timer,5);assert.equal(last.dir.x,10);assert.equal(last.pos[0],1);
assert.equal(ctx.fireLauncher(s,a,'ir',t),false);assert.equal(ctx.fireLauncher(s,b,'ir',t),true);
ctx.launcherTick(s,4.9);assert.equal(a.ready,0);ctx.launcherTick(s,0.1);assert.equal(a.ready,1);assert.equal(a.wid,'ir');assert.equal(b.wid,'rf');
let component=s.comps.find(x=>x.id===a.comp);component.hp=50;assert.equal(ctx.fireLauncher(s,a,'ir',t),false);component.hp=100;
blocked=true;assert.equal(ctx.fireLauncher(s,a,'ir',t),false);assert.equal(a.ready,1);assert.equal(s.stores.ir,1);blocked=false;
assert.equal(ctx.fireLauncher(s,a,'ir',t),true);assert.equal(s.stores.ir,0);
ctx.launcherTick(s,5);assert.equal(a.ready,0);s.stores.ir=1;ctx.launcherTick(s,0);assert.equal(a.ready,1);assert.equal(s.launcherMagazine.ir,0);
const carrier=ship(); carrier.def.ordnancePlan.stores.drone=12; carrier.def.ordnancePlan.droneLimit=6; ctx.initLaunchers(carrier); assert.equal(carrier.stores.drone,12); assert.equal(carrier.dlimit,6);
TUNE.ordnance.enabled=false;const off=ship();ctx.initLaunchers(off);assert.equal(off.launcherRuntime,undefined);assert.equal(ctx.fireLauncher(s,a,'ir',t),false);
TUNE.ordnance.enabled=true;const enemy=ship();enemy.def.fac='frogg';ctx.initLaunchers(enemy);assert.equal(enemy.launcherRuntime,undefined);
const fixed=ship();fixed.def.launchers=[{...bank,id:'FT',kind:'fixed',count:1,positions:[[0,1,2]],cap:4,reload:14,stores:['ir']}];fixed.def.ordnancePlan={stores:{ir:4}};
ctx.initLaunchers(fixed);const ft=fixed.launcherRuntime[0];assert.equal(ft.ready,4);
for(let i=0;i<4;i++){assert.equal(ctx.fireLauncher(fixed,ft,'ir',null),true);ctx.launcherTick(fixed,14);}
assert.equal(ft.ready,0);assert.equal(fixed.stores.ir,0);fixed.stores.ir=2;ctx.launcherTick(fixed,0);assert.equal(ft.ready,2);
fixed.stores.ir=0;ctx.launcherReconcile(fixed);assert.equal(ft.ready,0);
console.log('independent cells, typed magazines, reload, damage, cap refusal, rearm and feature controls: OK');
