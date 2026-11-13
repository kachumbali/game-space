"""Trace seed-1 capital duels; shield-after is sampled at the end of the update."""
import json
from armament_duels import DUEL
from lib import Runner
js=DUEL.replace('let elapsed = 0;', 'let elapsed = 0; __bf.log.length = 0; let seen=0, shots=[];').replace('elapsed += dt;', '''elapsed += dt;
        for (;seen<__bf.log.length;seen++) {const e=__bf.log[seen]; if(e.ev==='spine') {const target=teams.flat().find(s=>s.def.id===e.hit && s.team===e.hitTeam); shots.push({...e,sh1:target ? Math.round(target.shield.fore+target.shield.aft):null});}}''').replace('deaths: [...deaths.values()]', 'deaths: [...deaths.values()], log: __bf.log, shots')
with Runner() as r:
 for left,right in [('destroyer','exeter'),('carrier','bullfrog')]:
  p=r.page(480,270,'?free&n=0&q=low&skyres=128&mute&duelbench&seed=1',init_script='globalThis.__paused=true')
  print(json.dumps({'cell':left+'-'+right,**p.evaluate(js,[[left],[right],180])}),flush=True)
  p.context.close()
