# v0.3 M2: point defence against missiles, A/B between two db files (default: the committed data/db.json against a reference db given as argv[1]).
# A Kestrel (hostile, stationary) fires salvos of SW-9 / SK-1 / HM-1 at a PD ship (Bittern or Halberd, AI frozen, turrets live); we count how many missiles were
# shot down (killed with no damage to the ship) and the pool damage the ship took.  Usage:
#   git show <ref>:data/db.json > data/db_ref.json     # reference db (do not commit it)
#   GS_PORT=8861 GS_TEST_DIR=/tmp/gs_pdm python3 tools/tests/pd_msl_t.py data/db_ref.json [runs]
from lib import *
import sys, statistics
REF = sys.argv[1] if len(sys.argv) > 1 else None
RUNS = int(sys.argv[2]) if len(sys.argv) > 2 else 6
JS = """([hull,wid,n,seed])=>{const g=__game,T=g.THREE;__paused=true;
  g.player.group.position.set(0,0,60000);g.player.vel.set(0,0,0);g.player.team=0;
  for(const s of g.ships){if(s!==g.player){s.alive=false;s.dying=0;}} g.update(0.001);g.update(0.001);
  const t=g.spawnShip(hull,1,new T.Vector3(0,0,0),new T.Vector3(0,0,-3000),{skill:3});t.vel.set(0,0,0);t.ai.hold=true;t.mod.take=0.001;
  const k=g.spawnShip('kestrel',2,new T.Vector3(0,0,-1300),new T.Vector3(0,0,0),{skill:3});k.vel.set(0,0,0);k.ai.hold=true;k.mod.take=0.001;k.stores={[wid]:99,flare:0};
  const pool=()=>t.structure+t.shield.fore+t.shield.aft;const p0=pool();let launched=0,hits=0;
  const ms=[];
  for(let i=0;i<n;i++){ k.lock={tgt:t,wid,p:1,state:'locked',d:1300,ang:0}; if(g.launchMissile(k,wid)){launched++;ms.push(g.missiles[g.missiles.length-1]);}
    for(let j=0;j<10;j++) g.update(0.05); }
  for(let i=0;i<700;i++){ g.update(0.05); t.energy=Math.max(t.energy, 0); }
  const gone=ms.filter(m=>m.dead).length;
  return {launched,loss:p0-pool(),fired:t.turrets.reduce((a,x)=>a+x.fired,0),energyEnd:t.energy};}"""
def run(db):
    out = {}
    with Runner() as R:
        for hull in ('bittern', 'halberd'):
            for wid, n in (('ir', 6), ('tick', 6), ('torp', 3)):
                loss = [];
                for sd in range(RUNS):
                    pg = R.page(320, 180, f'?free&n=0&wing=0&seed={sd+1}&q=low' + (f'&db={db}' if db else ''))
                    pg.wait_for_timeout(300)
                    r = pg.evaluate(JS, [hull, wid, n, sd + 1]); pg.close()
                    loss.append(r['loss'])
                out[(hull, wid)] = (statistics.mean(loss), statistics.pstdev(loss))
        assert_no_console_errors(R)
    return out
cur = run(None)
ref = run(REF) if REF else None
print('hull     missile   damage taken (pool points, mean +- sd over %d runs)   %s' % (RUNS, 'current  |  reference' if ref else 'current'))
for k, v in cur.items():
    print(f'{k[0]:8s} {k[1]:6s}   {v[0]:7.1f} +- {v[1]:5.1f}' + (f'   |  {ref[k][0]:7.1f} +- {ref[k][1]:5.1f}' if ref else ''))
