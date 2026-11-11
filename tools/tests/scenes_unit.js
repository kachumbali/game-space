// Pure scene adaptation variants, independent of rendering or live saves.
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const source=fs.readFileSync('src/75c_prologue_scenes.js','utf8');
const sandbox={PILOT_DEFS:{hawk:{name:'Lt. Maya Okafor',callsign:'HAWK'},sparrow:{name:'Ens. Tomás Vidal',callsign:'SPARROW'}}};
vm.createContext(sandbox);vm.runInContext(source,sandbox);
const scene={id:'p01_after_lose',events:[{t:1,do:'say',who:'vance',text:'lost'},{t:8,do:'say',who:'vance',text:'base'},{t:15,do:'say',who:'hawk',text:'hello'},{t:22,do:'say',who:'vance',text:'end'}]};
const p={id:'h',callsign:'HAWK',name:'Lt. Maya Okafor',status:'ACTIVE',available:true};
const ctx={missionId:'p01',anchorAvailable:true,result:'lose',participants:[p],ejections:[]};
for(const [status,needle] of [['KIA','lost HAWK'],['MIA','HAWK is still missing'],['CAPTURED','HAWK was captured'],['RECOVERING','HAWK is recovering']]) {
 const out=sandbox.preparePrologueScene(scene,{...ctx,participants:[{...p,status,available:false}]});assert(out.events[1].text.includes(needle));assert.notEqual(out.events[2].who,'hawk');
}
for(const [outcome,needle] of [['recovered','recovered'],['captured','captured'],['destroyed','destroyed'],['life support expired','life support expired'],['adrift','unknown']]) {
 const out=sandbox.preparePrologueScene(scene,{...ctx,ejections:[{pilot:'h',outcome}]});assert(out.events[1].text.includes('HAWK')&&out.events[1].text.includes(needle));
}
for(const grade of 'SABCD') {const out=sandbox.preparePrologueScene({...scene,id:'p01_after_win'},{...ctx,result:'win',grade});assert(out.events[3].text.includes('Grade '+grade));}
const partial=sandbox.preparePrologueScene(scene,{...ctx,result:'partial',cause:'Missile or warhead impact.'});assert(partial.events[0].text.includes('partial'));assert(partial.events[3].text.includes('missile'));
const unchanged=JSON.stringify(scene);sandbox.preparePrologueScene(scene,ctx);assert.equal(JSON.stringify(scene),unchanged);
console.log('PASS scene status, ejection, grade, cause and input isolation');
