# Owner report 2026-11-10: the music vanished as soon as a sound played. Warning cues used to mute it; now real-danger cues duck it and it recovers.
from lib import *
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
with Runner() as R:
    pg = R.page(1280, 720, '?free&go&q=low'); pg.wait_for_timeout(1500)
    pg.keyboard.press('KeyV'); pg.wait_for_timeout(800)          # a key press unlocks audio and starts the music
    r = pg.evaluate("""()=>{const g=__game,A=g.AUDIO,M=g.MUS,O=g.AOPT; if(!A.ctx) return {noctx:true};
      __paused=true; const tick=n=>{for(let i=0;i<n;i++)g.musicTick(0.1)};
      A.criticalUntil=0; tick(40); const k=M.want, full=M.vol[k];
      const c0=A.criticalUntil; g.sfx('lowenergy'); g.sfx('warn'); const routine=A.criticalUntil===c0;
      g.sfx('alarm'); const danger=A.criticalUntil>A.ctx.currentTime;
      A.criticalUntil=A.ctx.currentTime+60; tick(10); const ducked=M.vol[k];
      A.criticalUntil=0; tick(10); const back=M.vol[k];
      return {k,full,ducked,back,vol:O.musicVol,duck:g.MUSIC_DUCK,routine,danger};}""")
    print(r)
    if r.get('noctx'):
        print('SKIP: no audio context in this browser'); raise SystemExit(0)
    check('music reaches its set level', abs(r['full'] - r['vol']) < 0.02, r['full'])
    check('routine cues (low energy, lock warning) do not duck the music', r['routine'])
    check('a danger cue ducks it', r['danger'])
    check('ducked music is quieter but still audible', abs(r['ducked'] - r['vol'] * r['duck']) < 0.03 and r['ducked'] > 0.1 * r['vol'], r['ducked'])
    check('it recovers within a second', abs(r['back'] - r['vol']) < 0.02, r['back'])
    check('no console errors', not [e for e in R.errs if e[0] != 'http'], R.errs[:2])
print('MUSIC DUCK OK' if ok else 'MUSIC DUCK FAIL'); raise SystemExit(0 if ok else 1)
