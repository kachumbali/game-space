# Music integration: autoplay start, track files load, mood transitions, mute.
# The mood logic runs in musicTick on real frames, but the sim is driven manually
# (__paused + __game.update(0.05) loops) so enemy waves and the mission-2 transit do not
# depend on wall-clock time in the software renderer (see bot2.py for the pattern).
# Usage: cd tools/tests && python3 music_t.py   (see README.md for the harness)
from lib import *
import urllib.request

# pause and step the sim until hostiles exist; returns steps taken
WARMUP='''()=>{globalThis.__paused=true;
 for(let i=0;i<600;i++){__game.update(0.05);if(__game.ships.some(s=>s.team===1&&s.alive))return i;}
 return -1}'''
# pause and step until the game reaches the given state (mission 2 transit)
UNTIL_CINE='''()=>{globalThis.__paused=true;
 for(let i=0;i<600;i++){__game.update(0.05);if(__game.state==="cine")return i;}
 return -1}'''
# put n hostiles within combat range of the player (mission 1's first wave is only five
# ships, so the rest are spawned on the spot), park any others far away
PLACE_NEAR='''(n)=>{const g=__game,P=g.player,f=new g.THREE.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
 const es=g.ships.filter(s=>s.team===1&&s.alive);
 es.slice(0,n).forEach((e,i)=>{e.group.position.copy(P.group.position).addScaledVector(f,600+i*40);e.group.updateMatrixWorld(true);});
 es.slice(n).forEach(e=>{e.group.position.set(90000,0,90000);e.group.updateMatrixWorld(true);});
 for(let i=es.length;i<n;i++) g.spawnShip('darter',1,P.group.position.clone().addScaledVector(f,600+i*40),P.group.position,{grp:'mus'});
 return g.ships.filter(s=>s.team===1&&s.alive&&s.group.position.distanceTo(P.group.position)<1800).length}'''

fails=[]
def until(pg,expr,what,timeout=90000):
    try: pg.wait_for_function(expr,timeout=timeout)
    except Exception: fails.append('%s (timeout)'%what)

def el_src(pg,k):
    return pg.evaluate('__game.MUS.el.%s && __game.MUS.el.%s.src.split("/").pop()'%(k,k))

with Runner() as R:
    # every shipped track is served (urgent/pulse are kept as fallbacks)
    for f in ['airy.mp3','sector.mp3','combat-dogfight.mp3','combat-bombast.mp3','victory.mp3','transmission.mp3','urgent.mp3','pulse.mp3']:
        try: code=urllib.request.urlopen('http://localhost:'+PORT+'/audio/'+f).status
        except Exception as e: code=str(e)
        if code!=200: fails.append('audio/%s not served (HTTP %s)'%(f,code))

    # ---- page 1: mission 1 into play: patrol -> combat -> heavy -> win ----
    pg=R.page(1280,720,'?go&m=1')
    if pg.evaluate('__game.MUS.started'): fails.append('MUS.started before any input')
    pg.keyboard.press('KeyW')
    until(pg,'__game.MUS.started===true','keydown did not set MUS.started')
    steps=pg.evaluate(WARMUP)
    if steps is None or steps<0: fails.append('no hostiles spawned after 600 sim-steps')
    until(pg,'__game.MUS.want==="patrol"','no patrol mood in empty space')
    el=pg.evaluate('(()=>{const e=__game.MUS.el.patrol;return e?{src:e.src.split("/").pop(),paused:e.paused,vol:+e.volume.toFixed(2)}:null})()')
    if not el or el['src']!='sector.mp3': fails.append('patrol element missing or wrong file: %r'%el)
    if el and el['paused']: fails.append('patrol track paused after user gesture (autoplay blocked?)')
    until(pg,'__game.MUS.el.patrol && __game.MUS.el.patrol.volume>=0.2','patrol volume did not ramp')
    # combat: two hostiles inside 1800 m
    pg.evaluate(PLACE_NEAR,2)
    until(pg,'__game.MUS.want==="combat"','no combat mood with 2 hostiles near')
    if el_src(pg,'combat')!='combat-dogfight.mp3': fails.append('combat track is not combat-dogfight.mp3')
    # heavy: seven hostiles near
    pg.evaluate(PLACE_NEAR,7)
    until(pg,'__game.MUS.want==="heavy"','no heavy mood with 7 hostiles near')
    if el_src(pg,'heavy')!='combat-bombast.mp3': fails.append('heavy track is not combat-bombast.mp3')
    # win: mission over
    pg.evaluate('__game.game.mstate.result="win";__game.state="done"')
    until(pg,'__game.MUS.want==="win"','no win mood after a won mission')
    if el_src(pg,'win')!='victory.mp3': fails.append('win track is not victory.mp3')
    print('page1 errs',R.errs[:10])
    pg.context.close()

    # ---- page 2: briefing screen -> menu mood (airy) ----
    pg=R.page(1280,720,'?m=1')
    pg.keyboard.press('KeyW')
    until(pg,'__game.MUS.want==="menu"','no menu mood on the briefing screen')
    if el_src(pg,'menu')!='airy.mp3': fails.append('menu track is not airy.mp3')
    print('page2 errs',R.errs[:10])
    pg.context.close()

    # ---- page 3: mission 2 transit cine -> story mood (transmission) ----
    pg=R.page(1280,720,'?go&m=2')
    pg.keyboard.press('KeyW')
    steps=pg.evaluate(UNTIL_CINE)
    if steps is None or steps<0: fails.append('mission 2 never reached the transit cine')
    until(pg,'__game.MUS.want==="story"','no story mood in the transit cine')
    if el_src(pg,'story')!='transmission.mp3': fails.append('story track is not transmission.mp3')
    print('page3 errs',R.errs[:10])
    pg.context.close()

    # ---- page 4: ?mute -> no track ever starts ----
    pg=R.page(1280,720,'?go&m=1&mute')
    pg.keyboard.press('KeyW')
    until(pg,'__game.MUS.started===true','keydown did not set MUS.started (mute page)')
    pg.evaluate(WARMUP)
    until(pg,'__game.game.mstate && __game.game.mstate.t>0.5','no sim steps ran on the mute page')
    if pg.evaluate('Object.keys(__game.MUS.el).length')!=0:
        fails.append('?mute: music elements created: %r'%pg.evaluate('Object.keys(__game.MUS.el)'))
    print('page4 errs',R.errs[:10])

print('FAILURES:' if fails else 'ALL MUSIC CHECKS PASS')
for f in fails: print(' -',f)
