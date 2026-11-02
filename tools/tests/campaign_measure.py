#!/usr/bin/env python3
"""Measure all thirteen authored missions with the existing campaign pilot bot.

One page at a time. Results include unfinished runs separately from losses.
Usage: python3 tools/tests/campaign_measure.py [seed-count] [output.json]
"""
import ast
import json
import os
import sys
from pathlib import Path
from lib import Runner

source = ast.parse(Path(__file__).with_name('campaign_t.py').read_text())
simple_bot = next(ast.literal_eval(n.value) for n in source.body
           if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'BOT' for t in n.targets))
# Prologue missions need not have a capital anchor.
simple_bot = simple_bot.replace('Math.round(100*g.game.anchor.structure/g.game.anchor.def.structure)',
                  'g.game.anchor ? Math.round(100*g.game.anchor.structure/g.game.anchor.def.structure) : null')
bot_name = os.environ.get('BOT', 'simple')
if bot_name not in ('simple', 'good'):
    raise SystemExit('BOT must be simple or good')
bot = simple_bot if bot_name == 'simple' else Path(__file__).with_name('pilot_good.js').read_text()
count = int(sys.argv[1]) if len(sys.argv) > 1 else 20
output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('campaign_measure.json')
results = []
with Runner() as runner:
    for campaign, number in [('prologue', 4), ('long_retreat', 4), ('severed_node', 5)]:
        if os.environ.get('CM_ONLY') and campaign not in os.environ['CM_ONLY'].split(','): continue
        for mission in range(1, number + 1):
            for seed in range(1, count + 1):
                for context in list(runner.b.contexts): context.close()
                runner.errs.clear()
                page = runner.page(640, 360, f'?go&campaign={campaign}&m={mission}&seed={seed}&nobloom')
                page.evaluate('()=>{__paused=true}')
                for _ in range(120):
                    page.evaluate(bot, 200)
                    status = page.evaluate("()=>({state:__game.state,ended:__game.game.mstate.ended,result:__game.game.mstate.result,why:__game.game.mstate.why,t:__game.game.mstate.t,prompt:document.getElementById('jumpPrompt')?.style.display})")
                    if status['ended']: break
                    if status['state'] == 'cine': page.keyboard.press('Space')
                    if status['prompt'] == 'block': page.keyboard.press('KeyX')
                result = dict(bot=bot_name, campaign=campaign, mission=mission, seed=seed, **status, errors=runner.errs[:])
                results.append(result)
                output.write_text(json.dumps(results, indent=2))
                print(result, flush=True)
for campaign, number in [('prologue', 4), ('long_retreat', 4), ('severed_node', 5)]:
    for mission in range(1, number + 1):
        rows = [r for r in results if r['campaign'] == campaign and r['mission'] == mission]
        losses = sum(r['ended'] and r['result'] == 'lose' for r in rows)
        unfinished = sum(not r['ended'] for r in rows)
        print(f'{campaign} {mission}: {losses}/{len(rows)} losses; {unfinished} unfinished')
print(f'{len(results)} runs written to {output}')
