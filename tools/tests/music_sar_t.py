#!/usr/bin/env python3
"""SAR music transitions via the campaign mission list, with a forced-mood control."""
from lib import Runner, SP, PORT

def run(p, forced):
    p.evaluate("()=>{__paused=true;__game.showMissionList(__game.CAMPAIGNS.find(c=>c.id==='long_retreat'))}")
    p.locator('[data-a="mission:long_retreat:4"]').click()
    p.locator('#bgo').click()
    p.keyboard.press('KeyW')
    p.evaluate("()=>{const g=__game;globalThis.probeEnemy=g.spawnShip('darter',1,g.player.group.position.clone(),g.player.group.position,{grp:'music_probe'});}")
    moods=[]
    for d in (10000,3000,600):
        p.evaluate("d=>{const g=__game;probeEnemy.group.position.copy(g.game.mstate.sar.cutter.group.position).add(new g.THREE.Vector3(0,0,d));g.player.group.position.copy(g.game.mstate.sar.cutter.group.position)}",d)
        p.wait_for_timeout(6000)
        moods.append(p.evaluate('__game.MUS.want'))
    p.evaluate("()=>{__game.game.mstate.result='win';__game.state='done'}")
    p.wait_for_timeout(6000)
    moods.append(p.evaluate('__game.MUS.want'))
    return moods

with Runner() as R:
    for forced in (False,True):
        if forced:
            html=open(SP+'/index.html').read().replace("if (state !== 'play' || !player) return 'menu';", "if (state !== 'play' || !player) return 'menu'; return 'rescue';", 1)
            ctx=R.b.new_context(viewport={'width':640,'height':360})
            p=ctx.new_page()
            p.route('**/index.html*', lambda route: route.fulfill(status=200,content_type='text/html',body=html))
            p.goto('http://localhost:'+PORT+'/index.html?seed=1&nobloom',wait_until='domcontentloaded',timeout=120000)
            p.wait_for_function('window.__game!==undefined',timeout=120000)
        else: p=R.page(640,360,'?seed=1&nobloom')
        moods=run(p,forced);p.context.close()
        print('forced rescue-only' if forced else 'SAR',moods,flush=True)
        transitions=sum(a!=b for a,b in zip(moods,moods[1:]))
        if forced: assert transitions<3,moods
        else: assert moods==['rescue','tension','combat','win'] and transitions>=3,moods
    assert not R.errs,R.errs
print('SAR music transitions and negative control: OK')
