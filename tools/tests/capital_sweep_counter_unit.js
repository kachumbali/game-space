const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('tools/tests/balance_sweep.py','utf8');
const code=src.slice(src.indexOf('  const missileShots='),src.indexOf('  player.team=2;'));
const c={};vm.createContext(c);
vm.runInContext(`const g={missiles:[]};`+code+`
  const a={team:0}, b={team:1};g.missiles.push(a,b);
  const warning=[];warning.push(a,b);a.dead=true;
  g.missiles=g.missiles.filter(m=>!m.dead);g.missiles.push({team:0});
  globalThis.result={...missileShots,peak:peakMissiles};`,c);
assert.equal(c.result.human,2);assert.equal(c.result.frogg,1);assert.equal(c.result.peak,2);
console.log('missile counter survives array replacement and ignores warning lists: OK');
