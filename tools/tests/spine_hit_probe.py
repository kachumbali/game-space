"""Probe two consecutive spine hits on fresh, stationary ships."""
import json
from lib import Runner
js='''([a,b])=>{const g=__game,T=g.THREE; g.__paused=true; g.player.group.position.set(0,0,90000);g.player.team=2;g.setLod('off');const V=(x,y,z)=>new T.Vector3(x,y,z);let s=g.spawnShip(a,0,V(0,0,0),V(0,0,-2000),{}),t=g.spawnShip(b,1,V(0,0,-2000),V(0,0,0),{});s.vel.set(0,0,0);t.vel.set(0,0,0);s.ai.hold=true;t.ai.hold=true;__bf.spineInit(s);s.spine.tgt=t;const pool=()=>t.structure+t.shield.fore+t.shield.aft;let initial=pool(), result=[];for(let i=0;i<2;i++){let before=pool(),sh=t.shield.fore+t.shield.aft,h=t.structure;let rec=__bf.spineFire(s);result.push({hit:rec.hit, shield:sh-(t.shield.fore+t.shield.aft),hull:h-t.structure,pool:before-pool(),fraction:(initial-pool())/initial,dead:!t.alive||t.dying>0});}return {initial,result}}'''
with Runner() as r:
 for a,b in [('bullfrog','carrier'),('destroyer','bullfrog'),('destroyer','exeter')]:
  p=r.page(320,180,'?free&n=0&q=low&skyres=128&mute&duelbench&seed=1',init_script='globalThis.__paused=true')
  result=p.evaluate(js,[a,b]); print(a,b,json.dumps(result),flush=True); p.context.close()
  first, second = result['result']
  assert first['hit'] == b and second['hit'] == b or first['dead'], result
  if (a,b) in [('bullfrog','carrier'),('destroyer','bullfrog')]:
   assert 0.30 <= first['fraction'] <= 0.50, result
   assert second['dead'] or second['fraction'] >= 0.85, result
 assert not r.errs, r.errs
