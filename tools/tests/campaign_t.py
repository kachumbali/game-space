"""Campaign missions 3-5 (docs/CAMPAIGN.md): scripted win paths, lose paths, hold countdown, no console errors.

Default mode runs the scripted checks (spawn groups are killed through the mission's own stages).
`python3 campaign_t.py bot` additionally flies mission 5 with an AI-controlled player across seeds
and reports per-seed results (the m05 fight is untested ground: bullfrog/hivecarrier/exeter).
"""
from lib import *
import re
import sys

MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'
fails = []
def check(n, ok, i=''):
    print(('PASS ' if ok else 'FAIL ') + n, i, flush=True)
    if not ok: fails.append(n)

STEP = "n=>{for(let i=0;i<n;i++)__game.update(0.05)}"
INFO = """()=>{const S=__game.game.mstate;return {t:+S.t.toFixed(1),stage:S.stage,state:__game.state,ended:S.ended,result:S.result,why:S.why,
 area:S.area,prompt:(document.getElementById('jumpPrompt')||{style:{}}).style.display,
 objs:__game.objectives.map(o=>o.state.toUpperCase()[0]+' '+o.text).join('\\n'),
 alive:__game.ships.filter(s=>s.alive&&s.team===1).map(s=>(s.grp||'')+':'+s.def.id).join(',')}}"""
KILL = "(g)=>{__game.ships.filter(s=>s.grp===g&&s.alive).forEach(s=>__game.destroy(s))}"
ALIVE = "(g)=>__game.ships.some(s=>s.grp===g&&s.alive)"

def newpage(R, q):
    for c in list(R.b.contexts): c.close()      # one heavy page at a time: old renderers starve the next load
    pg = R.page(640, 360, q); pg.wait_for_timeout(800)
    pg.evaluate("()=>{__paused=true}")
    return pg
def step(pg, n): pg.evaluate(STEP, n)
def info(pg): return pg.evaluate(INFO)
def objs(pg):                                  # live objective data (HUD text is drawn one rAF later)
    return pg.evaluate("()=>__game.objectives.map(o=>o.state.toUpperCase()[0]+' '+o.text).join('\\n')")
def kill(pg, g): pg.evaluate(KILL, g)
def alive(pg, g): return pg.evaluate(ALIVE, g)
def brief_txt(pg): return pg.evaluate("()=>document.getElementById('brief').innerText")
def skip_transit(pg):                      # cine: skip after 1.2 s, then let the arrival run
    step(pg, 30); pg.keyboard.press('Space'); step(pg, 10)
def wait_group(pg, g, secs=120):
    for _ in range(int(secs / 5)):
        if alive(pg, g): return True
        step(pg, 100)
    return alive(pg, g)
def wait_end(pg, secs=120):
    for _ in range(int(secs / 5)):
        i = info(pg)
        if i['ended']: break
        step(pg, 100)
    return info(pg)

