#!/usr/bin/env python3
"""Campaign kills cannot spawn arcade loot; free flight still can."""
from lib import Runner

with Runner() as runner:
    page = runner.page(640, 360, '?go&m=1&seed=1&nobloom')
    result = page.evaluate("""()=>{
      const g=__game; g.lootClear();
      const target=g.makeShip('gulper',1,new g.THREE.Vector3(0,0,-400),new g.THREE.Quaternion());
      target.lastAttacker=g.player;
      g.destroy(target);
      return {mode:g.game.mode,pods:g.lootPods.length};
    }""")
    assert result == {'mode': 'mission', 'pods': 0}, result
    # 30 campaign kills, none may drop; the same 30 kills in free flight must drop at least once (positive control: the check can fail)
    KILLS = """()=>{const g=__game; g.lootClear(); let n=0;
      for (let i=0;i<30;i++){const t=g.makeShip('gulper',1,new g.THREE.Vector3(i*50,0,-400),new g.THREE.Quaternion()); t.lastAttacker=g.player; g.destroy(t);}
      return {mode:g.game.mode,pods:g.lootPods.length};}"""
    camp = page.evaluate(KILLS)
    assert camp['pods'] == 0, camp
    free = runner.page(640, 360, '?free&n=0&seed=1&nobloom')
    fr = free.evaluate(KILLS)
    assert fr['mode'] == 'free' and fr['pods'] > 0, ('free flight must drop (positive control)', fr)
    assert not runner.errs, runner.errs
    print('campaign kill: no arcade drops (30 kills, 0 pods); free flight positive control:', fr['pods'], 'pods')
