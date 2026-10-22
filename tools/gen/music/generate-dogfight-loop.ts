// Dogfight Tension Loop - X-Wing / TIE Fighter style combat bed (GM MIDI).
// Run with:  npx tsx generate-dogfight-loop.ts
// Output:    combat-loop-dogfight.mid (SMF format 1, 128 BPM, 64 bars, 2:00)
//
// Designed to sit UNDER gameplay audio: no lead melody, low register,
// channel volumes ~10-15% below the anthem track.
//
// Structure (seamless loop, stays in D minor throughout):
//   bars 0-15   A  core groove: staccato string ostinato, trombone stabs,
//                   military 16th snare grid, rimshot clicks
//   bars 16-31  B  variation: long trombone line, xylophone clockwork ticks,
//                   muted trumpet accents, tom "timpani" pulses
//   bars 32-47  C  quiet menace: pedal Dm with a D-Ab tritone cluster,
//                   snare grid thins to 8ths, then rebuilds
//   bars 48-63  A' return, slightly hotter, ends on Dm -> loops into bar 0
//
// Channels (GM): 0 Low Brass (Trombone) | 1 Strings | 2 Synth Bass
//                3 Xylophone | 4 Muted Trumpet | 9 Drums

import { writeFileSync } from "fs";

const PPQ = 480;
const BPM = 128;
const BAR = 4 * PPQ;
const T = (beats: number) => Math.round(beats * PPQ);

type Ev = { tick: number; sortKey: number; bytes: number[] };

class Trk {
  evs: Ev[] = [];
  name: string;
  ch: number;
  constructor(name: string, ch: number) { this.name = name; this.ch = ch; }
  add(tick: number, sortKey: number, bytes: number[]) { this.evs.push({ tick, sortKey, bytes }); }
  note(pitch: number, vel: number, tick: number, durTicks: number, ch = this.ch) {
    if (durTicks <= 0) return;
    this.add(tick, 2, [0x90 | ch, pitch, Math.max(1, Math.min(127, Math.round(vel)))]);
    this.add(tick + durTicks, 0, [0x80 | ch, pitch, 64]);
  }
  setup(program: number, vol: number, pan: number, rev: number) {
    const nameBytes = [...this.name].map(c => c.charCodeAt(0));
    this.add(0, -2, [0xFF, 0x03, nameBytes.length, ...nameBytes]);
    this.add(0, -1, [0xC0 | this.ch, program]);
    this.add(0, -1, [0xB0 | this.ch, 7, vol]);
    this.add(0, -1, [0xB0 | this.ch, 10, pan]);
    this.add(0, -1, [0xB0 | this.ch, 91, rev]);
  }
  serialize(): number[] {
    this.evs.sort((a, b) => a.tick - b.tick || a.sortKey - b.sortKey);
    const body: number[] = [];
    let prev = 0;
    for (const e of this.evs) { pushVlq(body, e.tick - prev); body.push(...e.bytes); prev = e.tick; }
    pushVlq(body, 0); body.push(0xFF, 0x2F, 0x00);
    const len = body.length;
    return [0x4D, 0x54, 0x72, 0x6B, (len >> 24) & 255, (len >> 16) & 255, (len >> 8) & 255, len & 255, ...body];
  }
}

function pushVlq(arr: number[], v: number) {
  let b = [v & 0x7F]; v >>= 7;
  while (v > 0) { b = [0x80 | (v & 0x7F), ...b]; v >>= 7; }
  arr.push(...b);
}

const brass = new Trk("Low Brass", 0);
const strings = new Trk("Ostinato Strings", 1);
const bass = new Trk("Synth Bass", 2);
const xylo = new Trk("Xylophone", 3);
const trumpet = new Trk("Trumpet Accents", 4);
const drums = new Trk("Drums", 9);

brass.setup(56, 84, 72, 70);
strings.setup(48, 82, 60, 85);
bass.setup(37, 88, 64, 25);
xylo.setup(12, 56, 84, 55);
trumpet.setup(59, 74, 90, 65);
drums.setup(0, 96, 64, 0);

const hum = (i: number) => ((i * 37) % 7) - 3;

type Ch = { pc: number; minor: boolean };
const Dm: Ch = { pc: 2, minor: true }, Eb: Ch = { pc: 3, minor: false },
  Gm: Ch = { pc: 7, minor: true }, Bb: Ch = { pc: 10, minor: false }, A: Ch = { pc: 9, minor: false };

