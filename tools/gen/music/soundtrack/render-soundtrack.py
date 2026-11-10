import sys, mido, numpy as np, tinysoundfont, wave
import os
SF=os.environ.get('GS_SF2','GeneralUser-GS.sf2'); SR=44100
def render(path, out, tail=3.0):
    syn=tinysoundfont.Synth(samplerate=SR, gain=-3.0); sf=syn.sfload(SF)
    for c in range(16):
        try: syn.program_select(c, sf, 128 if c==9 else 0, 0, is_drums=(c==9))
        except Exception as e: pass
    mid=mido.MidiFile(path); chunks=[]; t=0.0; n_done=0
    for msg in mid:   # iterates with delta time in seconds
        n=int(round(msg.time*SR))
        if n>0: chunks.append(np.frombuffer(bytes(syn.generate(n)),dtype=np.float32).reshape(-1,2).copy())
        if msg.type=='note_on': syn.noteon(msg.channel,msg.note,msg.velocity)
        elif msg.type=='note_off': syn.noteoff(msg.channel,msg.note)
        elif msg.type=='program_change':
            try: syn.program_select(msg.channel, sf, 128 if msg.channel==9 else 0, msg.program, is_drums=(msg.channel==9))
            except Exception as e: print('prog err',msg.channel,msg.program,e)
        elif msg.type=='control_change': syn.control_change(msg.channel,msg.control,msg.value)
        elif msg.type=='pitchwheel': syn.pitchbend(msg.channel,msg.pitch+8192)
    body=np.concatenate(chunks) if chunks else np.zeros((0,2),np.float32)
    tailn=int(tail*SR); tl=np.frombuffer(bytes(syn.generate(tailn)),dtype=np.float32).reshape(-1,2).copy()
    L=len(body); body=body.reshape(-1,2) if body.ndim==1 else body; tl=tl.reshape(-1,2) if tl.ndim==1 else tl
    body=body.copy(); m=min(len(tl),len(body)); body[:m]+=tl[:m]   # fold the release tail onto the loop start
    peak=float(np.abs(body).max()); rms=float(np.sqrt((body**2).mean()))
    pcm=(np.clip(body,-1,1)*32767).astype('<i2')
    with wave.open(out,'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return L/SR, peak, rms
if __name__=='__main__':
    for p in sys.argv[1:]:
        name=p.split('/')[-1][:-4]; d,pk,r=render(p,f'/tmp/soundtrack-wav/{name}.wav'); print(f'{name}: {d:.1f}s peak {20*np.log10(pk+1e-9):.1f} dBFS rms {20*np.log10(r+1e-9):.1f} dBFS')