# ---- mission 3: THE SEVERED NODE (two areas, 240 s hold, X-gated transit) ------------------------------
def m3_win(R):
    pg = newpage(R, '?go&m=3&nobloom')
    check('m3 player flies kestrel', pg.evaluate("()=>__game.player.def.id") == 'kestrel')
    step(pg, 100); skip_transit(pg)                      # first transit (stage 0) is automatic
    i = info(pg); check('m3 arrived at ao2', i['state'] == 'play' and i['area'] == 'ao2', str(i))
    check('m3 group A spawned', wait_group(pg, 'A'))
    kill(pg, 'A'); step(pg, 100)
    o1 = objs(pg)
    m = re.search(r'Hold the relay[^\n]*?· *(\d+):(\d\d)', o1)
    rem1 = int(m.group(1)) * 60 + int(m.group(2)) if m else -1
    check('m3 hold objective open with countdown', bool(m) and 200 <= rem1 <= 240, o1.replace('\n', ' | '))
    step(pg, 100)
    o2 = objs(pg)
    m2 = re.search(r'Hold the relay[^\n]*?· *(\d+):(\d\d)', o2)
    rem2 = int(m2.group(1)) * 60 + int(m2.group(2)) if m2 else -1
    check('m3 countdown runs down', 0 <= rem2 < rem1, o2.replace('\n', ' | '))
    for k in range(48):                                  # 240 s hold; B at +60, C at +150
        step(pg, 100)
        if alive(pg, 'B'): kill(pg, 'B')
        if alive(pg, 'C'): kill(pg, 'C')
        if info(pg)['ended']: break
    for k in range(4):                                   # stage fires at hold+240 (float margin)
        if info(pg)['prompt'] == 'block': break
        step(pg, 20)
    i = info(pg)
    check('m3 hold done, X prompt shown', i['prompt'] == 'block' and 'Hold the relay' in objs(pg), str(i)[:160])
    s0 = i['stage']; step(pg, 60)
    check('m3 does not auto-jump', info(pg)['stage'] == s0 and info(pg)['prompt'] == 'block')
    pg.keyboard.press('KeyX'); step(pg, 5)
    skip_transit(pg)
    i = info(pg); check('m3 arrived at ao3', i['state'] == 'play' and i['area'] == 'ao3', str(i))
    check('m3 group D spawned', wait_group(pg, 'D'))
    kill(pg, 'D')
    i = wait_end(pg)
    check('m3 ends in win', i['ended'] and i['result'] == 'win', str(i)[:160])
    step(pg, 100)
    t = brief_txt(pg)
    check('m3 debrief shows CAMPAIGN win text', 'MISSION ACCOMPLISHED' in t and 'Logs recovered' in t, t[:80])
    check('m3 no console errors', not R.errs, str(R.errs[:3]))

# ---- mission 4: SHORT LEASH (merlin, exeter anchor, 360 s defence, win on timer) ------------------------
def m4_win(R):
    pg = newpage(R, '?go&m=4&nobloom')
    check('m4 player flies merlin', pg.evaluate("()=>__game.player.def.id") == 'merlin')
    check('m4 anchor is the exeter', pg.evaluate("()=>__game.game.anchor.def.id") == 'exeter')
    step(pg, 200)                                        # o1 at t=4, wave A at t=8
    o1 = objs(pg)
    m = re.search(r'Defend the Exeter[^\n]*?· *(\d+):(\d\d)', o1)
    rem = int(m.group(1)) * 60 + int(m.group(2)) if m else -1
    check('m4 defence objective open with countdown', bool(m) and 330 <= rem <= 360, o1.replace('\n', ' | '))
    check('m4 wave A spawned', alive(pg, 'A')); kill(pg, 'A')
    for k in range(80):                                  # B at t=120, C at t=260, win at t=364
        step(pg, 100)
        if alive(pg, 'B'): kill(pg, 'B')
        if alive(pg, 'C'): kill(pg, 'C')
        if info(pg)['ended']: break
    i = wait_end(pg)
    check('m4 ends in win on timer', i['ended'] and i['result'] == 'win' and i['t'] >= 363, str(i)[:160])
    step(pg, 100)
    t = brief_txt(pg)
    check('m4 debrief shows CAMPAIGN win text + exeter hull line', 'MISSION ACCOMPLISHED' in t and 'Exeter cleared the Fold' in t and 'EXETER HULL' in t.upper(), t[:100])
    pg.evaluate("()=>__game.startMission(__game.MISSIONS[3])")     # briefing screen: per-ship loadout
    t = brief_txt(pg)
    check('m4 briefing loadout names MERLIN', 'LOADOUT · MERLIN' in t and '12× flares/chaff' in t, t[:120])
    check('m4 no console errors', not R.errs, str(R.errs[:3]))