const progA: Ch[] = [Dm, Dm, Dm, Dm, Eb, Eb, Dm, Dm, Gm, Gm, Bb, Bb, A, A, Dm, Dm];
const progB: Ch[] = [Gm, Gm, Gm, Gm, Bb, Bb, Bb, Bb, Eb, Eb, Eb, Eb, A, A, A, A];
const progC: Ch[] = [Dm, Dm, Dm, Dm, Dm, Dm, Dm, Dm, Gm, Gm, Gm, Gm, A, A, A, A];
const progA2 = progA;
const song: Ch[] = [...progA, ...progB, ...progC, ...progA2];

function ostinato(startBar: number, prog: Ch[], vel: number) {
  prog.forEach((c, i) => {
    const r = 50 + c.pc, third = c.minor ? 3 : 4;
    const pat = [0, third, 7, third, 0, third, 7, third];
    for (let b = 0; b < 8; b++)
      strings.note(r + pat[b], (b === 0 ? vel + 6 : vel) - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.4));
  });
}
function pulseStrings(startBar: number, prog: Ch[], vel: number) {
  prog.forEach((c, i) => {
    const r = 50 + c.pc;
    for (let b = 0; b < 4; b++)
      strings.note(r, vel - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b), T(0.9));
  });
}
function pulseBass(startBar: number, prog: Ch[], vel: number, style: "eighths" | "half") {
  prog.forEach((c, i) => {
    const r = 38 + c.pc;
    if (style === "half") {
      bass.note(r, vel, (startBar + i) * BAR, T(2) - 10);
      bass.note(r, vel - 8, (startBar + i) * BAR + T(2), T(2) - 10);
    } else {
      for (let b = 0; b < 8; b++)
        bass.note(b === 7 ? r + 12 : r, (b === 0 ? vel + 6 : vel) - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.5) - 8);
    }
  });
}

const K = 36, S = 38, CR = 49, TOML = 41, TOMH = 43, RIM = 37;
const d = (tick: number, pitch: number, vel: number) => drums.note(pitch, Math.max(1, Math.min(127, Math.round(vel))), tick, 120);

function warSnare(bar: number, vel: number, density: 16 | 8, qMax = 4) {
  if (density === 16) {
    for (let q = 0; q < qMax; q++) {
      const acc = [6, -16, 0, -16][q];
      for (let s = 0; s < 4; s++)
        d(bar * BAR + T(q + s * 0.25), S, vel + acc - (s % 2) * 6 + hum(q * 4 + s));
    }
  } else {
    for (let q = 0; q < qMax; q++) d(bar * BAR + T(q), S, vel + (q % 2 === 0 ? 6 : -8));
  }
}
function snareRun(bar: number, fromBeat: number, velStart: number, velEnd: number) {
  const n = Math.round((4 - fromBeat) / 0.25);
  for (let i = 0; i < n; i++)
    drums.note(S, Math.round(velStart + (velEnd - velStart) * (i / Math.max(1, n - 1))), bar * BAR + T(fromBeat + i * 0.25), T(0.25) - 5, 9);
}

for (let bar = 0; bar < 64; bar++) {
  const section = bar < 16 ? 0 : bar < 32 ? 1 : bar < 48 ? 2 : 3;
  const secVel = [72, 76, 0, 80][section];
  const isRunBar = (bar % 8 === 7 && section !== 2) || bar === 47;

  const kicks = section === 2 ? (bar < 40 ? [0] : [0, 2]) : (section === 1 || section === 3) ? [0, 2, 3.5] : [0, 2];
  for (const k of kicks) d(bar * BAR + T(k), K, section === 2 ? 84 : 96);

  if (section === 2) {
    const rise = bar < 40 ? 40 : 48 + (bar - 40) * 2.5;
    warSnare(bar, rise, bar < 40 ? 8 : 16, isRunBar ? 3 : 4);
  } else {
    warSnare(bar, secVel, 16, isRunBar ? 3 : 4);
  }

  if (bar % 2 === 1 && section !== 2) {
    d(bar * BAR + T(1.75), RIM, 52); d(bar * BAR + T(3.75), RIM, 52);
  }
  if ((section === 1 || section === 3) && bar % 2 === 0) {
    d(bar * BAR + T(0), TOML, 80);
    d(bar * BAR + T(2), TOMH, 72);
  }
  if (isRunBar) snareRun(bar, 3, 62, section === 3 ? 100 : section === 2 ? 95 : 92);
  if (bar === 0 || bar === 16 || bar === 32 || bar === 48) d(bar * BAR, CR, 92);
}

