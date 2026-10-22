"""Muzzle / turret audit. For every ship with weapons: (1) numeric: distance from each fixed mount `pos` (and launch point) to the nearest solid voxel,
whether the point is inside the hull, and how far in front of the model the muzzle sits; turret base distance to the hull and turret-comp radius vs visible turret size;
(2) screenshots with markers (mount = red, launch = yellow, turret barrel tip = green, turret base = blue) in $GS_SHOTS/ships/.
Usage: GS_PORT=8813 GS_TEST_DIR=/tmp/gs_test_mz python3 muzzle_t.py [shipid ...]   (no args = all)"""
import os, sys, json
from lib import *
SHOTS = os.environ.get('GS_SHOTS', '/tmp/gs_shots') + '/ships'; os.makedirs(SHOTS, exist_ok=True)
IDS = sys.argv[1:] or ['kestrel', 'halberd', 'exeter', 'drone', 'darter', 'leaper', 'spitter', 'toad', 'reaver', 'gulper', 'hivecarrier']
SETUP = '''(id)=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
 for(const s of g.ships){if(s!==P){s.alive=false;s.dying=0;s.group.visible=false;g.scene.remove(s.group);}}
 g.ships.splice(0,g.ships.length,P);P.group.position.set(0,0,90000);P.group.visible=false;
 if(window.__mk){window.__mk.forEach(m=>g.scene.remove(m));}window.__mk=[];
 const S=g.spawnShip(id,1,new T.Vector3(0,0,0),new T.Vector3(0,0,-1000),{});S.group.quaternion.identity();S.group.updateMatrixWorld(true);
 S.vel.set(0,0,0);S.ai.hold=true;
 const V=S.vox,D=V.data;const near=(p,R)=>{let best=1e9;const ci=Math.floor((p.x+D.hx)/D.vs),cj=Math.floor((p.y+D.hy)/D.vs),ck=Math.floor((p.z+D.hz)/D.vs);const n=Math.ceil(R/D.vs);
  for(let i=ci-n;i<=ci+n;i++)for(let j=cj-n;j<=cj+n;j++)for(let k=ck-n;k<=ck+n;k++){if(i<0||j<0||k<0||i>=D.nx||j>=D.ny||k>=D.nz)continue;if(!V.solid[(i*D.ny+j)*D.nz+k])continue;
   const d=Math.hypot((i+.5)*D.vs-D.hx-p.x,(j+.5)*D.vs-D.hy-p.y,(k+.5)*D.vs-D.hz-p.z);if(d<best)best=d;}return best;};
 const inside=p=>{const i=Math.floor((p.x+D.hx)/D.vs),j=Math.floor((p.y+D.hy)/D.vs),k=Math.floor((p.z+D.hz)/D.vs);return i>=0&&j>=0&&k>=0&&i<D.nx&&j<D.ny&&k<D.nz&&V.solid[(i*D.ny+j)*D.nz+k]===1};
 const R=S.def.radius,mk=(p,c,r)=>{const m=new T.Mesh(new T.SphereGeometry(r,10,8),new T.MeshBasicMaterial({color:c,depthTest:false,transparent:true,opacity:.9}));m.renderOrder=50;m.position.copy(p);g.scene.add(m);window.__mk.push(m);};
 const out={id,len:S.def.length,vs:D.vs,mounts:[],turrets:[],launch:null};const mr=Math.max(0.12,R/160);
 for(const m of S.mounts){const p=new T.Vector3(...m.pos);const w=g.WEAPONS[m.w];
  // forward clearance: free path of 8 m ahead of the muzzle; barrel behind: nearest solid within R
  let fw=1e9;for(let z=0;z<=8;z+=D.vs*.5){const q=p.clone();q.z-=z;if(inside(q)){fw=z;break;}}
  out.mounts.push({w:m.w,comp:m.comp,pos:m.pos,near:+near(p,6).toFixed(2),inside:inside(p),fwdBlocked:fw>8?null:+fw.toFixed(2)});mk(S.group.localToWorld(p.clone()),0xff2020,mr);}
 if(S.def.launch){const p=new T.Vector3(...S.def.launch);out.launch={pos:S.def.launch,near:+near(p,8).toFixed(2),inside:inside(p)};mk(S.group.localToWorld(p.clone()),0xffe020,mr*1.5);}
 const surf=(p,sd)=>{ // signed distance along side*y from p to the hull surface: >0 = p is buried (must rise), <0 = floating
  let d=0;const q=p.clone();if(inside(q)){for(;d<40;d+=D.vs*.25){q.y=p.y+sd*d;if(!inside(q))return +d.toFixed(2);}return 40;}
  for(d=0;d<40;d+=D.vs*.25){q.y=p.y-sd*d;if(inside(q))return -d.toFixed(2);}return -40;};
 const col=(x,z,sd)=>{const H=D.hy;for(let y=sd*H;Math.abs(y)>0;y-=sd*D.vs*.25){if(inside(new T.Vector3(x,y,z)))return +y.toFixed(2);if(sd*y<-H)break;}return null;};
 const colFix=(p,sd)=>{for(let x=Math.abs(p.x);x>=0;x-=D.vs){const y=col(Math.sign(p.x||1)*x,p.z,sd);if(y!==null)return [+(Math.sign(p.x||1)*x).toFixed(2),y];}return null;};
 for(const t of S.turrets){const c=S.comps.find(c=>c.id===t.comp);const bp=new T.Vector3(...t.def.pos);
  const tip=t.head.localToWorld(t.muzzles[0].clone());
  out.turrets.push({w:t.wid,cls:t.cls,dia:+t.dia.toFixed(1),comp:t.comp,compR:c?c.r:null,pos:t.def.pos,side:t.def.side,baseNear:+near(bp,Math.max(8,t.dia)).toFixed(2),baseInside:inside(bp),surf:surf(bp,t.def.side),colTop:col(bp.x,bp.z,t.def.side),fix:colFix(bp,t.def.side),ratio:c?+(c.r/(t.dia/2)).toFixed(2):null,tipWorld:S.group.worldToLocal(tip.clone()).toArray().map(x=>+x.toFixed(1))});
  mk(tip,0x20ff40,mr);mk(S.group.localToWorld(bp.clone()),0x2080ff,mr);}
 window.__S=S;return out}'''
