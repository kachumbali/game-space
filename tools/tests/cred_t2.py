from lib import *
with Runner() as R:
    pg2=R.page(844,390,'?go'); pg2.wait_for_timeout(1200)
    pg2.keyboard.press('KeyO'); pg2.wait_for_timeout(200); pg2.click('#o_cred'); pg2.wait_for_timeout(300); pg2.screenshot(path='cred_phone.png')
    pg2.keyboard.press('Escape'); pg2.wait_for_timeout(200)
    print('after esc: cred',pg2.evaluate("getComputedStyle(document.getElementById('cred')).display"),'opts',pg2.evaluate("getComputedStyle(document.getElementById('opts')).display"))
    print(R.errs[:4])
