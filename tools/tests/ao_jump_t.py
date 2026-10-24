"""Multi-AO missions: after an area is cleared the player must press X (or tap the prompt) to start the jump."""
from lib import *
fails=[]
def check(n,ok,i=''):
    print(('PASS ' if ok else 'FAIL ')+n,i,flush=True)
    if not ok: fails.append(n)
with Runner() as R:
    pg=R.page(800,500,'?go&m=2&nobloom'); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{__paused=true}")
    step=lambda n,dt=0.05: pg.evaluate(f"()=>{{for(let i=0;i<{n};i++)__game.update({dt})}}")
    kill=lambda g: pg.evaluate("(g)=>{__game.ships.filter(s=>s.grp===g&&s.alive).forEach(s=>__game.destroy(s))}",g)
    st=lambda: pg.evaluate("()=>({stage:__game.game.mstate.stage,state:__game.state,p:(document.getElementById('jumpPrompt')||{style:{}}).style.display})")
    step(80); pg.keyboard.press('Space'); step(40); pg.keyboard.press('Space'); step(5)   # first transit (start of mission) stays automatic
    step(100); kill('A'); step(120); kill('B'); step(200)
    r=st(); check('area clear: prompt shown, stage waits', r['p']=='block' and r['state']!='cine', str(r))
    s0=r['stage']; step(100)
    check('does not auto-jump', st()['stage']==s0 and st()['p']=='block')
    pg.keyboard.press('KeyX'); step(10)
    r=st(); check('X starts the transit and hides the prompt', r['state']=='cine' and r['p']=='none', str(r))
    check('no console errors', not R.errs, str(R.errs[:3]))
print('FAILED:',fails or 'none')
