# Owner rule 2026-11-12: a capital with an XL spine gun brings it onto enemy capitals as quickly as possible instead of
# hunting fighters. Scenario: the Glaive's own target is an enemy fighter in front of it; an enemy Exeter sits 3.2 km off its
# beam (90 deg). The Glaive must turn and charge the spine at the Exeter within 30 s. Same for the Bullfrog (lancer AI) against
# a Glaive. Usage: python3 spine_focus_t.py
import json, sys
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
JS = """([me, big, team])=>{const g=__game,T=g.THREE;__paused=true;
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.group.visible=false;}} g.ships.splice(0,g.ships.length,g.player);
  g.player.group.position.set(0,0,90000);g.player.team=2;
  const a=g.spawnShip(me,team,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{});
  const b=g.spawnShip(big,1-team,new T.Vector3(3200,0,0),new T.Vector3(0,0,0),{});b.ai.hold=true;b.hold=true;
  const f=[];for(let i=0;i<4;i++){const k=g.spawnShip('kestrel',1-team,new T.Vector3((i-1.5)*120,40,-900),new T.Vector3(0,0,0),{});k.ai.hold=true;f.push(k);}
  a.target=f[0]; if(a.ai) a.ai.tgtSince=g.time||0;
  __bf.log.length=0;
  let first=null;
  for(let i=0;i<20*30;i++){g.update(0.05);b.vel.set(0,0,0);b.group.position.set(3200,0,0);
    for(const k of f){k.vel.set(0,0,0);}
    const ev=__bf.log.find(e=>(e.ev==='charge'||e.ev==='spine')&&(e.tgt===big||e.target===big||e.tgt===b.def.id));
    if(ev&&first===null){first=+(i*0.05).toFixed(1);break;}}
  return {first, events:__bf.log.slice(0,6)};}"""
with Runner() as R:
    for me, big, team in [('destroyer', 'exeter', 0), ('bullfrog', 'destroyer', 1)]:
        pg = R.page(480, 270, '?free&n=0&q=low&seed=7'); pg.wait_for_timeout(1200)
        r = pg.evaluate(JS, [me, big, team])
        print(me, json.dumps(r)[:400])
        check(f'{me}: spine charges at the {big} within 30 s although its target was a fighter', r['first'] is not None and r['first'] <= 30, r['first'])
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
sys.exit(0 if ok else 1)
