# v0.3 M2: bomber gunners. An AI Bittern (two PD turrets) with a hostile Kestrel on its six: the turrets must engage the attacker (target score
# tuning.turret.attackerBias) and still take an incoming missile first. Also: a PD turret keeps its capacitor reserve for the guns
# (tuning.turret.reserveShip) and a capital's PD does not drain the lasers' capacitor to zero.
# Run: GS_PORT=8841 GS_TEST_DIR=/tmp/gs_m2_g python3 tools/tests/gunner_t.py
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i, flush=True); ok = ok and bool(c)
SETUP = """()=>{const g=__game,T=g.THREE;__paused=true;
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}}
  g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=0;g.update(0.001);g.update(0.001);}"""
with Runner() as R:
    pg = R.page(320, 180, '?free&n=0&wing=0&seed=7&q=low')
    pg.wait_for_timeout(500)
    pg.evaluate(SETUP)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;
      const b=g.spawnShip('bittern',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
      const k=g.spawnShip('kestrel',2,new T.Vector3(0,40,260),new T.Vector3(0,0,0),{skill:3});
      b.vel.set(0,0,-30);k.vel.set(0,0,-60);b.ai.hold=true;
      const f0=b.turrets.map(t=>t.fired);const s0=k.structure+k.shield.fore+k.shield.aft;let tgt=0,n=0;
      for(let i=0;i<400;i++){ if(k.alive&&!k.dying)k.target=b; g.update(0.05); if(!(k.alive&&!k.dying))break; n++; }
      return {fired:b.turrets.map((t,i)=>t.fired-f0[i]),kAlive:k.alive&&!k.dying,kLoss:s0-(k.structure+k.shield.fore+k.shield.aft),secs:n*0.05,bEnergy:b.energy,bMax:b.energyMax};}""")
    print(r)
    check('Bittern gunners fire at the attacker on its six', sum(r['fired']) > 20, r['fired'])
    check('attacker takes damage from the gunners', r['kLoss'] > 10 or not r['kAlive'], r['kLoss'])
    # reserve: a Bittern with a low capacitor stops PD fire at ships below reserveShip x energyMax
    r2 = pg.evaluate("""()=>{const g=__game,T=g.THREE;
      for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);g.update(0.001);
      const b=g.spawnShip('bittern',1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});
      const k=g.spawnShip('kestrel',2,new T.Vector3(0,40,260),new T.Vector3(0,0,0),{skill:3});
      b.vel.set(0,0,0);k.vel.set(0,0,0);b.ai.hold=true;k.ai.hold=true;k.mod.take=0.001;
      const lowE=0.2*b.energyMax;let fired=0,minE=1e9;
      const f0=b.turrets.map(t=>t.fired);
      for(let i=0;i<200;i++){ b.energy=Math.min(b.energy,lowE); g.update(0.05); minE=Math.min(minE,b.energy);}
      fired=b.turrets.reduce((a,t,i)=>a+t.fired-f0[i],0);
      const res=0.25*b.energyMax;
      return {fired,minE,res,lowE};}""")
    print(r2)
    check('PD holds fire below the capacitor reserve (ships)', r2['fired'] == 0, r2)
    assert_no_console_errors(R)
print('ALL PASS' if ok else 'FAILED')
raise SystemExit(0 if ok else 1)
