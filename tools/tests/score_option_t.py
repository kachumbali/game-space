"""Orchestral score option: switching the option rebuilds the music elements from the new files; classic stays the default; slots the score lacks keep the classic file."""
from lib import *
FAILS = []
def ck(n, ok, d=''):
    print(('PASS ' if ok else 'FAIL ') + n + (f' {d}' if d else ''), flush=True)
    if not ok: FAILS.append(n)
with Runner() as R:
    pg = R.page(1280, 720, '?free&n=0&q=mid&seed=8'); pg.wait_for_timeout(500)
    r = pg.evaluate("""()=>{const g=__game; return {score:g.AOPT.score, patrol:g.musFile('patrol'), hive:g.musFile('hive')}}""")
    ck('default score is classic', r['score'] == 'classic' and 'situation-patrol' in r['patrol'], r)
    r = pg.evaluate("""()=>{const g=__game; g.musScoreSet('orchestral'); return {score:g.AOPT.score, patrol:g.musFile('patrol'), win:g.musFile('win'), hive:g.musFile('hive'), el:Object.keys(g.MUS.el).length}}""")
    ck('orchestral selects score-* files', r['score'] == 'orchestral' and 'score-patrol' in r['patrol'] and 'score-win' in r['win'], r)
    ck('slots without a score keep the classic track', 'situation-hive' in r['hive'], r['hive'])
    pg.evaluate("()=>__game.musicUnlock && 0")
    rr = pg.evaluate("""async()=>{const out={};for(const k of ['title','menu','patrol','tension','combat','heavy','capital','boss','win','loss']){const u=__game.musFile(k);const r=await fetch(u,{method:'HEAD'});out[k]=r.status;}return out}""")
    ck('all ten score files are served', all(v == 200 for v in rr.values()), rr)
    r = pg.evaluate("""()=>{const g=__game; g.musScoreSet('classic'); return g.musFile('boss')}""")
    ck('switch back to classic', 'situation-bullfrog' in r, r)
    assert_no_console_errors(R)
raise SystemExit(1 if FAILS else 0)
