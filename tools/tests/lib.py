import subprocess, time, json, os, glob, shutil
from playwright.sync_api import sync_playwright
# Portable test harness. Serves a patched copy of index.html (three.js from a local node_modules, because the CDN is not reachable in the sandbox).
# First run installs three@0.170.0 into GS_TEST_DIR (needs npm). Override GS_TEST_DIR / GS_CHROMIUM if your paths differ.
REPO=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
SP=os.environ.get('GS_TEST_DIR','/tmp/gs_test')
def prep():
    os.makedirs(SP,exist_ok=True)
    if not os.path.isdir(SP+'/node_modules/three'):
        subprocess.run(['npm','install','--prefix',SP,'three@0.170.0'],check=True,stdout=subprocess.DEVNULL)
    if not os.path.exists(SP+'/audio') and os.path.isdir(REPO+'/audio'): os.symlink(REPO+'/audio',SP+'/audio')
    src=open(REPO+'/index.html').read()
    src=src.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js','/node_modules/three/build/three.module.js')
    src=src.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/','/node_modules/three/examples/jsm/')
    open(SP+'/index.html','w').write(src)
def chromium():
    if os.environ.get('GS_CHROMIUM'): return os.environ['GS_CHROMIUM']
    c=glob.glob(os.environ.get('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')+'/chromium-*/chrome-linux/chrome')
    return c[0] if c else None
class Runner:
    def __enter__(self):
        prep()
        self.srv=subprocess.Popen(['python3','-m','http.server','8765','-d',SP],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        time.sleep(1)
        self.pw=sync_playwright().start()
        self.b=self.pw.chromium.launch(executable_path=chromium(),
          args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-gl=angle'])
        self.errs=[]
        return self
    def page(self,w,h,q='',touch=False):
        ctx=self.b.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch)
        pg=ctx.new_page()
        pg.on('console',lambda m: self.errs.append((m.type,m.text)) if m.type in('error','warning') and '404' not in m.text and 'GPU stall' not in m.text and 'swiftshader' not in m.text.lower() else None)
        pg.on('pageerror',lambda e: self.errs.append(('pageerror',str(e))))
        pg.goto('http://localhost:8765/index.html'+q); pg.wait_for_function('window.__game!==undefined',timeout=30000)
        pg.add_style_tag(content='#msg{display:none!important}')
        return pg
    def __exit__(self,*a):
        self.b.close(); self.pw.stop(); self.srv.terminate()
# place enemy relative to player: distance d along forward, offsets, yaw/pitch of enemy
PLACE='''([d,ox,oy,yaw,pitch,idx])=>{const g=__game;const es=g.ships.filter(s=>s.team===1);const e=es[idx||0];const P=g.player;
  es.forEach(x=>{if(x!==e){x.group.position.set(5000,0,5000);}});
  const f=new g.THREE.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
  e.group.position.copy(P.group.position).addScaledVector(f,d).add(new g.THREE.Vector3(ox,oy,0));
  e.vel.set(0,0,0);
  e.group.lookAt(P.group.position); e.group.rotateY(Math.PI); e.group.rotateY(yaw||0); e.group.rotateX(pitch||0);
  e.group.updateMatrixWorld(true);}'''
