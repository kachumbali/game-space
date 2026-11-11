"""Prologue scene adapter and playback regression."""
from lib import *
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&seed=42')
    out=p.evaluate('''() => {
      const g=__game, input={id:'p01_after_win',events:[{t:1,do:'say',who:'vance',text:'result'},{t:8,do:'say',who:'vance',text:'generic'},{t:15,do:'say',who:'hawk',text:'hawk line'},{t:22,do:'say',who:'vance',text:'ending'}]};
      const hawk={id:'h',callsign:'HAWK',name:'Lt. Maya Okafor',status:'KIA',available:false}, sparrow={id:'s',callsign:'SPARROW',name:'Ens. Tomás Vidal',status:'MIA',available:false};
      const ctx={missionId:'p01',result:'win',grade:'A',anchorAvailable:true,participants:[hawk,sparrow],ejections:[]};
      const adapted=g.preparePrologueScene(input,ctx), ev=adapted.events;
      const ejection=g.preparePrologueScene(input,{...ctx,participants:[{...hawk,status:'RECOVERING'}],ejections:[{pilot:'h',outcome:'recovered'}]}).events;
      const fake=g.preparePrologueScene({id:'p01_before',events:[{t:.4,do:'head',char:'hawk'},{t:9,do:'say',who:'hawk',text:'hi'}]}, {...ctx,participants:[{...hawk,status:'ACTIVE',available:true,name:'Replacement'}]}).events;
      const partial=g.preparePrologueScene({...input,id:'p01_after_lose'},{...ctx,result:'partial',anchorAvailable:false,participants:[],ejections:[],cause:null}).events;
      const fallback=g.preparePrologueScene(input,null).events;
      return {loss:ev[1].text,second:ev[2].text,grade:ev[3].text,original:input.events[1].text,ejected:ejection[1].text,fake,partial,fallback:fallback[1].text};
    }''')
    assert 'HAWK' in out['loss'] and 'lost' in out['loss'].lower(),out
    assert 'SPARROW' in out['second'] and 'missing' in out['second'],out
    assert 'Grade A' in out['grade'] and out['original']=='generic',out
    assert 'HAWK' in out['ejected'] and 'recovered' in out['ejected'],out
    assert not any(e.get('char')=='hawk' for e in out['fake']) and out['fake'][0]['who']=='vance',out
    assert 'partial' in out['partial'][0]['text'] and all(e.get('who')!='vance' for e in out['partial'] if e['do']=='say'),out
    assert out['fallback']!='We will account for everyone we can.',out
    assert_no_console_errors(r)
    print('PASS immutable context, losses, ejection, grade, replacement and partial fallback',flush=True)

# The 12 authored hooks and opening load their shared assets, remain skippable,
# and invoke the continuation once. Use ordinary callbacks, as mission hooks do.
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&seed=42')
    ids=[f'p0{i}_{suffix}' for i in range(1,5) for suffix in ('before','after_win','after_lose')]+['prologue_opening']
    for ident in ids:
        p.evaluate('''id=>{window.sceneDone=0;__game.startScene(id,()=>window.sceneDone++,{missionId:id.slice(0,3),result:'win',grade:'A',anchorAvailable:true,participants:[],ejections:[]})}''',ident)
        p.wait_for_function('(id)=>__game.sceneState.active && __game.sceneState.id===id',arg=ident,timeout=15000)
        assert p.evaluate("()=>__game.sceneState.events.length>0 && Object.keys(__game.sceneState.images).some(x=>x.includes('bg_ready_room.webp'))")
        p.evaluate('()=>__game.stopScene()')
        assert p.evaluate('()=>window.sceneDone===1 && !__game.sceneState.active')
    assert_no_console_errors(r)
    print('PASS all 12 scenes and opening load and skip',flush=True)

# Briefing scene is inline, NEXT skips it, and returning does not replay it.
with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&seed=42')
    p.wait_for_function("()=>__game.sceneState.id==='p01_before' && __game.sceneState.active",timeout=15000)
    assert p.evaluate("()=>document.getElementById('sceneWrap').parentElement.id==='briefScene'")
    p.locator('#briefNext').click(); assert p.locator('#briefBack').count()==1
    assert not p.evaluate('()=>__game.sceneState.active')
    p.locator('#briefBack').click(); assert not p.evaluate('()=>__game.sceneState.active')
    assert_no_console_errors(r)
    print('PASS inline briefing scene, skip and no replay',flush=True)

with Runner() as r:
    p=r.page(1280,720,'?q=low',init_script="localStorage.removeItem('gs_prologue_opening_seen');localStorage.removeItem('gs_prologue_progress')")
    p.locator('[data-a="continue"]').click()
    p.wait_for_function("()=>__game.sceneState.id==='prologue_opening' && __game.sceneState.active",timeout=20000)
    p.locator('#sceneSkip').click()
    p.wait_for_function("()=>__game.sceneState.id==='p01_before' && __game.sceneState.active",timeout=20000)
    assert p.evaluate("()=>localStorage.getItem('gs_prologue_opening_seen')==='1'")
    p.locator('#sceneSkip').click();p.locator('#briefMenu').click()
    p.locator('[data-a="prologue_opening"]').click()
    p.wait_for_function("()=>__game.sceneState.id==='prologue_opening' && __game.sceneState.active",timeout=20000)
    p.locator('#sceneSkip').click()
    assert p.locator('[data-a="prologue_opening"]').count()==1
    assert_no_console_errors(r)
    print('PASS automatic opening, skip and menu replay',flush=True)

with Runner() as r:
    p=r.page(1280,720,'?campaign=prologue&m=1&go&q=low')
    result=p.evaluate('''()=>{const g=__game,S=g.game.mstate,id=S.rosterSelected[0],pilot=g.rosterFind(id);pilot.status='KIA';g.endMission('win','test');const snap=S.sceneContext;pilot.status='ACTIVE';return {result:snap.result,grade:snap.grade,participant:snap.participants.find(x=>x.id===id),snapshot:snap};}''')
    assert result['result']=='win' and result['grade'] in 'SABCD' and result['participant']['status']=='KIA',result
    assert_no_console_errors(r)
    print('PASS completed-sortie snapshot is detached from live roster',flush=True)