CAM = '''([px,py,pz,lx,ly,lz])=>{const g=__game;g.camera.position.set(px,py,pz);g.camera.up.set(0,1,0);g.camera.lookAt(lx,ly,lz);g.camera.updateMatrixWorld(true);}'''
with Runner() as R:
    pg = R.page(1280, 720, '?free&n=0'); pg.wait_for_timeout(500)
    pg.add_style_tag(content='body>div,#ov,#radar{display:none!important}')
    for sid in IDS:
        info = pg.evaluate(SETUP, sid); pg.wait_for_timeout(900)
        print(json.dumps(info))
        R_ = pg.evaluate('()=>__S.def.radius'); L = info['len']
        views = {'iso': [0.7 * L, 0.45 * L, -0.9 * L, 0, 0, 0], 'top': [0, 1.15 * L, 0.01, 0, 0, 0], 'front': [0, 0.1 * L, -1.3 * L, 0, 0, 0], 'bottom': [0, -1.15 * L, 0.01, 0, 0, 0]}
        for vn, c in views.items():
            pg.evaluate(CAM, c); pg.wait_for_timeout(250); pg.screenshot(path=f'{SHOTS}/{sid}_{vn}.png')
        # closeups: first mount, first turret
        for i, m in enumerate(info['mounts'][:2]):
            p = m['pos']; d = max(3, 0.05 * L)
            pg.evaluate(CAM, [p[0] + d, p[1] + d * 0.6, p[2] - d * 1.2, p[0], p[1], p[2]]); pg.wait_for_timeout(250); pg.screenshot(path=f'{SHOTS}/{sid}_mount{i}.png')
        for i, t in enumerate(info['turrets'][:int(os.environ.get('GS_NT', 2))]):
            p = t['pos']; d = max(8, t['dia'] * 2.2); sd = t['side']
            pg.evaluate(CAM, [p[0] + d, p[1] + sd * d * 0.7, p[2] - d * 1.1, p[0], p[1], p[2]]); pg.wait_for_timeout(250); pg.screenshot(path=f'{SHOTS}/{sid}_tur{i}.png')
    print('errors', R.errs[:5])
