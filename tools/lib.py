import subprocess, time, json
from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/e65dd804-c27c-598e-91ce-d747b4731242/scratchpad/shot'
def prep():
    src=open('/home/claude/game-space/index.html').read()
    src=src.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js','/node_modules/three/build/three.module.js')
    src=src.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/','/node_modules/three/examples/jsm/')
    open(SP+'/index.html','w').write(src)
class Runner:
    def __enter__(self):
        prep()
        self.srv=subprocess.Popen(['python3','-m','http.server','8765','-d',SP],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        time.sleep(1)
        self.pw=sync_playwright().start()
        self.b=self.pw.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
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
