// Exercise the sweep's actual hook, including array replacement by missile cleanup.
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const source=fs.readFileSync('tools/tests/balance_sweep.py','utf8');
const hook=source.slice(source.indexOf('  const missileShots='),source.indexOf('  player.team=2;'));
const context={}; vm.createContext(context);
vm.runInContext(hook+`
  let missiles=[];
  const shot=team=>({w:{kind:'msl'},owner:{},pos:{},mesh:{},team});
  missiles.push(shot(0),shot(1));
  missiles[0].dead=true; missiles=missiles.filter(m=>!m.dead);
  missiles.push(shot(0));
  [].push({w:{kind:'proj'},owner:{},pos:{},mesh:{},team:0});
  globalThis.observed={...missileShots,peak:peakMissiles};`,context);
assert.equal(context.observed.human,2); assert.equal(context.observed.frogg,1); assert.equal(context.observed.peak,2);
console.log('sweep missile counter tracks launches through array replacement and ignores bolts: OK');
