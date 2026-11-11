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
