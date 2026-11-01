// Offline, sample-free renderer for Frontier Overture. It deliberately uses
// additive oscillator voices rather than a soundfont, so the committed menu MP3
// contains only this project's original synthesis. Run after the MIDI generator:
//   node render-menu-frontier.mjs /tmp/menu-frontier.wav
import { writeFileSync } from 'node:fs';

const output = process.argv[2] || '/tmp/menu-frontier.wav';
const rate = 44100, bpm = 92, beat = 60 / bpm, bars = 32, seconds = bars * 4 * beat + 4;
const left = new Float32Array(Math.ceil(seconds * rate)), right = new Float32Array(left.length);
const hz = n => 440 * 2 ** ((n - 69) / 12);
const cells = [[50,1],[46,0],[53,0],[48,0],[50,1],[55,1],[46,0],[45,0],[50,1],[46,0],[53,0],[48,0],[55,1],[46,0],[45,0],[50,1]];
const voice = (start, duration, key, gain, kind, pan = 0) => {
  const first = Math.max(0, Math.floor(start * rate)), last = Math.min(left.length, Math.ceil((start + duration + 1.4) * rate));
  const f = hz(key), lpan = Math.sqrt((1 - pan) * .5), rpan = Math.sqrt((1 + pan) * .5);
  for (let i = first; i < last; i++) {
    const t = (i / rate) - start; if (t < 0) continue;
    const rel = Math.max(0, t - duration), a = Math.min(1, t / (kind === 'pad' ? .65 : .045));
    let env, wave;
    if (kind === 'piano') { env = Math.exp(-t * 2.6) * Math.exp(-rel * 6); wave = Math.sin(6.283 * f * t) + .31 * Math.sin(12.566 * f * t) + .12 * Math.sin(18.85 * f * t); }
    else if (kind === 'bass') { env = Math.min(1, t / .03) * Math.exp(-rel * 5); wave = Math.sin(6.283 * f * t) + .28 * Math.sin(12.566 * f * t); }
    else if (kind === 'horn') { env = a * Math.exp(-rel * 3.2); const vib = Math.sin(6.283 * 5.2 * t) * .004; wave = Math.sin(6.283 * f * (t + vib)) + .34 * Math.sin(12.566 * f * (t + vib)) + .12 * Math.sin(18.85 * f * t); }
    else { env = a * Math.exp(-rel * 1.35); wave = Math.sin(6.283 * f * t) + .26 * Math.sin(12.566 * f * t) + .09 * Math.sin(18.85 * f * t); }
    const s = gain * env * wave; left[i] += s * lpan; right[i] += s * rpan;
  }
};
cells.forEach(([root, minor], i) => {
  const t = i * 8 * beat, tones = [root, root + 7, root + (minor ? 15 : 16), root + 19];
  tones.forEach((key, j) => voice(t, 8 * beat - .03, key, .040 - j * .003, 'pad', (j - 1.5) * .22));
  [root - 12, root - 5].forEach((key, j) => voice(t, 8 * beat - .05, key, .018, 'pad', j ? .26 : -.26));
  [0,1.5,2.5,3.25,4,5.5,6.5,7.25].forEach((at, j) => voice(t + at * beat, (j % 4 === 3 ? .55 : .72) * beat, root - (j % 4 === 2 ? 5 : 0), .062, 'bass', -.08));
  if (i >= 2 && i !== 15) [0,1,2,3,4,5,6,7].forEach((at, j) => voice(t + at * beat, .76 * beat, [root, root + (minor ? 3 : 4), root + 7, root + (minor ? 10 : 11), root + 12, root + 7, root + (minor ? 3 : 4), root + 7][j] + 12, .026, 'piano', .18));
});
const lead = [74,77,81,79,77,74,72,74,77,81,84,81,79,77,74,72];
lead.forEach((key, i) => voice(8 * 4 * beat + i * beat, (i === 3 || i === 10 ? 1.55 : .82) * beat, key, .075, 'horn', -.12));
[69,72,74,77,76,74,72,69].forEach((key, i) => voice(20 * 4 * beat + i * beat, .78 * beat, key, .057, 'horn', -.12));
voice(30 * 4 * beat, 1.7 * beat, 74, .05, 'horn', -.12);
const data = Buffer.alloc(44 + left.length * 4); data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(left.length * 4, 40);
for (let i = 0, p = 44; i < left.length; i++, p += 4) { data.writeInt16LE(Math.max(-1, Math.min(1, left[i])) * 32767, p); data.writeInt16LE(Math.max(-1, Math.min(1, right[i])) * 32767, p + 2); }
writeFileSync(output, data); console.log(`Wrote ${output} (${seconds.toFixed(1)} seconds, oscillator synthesis only)`);
