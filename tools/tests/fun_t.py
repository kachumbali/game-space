# v0.2 fun update tests. Usage: python3 fun_t.py [feel|shot|loot|survival|missions ...]; screenshots in /tmp/gs_shots (git-ignored).
from lib import *
import sys, os
which = sys.argv[1:] or ['feel', 'shot']
os.makedirs('/tmp/gs_shots', exist_ok=True)

def feel(R):
    pg = R.page(1280, 720, '?free&go&q=low'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player,J=g.juice;__paused=true;
      g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const mk=(id,d)=>{const e=g.spawnShip(id,1,P.group.position.clone().addScaledVector(f,d),null,{skill:1});e.vel.set(0,0,0);e.ai.hold=true;return e};
      const out={};
      const a=mk('darter',300);                                   // 1. our hit on an enemy: a marker
      g.hitSrc=P;g.hitKind='gun';g.applyHit(a,new T.Vector3(0,0,-2),2,a.group.position.clone(),'kin');
      out.marks=J.marks.map(m=>m.kind);
      const b=mk('leaper',400);b.group.position.copy(P.group.position).addScaledVector(new T.Vector3(1,0,0).applyQuaternion(P.group.quaternion),300);
      g.hitSrc=b;g.hitKind='gun';g.applyHit(P,new T.Vector3(1,0,0),5,P.group.position.clone(),'kin');   // 2. we get hit from the right: an arc
      out.arcs=J.arcs.map(x=>+x.ang.toFixed(2));
      const kill=(e,kind)=>{e.lastAttacker=P;e.lastKind=kind||'gun';g.killShip(e)};                      // 3. kills: chain, score, banners, hit-stop
      const c=[mk('darter',200),mk('leaper',220),mk('spitter',240)];
      kill(c[0]);kill(c[1],'missile');kill(c[2]);
      out.chain=J.chain;out.mult=J.mult;out.kills=J.kills;out.score=J.score;out.bonus=J.bonus;out.missileKills=J.missileKills;
      out.banners=J.banners.map(x=>x.text+' | '+x.sub);out.hitStop=+J.hitStop.toFixed(2);
      out.medals=g.juiceMedals(50,60,J.kills).map(m=>m[0]);
      for(let i=0;i<150;i++)g.update(0.05);                       // 4. the chain expires
      out.chainAfter=J.chain;
      return out}""")
    for k, v in r.items(): print(' ', k, v)
    ok = ({'hull', 'shield', 'armor'} & set(r['marks'])) and len(r['arcs']) == 1 and abs(r['arcs'][0]) < 0.6 and r['chain'] == 3 and r['kills'] == 3 \
        and r['mult'] == 2 and r['score'] > 300 and r['hitStop'] > 0 and r['chainAfter'] == 0 and r['missileKills'] == 1
    print('FEEL', 'OK' if ok else 'FAIL', 'errs', R.errs[:3]); pg.close()
    return bool(ok)

def shot(R):
    for w, h, tag, q in ((1280, 720, 'desk', '?free&go&q=mid'), (844, 390, 'phone', '?free&go&touch&q=low')):
        pg = R.page(w, h, q, touch=(tag == 'phone')); pg.wait_for_timeout(1500)
        pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player,J=g.juice;__paused=true;g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);
          const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
          const e=g.spawnShip('darter',1,P.group.position.clone().addScaledVector(f,260),null,{});e.vel.set(0,0,0);e.ai.hold=true;
          g.update(0.05);const t=g.time;
          J.chain=4;J.mult=2.5;J.chainT=t+4;
          J.arcs.push({t:t,ang:-0.2,out:'hull',big:1},{t:t,ang:2.6,out:'shield',big:0.5});
          J.marks.push({t:t,kind:'sub'});
          J.banners.push({t:t,text:'+450  FROGG DARTER',sub:'QUAD KILL · MISSILE · POINT BLANK',col:'#c8fff0',big:false},{t:t,text:'ENGINE L DESTROYED',sub:'+40',col:'#ffb060',big:false});
          g.updateHud();}""")
        pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/gs_shots/fun_feel_{tag}.png'); pg.close()
    return True

