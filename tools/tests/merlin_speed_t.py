#!/usr/bin/env python3
"""Cloud browser check of Merlin speed and touch BOOST; no balance claim."""
from lib import Runner

with Runner() as R:
    p=R.page(844,390,'?sk=darter:1&sk_ship=merlin&sk_wing=0&touch&nobloom',touch=True)
    p.evaluate('''()=>{__paused=true;const g=__game;for(const s of g.ships)if(s.team===1)s.alive=false;
      g.player.vel.set(0,0,0);g.player.throttle=1;g.player.abLock=false;}''')
    base=p.evaluate('''()=>{for(let i=0;i<200;i++)__game.update(0.05);
      return {ship:__game.player.def.id,max:__game.player.def.maxSpeed,speed:__game.player.vel.length(),ab:__game.player.ab}}''')
    assert base['ship']=='merlin' and base['max']==262.5 and 245<base['speed']<270 and not base['ab'],base
    box=p.locator('#bboost').bounding_box(); assert box
    c=p.context.new_cdp_session(p)
    c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2,'id':1}]})
    boosted=p.evaluate('''()=>{for(let i=0;i<40;i++)__game.update(0.05);return {ab:__game.player.ab,speed:__game.player.vel.length()}}''')
    c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()
    assert boosted['ab'] and boosted['speed']>base['speed'],(base,boosted)
    p.evaluate('''()=>{for(let i=0;i<10;i++)__game.update(0.05)}''')
    assert not p.evaluate('()=>__game.player.ab'), 'boost remains active after release'
    assert not R.errs,R.errs
print('Merlin player speed and touch BOOST: OK')
