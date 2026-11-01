// Frontier Overture — original menu loop for Claude Space Commander.
// Hand-written Standard MIDI File generator; uses no samples or melodies from
// existing games. Run with: node generate-menu-frontier.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), 'menu-frontier-overture.mid');
const PPQ = 480, BPM = 92, bar = PPQ * 4;
const ev = [];
const add = (t, data, order = 1) => ev.push({ t, data, order });
const vlq = n => { const a = [n & 0x7f]; while ((n >>= 7)) a.unshift((n & 0x7f) | 0x80); return a; };
const note = (t, d, ch, key, vel) => { add(t, [0x90 | ch, key, vel], 2); add(t + d, [0x80 | ch, key, 0], 0); };
const program = (ch, p) => add(0, [0xc0 | ch, p], 0);
const chord = (t, root, minor, velocity) => [root, root + 7, root + (minor ? 15 : 16), root + 19].forEach((k, i) => note(t, bar * 2 - 12, 0, k, velocity - i * 3));
const arpeggio = (t, root, minor) => {
  const tones = [root, root + (minor ? 3 : 4), root + 7, root + (minor ? 10 : 11), root + 12, root + 7, root + (minor ? 3 : 4), root + 7];
  tones.forEach((k, i) => note(t + i * PPQ, PPQ * 0.78, 1, k + 12, 44 + (i === 0 ? 9 : 0)));
};
const bass = (t, root) => [0, PPQ * 1.5, PPQ * 2.5, PPQ * 3.25].forEach((at, i) => note(t + at, PPQ * (i === 3 ? 0.55 : 0.72), 2, root - (i === 2 ? 5 : 0), 52));
const drum = (t, k, v) => note(t, PPQ / 8, 9, k, v);

// D minor frontier call: 16 two-bar harmonic cells, returning quietly to Dm.
const cells = [
  [50, true], [46, false], [53, false], [48, false], [50, true], [55, true], [46, false], [45, false],
  [50, true], [46, false], [53, false], [48, false], [55, true], [46, false], [45, false], [50, true],
];
add(0, [0xff, 0x51, 0x03, ...[(60000000 / BPM) >> 16 & 255, (60000000 / BPM) >> 8 & 255, (60000000 / BPM) & 255]], -2);
add(0, [0xff, 0x58, 0x04, 4, 2, 24, 8], -2);
const title = Buffer.from('Frontier Overture (original)');
add(0, [0xff, 0x03, ...vlq(title.length), ...title], -2);
program(0, 48);  // string ensemble
program(1, 0);   // piano
program(2, 38);  // synth bass
program(3, 60);  // French horn
program(4, 91);  // choir pad

cells.forEach(([root, minor], i) => {
  const t = i * bar * 2;
  chord(t, root, minor, i < 4 || i > 13 ? 46 : 58);
  // A very soft choir sustain keeps the first menu moments spacious.
  [root - 12, root - 5].forEach(k => note(t, bar * 2 - 24, 4, k, i < 4 ? 23 : 31));
  bass(t, root);
  if (i >= 2 && i !== 15) { arpeggio(t, root, minor); arpeggio(t + bar, root, minor); }
  if (i >= 4 && i <= 13) {
    drum(t, 49, 24); drum(t + bar, 49, 20); // distant cymbal swells
    drum(t + PPQ * 2, 43, 22); drum(t + bar + PPQ * 2, 43, 22);
  }
});
// Original horn motif, voiced only after the bed has settled.
const motif = [74, 77, 81, 79, 77, 74, 72, 74, 77, 81, 84, 81, 79, 77, 74, 72];
motif.forEach((key, i) => {
  const t = bar * 8 + i * PPQ;
  note(t, i === 3 || i === 10 ? PPQ * 1.55 : PPQ * 0.82, 3, key, 59 + (i === 0 || i === 8 ? 12 : 0));
});
// A restrained answer in the final third; the final D is deliberately left open.
[69, 72, 74, 77, 76, 74, 72, 69].forEach((key, i) => note(bar * 20 + i * PPQ, PPQ * 0.78, 3, key, 52));
note(bar * 30, bar * 1.7, 3, 74, 46);

ev.sort((a, b) => a.t - b.t || a.order - b.order);
let last = 0; const track = [];
for (const e of ev) { track.push(...vlq(e.t - last), ...e.data); last = e.t; }
track.push(0, 0xff, 0x2f, 0);
const header = Buffer.from([0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,PPQ >> 8,PPQ & 255]);
const len = track.length, chunk = Buffer.from([0x4d,0x54,0x72,0x6b,(len>>>24)&255,(len>>>16)&255,(len>>>8)&255,len&255,...track]);
writeFileSync(out, Buffer.concat([header, chunk]));
console.log(`Wrote ${out} (${(cells.length * 8 * 60 / BPM).toFixed(1)} seconds)`);
