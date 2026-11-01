# v0.3 M5 subsystem damage: for each component role, damage the component through the real hit path (applyHit) to state 1 (damaged, <= 50% hp) and
# state 2 (destroyed) and assert the measurable effect. Table: docs/SUBSYSTEM_EFFECTS.md. Also: HUD cue text, phone layout (844x390 ?touch), no console errors.
# Run: cd tools/tests && GS_PORT=8791 GS_TEST_DIR=/tmp/gs_subsys python3 subsys_t.py   (needs python3 ../../build.py first)
from lib import *
import os
os.makedirs('/tmp/gs_shots', exist_ok=True)
ok = True
def check(name, cond, info=''):
    global ok
    print(('PASS ' if cond else 'FAIL ') + name, info)
    ok = ok and bool(cond)
def near(v, lo, hi): return lo <= v <= hi

HELPERS = """()=>{
const g=__game, V=g.THREE.Vector3;
const EXP=['turret','gun','engine','radar','shield','radiator','bay'];
window.H={
  prep(){ g.game.mode='none'; g.ships.filter(s=>s!==g.player).forEach(s=>s.alive=false); g.update(0.01); },
  mk(kind,team,x,z){ const s=g.spawnShip(kind,team,new V(x||0,0,z||-4000),null,{}); s.ai.hold=true; s.vel.set(0,0,0); return s; },
  // damage every component of a role to the grade through applyHit (exposed roles: plain hits; buried ones: piercing hits that breach the armour)
  dmg(s,role,st){ let k=0; s.structure=1e7; for(const c of s.comps.filter(c=>c.role===role)){ let n=0;
      while(g.compState(c)<st && n++<4000 && s.alive){ s.shield.fore=s.shield.aft=0; const lp=new V(c.pos[0],c.pos[1],c.pos[2]), wp=s.group.localToWorld(lp.clone());
        g.hitSrc=null; g.applyHit(s,lp,1.0,wp,'kin',EXP.includes(role)?0:1.0); } k+=n; }
    return s.comps.filter(c=>c.role===role).map(c=>g.compState(c)); },
  steady(s,ab,n){ s.vel.set(0,0,0); s.abFuel=s.def.abMax; s.abLock=false; for(let i=0;i<(n||100);i++) g.flightModels.arcade(s,{throttle:1,ab:ab},0.05); return s.vel.length(); },
  lockTime(s,e,d){ const f=new V(0,0,-1).applyQuaternion(s.group.quaternion); e.group.position.copy(s.group.position).addScaledVector(f,d); e.vel.set(0,0,0); s.target=e; s.sel=0; s.lock.p=0; s.lock.tgt=null;
    for(let i=0;i<400;i++){ g.lockUpdate(s,0.05); if(s.lock.state==='locked') return (i+1)*0.05; } return s.lock.state; },
  lockState(s,e,d){ const f=new V(0,0,-1).applyQuaternion(s.group.quaternion); e.group.position.copy(s.group.position).addScaledVector(f,d); s.target=e; s.sel=0; s.lock.p=0; s.lock.tgt=null; g.lockUpdate(s,0.05); return s.lock.state; },
  regen(s,secs){ s.energy=0; const n=Math.round(secs/0.05); for(let i=0;i<n;i++) g.update(0.05); return s.energy; },
  kill(s){ s.alive=false; g.update(0.01); },
};
}"""

def fresh(pg):
    pg.evaluate("()=>{__game.ships.filter(s=>s!==__game.player).forEach(s=>s.alive=false);__game.update(0.01)}")

