#!/usr/bin/env python3
"""Exercise R3 convoy loss outcomes through the mission and debrief UI."""
from lib import Runner

def run_case(page, losses):
    page.goto(page.url.split('/index.html')[0] + '/index.html?campaign=long_retreat&m=3&go&seed=1&nobloom', timeout=120000)
    page.wait_for_function('window.__game && __game.game.mission && __game.state === "play"', timeout=120000)
    return page.evaluate('''losses => {
      const g=__game; __paused=true;
      g.player.structure=1e9; g.game.anchor.structure=1e9;
      for(let i=0;i<100;i++) g.update(0.05);
      const C=g.game.mstate.convoy;
      if (!C || C.entries.length !== 2) throw Error('R3 convoy did not start');
      for(let i=0;i<losses;i++) g.destroy(C.entries[i].ship);
      // Remove hostile waves to isolate convoy and debrief behavior.
      for(let i=0;i<7600 && !g.game.mstate.ended;i++) {
        for(const e of g.ships) if(e.team===1 && e.alive && !e.dying) g.destroy(e);
        g.update(0.05);
      }
      for(let i=0;i<100;i++) g.update(0.05);
      const S=g.game.mstate, brief=document.getElementById('brief');
      return {ended:S.ended, result:S.result, passengers:S.convoy.passengers,
        statuses:S.convoy.entries.map(e=>e.status), title:brief.querySelector('h1')?.textContent,
        text:brief.innerText, next:!!brief.querySelector('#bnext')};
    }''', losses)

with Runner() as runner:
    page = runner.page(640, 360, '?campaign=long_retreat&m=3&go&seed=1&nobloom')
    partial = run_case(page, 1)
    print('partial', partial, flush=True)
    assert partial['ended'] and partial['result'] == 'partial' and partial['title'] == 'PARTIAL SUCCESS'
    assert partial['statuses'].count('lost') == 1 and partial['statuses'].count('escaped') == 1
    assert partial['passengers'] == 1000 and '1000' in partial['text'] and partial['next']
    page.context.close()
    page = runner.page(640, 360, '?campaign=long_retreat&m=3&go&seed=1&nobloom')
    loss = run_case(page, 2)
    print('full loss', loss, flush=True)
    assert loss['ended'] and loss['result'] == 'lose' and loss['title'] == 'MISSION FAILED'
    assert loss['statuses'].count('lost') == 2 and loss['passengers'] == 0
    assert 'Passengers evacuated' in loss['text'] and '0' in loss['text']
    assert not loss['next']
    assert not runner.errs, runner.errs
print('retreat convoy debrief: OK')
