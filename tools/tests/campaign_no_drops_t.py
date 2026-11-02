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
    assert not runner.errs, runner.errs
    print('campaign kill: no arcade drops')