# ---- mission 5: THE SPINE (bullfrog + hivecarrier never flown from a mission script before) -------------
def m5_win(R):
    pg = newpage(R, '?go&m=5&nobloom')
    check('m5 anchor is the exeter', pg.evaluate("()=>__game.game.anchor.def.id") == 'exeter')
    step(pg, 100); skip_transit(pg)
    i = info(pg); check('m5 arrived at ao3 lane', i['state'] == 'play' and i['area'] == 'ao3', str(i))
    check('m5 group A (incl gulper) spawned', wait_group(pg, 'A'))
    kill(pg, 'A'); step(pg, 200)                         # dead A + delay 4 -> X prompt
    i = info(pg); check('m5 X prompt after lane clear', i['prompt'] == 'block', str(i)[:120])
    pg.keyboard.press('KeyX'); step(pg, 5)
    skip_transit(pg)
    i = info(pg); check('m5 arrived at oasis anchorage', i['state'] == 'play' and i['area'] == 'oasis', str(i))
    check('m5 hangar launch B1 spawned', wait_group(pg, 'B1')); kill(pg, 'B1')
    for k in range(20):                                  # B2 launches 60 s after B1
        step(pg, 100)
        if alive(pg, 'B2'): break
    check('m5 hangar launch B2 spawned', alive(pg, 'B2')); kill(pg, 'B2'); step(pg, 100)
    check('m5 bullfrog group C spawned (jump-in)', wait_group(pg, 'C', 30))
    check('m5 bullfrog present', pg.evaluate("()=>__game.ships.some(s=>s.alive&&s.def.id==='bullfrog')"))
    kill(pg, 'C'); step(pg, 100)
    check('m5 hivecarrier epilogue spawned at range', pg.evaluate("()=>__game.ships.some(s=>s.def.id==='hivecarrier'&&s.grp==='D')"))
    i = wait_end(pg)
    check('m5 ends in win', i['ended'] and i['result'] == 'win', str(i)[:160])
    step(pg, 100)
    t = brief_txt(pg)
    check('m5 debrief shows CAMPAIGN win text', 'MISSION ACCOMPLISHED' in t and 'The spine is broken' in t, t[:80])
    check('m5 no console errors', not R.errs, str(R.errs[:3]))

# ---- lose paths: anchor destroyed / ECHO down -----------------------------------------------------------
def lose(R, m, anchor_name, snippet, has_transit):
    pg = newpage(R, f'?go&m={m}&nobloom')
    if has_transit: step(pg, 100); skip_transit(pg)
    else: step(pg, 60)
    pg.evaluate("()=>__game.destroy(__game.game.anchor)")
    i = wait_end(pg, 30)
    check(f'm{m} anchor loss -> lose', i['ended'] and i['result'] == 'lose' and i['why'] == f'THE {anchor_name} WAS DESTROYED', str(i)[:160])
    step(pg, 100)
    t = brief_txt(pg)
    check(f'm{m} lose debrief text + anchor hull name', 'MISSION FAILED' in t and snippet in t and anchor_name in t.upper(), t[:100])
    check(f'm{m} anchor-loss run no console errors', not R.errs, str(R.errs[:3]))
    pg = newpage(R, f'?go&m={m}&nobloom')
    if has_transit: step(pg, 100); skip_transit(pg)
    else: step(pg, 60)
    pg.evaluate("()=>__game.destroy(__game.player)")
    i = wait_end(pg, 30)
    check(f'm{m} player loss -> lose', i['ended'] and i['result'] == 'lose' and i['why'] == 'ECHO DOWN', str(i)[:160])
    step(pg, 100)
    t = brief_txt(pg)
    check(f'm{m} player-loss debrief text', 'MISSION FAILED' in t and snippet in t, t[:80])
    check(f'm{m} player-loss run no console errors', not R.errs, str(R.errs[:3]))

