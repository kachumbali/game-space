#!/usr/bin/env python3
"""Exercise SAR through the campaign list, including an immobilised negative control."""
from lib import Runner

START = '''()=>{const g=__game;globalThis.__paused=true;g.showMissionList(g.CAMPAIGNS.find(c=>c.id==='long_retreat'));}'''
def launch(p):
    p.evaluate(START)
    p.locator('[data-a="mission:long_retreat:4"]').evaluate('(el)=>el.click()')
    p.locator('#bgo').evaluate('(el)=>el.click()')

with Runner() as R:
    p=R.page(640,360,'?seed=1&nobloom')
    launch(p)
    evasion=p.evaluate("""()=>{const g=__game,S=g.game.mstate,c=S.sar.cutter,pod=g.rescueCapsules()[0];
      c.group.position.copy(pod.group.position).add(new g.THREE.Vector3(0,0,50));c.vel.set(0,0,0);
      const start=c.group.position.clone(),e=g.spawnShip('darter',1,c.group.position.clone().add(new g.THREE.Vector3(0,0,300)),c.group.position,{grp:'test'});
      let notice=false;for(let i=0;i<100;i++){e.target=c;e.ai.tgtT=100;g.update(.05);notice ||= g.objectives.some(o=>JSON.stringify(o).includes('HOSTILE ENGAGING'));}
      return {distance:c.group.position.distanceTo(start),notice};}""")
    print('engaged evasion',evasion,flush=True)
    assert evasion['distance']>20 and evasion['notice'],evasion
    for mode in ('passive','flying','escort','held'):
        launch(p)
        r=p.evaluate('''mode=>{const g=__game,S=g.game.mstate,c=S.sar.cutter,start=c.group.position.clone(),samples=[];let death=null,nearest=Infinity;
          for(let i=0;i<(mode==='held'?1200:4400) && !S.result;i++){
            // A simple flying escort aims and fires using the normal player weapons.
            if(mode==='flying' && g.player.alive && !g.player.dying){
              const p=g.player, enemies=g.ships.filter(e=>e.alive&&!e.dying&&e.team!==p.team);
              enemies.sort((a,b)=>a.group.position.distanceToSquared(c.group.position)-b.group.position.distanceToSquared(c.group.position));
              if(enemies.length){const e=enemies[0],aim=e.group.position.clone().addScaledVector(e.vel,.5);p.group.lookAt(aim);p.group.rotateY(Math.PI);p.throttle=1;g.fireGuns(p,7);}
            }
            // Clearing threats isolates navigation and pickup; it is not a combat balance measurement.
            if(mode==='escort'||mode==='held')for(const e of g.ships)if(e.team!==c.team)e.alive=false;
            if(mode==='held'){c.group.position.copy(start);c.vel.set(0,0,0)}
            g.update(.05);
            if(i<1200 && (i+1)%100===0)samples.push(+c.group.position.distanceTo(start).toFixed(1));
            if(g.rescueCapsules().length) nearest=Math.min(nearest,...g.rescueCapsules().map(p=>p.group.position.distanceTo(c.group.position)));
            if(!c.alive||c.dying){death=+(i*.05).toFixed(1);break}
          }
          return {samples,death,elapsed:+S.t.toFixed(1),result:S.result,recovered:S.sar.records.map(x=>x.outcome),nearest:+nearest.toFixed(1)};}''',mode)
        print(mode,r,flush=True)
        if mode=='escort':
            assert r['samples'][5]>100 and r['nearest']<150 and r['result']=='win',r
        if mode=='held':
            assert not (len(r['samples'])>=6 and r['samples'][5]>100 and r['result']=='win'),r
    assert not R.errs,R.errs
print('SAR navigation and held negative control: OK')
