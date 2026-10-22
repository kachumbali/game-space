"""Beam rendering: Exeter (hostile) lasers the player; screenshots from several cameras, asserts live beams in the pool and no console errors.
Shots go to $GS_SHOTS (default /tmp/gs_shots). Usage: GS_PORT=8811 GS_TEST_DIR=/tmp/gs_test_beam python3 beam_vis_t.py"""
import os, sys
from lib import *
SHOTS = os.environ.get('GS_SHOTS', '/tmp/gs_shots'); os.makedirs(SHOTS, exist_ok=True)
SETUP = '''()=>{const g=__game,T=g.THREE;__paused=true;const P=g.player;
 for(const s of g.ships){if(s!==P){s.alive=false;s.dying=0;s.group.visible=false;}}
 g.ships.splice(0,g.ships.length,P);
 P.shield.fore=P.shield.aft=9999;P.structure=9999;P.group.position.set(0,0,0);P.group.quaternion.identity();P.vel.set(0,0,0);
 const E=g.spawnShip('exeter',1,new T.Vector3(0,-330,-900),new T.Vector3(0,0,0),{});
 E.vel.set(0,0,0);E.hold=true;E.ai.hold=true;
 E.group.lookAt(new T.Vector3(0,-330,0));E.group.rotateY(Math.PI);E.group.updateMatrixWorld(true);
 return E.turrets.length}'''
STEP = '''(n)=>{const g=__game;for(let i=0;i<n;i++){g.update(0.05);g.player.shield.fore=g.player.shield.aft=9999;g.player.structure=9999;g.player.vel.set(0,0,0);
 g.ships.forEach(s=>{if(s.team===1){s.vel.set(0,0,0);}});}
 const c=[...g.beamRec.values()].filter(r=>r.live).length;
 return {rec:g.beamRec.size,live:c,drawn:g.beamStat.n,t:g.ships.find(s=>s.team===1).turrets.map(T=>[T.wid,!!T.tgt])}}'''
CAM = '''([px,py,pz,lx,ly,lz])=>{const g=__game;g.camera.position.set(px,py,pz);g.camera.up.set(0,1,0);g.camera.lookAt(lx,ly,lz);g.camera.updateMatrixWorld(true);}'''
with Runner() as R:
    pg = R.page(1280, 720, '?free&n=0'); pg.wait_for_timeout(600)
    pg.add_style_tag(content='body>div,#ov,#radar{display:none!important}')
    print('turrets', pg.evaluate(SETUP))
    st = pg.evaluate(STEP, 60); print(st)
    st = pg.evaluate(STEP, 70); print(st)
    assert st['rec'] > 0 and st['drawn'] > 0, 'no beams'
    pg.evaluate('()=>{__game.setView&&__game.setView("cockpit")}')
    # player eye (cockpit) looking at the Exeter
    pg.evaluate(CAM, [0, 0.6, -2.5, 0, -200, -900]); pg.wait_for_timeout(400); pg.screenshot(path=SHOTS + '/beam_cockpit.png')
    pg.evaluate(CAM, [420, -120, -450, 0, -250, -450]); pg.wait_for_timeout(400); pg.screenshot(path=SHOTS + '/beam_side.png')
    pg.evaluate(CAM, [70, -200, -520, 0, -310, -760]); pg.wait_for_timeout(400); pg.screenshot(path=SHOTS + '/beam_origin.png')
    pg.evaluate(CAM, [0, 600, 3800, 0, -150, -300]); pg.wait_for_timeout(400); pg.screenshot(path=SHOTS + '/beam_far4km.png')
    # stale-beam checks: brief state hides, clear empties
    pg.evaluate('()=>{__game.state="brief";__game.renderBeams()}'); pg.wait_for_timeout(300)
    print('brief drawn', pg.evaluate('()=>__game.beamStat.n'))
    assert pg.evaluate('()=>__game.beamStat.n') == 0, 'beams drawn in brief'
    pg.evaluate('()=>{__game.state="play";__game.beamsClear()}'); pg.wait_for_timeout(200)
    assert pg.evaluate('()=>__game.beamRec.size') == 0
    print('errors', R.errs[:6])
    assert not R.errs, R.errs
print('OK')