# ---- m05 with an AI-controlled player (untested ground: at least one seed must be winnable) --------------
BOT = """(n)=>{const g=__game,T=g.THREE;const out=[];
 for(let i=0;i<n;i++){
  const P=g.player;
  if(P&&P.alive&&g.state==='play'){
    let best=null,bd=1e15;
    for(const s of g.ships){ if(s.team!==1||!s.alive||s.dying||s.def.cls!=='fighter') continue;
      const d=s.group.position.distanceToSquared(P.group.position); if(d<bd){bd=d;best=s;} }
    if(!best){ bd=1e15; for(const s of g.ships){ if(s.team!==1||!s.alive||s.dying) continue;
      const d=s.group.position.distanceToSquared(P.group.position); if(d<bd){bd=d;best=s;} } }
    g.target=best;
    if(P.evT===undefined) P.evT=0;
    if(!P.evT&&(P.shield.fore<10||P.shield.aft<6)&&Math.random()<0.05) P.evT=50;   // ~2.5 s break-off
    if(P.evT>0){ P.evT--; P.throttle=1;
      const e=new T.Vector3(Math.sin(i*0.9),Math.cos(i*0.6),Math.sin(i*0.37)).normalize();
      const m=new T.Matrix4().lookAt(P.group.position,P.group.position.clone().add(e),new T.Vector3(0,1,0));
      P.group.quaternion.rotateTowards(new T.Quaternion().setFromRotationMatrix(m),2.4*0.05);
    } else if(best){
      const t=best, d=t.group.position.distanceTo(P.group.position);
      const standoff=t.def.cls==='fighter'?340:1200;
      const ap=t.group.position.clone().addScaledVector(t.vel.clone().sub(P.vel.clone().multiplyScalar(0.9)),d/900);
      const toT=ap.clone().sub(P.group.position); const dist=toT.length(); toT.normalize();
      const dir=dist<standoff*0.75?toT.clone().multiplyScalar(-1):toT;
      const m=new T.Matrix4().lookAt(P.group.position,P.group.position.clone().add(dir),new T.Vector3(0,1,0));
      P.group.quaternion.rotateTowards(new T.Quaternion().setFromRotationMatrix(m),2.0*0.05);
      P.throttle=dist<standoff?0.55:0.95;
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const err=f.angleTo(ap.clone().sub(P.group.position).normalize());
      if(err<0.06&&dist<(t.def.cls==='fighter'?650:1900)) g.fireGuns(P,3);
      if(P.lock.state==='locked'&&P.stores[g.selectedMissile(P)]>0&&d>500&&Math.random()<0.03) g.launchMissile(P,g.selectedMissile(P));
    }
    if(g.warnState.incoming.length){const m=g.warnState.incoming[0]; if(m.pos.distanceTo(P.group.position)<450) g.deployCM(P);}
  }
  g.update(0.05);
  if(i%200===199){const S=g.game.mstate,P2=g.player;out.push({i,t:S.t.toFixed(0),stage:S.stage,state:g.state,res:S.result,
    pstr:P2&&P2.alive?Math.round(P2.structure):0,shd:P2&&P2.alive?[Math.round(P2.shield.fore),Math.round(P2.shield.aft)]:0,
    hostiles:g.ships.filter(s=>s.team===1&&s.alive).length,wing:g.ships.filter(s=>s.team===0&&s.pilot&&s.alive).length,
    bf:g.ships.some(s=>s.alive&&s.def.id==='bullfrog'),anchorPct:Math.round(100*g.game.anchor.structure/g.game.anchor.def.structure)});}
 }
 return out}"""
def m5_bot(R):
    seeds = [int(s) for s in (sys.argv[2:] or [1, 2, 3])]
    wins = 0
    for sd in seeds:
        R.errs.clear()
        pg = newpage(R, f'?go&m=5&seed={sd}&nobloom')
        step(pg, 100); skip_transit(pg)
        ran, maxs = 0, 24000          # up to 1200 s of sim
        trace = []
        while ran < maxs:
            chunk = pg.evaluate(BOT, 200); ran += 200
            trace = chunk[-3:]
            i = info(pg)
            if i['prompt'] == 'block': pg.keyboard.press('KeyX'); step(pg, 5); skip_transit(pg)
            elif i['state'] == 'cine': skip_transit(pg)
            if i['ended']: break
        i = info(pg)
        won = i['ended'] and i['result'] == 'win'
        wins += won
        print(f'm5 bot seed {sd}: {"WIN" if won else "LOSE"} t={i["t"]} why={i["why"]!r} anchor={trace[-1]["anchorPct"] if trace else "?"}% player={trace[-1]["pstr"] if trace else "?"}', flush=True)
        print('   tail:', trace, flush=True)
        check(f'm5 bot seed {sd} no console errors (>= 120 s run or ended)', not R.errs and (i['t'] >= 120 or i['ended']), f't={i["t"]} errs={R.errs[:3]}')
    check('m5 winnable by AI player in at least one seed', wins >= 1, f'{wins}/{len(seeds)} wins')

if MODE == 'bot':
    with Runner() as R:
        m5_bot(R)
else:
    with Runner() as R:
        if MODE in ('all', 'win'):
            m3_win(R); m4_win(R); m5_win(R)
        if MODE in ('all', 'lose'):
            lose(R, 3, 'HALBERD', 'Relay lost, logs lost.', True)
            lose(R, 4, 'EXETER', 'The Exeter is gone.', False)
            lose(R, 5, 'EXETER', 'Eagle flight is not coming home.', True)
print('FAILED:', fails or 'none')
