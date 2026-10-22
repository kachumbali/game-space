from lib import *
with Runner() as R:
    pg=R.page(640,360,'?go&m=2'); pg.wait_for_timeout(1200)
    g=lambda s: pg.evaluate(s)
    print('state',g('__game.state'))
    pg.keyboard.press('KeyR'); pg.wait_for_timeout(200)
    print('dlg',g("getComputedStyle(document.getElementById('rdlg')).display"), g("document.getElementById('rdlg').innerText.replace(/\\n/g,'|')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    print('closed',g("getComputedStyle(document.getElementById('rdlg')).display"))
    # advance mission to set a segment
    g("(()=>{for(let i=0;i<40;i++)__game.update(0.05);__game.game.seg={stage:1,area:Object.keys(__game.game.mission.areas||{})[0]||'x',t:5}})()")
    pg.keyboard.press('KeyR'); pg.wait_for_timeout(200)
    print(g("document.getElementById('rdlg').innerText.replace(/\\n/g,'|')"))
    pg.keyboard.press('KeyS'); pg.wait_for_timeout(500)
    print('after S', g('[__game.state,__game.game.mstate.stage,__game.game.mode]'))
    pg.keyboard.press('KeyR'); pg.keyboard.press('KeyM'); pg.wait_for_timeout(400)
    print('after M', g('[__game.state,__game.game.mstate.stage]'))
    print(R.errs[:5])
