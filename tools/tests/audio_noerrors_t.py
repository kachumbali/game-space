#!/usr/bin/env python3
"""Cloud browser smoke: initialize audio and exercise every registered effect."""
from lib import Runner
with Runner() as R:
    p=R.page(640,360,'?free&n=0&nobloom')
    p.locator('body').click(position={'x':10,'y':10})
    n=p.evaluate('''()=>{__game.audioInit();const ids=__game.audioIds();for(const id of ids)__game.sfx(id,0,0.1);return ids.length;}''')
    assert n>20,n
    assert not R.errs,R.errs
print('audio effects browser smoke: OK')