def loot(R):
    pg = R.page(1280, 720, '?free&go&q=low'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE,P=g.player,J=g.juice;__paused=true;
      g.ships.filter(s=>s!==P).forEach(s=>s.alive=false);const out={};
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const mk=(id,d)=>{const e=g.spawnShip(id,1,P.group.position.clone().addScaledVector(f,d),null,{skill:1});e.vel.set(0,0,0);e.ai.hold=true;return e};
      // 1. drops: the pity timer forces one within 5 fighter kills
      g.lootState.dry=0;let kills=0;
      while(g.lootPods.length===0&&kills<8){const e=mk('darter',400);e.lastAttacker=P;g.killShip(e);kills++}
      out.killsToDrop=kills;out.pods=g.lootPods.length;out.type=g.lootPods[0]&&g.lootPods[0].type;
      // 2. magnet: a pod 100 m away moves closer without us moving
      g.lootPods.forEach(o=>o.g.visible=true);
      const o=g.lootSpawn(P.group.position.clone().addScaledVector(f,-100),'SHD');P.vel.set(0,0,0);
      const d0=o.pos.distanceTo(P.group.position);for(let i=0;i<6;i++)g.lootTick(0.05);out.magnet=[Math.round(d0),Math.round(o.pos.distanceTo(P.group.position))];
      g.lootPods.length&&g.lootPods.slice().forEach(()=>{});
      // 3. effects, one by one (pods are placed on top of the pilot)
      const put=t=>{g.lootSpawn(P.group.position.clone(),t);g.lootTick(0.016)};
      P.shield.fore=0;P.shield.aft=0;put('SHD');out.shd=Math.round(P.shield.fore+P.shield.aft)+'/'+(P.def.shield.fore+P.def.shield.aft);
      P.structure=P.def.structure*0.5;P.comps[0].hp=P.comps[0].max*0.4;put('REP');out.rep=[+(P.structure/P.def.structure).toFixed(2),+(P.comps[0].hp/P.comps[0].max).toFixed(2)];
      const mk0=g.selectedMissile(P);P.stores[mk0]=0;put('MSL');out.msl=P.stores[mk0];
      for(const k in P.ammoMax)P.ammo[k]=0;P.energy=0;put('AMO');out.amo=Object.keys(P.ammoMax).every(k=>P.ammo[k]===P.ammoMax[k])&&P.energy===(P.energyMax||100);
      put('OVR');out.ovr=[P.mod.rof,P.mod.dmg];
      // 4. the damage multiplier reaches a real bolt
      P.ammo.cannon=600;P.mounts.forEach(m=>m.cool=0);g.fireGuns(P,1);const b=g.bolts.find(x=>x.owner===P);out.boltDmg=b&&+b.dmg.toFixed(2);out.cannonBase=g.WEAPONS.cannon.dmg;
      g.lootClear();for(let i=0;i<300;i++)g.update(0.05);                    // overdrive expires after 12 s
      out.ovrAfter=[P.mod.rof,P.mod.dmg];
      // 5. pods time out
      const o2=g.lootSpawn(P.group.position.clone().addScaledVector(f,-3000),'AMO');for(let i=0;i<800;i++)g.update(0.05);out.timedOut=!g.lootPods.includes(o2);
      return out}""")
    for k, v in r.items(): print(' ', k, v)
    ok = r['killsToDrop'] <= 6 and r['pods'] >= 1 and r['magnet'][1] < r['magnet'][0] - 5 and r['shd'].split('/')[0] != '0' \
        and r['rep'][0] > 0.6 and r['rep'][1] > 0.4 and r['msl'] >= 1 and r['amo'] and r['ovr'][0] > 1.3 and abs(r['boltDmg'] / r['cannonBase'] - 1.2) < 0.05 \
        and r['ovrAfter'][0] in (None, 1) and r['timedOut']
    print('LOOT', 'OK' if ok else 'FAIL', 'errs', R.errs[:3]); pg.close()
    return bool(ok)

CLEAR = """(P)=>{const g=__game;let n=0;while(g.ships.some(s=>s.team===1&&s.alive)&&n<400){g.ships.filter(s=>s.team===1&&s.alive&&!s.dying).forEach(e=>{e.lastAttacker=P;g.killShip(e)});g.update(0.05);n++}return n}"""

def survival(R):
    ok = True
    pg = R.page(1280, 720, '?sv=1&sv_seed=42&q=low'); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{__paused=true}")
    r = pg.evaluate("""()=>{const g=__game,P=g.player,out={};
      out.mode=g.game.mode;out.n=g.sv.n;out.enemies=g.ships.filter(s=>s.team===1&&s.alive).length;out.kinds=[...new Set(g.ships.filter(s=>s.team===1).map(s=>s.def.id))];
      out.hud=(document.getElementById('hudtxt').textContent.match(/WAVE \\d+/)||[''])[0];g.updateHud();out.hud=(document.getElementById('hudtxt').textContent.match(/WAVE \\d+/)||[''])[0];
      return out}""")
    print(' start', r); ok = ok and r['mode'] == 'survival' and r['n'] == 1 and r['enemies'] >= 3 and r['hud'] == 'WAVE 1'
    # clear wave 1 -> draft with 3 offers, 2 pods, score banked
    r = pg.evaluate("(" + CLEAR + ")(__game.player)")
    r = pg.evaluate("""()=>{const g=__game;return {phase:g.sv.phase,offers:g.sv.draft&&g.sv.draft.offers.map(o=>o.id),pods:g.lootPods.length,score:g.juice.score,draftShown:getComputedStyle(document.getElementById('svdraft')).display}}""")
    print(' cleared', r); ok = ok and r['phase'] == 'draft' and len(r['offers']) == 3 and r['pods'] >= 2 and r['score'] > 0 and r['draftShown'] == 'block'
    pg.screenshot(path='/tmp/gs_shots/fun_draft.png')
    # a real keypress picks card 1 (digit keys must not change the fire group)
    pg.keyboard.press('Digit1'); pg.wait_for_timeout(200)
    r = pg.evaluate("""()=>{const g=__game;return {phase:g.sv.phase,picked:g.sv.picks,fireMask:g.player.fireMask,shown:getComputedStyle(document.getElementById('svdraft')).display}}""")
    print(' picked', r); ok = ok and r['phase'] == 'break' and len(r['picked']) == 1 and r['shown'] == 'none'
    r = pg.evaluate("""()=>{const g=__game;for(let i=0;i<90;i++)g.update(0.05);return {n:g.sv.n,phase:g.sv.phase,enemies:g.ships.filter(s=>s.team===1&&s.alive).length}}""")
    print(' next wave', r); ok = ok and r['n'] == 2 and r['phase'] == 'fight' and r['enemies'] >= 3
    # perk effects: HOT ROUNDS multiplies bolt damage, GLASS CANNON also raises damage taken
    r = pg.evaluate("""()=>{const g=__game,P=g.player;const hot=g.PERKS.find(x=>x.id==='hot'),gl=g.PERKS.find(x=>x.id==='glass');
      const before=P.mod.dmg??1;g.sv.perks.hot=0;g.sv.phase='draft';g.sv.draft={offers:[hot],t:5};g.svPick(0);const after=P.mod.dmg;
      g.sv.phase='draft';g.sv.draft={offers:[gl],t:5};g.svPick(0);return {before,after,glass:[P.mod.dmg,P.mod.take]}}""")
    print(' perks', r); ok = ok and abs(r['after'] - 1.15) < 0.01 and abs(r['glass'][0] - 1.15 * 1.4) < 0.02 and r['glass'][1] > 1.2
    # walk the director through waves 2..11: boss waves, aces, no errors
    r = pg.evaluate("""(CLEARSRC)=>{const g=__game,P=g.player,out={waves:[],aces:0,boss:{}};const clear=eval(CLEARSRC);
      for(let w=0;w<10;w++){
        const foes=g.ships.filter(s=>s.team===1&&s.alive);out.aces+=foes.filter(s=>s.ace).length;
        out.waves.push([g.sv.n,foes.length,[...new Set(foes.map(s=>s.def.id))].join('+')]);
        if(g.sv.n%5===0)out.boss[g.sv.n]=[...new Set(foes.map(s=>s.def.id))];
        clear(P);if(g.sv.phase==='draft')g.svPick(0);for(let i=0;i<80&&g.sv.phase!=='fight';i++)g.update(0.05);
        P.structure=P.def.structure;P.shield.fore=P.def.shield.fore;P.shield.aft=P.def.shield.aft;
      }return out}""", CLEAR)
    print(' waves', r['waves']); print(' aces', r['aces'], 'bosses', r['boss'])
    ok = ok and r['aces'] >= 1 and 'gulper' in (r['boss'].get('5') or []) and 'bullfrog' not in (r['boss'].get('5') or []) and '10' in r['boss']
    print(' errs', R.errs[:3]); ok = ok and not R.errs
    # death -> debrief, best saved
    r = pg.evaluate("""()=>{const g=__game,P=g.player;g.hitSrc=null;g.applyHit(P,new g.THREE.Vector3(0,0,-1),99999,P.group.position.clone(),'kin');for(let i=0;i<140;i++)g.update(0.05);
      return {over:g.sv.over,shown:g.sv.shown,html:document.getElementById('brief').textContent.slice(0,90),best:localStorage.getItem('gs_svbest'),career:localStorage.getItem('gs_career')}}""")
    print(' death', r); ok = ok and r['over'] and r['shown'] and 'DOWN ON WAVE' in r['html'] and r['best'] and r['career']
    pg.screenshot(path='/tmp/gs_shots/fun_sv_debrief.png'); pg.close()
    # determinism: the same seed gives the same director plan
    plans = []
    for _ in range(2):
        pg = R.page(640, 360, '?sv=1&sv_seed=777&q=low'); pg.wait_for_timeout(800)
        plans.append(pg.evaluate("""()=>{const g=__game;const out=[];for(let w=2;w<=12;w++){g.sv.n=w-1;const sp=g.svCompose(w);out.push(w+':'+sp.name+':'+sp.rows.map(r=>r.kind+r.count).join(',')+':'+(sp.ace?sp.ace.name:''))}return out.join('|')}"""))
        pg.close()
    print(' determinism', plans[0] == plans[1], plans[0][:120]); ok = ok and plans[0] == plans[1]
    # mutators and difficulty reach the player
    pg = R.page(640, 360, '?sv=1&sv_diff=ace&sv_mut=glass,newton,scarce&q=low'); pg.wait_for_timeout(800)
    r = pg.evaluate("""()=>{const g=__game,P=g.player;return {take:+P.mod.take.toFixed(2),fm:g.game&&0,scoreMul:+g.juice.scoreMul.toFixed(2),drop:P.mod.drop}}""")
    print(' ace+glass', r); ok = ok and abs(r['take'] - 1.4 * 1.5) < 0.02 and abs(r['scoreMul'] - 1.6 * 1.3 * 1.6 * 1.3) < 0.02; pg.close()
    # menu flow: main menu -> GAUNTLET setup -> launch
    for w, h, tag, touch in ((1280, 720, 'desk', False), (844, 390, 'phone', True)):
        pg = R.page(w, h, '?touch&q=low' if touch else '?q=low', touch=touch); pg.wait_for_timeout(1500)
        if touch: pg.screenshot(path=f'/tmp/gs_shots/fun_menu_{tag}.png')
        pg.click('.mi[data-a="survival"]'); pg.wait_for_timeout(400); pg.screenshot(path=f'/tmp/gs_shots/fun_sv_setup_{tag}.png')
        pg.click('[data-mut="swarm"]'); pg.wait_for_timeout(300)
        pg.click('#sv_go'); pg.wait_for_timeout(1500)
        r = pg.evaluate("()=>({mode:__game.game.mode,mut:Object.keys(__game.sv.mut),n:__game.sv.n})")
        print(' menu', tag, r); ok = ok and r['mode'] == 'survival' and 'swarm' in r['mut']
        if tag == 'phone':
            pg.evaluate("()=>{const g=__game;__paused=true;g.ships.filter(s=>s.team===1).forEach(e=>{e.lastAttacker=g.player;g.killShip(e)});for(let i=0;i<80;i++)g.update(0.05);g.updateHud()}"); pg.wait_for_timeout(300)
            pg.screenshot(path='/tmp/gs_shots/fun_draft_phone.png')
        pg.close()
    print('SURVIVAL', 'OK' if ok else 'FAIL', 'errs', R.errs[:3])
    return ok

def missions(R):
    ok = True
    ctx = R.b.new_context(viewport={'width': 1280, 'height': 720}); pg = ctx.new_page()
    pg.on('console', lambda m: R.errs.append((m.type, m.text)) if m.type == 'error' and '404' not in m.text else None)
    pg.on('pageerror', lambda e: R.errs.append(('pageerror', str(e))))
    pg.goto('http://localhost:' + PORT + '/index.html?m=1&q=low', timeout=120000); pg.wait_for_function('window.__game!==undefined', timeout=120000); pg.wait_for_timeout(800)
    r = pg.evaluate("()=>({btns:[...document.querySelectorAll('[data-d]')].map(b=>b.dataset.d),cur:[...document.querySelectorAll('[data-d].on')].map(b=>b.dataset.d)})")
    print(' briefing selector', r); ok = ok and r['btns'] == ['easy', 'normal', 'hard', 'ace'] and r['cur'] == ['normal']
    pg.click('[data-d="hard"]'); pg.wait_for_timeout(1500)
    pg.click('#bgo'); pg.wait_for_timeout(300)
    r = pg.evaluate("""()=>{const g=__game;__paused=true;for(let i=0;i<110;i++)g.update(0.05);const P=g.player,foes=g.ships.filter(s=>s.team===1&&s.alive);
      g.updateHud();return {n:foes.length,skills:[...new Set(foes.map(s=>s.skill))],take:+P.mod.take.toFixed(2),obj:document.getElementById('objs').textContent.replace(/\\s+/g,' ').slice(0,120),wing:document.getElementById('wingstrip').textContent.replace(/\\s+/g,' '),
      comms:[...document.getElementById('comm').children].map(c=>c.textContent.slice(0,40))}}""")
    print(' hard m1', r); ok = ok and r['n'] == 7 and r['skills'] == [4] and abs(r['take'] - 1.2) < 0.01 and '[0/7]' in r['obj'] and 'HAWK' in r['wing'] and 'SPARROW' in r['wing']
    # tips: four lines in order, once; after the mission they are remembered
    r = pg.evaluate("""()=>{const g=__game;for(let i=0;i<700;i++)g.update(0.05);return {tipN:g.game.mstate.tipN,tips:localStorage.getItem('gs_tips')}}""")
    print(' tips', r); ok = ok and r['tipN'] == 4 and r['tips'] and 'm01' in r['tips']
    r = pg.evaluate("""()=>{const g=__game;g.ships.filter(s=>s.team===1).forEach(e=>{e.lastAttacker=g.player;g.killShip(e)});for(let i=0;i<120;i++)g.update(0.05);g.endMission('win','test');for(let i=0;i<80;i++)g.update(0.05);
      return {html:document.getElementById('brief').textContent.replace(/\\s+/g,' ').slice(0,600),career:localStorage.getItem('gs_career')}}""")
    print(' debrief', r['html'][:200], '|', r['career']); ok = ok and 'MISSION ACCOMPLISHED' in r['html'] and 'STYLE' in r['html'] and 'CAREER' in r['html'] and r['career']
    pg.screenshot(path='/tmp/gs_shots/fun_debrief_mission.png')
    # second launch: tips are not repeated
    pg.evaluate("()=>{localStorage.setItem('gs_diff','normal')}"); pg.reload(); pg.wait_for_function('window.__game!==undefined', timeout=120000); pg.wait_for_timeout(600)
    pg.evaluate("()=>{document.getElementById('bgo')&&document.getElementById('bgo').click()}"); pg.wait_for_timeout(200)
    r = pg.evaluate("()=>{const g=__game;__paused=true;for(let i=0;i<700;i++)g.update(0.05);return {tipN:g.game.mstate.tipN||0}}")
    print(' tips repeat', r); ok = ok and r['tipN'] == 0
    pg.close(); ctx.close()
    print('MISSIONS', 'OK' if ok else 'FAIL', 'errs', R.errs[:3]); return ok and not R.errs

with Runner() as R:
    ok = True
    for name in which:
        ok = globals()[name](R) and ok
    print('ALL', 'OK' if ok else 'FAIL')
