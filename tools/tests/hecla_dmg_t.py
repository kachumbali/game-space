from lib import *
with Runner() as R:
    pg = R.page(800, 500, '?sk=hecla:1&sk_range=1500&seed=1'); pg.wait_for_timeout(1000)
    pg.evaluate("()=>{__game.player.vital=false}")
    for i in range(8):
        pg.wait_for_timeout(2500)
        print(i, pg.evaluate("""()=>{const g=__game,h=g.ships.find(s=>s.team===1),P=g.player;return {playerAlive:P.alive,pst:Math.round(P.structure),psh:P.shield&&Object.values(P.shield).map(Math.round),dist:Math.round(h.group.position.distanceTo(P.group.position)),sim:g.game&&g.game.t}}"""), flush=True)
