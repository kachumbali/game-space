#!/usr/bin/env python3
"""Original situation cues. Emits GM MIDI scores and sample-free rendered MP3 loops.
Requires Python 3, NumPy and ffmpeg. No soundfont, samples, or external music.
"""
import math, struct, subprocess, tempfile, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
AUDIO = HERE.parents[2] / 'audio'
PPQ, RATE = 480, 32000
# name, BPM, root progression, melodic degrees, rhythm, color
SCORES = {
 'patrol': (78, [50, 46, 53, 48], [0, 7, 3, 10, 7, 5, 3, 2], 'sparse', 'clear'),
 'tension': (90, [45, 46, 43, 45], [0, 1, 7, 5, 3, 1, 0, -2], 'pulse', 'dark'),
 'hive': (66, [38, 39, 45, 38], [0, 1, 6, 7, 1, -1, 3, 0], 'sparse', 'dark'),
 'capital-duel': (102, [38, 43, 41, 38], [0, 7, 5, 3, 10, 7, 5, 2], 'martial', 'dark'),
 'bullfrog': (112, [38, 41, 39, 37], [0, 6, 7, 1, 3, 6, 5, 1], 'martial', 'dark'),
 'retreat': (88, [45, 41, 48, 43], [0, 3, 7, 5, 2, 0, -2, 0], 'pulse', 'warm'),
 'rescue': (82, [48, 53, 50, 55], [0, 5, 7, 4, 2, 5, 7, 0], 'sparse', 'warm'),
 'loss': (68, [45, 41, 38, 45], [0, -2, -5, -7, -5, -3, -2, 0], 'sparse', 'dark'),
 'victory-new': (96, [48, 53, 55, 48], [0, 4, 7, 12, 9, 7, 4, 7], 'march', 'warm'),
 'title-sting': (108, [50, 45], [0, 7, 3, 12], 'sting', 'clear'),
}

def vlq(n):
 a=[n & 127]; n >>= 7
 while n: a.insert(0,(n & 127)|128); n >>= 7
 return bytes(a)

def compose(name, bpm, roots, degrees, rhythm, color):
 # Two-bar harmonic cells, explicit cadence and restrained original motifs.
 beat=60/bpm; beats=8*len(roots); duration=beats*beat; notes=[]
 def add(b,d,ch,key,vel,kind):
  if b < beats: notes.append((b,min(d,beats-b),ch,key,vel,kind))
 for i, root in enumerate(roots):
  t=i*8; minor = color == 'dark' or (name in ('patrol','retreat') and i % 2 == 0)
  for j,k in enumerate([root,root+7,root+(15 if minor else 16)]): add(t,7.5,0,k,34-j*3,'pad')
  add(t,7.3,1,root-12,38,'bass')
  if rhythm in ('pulse','martial','march'):
   for b in (0,2,4,6): add(t+b,.6,1,root-12+(7 if b==4 else 0),45,'bass')
  if rhythm in ('martial','march'):
   for b in (0,2,4,6): add(t+b,.12,9,36 if b in (0,4) else 43,36,'drum')
  picks = range(4) if rhythm == 'sting' else range(8)
  for j in picks:
   if rhythm=='sparse' and j%2: continue
   key=root+12+degrees[(i*2+j)%len(degrees)]
   add(t+j,(1.2 if rhythm=='sparse' else .58),2,key,39+(j==0)*10,'lead')
 # MIDI mirrors the performed notes, entirely GM, no external samples.
 events=[(0,-2,bytes([255,81,3])+int(60000000/bpm).to_bytes(3,'big'))]
 for ch,prg in [(0,48),(1,38),(2,60)]: events.append((0,-1,bytes([0xc0|ch,prg])))
 for b,d,ch,key,vel,kind in notes:
  events.extend([(round(b*PPQ),1,bytes([0x90|ch,key,vel])),(round((b+d)*PPQ),0,bytes([0x80|ch,key,0]))])
 events.sort(key=lambda e:(e[0],e[1])); out=bytearray(); last=0
 for tick,_,msg in events: out.extend(vlq(tick-last)+msg); last=tick
 out.extend(vlq(beats*PPQ-last)+bytes([255,47,0]))
 (HERE/f'situation-{name}.mid').write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,PPQ)+b'MTrk'+struct.pack('>I',len(out))+out)
 # Render each voiced note with additive oscillators; no soundfont or copied samples.
 n=round(duration*RATE); mix=np.zeros((n,2),dtype=np.float64)
 for b,d,ch,key,vel,kind in notes:
  first=round(b*beat*RATE); length=min(n-first,round(d*beat*RATE));
  if length<=0: continue
  t=np.arange(length)/RATE; f=440*2**((key-69)/12)
  attack={'pad':.28,'bass':.035,'lead':.08,'drum':.004}[kind]
  release={'pad':.45,'bass':.12,'lead':.2,'drum':.1}[kind]
  env=np.minimum(1,t/attack)*np.minimum(1,(length/RATE-t)/release)
  if kind=='drum': tone=np.sin(2*np.pi*(48*t+45*(1-np.exp(-8*t))/8))*np.exp(-5*t)
  else:
   tone=np.sin(2*np.pi*f*t)+(.17 if kind=='pad' else .25)*np.sin(4*np.pi*f*t)+.06*np.sin(6*np.pi*f*t)
  gain={'pad':.032,'bass':.065,'lead':.050,'drum':.08}[kind]*vel/64
  pan=((key%7)-3)*.055 if kind!='bass' else 0
  mix[first:first+length,0]+=tone*env*gain*math.sqrt((1-pan)/2)
  mix[first:first+length,1]+=tone*env*gain*math.sqrt((1+pan)/2)
 # Zero crossings at the seam; micro-fade is 40 ms, not a several-second gap.
 fade=min(round(RATE*.04),n//2); mix[:fade]*=np.linspace(0,1,fade)[:,None]; mix[-fade:]*=np.linspace(1,0,fade)[:,None]
 pcm=np.round(np.clip(mix,-.95,.95)*32767).astype('<i2')
 with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
  with wave.open(tmp.name,'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(pcm.tobytes())
  subprocess.run(['ffmpeg','-loglevel','error','-y','-i',tmp.name,'-codec:a','libmp3lame','-b:a','96k',str(AUDIO/f'situation-{name}.mp3')],check=True)
 print(name, 'duration',round(duration,2),'seconds, bytes', (AUDIO/f'situation-{name}.mp3').stat().st_size)

if __name__ == '__main__':
 for name, spec in SCORES.items(): compose(name,*spec)
