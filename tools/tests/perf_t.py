from lib import *
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&q=low&fps')
    p.evaluate('() => { __game.__paused=true; __game.perfReset(); for(let i=0;i<999;i++) __game.perfRecord(10); __game.perfRecord(20); }')
    s=p.evaluate('() => __game.perfSummary()')
    assert s['count']==1000 and abs(s['avg']-10.01)<1e-6 and s['p95']==10 and s['worst']==20
    assert len(s['windows'])==1 and s['windows'][0]['count']==999 and s['windows'][0]['worst']==10
    p.evaluate('() => {__game.perfReset(); __game.perfRecord(21000)}')
    z=p.evaluate('() => __game.perfSummary()')
    assert len(z['windows'])==2 and all(w['count']==0 for w in z['windows'])
    p.evaluate('() => {__game.perfReset(); for(let i=0;i<19;i++) __game.perfRecord(10); __game.perfRecord(2500); __game.perfRecord(3000)}')
    assert p.evaluate('() => __game.perfSummary().p95') == 2500
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
with Runner() as r:
    p=r.page(1280,720,'?go&q=low')
    a=p.evaluate('''() => {const g=__game, p=new g.Particles(2,1,false), v=new g.THREE.Vector3();
      const initial=p.geo.attributes.position.version; p.update(.1); const empty=p.geo.attributes.position.version;
      p.emit(v,v,.1,[1,1,1,1],[0,0,0,0]); p.emit(v,v,.2,[1,1,1,1],[0,0,0,0]); p.emit(v,v,.3,[1,1,1,1],[0,0,0,0]);
      const active=p.activeCount; p.update(.4); const dead=p.activeCount, version=p.geo.attributes.position.version;
      p.update(.4); const after=p.geo.attributes.position.version;
      g.scene.remove(p.points); p.geo.dispose(); p.points.material.dispose();
      return {initial,empty,active,dead,version,after};}''')
    assert a['initial']==a['empty'] and a['active']==2 and a['dead']==0 and a['version']==a['after']
    assert p.evaluate('''() => {const v=__game.player.vox,d=v.data; return v.solid.every((x,i)=>x===(d.grid[i]>=0?1:0)) && v.hasInst.every((x,i)=>x===(d.cellToVox[i]>=0?1:0));}''')
    assert_no_console_errors(r)
print('PARTICLE IDLE AND VOXEL MASKS OK')
