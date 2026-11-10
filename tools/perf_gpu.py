"""Headed Chrome/Metal opening-flight sampler. Run from repo root; see docs/PERF_REPORT.md."""
import os,sys,json,time,subprocess
from pathlib import Path
os.environ.setdefault('GS_TEST_DIR', '/tmp/gs_perfdata')
os.environ.setdefault('GS_PORT', '8767')
sys.path.insert(0,'tools/tests')
from lib import prep
from playwright.sync_api import sync_playwright
prep()
server=subprocess.Popen([sys.executable,'tools/tests/serve.py',os.environ['GS_TEST_DIR'],os.environ['GS_PORT']],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
cases=[('p01','?campaign=prologue&m=1&go'),('p02','?campaign=prologue&m=2&go'),('p03','?campaign=prologue&m=3&go'),('p04','?campaign=prologue&m=4&go'),('r04','?campaign=long_retreat&m=4&go'),('hecla','?sk=darter:8&skh=hecla:1&sk_wing=2&sk_range=2000')]
if len(sys.argv)>1: cases=[c for c in cases if c[0]==sys.argv[1]]
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=False,executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args=['--no-first-run','--no-default-browser-check','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
  for w,h,touch in [(1440,900,False),(1180,820,True)]:
   for name,query in cases:
    ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch,device_scale_factor=1)
    ctx.add_init_script("localStorage.setItem('gs_tutorial_p01','done');")
    page=ctx.new_page(); errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://localhost:'+os.environ['GS_PORT']+'/index.html'+query+'&fps&seed=42',timeout=120000)
    page.wait_for_function('window.__game!==undefined',timeout=120000)
    gpu=page.evaluate("""() => {const g=document.querySelector('#c').getContext('webgl2');const e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)}""")
    if 'SwiftShader' in gpu or 'Apple' not in gpu: raise RuntimeError('Hardware GPU not verified: '+gpu)
    page.wait_for_timeout(5000)
    before=page.evaluate('()=>{__game.perfReset();return __game.perfDiagnostics()}')
    page.wait_for_timeout(25500)
    after=page.evaluate('''() => ({perf:__game.perfSummary(),diag:__game.perfDiagnostics(),state:__game.state,mission:__game.game.mission?.id,stage:__game.game.mstate?.stage,simTime:__game.game.mstate?.t,viewport:[innerWidth,innerHeight,devicePixelRatio]})''')
    costs={k:after['diag']['costs'][k]-before['costs'][k] for k in ['hudSum','renderSum','frames','callsSum']}
    row=dict(name=name,width=w,height=h,touch=touch,gpu=gpu,before=before,after=after,costs=costs,errors=errors)
    results.append(row);Path(os.environ.get('GS_PERF_OUTPUT', '/tmp/gpu-results.json')).write_text(json.dumps(results,indent=2))
    print(json.dumps({'case':name,'size':[w,h],'perf':after['perf'],'simTime':after['simTime'],'state':after['state'],'costs':costs,'ships':after['diag']['ships'],'errors':errors}),flush=True)
    ctx.close()
  browser.close()
finally: server.terminate()
