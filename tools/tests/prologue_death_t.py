from lib import *

with Runner() as R:
    pg = R.page(1180,820,'?campaign=prologue&m=1&go&q=low',touch=True,
                init_script="localStorage.setItem('gs_tutorial_p01','done')")
    pg.evaluate('''()=>{
      globalThis.__paused=true;
      const g=__game; g.TUNE.rescue.enabled=false;
      const p=g.player; p.shield.fore=0; p.shield.aft=0;
      g.hitKind='missile';
      const lp=new g.THREE.Vector3(0,0,-p.def.half[2]);
      g.applyHit(p,lp,1000000,p.group.localToWorld(lp.clone()),'exp');
      g.missionUpdate(.1); g.showDebrief();
    }''')
    assert 'Missile or warhead impact.' in pg.locator('#brief').inner_text()
    assert pg.locator('#bgo').inner_text() == 'RETRY'
    pg.locator('#bgo').click()
    assert pg.evaluate("()=>__game.state === 'brief' && __game.game.mission.id === 'p01' && __game.player.alive")
    pg.evaluate('''()=>{
      const g=__game, snapshot=JSON.parse(g.game.crewSnap);
      snapshot.hawk.status='SENTINEL'; g.game.crewSnap=JSON.stringify(snapshot);
      g.endMission('win'); g.showDebrief();
    }''')
    assert pg.locator('#bgo').inner_text() == 'FLY AGAIN'
    pg.locator('#bgo').click()
    assert pg.evaluate("()=>JSON.parse(__game.game.crewSnap).hawk.status !== 'SENTINEL'")
    assert not [e for e in R.errs if e[0] != 'http'], R.errs
    print('PASS missile feedback, touch retry and fly-again state')
print('PROLOGUE DEATH OK')
