import os,sys,json,subprocess
from playwright.sync_api import sync_playwright
os.environ.setdefault('GS_TEST_DIR','/tmp/gs_perfdata');os.environ.setdefault('GS_PORT','8767')
sys.path.insert(0,'tools/tests');from lib import prep
prep();server=subprocess.Popen([sys.executable,'tools/tests/serve.py',os.environ['GS_TEST_DIR'],os.environ['GS_PORT']],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=False,executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args=['--no-first-run','--disable-backgrounding-occluded-windows'])
  for name,q in [('p04','?campaign=prologue&m=4&go'),('hecla','?sk=darter:8&skh=hecla:1&sk_wing=2')]:
   ctx=b.new_context(viewport={'width':1440,'height':900});p=ctx.new_page();p.goto('http://localhost:8767/index.html'+q+'&fps&seed=42',timeout=120000);p.wait_for_function('window.__game');p.wait_for_timeout(4000)
   c=ctx.new_cdp_session(p);c.send('HeapProfiler.enable');c.send('HeapProfiler.startSampling',{'samplingInterval':16384,'includeObjectsCollectedByMajorGC':True,'includeObjectsCollectedByMinorGC':True});p.evaluate('()=>__game.perfReset()');p.wait_for_timeout(18000); frames=p.evaluate('()=>__game.perfSummary()?.count || 0');profile=c.send('HeapProfiler.stopSampling')['profile']
   def walk(n): return n.get('selfSize',0)+sum(walk(x) for x in n.get('children',[]))
   total=walk(profile['head']);print(json.dumps({'scenario':name,'sampled_estimated_bytes':total,'frames':frames,'bytes_per_frame':total/frames if frames else None,'samples':len(profile.get('samples',[]))}),flush=True);ctx.close()
  b.close()
finally: server.terminate()
