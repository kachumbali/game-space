# Gate smoke test (docs/ROADMAP.md): every mode the demo needs must load and reach its state with no console error, on a desktop and an iPad-sized
# touch screen. Fast on purpose (one page per case, no combat); deeper tests stay in their own scripts. Phones are not a target (owner 2026-11-09).
from lib import *
CASES = [  # (url, expected state, width, height, touch)
    ('', 'brief', 1280, 720, False),                                   # main menu
    ('?campaign=prologue&m=1&go&q=low', 'play', 1280, 720, False),     # the demo slice
    ('?campaign=prologue&m=1&go&q=low', 'play', 1180, 820, True),      # iPad landscape, touch
    ('?campaign=long_retreat&m=1&go&q=low', 'play', 1280, 720, False),
    ('?go&m=1&q=low', 'play', 1280, 720, False),                       # Severed Node
    ('?free&go&q=low', 'play', 1280, 720, False),
    ('?sk=darter:2,gulper:1&sk_wing=1&sk_ship=falchion&go&q=low', 'play', 1280, 720, False),
    ('?sv=1&sv_seed=42&q=low', 'play', 1280, 720, False),              # Gauntlet
]
fails = []
for u, want, w, h, touch in CASES:
    with Runner() as R:
        pg = R.page(w, h, u, touch=touch); pg.wait_for_timeout(2500)
        st = pg.evaluate("()=>__game.state")
        pg.evaluate("()=>{__game.__paused=true;for(let i=0;i<40;i++)__game.update(0.05);__game.__paused=false}") if st == 'play' else None
        errs = [e for e in R.errs if not (e[0] == 'http' and 'favicon' in str(e))]
        ok = st in (want, 'cine') and not errs
        print(('PASS ' if ok else 'FAIL ') + (u or '(menu)') + (' [touch]' if touch else ''), st, errs[:2])
        if not ok: fails.append(u)
print('SMOKE OK' if not fails else 'SMOKE FAIL ' + str(fails))
raise SystemExit(1 if fails else 0)
