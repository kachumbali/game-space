# Gauntlet wave calibration with an AI proxy for the pilot: one AI Kestrel (skill SK, arcade) vs the director's composition for wave N, seeded, sim only.
# Usage: python3 sv_calib.py N RUNS [SK] [WING]   (WING = extra AI Kestrel wingmen). Prints win rate and mean hull left. A proxy, not a player: direction, not truth.
from lib import *
import sys
N = int(sys.argv[1]); RUNS = int(sys.argv[2]); SK = int(sys.argv[3]) if len(sys.argv) > 3 else 4; WING = int(sys.argv[4]) if len(sys.argv) > 4 else 0
JS = """([N,seed,SK,WING])=>{const g=__game,T=g.THREE;__paused=true;
  const spec=(()=>{g.sv.n=N-1;return g.svCompose(N)})();
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;s.group.visible=false;}}
  g.ships.splice(0,g.ships.length,g.player);g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=2;
  const skill=g.svSkill(N);const me=[];for(let i=0;i<1+WING;i++)me.push(g.spawnShip('kestrel',0,new T.Vector3(-900+i*40,i*30,0),new T.Vector3(900,0,0),{skill:SK}));
  const foes=[];let k=0;const kinds=[];for(const r of spec.rows)for(let i=0;i<r.count;i++){const e=g.spawnShip(r.kind,1,new T.Vector3(900+(k%4)*60,Math.floor(k/4)*50-60,k*20),new T.Vector3(-900,0,0),{skill:skill});if(r.soft)e.mod.take=1/r.soft;foes.push(e);kinds.push(r.kind);k++}
  if(spec.ace){const a=g.spawnShip(spec.ace.kind,1,new T.Vector3(1000,0,0),new T.Vector3(-900,0,0),{skill:5});a.mod.take=1/1.8;foes.push(a);kinds.push('ACE'+spec.ace.kind)}
  let t=0;while(t<300&&me.some(s=>s.alive)&&foes.some(s=>s.alive)){g.update(0.05);t+=0.05}
  const hull=me[0].alive?me[0].structure/me[0].def.structure:0;
  return {win:foes.every(s=>!s.alive)&&me[0].alive,t:Math.round(t),hull:+hull.toFixed(2),n:foes.length,skill}}"""
wins = 0; deaths = 0; hulls = []; ts = []; info = None
with Runner() as R:
    for seed in range(1, RUNS + 1):
        pg = R.page(320, 180, f'?sv=1&sv_seed={seed}&seed={seed}&q=low'); pg.wait_for_timeout(500)
        r = pg.evaluate(JS, [N, seed, SK, WING]); pg.close()
        wins += r['win']; deaths += (r['hull'] == 0); hulls.append(r['hull']); ts.append(r['t']); info = r
        print(seed, r, flush=True)
import math
p = wins / RUNS; z = 1.96; den = 1 + z * z / RUNS; c = (p + z * z / (2 * RUNS)) / den; h = z * math.sqrt(p * (1 - p) / RUNS + z * z / (4 * RUNS * RUNS)) / den
print(f'WAVE {N} enemies~{info["n"]} skill {info["skill"]} proxy skill {SK} wing {WING}: pilot died {deaths}/{RUNS}; clean wins {wins}/{RUNS} = {p:.2f} (Wilson 95% {max(0,c-h):.2f}-{min(1,c+h):.2f}), mean hull left {sum(hulls)/len(hulls):.2f}, mean t {sum(ts)/len(ts):.0f}s')
