#!/usr/bin/env python3
"""Browser runtime burst checks for player and AI turrets, plus full PD control."""
from lib import Runner

CHECK = r'''arg => {
  const g=__game,T=g.THREE; __paused=true;
  for(const x of g.ships) if(x!==g.player) x.alive=false;
  g.player.group.position.set(50000,0,50000);g.player.team=2;
  const p=g.makeShip('falchion',0,new T.Vector3(),new T.Quaternion(),{player:arg.player});
  const enemy=g.makeShip('darter',1,new T.Vector3(0,300,-400),new T.Quaternion(),{});
  p.energy=p.energyMax=1e9; const t=p.turrets[0]; p.turrets=[t]; t.cool=0; t.thinkT=0;
  if(arg.full) { t.w=g.WEAPONS.pd; t.wid='pd'; }
  let previous=0, ninth=null,tenth=null;
  for(let i=0;i<3000 && t.fired<10;i++){
    g.updateTurrets(p,0.05);
    if(t.fired!==previous){ if(t.fired===9)ninth=t.cool;if(t.fired===10)tenth=t.cool;previous=t.fired; }
  }
  return {weapon:t.wid, fired:t.fired, ninth, tenth, enemy:enemy.alive};
}'''
with Runner() as R:
    for is_player, full in ((True,False), (False,False), (False,True)):
        page=R.page(640,360,'?free&n=0&nobloom')
        result=page.evaluate(CHECK,{'player':is_player,'full':full})
        print('player' if is_player else 'AI', 'full' if full else 'burst',result,flush=True)
        assert result['weapon']==('pd' if full else 'pdS') and result['fired']==10, result
        assert result['ninth']<0.2 and (result['tenth']<0.2 if full else result['tenth']>=1), result
        page.context.close()
    page=R.page(640,360,'?free&n=0&diag&nobloom')
    page.wait_for_timeout(1200)
    diag=page.locator('#diagnostics').inner_text()
    assert 'WebGL renderer:' in diag and 'Instancing:' in diag and 'meshes /' in diag, diag
    page.context.close()
    page=R.page(640,360,'?free&n=0&nobloom')
    assert page.locator('#diagnostics').count()==0
    page.context.close()
    assert not R.errs, R.errs
print('v0.5 burst browser test: OK')
