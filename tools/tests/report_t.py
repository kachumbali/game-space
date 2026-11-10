"""Report lifecycle, privacy and touch parity. Run after build.py, one browser at a time."""
from lib import *

for touch, w, h in [(False, 1280, 720), (True, 1180, 820)]:
    with Runner() as r:
        init = '''Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText: async s => {window.copiedReport=s}}});'''
        p = r.page(w, h, '?campaign=prologue&m=1&go&q=low', touch=touch, init_script=init)
        p.evaluate('''() => { localStorage.removeItem('gs_reports'); __game.__paused=true;
          __game.player.mounts.forEach(m=>m.cool=0); __game.player.energy=10000; __game.fireGuns(__game.player, 7); __game.pauseToggle(true); __game.updateHud(); }''')
        p.wait_for_selector('#pauseOv textarea', state='visible')
        p.fill('#pauseOv textarea', 'Alarm was too loud\nand frequent')
        p.click('#pauseOv .report-copy')
        copied = p.evaluate('window.copiedReport')
        assert 'Campaign / mission: prologue / p01' in copied
        assert f"Device: {'touch' if touch else 'desktop'} · {w}x{h}" in copied
        assert 'What annoyed you: Alarm was too loud and frequent' in copied
        assert len(copied.splitlines()) < 60
        assert p.evaluate('Object.keys(__game.REPORT.weapons).length') > 0
        p.evaluate('''() => { __game.pauseToggle(false); __game.endMission('lose','test'); __game.showDebrief(); }''')
        assert p.locator('#brief .report-copy').count() == 1
        assert p.locator('#brief textarea').input_value().startswith('Alarm')
        p.fill('#brief textarea', 'Changed at debrief')
        assert p.evaluate("__game.reportHistory()[0].text.includes('Changed at debrief')")
        assert p.evaluate("__game.reportHistory()[0].text.includes('Result: lose')")
        # Clipboard refusal must leave an explicit download action available.
        p.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText: async () => {throw Error('refused')}}})")
        p.click('#brief .report-copy')
        assert 'DOWNLOAD REPORT' in p.locator('#brief .report-status').inner_text()
        with p.expect_download() as download:
            p.click('#brief .report-download')
        assert download.value.suggested_filename.endswith('.txt')
        # The same session is updated in place; old sessions are capped at ten.
        names = p.evaluate('''() => { const g=__game; for(let i=0;i<12;i++) {g.reportReset();g.REPORT.note='run '+i;g.reportArchive('exit');} return g.reportHistory().map(r=>r.text.match(/What annoyed you: (.*)/)[1]); }''')
        assert names == [f'run {i}' for i in range(11,1,-1)]
        with p.expect_download() as download:
            p.click('#brief .report-history')
        assert download.value.suggested_filename == 'space-commander-reports.txt'
        saved = open(download.value.path(), encoding='utf8').read()
        assert 'run 11' in saved and 'run 2' in saved and 'run 1\n' not in saved
        assert_no_console_errors(r)
        print('PASS report lifecycle', 'touch' if touch else 'desktop')

# Exit to menu records an exit before the world is reset.
with Runner() as r:
    p = r.page(1280, 720, '?campaign=prologue&m=1&go&q=low')
    p.evaluate("() => {localStorage.removeItem('gs_reports'); __game.pauseToggle(true); __game.pauseExit();}")
    assert p.evaluate("__game.reportHistory()[0].text.includes('Result: exit')")
    assert p.evaluate("__game.reportHistory()[0].text.includes('prologue / p01')")
    assert_no_console_errors(r)
    print('PASS exit report')
# A fatal hit still captures its final values and a destroyed wingman remains listed.
with Runner() as r:
    p = r.page(1280, 720, '?campaign=prologue&m=1&go&q=low')
    result = p.evaluate("""() => {const g=__game;g.__paused=true;
      const wing=g.ships.find(s=>s.pilot && s!==g.player && s.team===0);g.destroy(wing);
      const enemy=g.ships.find(s=>s.team===1) || g.makeShip('darter',1,new g.THREE.Vector3(0,0,-500),new g.THREE.Quaternion(),{});
      g.hitSrc=enemy;g.hitKind='gun';g.applyHit(g.player,new g.THREE.Vector3(0,0,0),100000,g.player.group.position.clone());
      return {wing:g.REPORT.wing, hull:g.REPORT.hull, damage:g.REPORT.damage}; }""")
    assert 'lost' in result['wing'].values() and result['hull'] == 0 and result['damage']
    assert_no_console_errors(r)
    print('PASS fatal hit and wing status')

for query, call in [('?sk=darter:1&go&q=low', '__game.showSkirmishDebrief()'), ('?sv=1&q=low', '__game.svShowDebrief()')]:
    with Runner() as r:
        p = r.page(1280,720,query)
        p.evaluate('() => {' + call + '}')
        assert p.locator('#brief .report-copy').count() == 1
        assert p.evaluate('__game.reportHistory().length') == 1
        assert_no_console_errors(r)
        print('PASS debrief', query.split('=')[0])
print('REPORT OK')
