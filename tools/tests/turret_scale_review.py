import os,sys,json,subprocess
from lib import Runner
phase=sys.argv[1]
if phase == 'compare':
 from pathlib import Path
 from PIL import Image, ImageDraw
 root=Path(__import__('os').environ.get('GS_SHOTS', '/tmp/gs_shots')) / 'turret-scale'
 for before in (root/'before').glob('*.png'):
  after=root/'after'/before.name
  if not after.exists(): continue
  a,b=Image.open(before).convert('RGB'),Image.open(after).convert('RGB')
  im=Image.new('RGB',(a.width+b.width,max(a.height,b.height)+32),(15,23,28))
  im.paste(a,(0,32));im.paste(b,(a.width,32));draw=ImageDraw.Draw(im)
  draw.text((12,8),'BEFORE',fill='white');draw.text((a.width+12,8),'AFTER',fill='white')
  im.save(root/(before.stem+'-compare.png'),optimize=True)
 sys.exit(0)
out=__import__('os').environ.get('GS_SHOTS', '/tmp/gs_shots') + '/turret-scale/'+phase
os.makedirs(out,exist_ok=True)
ids=sys.argv[2:] or ['exeter','halberd','hecla','bullfrog','gulper','falchion','liner','destroyer','bittern','hivecarrier']
with Runner() as R:
 if phase=='before':
  base=subprocess.check_output(['git','show','origin/main:index.html'],text=True)
  base=base.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js','/node_modules/three/build/three.module.js').replace('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/','/node_modules/three/examples/jsm/')
  open(os.path.join(os.environ.get('GS_TEST_DIR','/tmp/gs_test'),'index.html'),'w').write(base)
 p=R.page(1280,720,'?free&n=0&nobloom&q=low&seed=1');p.add_style_tag(content='body>div,canvas:not(#c){display:none!important}')
 for ship in ids:
  info=p.evaluate('''id=>{const g=__game,T=g.THREE;globalThis.__paused=true;if(window.subject){window.subject.alive=false;g.scene.remove(window.subject.group)};for(const s of g.ships)s.group.visible=false;const d=g.SHIPS[id];if(!d)return null;const s=g.spawnShip(id,0,new T.Vector3(0,0,0),null,{});s.group.quaternion.identity();s.vel.set(0,0,0);s.group.visible=true;window.subject=s;s.group.updateMatrixWorld(true);return {length:d.length,cls:d.cls,turrets:s.turrets.map(t=>({cls:t.cls,dia:t.dia,pos:t.def.pos,tip:s.group.worldToLocal(t.head.localToWorld(t.muzzles[0].clone())).toArray()}))};}''',ship)
  if not info: print(ship,'missing',flush=True);continue
  open(out+'/'+ship+'.json','w').write(json.dumps(info))
  if info['cls'] not in ('capital','frigate','corvette'):print(ship,'numeric only',flush=True);continue
  baseline=info if phase=='before' else json.load(open(__import__('os').environ.get('GS_SHOTS', '/tmp/gs_shots') + '/turret-scale/before/'+ship+'.json'))
  base=next((x for x in baseline['turrets'] if ship=='hecla' and x['cls']=='M' and x['pos'][0]>100),None) or next((x for x in baseline['turrets'] if x['cls']=='L'),None) or next((x for x in baseline['turrets'] if x['cls']=='M'),None) or (baseline['turrets'][0] if baseline['turrets'] else None)
  distance=max(25,base['dia']*3) if base else 100
  for label,wh in [('desktop',(1280,720)),('phone',(844,390))]:
   p.set_viewport_size({'width':wh[0],'height':wh[1]})
   for dist in ('close','300m'):
    p.evaluate('''([dist,close])=>{const g=__game,T=g.THREE,s=subject,t=s.turrets.find(x=>s.def.id==='hecla'&&x.cls==='M'&&x.def.pos[0]>100)||s.turrets.find(x=>x.cls==='L')||s.turrets.find(x=>x.cls==='M')||s.turrets[0],pos=t?new T.Vector3(...t.def.pos):new T.Vector3(0,0,-s.def.length*.4),radius=dist==='300m'?300:close;const dir=new T.Vector3(.55,.6,-.58).normalize();g.camera.fov=dist==='300m'?75:45;g.camera.updateProjectionMatrix();g.camera.position.copy(pos).addScaledVector(dir,radius);g.camera.lookAt(pos);g.camera.updateMatrixWorld(true)}''',[dist,distance])
    p.wait_for_timeout(150);p.screenshot(path=f'{out}/{ship}_{label}_{dist}.png',timeout=120000)
  print(ship,'captured',flush=True)
 print('errors',R.errs[:5],flush=True)
