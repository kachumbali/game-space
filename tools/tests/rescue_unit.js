// Run the actual rescue primitives in isolation, with positive and negative controls.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const cfg=JSON.parse(fs.readFileSync('data/db.json','utf8')).tuning.rescue;
cfg.enabled=false; // The committed hand-play preset may enable rescue.
const vec=x=>({x,clone(){return vec(this.x)},distanceTo(b){return Math.abs(this.x-b.x)},distanceToSquared(b){return (this.x-b.x)**2}});
const group=x=>({position:vec(x),quaternion:{clone(){return {}}},visible:true});
const C={TUNE:{rescue:cfg},ships:[],missiles:[],time:10,game:{},CREW:{hawk:{notes:[]}},SHIPS:{sar:{armor:{}}},
  ell:()=>({}),comm:()=>{},saveCrew:()=>{},rosterEnabled:()=>false,player:null,state:'play',view:'cockpit',
  destroy:s=>{s.alive=false},turnToward:()=>{},aiFly:()=>{},
  makeShip:(id,team,pos,q,opts)=>{const s={team,alive:true,dying:0,def:{id},group:group(pos.x),vel:{copy(){}},callsign:opts.callsign};C.ships.push(s);return s;}};
vm.createContext(C);vm.runInContext(fs.readFileSync('src/72_rescue.js','utf8'),C);
const pilot={alive:true,dying:0,team:0,pilot:'hawk',def:{cls:'fighter',structure:100},structure:20,group:group(0),vel:{}};
assert.equal(C.rescueCritical(pilot),false);assert.equal(C.rescueSpawnCapsule(pilot),null);
cfg.enabled=true;assert.equal(C.rescueCritical(pilot),true);
pilot.structure=80;assert.equal(C.rescueCritical(pilot),false);assert.equal(C.rescueRequestEject(pilot),false);
pilot.structure=20;assert.equal(C.rescueRequestEject(pilot),true);assert.equal(pilot.rescueManualRequested,true);
const pod=C.rescueSpawnCapsule(pilot,{pilot:'hawk'});assert(pod&&pod.alive);assert.equal(C.game.rescueLog.length,1);
const sar={alive:true,dying:0,team:0,def:{rescue:true,sar:{}},group:group(50),lastHit:-99}; C.ships.push(sar);
const threat={alive:true,dying:0,team:1,target:sar,group:group(500)};C.ships.push(threat);
assert.equal(C.rescueCanPickup(sar,pod,C.time,cfg),false);threat.target=null;
assert.equal(C.rescueCanPickup(sar,pod,C.time,cfg),true);C.ships.pop();
sar.lastHit=10;C.rescueTick(cfg.pickupTime);assert.equal(pod.rescueCapsule.outcome,'adrift');
sar.lastHit=-99;C.missiles.push({target:sar,dead:false});C.rescueTick(cfg.pickupTime);assert.equal(pod.rescueCapsule.outcome,'adrift');
C.missiles=[];C.rescueTick(cfg.pickupTime);assert.equal(pod.rescueCapsule.outcome,'recovered');assert.equal(C.CREW.hawk.status,'recovering');
const expired=C.rescueSpawnCapsule(pilot,{});sar.group.position=vec(1000);C.rescueTick(cfg.lifeSupport);assert.equal(expired.rescueCapsule.outcome,'life support expired');
const cap=C.rescueSpawnCapsule(pilot,{});const enemy={alive:true,dying:0,team:1,def:{rescue:true},group:group(0),lastHit:-99};C.ships.push(enemy);C.rescueTick(cfg.pickupTime);assert.equal(cap.rescueCapsule.outcome,'captured');
const route=C.rescueSpawnCapsule(pilot,{});sar.group.position=vec(500);
let turns=0,flights=0;C.turnToward=()=>turns++;C.aiFly=()=>flights++;
assert.equal(C.rescueShipAI(sar,0.05),true);assert.equal(turns,1);assert.equal(flights,1);
assert.equal(C.rescueShipAI(enemy,0.05),false);
const capital={alive:true,dying:0,def:{rescue:true,radius:250},group:group(300),lastHit:-99};
assert.equal(C.rescueCanPickup(capital,route,C.time,cfg),true);
capital.group.position=vec(500);assert.equal(C.rescueCanPickup(capital,route,C.time,cfg),false);
sar.group.position=vec(5000);enemy.group.position=vec(-500);
assert.equal(C.rescueShipAI(enemy,0.05),true);assert.equal(flights,2);
assert.equal(C.rescueOnDestroyed(route),true);assert.equal(route.rescueCapsule.outcome,'destroyed');
assert.equal(C.rescueOnDestroyed(sar),false);
console.log('rescue disabled, manual eligibility, fire interruption, recovery, expiry and capture: OK');