with Runner() as R:
    pg = R.page(1280, 720, '?free&go&seed=7&q=low'); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{__paused=true}")
    pg.evaluate(HELPERS)
    pg.evaluate("()=>H.prep()")
    print('player', pg.evaluate("()=>__game.player.def.id"))

    # ---------------- engines: speed, turn (existing, continuous), afterburner pool / boost (new) ----------------
    res = {}
    for st in (0, 1, 2):
        r = pg.evaluate("""(st)=>{ const s=H.mk('kestrel',0,0,-4000); if(st) H.dmg(s,'engine',st);
          const v=H.steady(s,false), vab=H.steady(s,true); return {v, boost:vab/v, pool:__game.abMaxOf(s), tm:__game.turnMul(s), sm:__game.speedMul(s), mean:__game.subMean(s,'engine')}; }""", st)
        res[st] = r; print(' engine', st, r)
    check('engine st1: top speed drops noticeably but is not crippled', near(res[1]['v'] / res[0]['v'], 0.5, 0.85), res[1]['v'] / res[0]['v'])
    check('engine st2: top speed 20-45% of healthy', near(res[2]['v'] / res[0]['v'], 0.2, 0.45), res[2]['v'] / res[0]['v'])
    check('engine st1/st2: turn multiplier falls (0.6-0.85 / 0.4-0.55)', near(res[1]['tm'] / res[0]['tm'], 0.6, 0.85) and near(res[2]['tm'] / res[0]['tm'], 0.4, 0.55), (res[1]['tm'], res[2]['tm']))
    check('afterburner boost ratio shrinks with engine damage (1.8 -> 1.6 -> 1.3)', res[0]['boost'] > res[1]['boost'] > res[2]['boost'] > 1.0 and near(res[1]['boost'], 1.5, 1.7) and near(res[2]['boost'], 1.2, 1.45), [res[k]['boost'] for k in res])
    check('afterburner pool shrinks (x0.7 / x0.35)', near(res[1]['pool'] / res[0]['pool'], 0.65, 0.75) and near(res[2]['pool'] / res[0]['pool'], 0.3, 0.4), [res[k]['pool'] for k in res])
    # real player controls: yaw rate under full stick, healthy vs damaged (updatePlayer)
    yaw = []
    for st in (0, 1, 2):
        if st: pg.evaluate("(st)=>{const g=__game; H.dmg(g.player,'engine',st); g.player.structure=1e7}", st)
        a = pg.evaluate("""()=>{const g=__game,p=g.player; p.shield.fore=p.shield.aft=1e5; const q0=p.group.quaternion.clone(); g.stick.x=-1; g.stick.y=0;
          for(let i=0;i<20;i++) g.update(0.05); g.stick.x=0; return q0.angleTo(p.group.quaternion); }""")
        yaw.append(a)
    print(' player yaw angle over 1 s', yaw)
    check('player turn rate under full stick falls with engine grade', yaw[0] > yaw[1] > yaw[2] and near(yaw[1] / yaw[0], 0.6, 0.85) and near(yaw[2] / yaw[0], 0.38, 0.58), yaw)

    # ---------------- radar: lock range and lock time (shared lockUpdate, so AI too) ----------------
    pg.evaluate("()=>H.prep()")
    lt = {}
    for st in (0, 1, 2):
        lt[st] = pg.evaluate("""(st)=>{ const s=H.mk('kestrel',0,0,-4000), e=H.mk('darter',1,3000,-4000); if(st) H.dmg(s,'radar',st);
          const R=__game.WEAPONS.ir.range;
          return {t:H.lockTime(s,e,0.3*R), mid:H.lockState(s,e,0.5*R), far:H.lockState(s,e,0.8*R), eff:__game.subEff(s,'radar','lockRange'), d:__game.subDegraded(s).map(x=>x.role)}; }""", st)
        print(' radar', st, lt[st])
    check('radar healthy: locks at 30% / 50% / 80% of missile range', isinstance(lt[0]['t'], float) and lt[0]['mid'] == 'locking' and lt[0]['far'] == 'locking', lt[0])
    check('radar st1: lock time x1.4-1.6, 80% range no longer locks, 50% still does', isinstance(lt[1]['t'], float) and near(lt[1]['t'] / lt[0]['t'], 1.35, 1.65) and lt[1]['mid'] == 'locking' and lt[1]['far'] == 'range', lt[1])
    check('radar st2: IR lock still possible but slow (x2.2-3.0) and short (50% range fails)', isinstance(lt[2]['t'], float) and near(lt[2]['t'] / lt[0]['t'], 2.2, 3.0) and lt[2]['mid'] == 'range', lt[2])
    rf = pg.evaluate("""()=>{ const s=H.mk('kestrel',0,0,-4000), e=H.mk('darter',1,3000,-4000); s.sel=1; H.dmg(s,'radar',2); const f=new __game.THREE.Vector3(0,0,-1);
        e.group.position.copy(s.group.position).addScaledVector(f,500); s.target=e; s.lock.p=0; s.lock.tgt=null; s.sel=__game.WEAPONS.rf?1:0; __game.lockUpdate(s,0.05); return {sel:__game.selectedMissile(s), st:s.lock.state}; }""")
    check('radar st2: radar-guided (RF) missile cannot lock at all (physical)', rf['sel'] == 'rf' and rf['st'] in ('seek', 'range'), rf)
    sens = pg.evaluate("""()=>{ const s=H.mk('kestrel',0,0,-4000); const a=__game.sensorLimit(s); H.dmg(s,'radar',1); const b=__game.sensorLimit(s); return [a,b]; }""")
    check('radar st1: scope shows contacts only to 60% of 6 km', sens[0] == None or sens[0] > 1e8, sens)
    check('radar st1 scope limit 3600 m', abs(sens[1] - 3600) < 1, sens)

    # ---------------- power plant: energy capacity and recharge (+ reactor loss = ship loss) ----------------
    pw = {}
    for st in (0, 1):
        pw[st] = pg.evaluate("""(st)=>{ const s=H.mk('kestrel',0,0,-4000); if(st) H.dmg(s,'power',st); const rg=H.regen(s,2); s.energy=1e9; __game.update(0.05); return {rg, cap:s.energy, mx:s.energyMax, pm:__game.powerMul(s)}; }""", st)
        print(' power', st, pw[st])
    check('power st1: capacitor capacity x0.8', near(pw[1]['cap'] / pw[1]['mx'], 0.79, 0.81) and abs(pw[0]['cap'] - pw[0]['mx']) < 1e-6, pw)
    check('power st1: energy recharge drops (0.5-0.8 of healthy)', near(pw[1]['rg'] / pw[0]['rg'], 0.5, 0.82), pw[1]['rg'] / pw[0]['rg'])
    dead = pg.evaluate("""()=>{ const s=H.mk('kestrel',0,0,-4000); H.dmg(s,'power',2); __game.update(0.05); return {alive:s.alive, dying:s.dying}; }""")
    check('power st2: a destroyed reactor loses the ship', (not dead['alive']) or dead['dying'] > 0, dead)

    # ---------------- guns: rate of fire per mount (existing: destroyed gates the mount) ----------------
    gn = {}
    for st in (0, 1, 2):
        gn[st] = pg.evaluate("""(st)=>{ H.prep(); const s=H.mk('kestrel',0,0,-4000); s.ai.hold=false; const c=__game.compOf(s,'gunL'); const m=s.mounts.find(m=>m.comp==='gunL'); s.mounts.forEach(x=>x.cool=0);
          if(st){ let n=0; while(__game.compState(c)<st&&n++<500){ s.shield.fore=s.shield.aft=0; s.structure=1e7; const lp=new __game.THREE.Vector3(...c.pos); __game.hitSrc=null; __game.applyHit(s,lp,1,s.group.localToWorld(lp.clone()),'kin',0);} }
          const r=__game.fireGuns(s,1); return {n:r.n, cool:m.cool, w:__game.WEAPONS[m.w].cd, state:__game.compState(c)}; }""", st)
        print(' gun', st, gn[st])
    check('gun st1: mount cooldown x1.35', near(gn[1]['cool'] / gn[0]['cool'], 1.3, 1.4) and gn[1]['state'] == 1, gn)
    check('gun st2: the destroyed mount does not fire (cooldown untouched)', gn[2]['cool'] <= 0 and gn[2]['state'] == 2, gn[2])

    # ---------------- shield generator (existing, graded by hp): cap follows component health ----------------
    sh = pg.evaluate("""()=>{ const s=H.mk('kestrel',0,0,-4000); const f0=s.def.shield.fore; H.dmg(s,'shield',1); __game.update(0.05); const a=s.shield.fore/f0; H.dmg(s,'shield',2); __game.update(0.05); return [a, s.shield.fore]; }""")
    check('shield st1 caps shields at <= 50%, st2 -> 0', sh[0] <= 0.5 and sh[1] == 0, sh)

    # ---------------- turrets: fire rate and slew rate per turret ----------------
    tur = {}
    for st in (0, 1, 2):
        tur[st] = pg.evaluate("""(st)=>{ const g=__game, V=g.THREE.Vector3; H.prep(); const q=H.mk('bittern',0,0,-4000), e=H.mk('darter',1,3000,-4000); e.ai.hold=true;
          const T=q.turrets[0]; const side=T.def.side;
          if(st){ const c=g.compOf(q,T.comp); let n=0; while(g.compState(c)<st&&n++<500){ q.shield.fore=q.shield.aft=0; q.structure=1e7; const lp=new V(...c.pos); g.hitSrc=null; g.applyHit(q,lp,1,q.group.localToWorld(lp.clone()),'kin',0);} }
          const q0=q.group.quaternion.clone(), p0=q.group.position.clone(); const place=()=>{ q.group.quaternion.copy(q0); q.group.position.copy(p0); q.group.updateMatrixWorld(true); e.group.position.copy(q.group.localToWorld(new V(0,side*250,0))); e.vel.set(0,0,0); q.vel.set(0,0,0); };
          let fired=-1, cool=null, delta=null;
          for(let i=0;i<60 && !T.tgt;i++){ place(); g.update(0.05); }
          if(T.tgt && !T.dead){ T.head.quaternion.identity(); const b=T.head.quaternion.clone(); place(); g.update(0.05); delta=b.angleTo(T.head.quaternion); }
          const f0=T.fired;
          for(let i=0;i<200 && T.fired===f0;i++){ place(); g.update(0.05); }
          if(T.fired>f0) cool=T.cool;
          return {err:T.lastErr, ammo:T.ammo, dry:T.dry, hastgt:!!T.tgt, dist:e.group.position.distanceTo(T.head.getWorldPosition(new V())), state:g.compState(g.compOf(q,T.comp)), dead:T.dead, track:T.w.track, delta, cool, cd:T.w.cd, pm:g.powerMul(q), beam:T.w.kind==='beam', kind:T.w.kind}; }""", st)
        print(' turret', st, tur[st])
    check('turret st1: fire rate x0.71 (cooldown x1.4)', tur[0]['cool'] and tur[1]['cool'] and near(tur[1]['cool'] / tur[0]['cool'], 1.3, 1.5), (tur[0]['cool'], tur[1]['cool']))
    check('turret st1: slew rate x0.6', tur[0]['delta'] and tur[1]['delta'] and near(tur[1]['delta'] / tur[0]['delta'], 0.55, 0.65), (tur[0]['delta'], tur[1]['delta']))
    check('turret st2: dead turret (no tracking, no fire)', tur[2]['dead'] and tur[2]['cool'] is None, tur[2])

    # ---------------- radiator (Exeter): capacitor refill ----------------
    rd = {}
    for st in (0, 1):
        rd[st] = pg.evaluate("""(st)=>{ const s=H.mk('exeter',0,0,-6000); if(st) H.dmg(s,'radiator',st); const v=H.regen(s,0.5); const d=__game.subDegraded(s).map(x=>x.role); H.kill(s); return {v,d}; }""", st)
    print(' radiator', rd)
    check('radiator st1: capacitor refill x0.85', near(rd[1]['v'] / rd[0]['v'], 0.8, 0.9) and 'radiator' in rd[1]['d'], rd)
    dk = pg.evaluate("""()=>{ const s=H.mk('exeter',0,0,-6000); const v0=__game.speedMul(s); H.dmg(s,'dock',2); const r={dmg:__game.subDegraded(s).map(x=>x.role), sp:__game.speedMul(s)/v0}; H.kill(s); return r; }""")
    check('dock role: documented as no effect (no docking exists on those hulls)', 'dock' not in dk['dmg'] and abs(dk['sp'] - 1) < 1e-9, dk)

    # ---------------- bay (Tender): rearm rate and docking clearance ----------------
    pg.evaluate("()=>H.prep()")
    bay = {}
    for st in (0, 1, 2):
        bay[st] = pg.evaluate("""(st)=>{ const g=__game, p=g.player; const t=g.spawnShip('tender',0,p.group.position.clone().add(new g.THREE.Vector3(0,0,-200)),null,{}); t.ai.hold=true;
          if(st) H.dmg(t,'bay',st);
          const r=H.mk('kestrel',0,0,0); r.group.position.copy(p.group.position).add(new g.THREE.Vector3(30,0,-200)); r.stores.ir=0; g.tenderTick(1); const got=r.stores.ir;
          g.state='play'; g.dockTry(); const docked=!!g.dock; if(g.dock) g.dock=null;
          H.kill(r); H.kill(t); return {got, docked}; }""", st)
        print(' bay', st, bay[st])
    check('bay st0: rearm (hovering trickle 0.25 missiles/s) and docking clearance', abs(bay[0]['got'] - 0.25) < 1e-6 and bay[0]['docked'], bay[0])
    check('bay st1: rearm halves, docking still granted', near(bay[1]['got'] / bay[0]['got'], 0.45, 0.55) and bay[1]['docked'], bay[1])
    check('bay st2: no rearm, docking refused', bay[2]['got'] == 0 and not bay[2]['docked'], bay[2])

    # ---------------- HUD cues (desktop) ----------------
    pg2 = R.page(1280, 720, '?free&go&seed=7&q=low'); pg2.wait_for_timeout(1500)
    pg2.evaluate("()=>{__paused=true}"); pg2.evaluate(HELPERS); pg2.evaluate("()=>{H.prep(); const p=__game.player; p.shield.fore=p.shield.aft=1e5; H.dmg(p,'radar',1); H.dmg(p,'engine',1); __game.update(0.05); __game.updateHud(); __game.updateHud()}")
    txt = pg2.evaluate("()=>document.getElementById('subsys').innerText")
    lg = pg2.evaluate("()=>document.getElementById('log').innerText")
    print(' desktop cue:', repr(txt), '| log:', repr(lg))
    check('desktop cue lists RADAR and ENGINES with effects', 'RDR' in txt and 'LOCK RANGE 65%' in txt and 'ENG' in txt and 'SPEED' in txt, txt)
    check('log flash names the effect (RADAR DAMAGED - LOCK RANGE 65%)', 'LOCK RANGE 65%' in lg, lg)
    pg2.screenshot(path='/tmp/gs_shots/subsys_desktop.png')

    # ---------------- HUD cues (phone 844x390 touch) ----------------
    pg3 = R.page(844, 390, '?free&go&touch&seed=7&q=low', touch=True); pg3.wait_for_timeout(1500)
    pg3.evaluate("()=>{__paused=true}"); pg3.evaluate(HELPERS)
    pg3.evaluate("()=>{H.prep(); const p=__game.player; p.shield.fore=p.shield.aft=1e5; H.dmg(p,'radar',1); H.dmg(p,'engine',2); __game.update(0.05); __game.updateHud(); __game.updateHud()}")
    ph = pg3.evaluate("""()=>{ const e=document.getElementById('subsys'), r=e.getBoundingClientRect(), d=document.getElementById('dmg').getBoundingClientRect();
        return {txt:e.innerText, phone:document.body.classList.contains('phone'), r:[r.left,r.top,r.right,r.bottom], d:[d.left,d.top,d.right,d.bottom], iw:innerWidth, ih:innerHeight, sw:document.documentElement.scrollWidth}; }""")
    print(' phone cue:', ph)
    check('phone cue is one compact tag line inside the viewport, below the damage map, no horizontal scroll', ph['phone'] and 'RDR' in ph['txt'] and 'ENG' in ph['txt'] and ph['r'][2] <= ph['iw'] and ph['r'][3] <= ph['ih'] and ph['r'][1] >= ph['d'][3] - 1 and ph['sw'] <= ph['iw'], ph)
    pg3.screenshot(path='/tmp/gs_shots/subsys_phone.png')

    assert_no_console_errors(R)
    print('no console errors')
print('ALL PASS' if ok else 'SOME FAILED')
raise SystemExit(0 if ok else 1)