// SECTION A (bars 0-15): core groove
ostinato(0, progA, 66);
pulseBass(0, progA, 84, "eighths");
progA.forEach((c, i) => {
  const r = 50 + c.pc;
  for (const p of [r, r + 7, r + 12]) brass.note(p, 76 + hum(i), i * BAR, T(0.4));
  if (i % 2 === 1) for (const p of [r, r + 7]) brass.note(p, 66 + hum(i), i * BAR + T(2.5), T(0.35));
  if (i % 4 === 3) brass.note(r + 12, 80, i * BAR + T(1), T(3) - 10);
});

// SECTION B (bars 16-31): variation, long brass line + ticks
ostinato(16, progB, 70);
pulseBass(16, progB, 88, "eighths");
const brassLineB = [57, 55, 53, 58, 55, 51, 61, 62];
progB.forEach((c, i) => {
  if (i % 2 === 0) brass.note(brassLineB[i / 2], 80 + hum(i), (16 + i) * BAR, 2 * BAR - 30);
  const r = 50 + c.pc;
  xylo.note(r + 24, 46 + hum(i), (16 + i) * BAR + T(0.75), T(0.2));
  xylo.note(r + 24, 44 + hum(i + 1), (16 + i) * BAR + T(2.75), T(0.2));
  if (i % 2 === 1) trumpet.note(r + 24, 52, (16 + i) * BAR + T(2.75), T(0.25));
});

// SECTION C (bars 32-47): quiet menace, tritone cluster, rebuild
pulseStrings(32, progC, 52);
pulseBass(32, progC, 72, "half");
progC.forEach((c, i) => {
  const r = 50 + c.pc;
  const vel = 56 + i * 1.4;
  brass.note(r, vel, (32 + i) * BAR, BAR - 30);
  if (i < 8) brass.note(r + 6, Math.max(1, vel - 16), (32 + i) * BAR, BAR - 30);
  if (i >= 12) {
    xylo.note(r + 24, 44, (32 + i) * BAR + T(0.75), T(0.2));
    xylo.note(r + 24, 42, (32 + i) * BAR + T(2.75), T(0.2));
  }
});

// SECTION A' (bars 48-63): return, slightly hotter
ostinato(48, progA2, 72);
pulseBass(48, progA2, 92, "eighths");
progA2.forEach((c, i) => {
  const r = 50 + c.pc;
  for (const p of [r, r + 7, r + 12]) brass.note(p, 82 + hum(i), (48 + i) * BAR, T(0.4));
  if (i % 2 === 1) for (const p of [r, r + 7]) brass.note(p, 72, (48 + i) * BAR + T(2.5), T(0.35));
  if (i % 4 === 3) brass.note(r + 12, 86, (48 + i) * BAR + T(1), T(3) - 10);
  xylo.note(r + 24, 48 + hum(i), (48 + i) * BAR + T(0.75), T(0.2));
  if (i % 2 === 0) xylo.note(r + 24, 46, (48 + i) * BAR + T(2.75), T(0.2));
});
// final Dm chord stabs under the loop seam (kick already placed by the drum loop)
for (const p of [50, 57, 62]) brass.note(p, 88, 63 * BAR + T(2), T(1.9));

// assemble SMF
const tempoTrk = new Trk("Tempo", 0);
const mpqn = Math.round(60000000 / BPM);
const songName = "Dogfight Tension Loop";
tempoTrk.add(0, -1, [0xFF, 0x03, songName.length, ...[...songName].map(c2 => c2.charCodeAt(0))]);
tempoTrk.add(0, -1, [0xFF, 0x51, 0x03, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255]);
tempoTrk.add(0, -1, [0xFF, 0x58, 0x04, 4, 2, 24, 8]);

const tracks = [tempoTrk, brass, strings, bass, xylo, trumpet, drums];
const trackBytes = tracks.map(t => t.serialize());
const ntrks = tracks.length;
const header = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (ntrks >> 8) & 255, ntrks & 255, (PPQ >> 8) & 255, PPQ & 255];
const file = new Uint8Array([...header, ...trackBytes.flat()]);

function b64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? "=" : chars[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? "=" : chars[b2 & 63];
  }
  return out;
}

writeFileSync(new URL("./combat-loop-dogfight.mid", import.meta.url), Buffer.from(b64(file), "base64"));
console.log(`combat-loop-dogfight.mid: ${file.length} bytes, ${BPM} BPM, 64 bars, ${(64 * 4 / BPM * 60).toFixed(1)}s`);
