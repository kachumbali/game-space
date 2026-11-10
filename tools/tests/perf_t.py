from lib import *
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&q=low&fps')
    p.evaluate('() => { __game.__paused=true; __game.perfReset(); for(let i=0;i<999;i++) __game.perfRecord(10); __game.perfRecord(20); }')
    s=p.evaluate('() => __game.perfSummary()')
    assert s['count']==1000 and abs(s['avg']-10.01)<1e-6 and s['p95']==10 and s['worst']==20
    assert len(s['windows'])==1 and s['windows'][0]['worst']==20
    assert 'slowest 10s' in p.evaluate('() => __game.perfReportLine()')
    p.evaluate('() => __game.plogReset("test")')
    assert p.evaluate('() => __game.perfSummary()') is None
    assert_no_console_errors(r)
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&q=low')
    p.wait_for_timeout(1000)
    assert p.evaluate('() => __game.perfSummary()') is None
    assert_no_console_errors(r)
print('PERF RECORDER OK')
