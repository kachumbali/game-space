import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8767','-d',REPO+'/docs/prototypes'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1280,'height':800})
    pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8767/cutscene_poc.html?fast'); pg.wait_for_timeout(500)
    for _ in range(3): pg.keyboard.press('Space'); pg.wait_for_timeout(300)
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/mid.png')
    # advance to choice
    for _ in range(6):
        if pg.locator('#ch button').count() and pg.locator('#ch').is_visible(): break
        pg.keyboard.press('Space'); pg.wait_for_timeout(250)
    print('choice visible',pg.locator('#ch').is_visible())
    pg.screenshot(path=REPO+'/docs/prototypes/cutscene_poc.png')
    pg.keyboard.press('2'); pg.wait_for_timeout(300)
    for _ in range(4): pg.keyboard.press('Space'); pg.wait_for_timeout(250)
    print('done',pg.evaluate('window.__sceneDone'),pg.inner_text('#endinfo'))
    pg.goto('http://localhost:8767/cutscene_poc.html?crew=sparrow-kia&fast'); pg.wait_for_timeout(300); pg.keyboard.press('s'); print('skip',pg.evaluate('window.__sceneDone'))
    pg2=b.new_page(viewport={'width':390,'height':844}); pg2.goto('http://localhost:8767/cutscene_poc.html?fast'); pg2.wait_for_timeout(600); pg2.screenshot(path='/tmp/phone.png')
    b.close()
srv.terminate();print('errors',errs)
