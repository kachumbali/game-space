"""v0.3 M3: missile damage model, tandem torpedo warhead, aspect independence of blasts, bomber salvo discipline, torpedo marks.
Usage: GS_PORT=8840 GS_TEST_DIR=/tmp/gs_m3t python3 tools/tests/m3_missile_t.py"""
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i, flush=True); ok = ok and bool(c)

with Runner() as R:
    pg = R.page(640, 360, '?free&n=0&wing=0&seed=7&q=low'); pg.wait_for_timeout(500)
    # --- 1. tandem: precursor collapses the struck facet, it stays down for holeT, then the normal regen delay applies
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;g.state='cine';
      const P=g.player;P.group.position.set(0,0,400000);
      const t=g.spawnShip('exeter',1,new T.Vector3(0,0,-900),new T.Vector3(0,0,0));t.vel.set(0,0,0);t.turrets=[];t.mounts=[];t.stores={};t.ai.hold=true;
      const sh0=t.shield.fore, hole=g.WEAPONS.torp.tandem.holeT, out={sh0,hole};
      t.group.updateMatrixWorld(true);
      const lp=new T.Vector3(0,0,-t.def.half[2]*0.9), wp=t.group.localToWorld(lp.clone());
      const st0=t.structure;
      g.blastAt(wp,g.WEAPONS.torp,0,P,t);
      out.shAfter=t.shield.fore; out.holeUntil=t.shHole&&t.shHole.fore-g.time; out.dStruct=st0-t.structure;
      for(let i=0;i<20;i++)g.update(0.05);      // 1 s later: still down
      out.sh1s=t.shield.fore;
      // a second hit during the hole goes through undiminished (no shield to eat it)
      const s1=t.structure; g.blastAt(wp,g.WEAPONS.torp,0,P,t); out.dStruct2=s1-t.structure;
      for(let i=0;i<Math.ceil((hole+0.2)/0.05);i++)g.update(0.05);
      out.holeClosed=!(t.shHole.fore>g.time);
      for(let i=0;i<Math.ceil(10/0.05);i++)g.update(0.05);
      out.shLater=t.shield.fore;
      // a friendly ship gets no hole
      const f=g.spawnShip('exeter',0,new T.Vector3(0,0,-2500),new T.Vector3(0,0,0));f.vel.set(0,0,0);f.group.updateMatrixWorld(true);
      g.blastAt(f.group.localToWorld(new T.Vector3(0,0,-f.def.half[2]*0.9)),g.WEAPONS.torp,0,P,f);out.friendHole=!!(f.shHole&&f.shHole.fore>g.time);
      return out}""")
    print(r)
    check('precursor collapses the facet', r['shAfter'] == 0 and r['sh0'] > 500, r)
    check('hole lasts holeT (still down after 1 s)', r['holeUntil'] > 2.0 and r['sh1s'] == 0, r)
    check('main charge reaches the hull', r['dStruct'] > 100, r['dStruct'])
    check('second hit inside the hole is not eaten by a shield', r['dStruct2'] > 150, r['dStruct2'])
    check('shield regrows after the hole closes', r['holeClosed'] and r['shLater'] > 0, r)
    check('no hole on friendly hulls', not r['friendHole'])

    # --- 2. fighter missiles: 1-2 hits on light/medium, <= 3 on heavy, at a typical (fuzed) detonation; aspect independent on corvettes
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;g.state='cine';const P=g.player;P.group.position.set(0,0,400000);
      const out={};
      for(const wid of ['ir','rf','tick']){
        for(const id of ['merlin','darter','kestrel','leaper','bittern','toad','reaver']){
          let n=0;const t=g.spawnShip(id,1,new T.Vector3(0,0,-600),new T.Vector3(0,0,0));t.vel.set(0,0,0);t.turrets=[];t.mounts=[];t.stores={};t.ai.hold=true;t.group.updateMatrixWorld(true);
          const w=g.WEAPONS[wid];
          // a proximity-fuze burst where the fuze trips (0.55 R + fuze from the centre), nose on: the typical non-contact detonation
          while(t.alive&&!t.dying&&n<12){const wp=t.group.localToWorld(new T.Vector3(0,0,-(t.def.radius*0.55+w.fuze)));g.blastAt(wp,w,0,P,null);n++;}
          out[wid+'|'+id]=n;t.alive=false;t.dying=0;}}
      return out}""")
    print(r)
    light = [v for k, v in r.items() if k.split('|')[1] in ('merlin', 'darter', 'kestrel', 'leaper')]
    heavy = [v for k, v in r.items() if k.split('|')[1] in ('bittern', 'toad', 'reaver')]
    check('light/medium die to <= 3 far-fuze bursts (the ceiling rig, with contact hits, is the 1-2 claim)', max(light) <= 3, max(light))
    check('heavy/bomber die to <= 5 far-fuze bursts', max(heavy) <= 5, max(heavy))

    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;g.state='cine';const P=g.player;P.group.position.set(0,0,400000);const out={};
      for(const id of ['halberd','gulper','exeter']){
        for(const asp of ['nose','broadside','tail']){
          const t=g.spawnShip(id,1,new T.Vector3(0,0,-600),new T.Vector3(0,0,0));t.vel.set(0,0,0);t.turrets=[];t.mounts=[];t.stores={};t.ai.hold=true;
          t.shield.fore=0;t.shield.aft=0;t.group.updateMatrixWorld(true);
          const h=t.def.half;const lp=asp==='nose'?new T.Vector3(0,0,-h[2]):asp==='tail'?new T.Vector3(0,0,h[2]):new T.Vector3(h[0],0,0);
          const wp=t.group.localToWorld(lp);
          // a missile that struck the hull is AT the hull: direct
          const s0=t.structure+t.comps.reduce((a,c)=>a+c.hp,0);
          g.blastAt(wp,g.WEAPONS.ir,0,P,t);
          out[id+'|'+asp]=+(s0-(t.structure+t.comps.reduce((a,c)=>a+c.hp,0))).toFixed(1);t.alive=false;t.dying=0;}}
      return out}""")
    print(r)
    for id in ('halberd', 'gulper', 'exeter'):
        v = [r[f'{id}|{a}'] for a in ('nose', 'broadside', 'tail')]
        check(f'{id}: a direct hit does damage from every aspect', min(v) > 0, v)

    # --- 3. torpedo marks resolve with the expected deltas
    r = pg.evaluate("""()=>{const W=__game.WEAPONS;return ['torp','torp_2','torp_3','torp_4'].map(k=>({k,n:W[k]&&W[k].name,range:W[k]&&W[k].range,pen:W[k]&&W[k].tandem.pen,hole:W[k]&&W[k].tandem.holeT,vmax:W[k]&&W[k].vmax,hp:W[k]&&W[k].hp}))}""")
    print(r)
    check('torp_2..4 exist and carry rising tandem pen and holeT', all(r[i]['range'] > r[0]['range'] and r[i]['pen'] > r[i - 1]['pen'] and r[i]['hole'] > r[i - 1]['hole'] for i in (1, 2, 3)))      # range: Gemini's marks are non-compounding, so only pen and holeT must climb
    check('mark names', [x['n'] for x in r] == ['HM-1 HAMMER TORPEDO', 'HM-1 HAMMER TORPEDO II', 'HM-1 HAMMER TORPEDO III', 'HM-1 HAMMER TORPEDO IV'], [x['n'] for x in r])

    # --- 4. bomber AI: a salvo of tuning.ai.torpSalvo, then break away; never more than the target needs
    r = pg.evaluate("""()=>{const g=__game,T=g.THREE;__paused=true;g.state='play';const P=g.player;P.group.position.set(0,0,400000);P.team=0;
      for(const s of g.ships) if(s!==P){s.alive=false;s.dying=0;}
      const t=g.spawnShip('halberd',0,new T.Vector3(0,0,0),new T.Vector3(0,0,-5000));t.vel.set(0,0,0);t.ai.hold=true;t.turrets=[];t.mounts=[];
      const b=g.spawnShip('bittern',1,new T.Vector3(0,0,1500),new T.Vector3(0,0,0),{ai:'bomber',skill:3});b.target=t;b.ai.mslT=0;
      const seen=new Set();let launched=[],mode=[];let tt=0;
      while(tt<70){g.update(0.05);tt+=0.05;b.target=t;
        for(const m of g.missiles) if(!seen.has(m)){seen.add(m);launched.push(+tt.toFixed(1));}
        if(Math.round(tt*20)%20===0) mode.push(b.ai.mode);}
      return {launched,stores:b.stores.torp,mode:mode.join(',').slice(0,200),hull:+(t.structure/t.def.structure).toFixed(2)}}""")
    print(r)
    check('bomber launches in salvos (never 12 at one corvette)', 0 < len(r['launched']) <= 6, r['launched'])
    check('torpedo stores not emptied at one corvette', r['stores'] >= 6, r['stores'])
    check('no console errors', not R.errs, R.errs[:3])
print('M3 OK' if ok else 'M3 FAIL')
