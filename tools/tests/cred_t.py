from lib import *
with Runner() as R:
    pg=R.page(1280,720,''); pg.wait_for_timeout(1500)
    print('title',pg.title(), 'btn', pg.locator('#bcred').count())
    pg.click('#bcred'); pg.wait_for_timeout(300); pg.screenshot(path='cred_brief.png')
    print('open',pg.evaluate("getComputedStyle(document.getElementById('cred')).display"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    print('closed',pg.evaluate("getComputedStyle(document.getElementById('cred')).display"))
    print(R.errs[:4])
