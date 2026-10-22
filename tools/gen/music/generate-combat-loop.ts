// 90s Bombast Combat Loop - WC2 / Top Gun flavored GM MIDI generator.
// Run with:  npx tsx generate-combat-loop.ts
// Output:    combat-loop-90s-bombast.mid (SMF format 1, 148 BPM, 80 bars, ~2:10)
//
// Structure:
//   bars 0-7    Intro fanfare (WC2 title march, snare build)
//   bars 8-23  Main anthem (Top Gun drive, Cm i-VI-III-VII)
//   bars 24-39 Dogfight ostinato (Cm-Fm-Db menace, string 8ths)
//   bars 40-55 Breakdown + build (piano arps, brass long-line, snare roll)
//   bars 56-71 Final anthem (truck-driver modulation up to Dm)
//   bars 72-79 Outro fanfare (lands on Bb, loops back into the Cm intro)
//
// Channels (GM): 0 Lead Brass | 1 Strings | 2 Bass | 3 Piano | 4 Power Guitar
//                5 Organ | 6 Horn Stabs | 9 Drums

import { writeFileSync } from "fs";

type NT = [number | null, number][]; // [pitch (null = rest), duration in beats]

const PPQ = 480;
const BPM = 148;
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

const lead = new Trk("Lead Brass", 0);
const strings = new Trk("Strings", 1);
const bass = new Trk("Bass", 2);
const piano = new Trk("Piano", 3);
const guitar = new Trk("Power Guitar", 4);
const organ = new Trk("Organ Pad", 5);
const horns = new Trk("Horn Stabs", 6);
const drums = new Trk("Drums", 9);

lead.setup(61, 112, 64, 90);
strings.setup(48, 95, 70, 100);
bass.setup(33, 100, 64, 30);
piano.setup(0, 78, 64, 60);
guitar.setup(30, 96, 80, 40);
organ.setup(16, 62, 32, 70);
horns.setup(59, 100, 96, 80);
drums.setup(0, 110, 64, 0);

const hum = (i: number) => ((i * 37) % 7) - 3;

type Ch = { pc: number; minor: boolean };
const Cm: Ch = { pc: 0, minor: true }, Ab: Ch = { pc: 8, minor: false },
  Eb: Ch = { pc: 3, minor: false }, Bb: Ch = { pc: 10, minor: false },
  Fm: Ch = { pc: 5, minor: true }, Db: Ch = { pc: 1, minor: false },
  Dm: Ch = { pc: 2, minor: true }, F: Ch = { pc: 5, minor: false },
  C: Ch = { pc: 0, minor: false };

const progIntro: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb];
const progA: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb, Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb];
const progB: Ch[] = [Cm, Cm, Fm, Fm, Cm, Cm, Db, Bb, Cm, Cm, Fm, Fm, Cm, Cm, Db, Bb];
const progBreak: Ch[] = [Cm, Bb, Ab, Bb, Cm, Bb, Ab, Bb, Cm, Bb, Ab, Bb, Cm, Bb, Ab, Bb];
const progA2: Ch[] = [Dm, Dm, Bb, Bb, F, F, C, C, Dm, Dm, Bb, Bb, F, F, C, C];
const progOutro: Ch[] = [Dm, Dm, Bb, Bb, Cm, Cm, Bb, Bb];

const triad = (c: Ch, base: number) => [base + c.pc, base + c.pc + (c.minor ? 3 : 4), base + c.pc + 7];

function melody(part: Trk, startBar: number, phrases: NT[], vel: number, artic = 0.98) {
  phrases.forEach((barNotes, i) => {
    let beat = 0, n = 0;
    for (const [p, d] of barNotes) {
      if (p !== null) part.note(p, vel + hum(n + i), (startBar + i) * BAR + T(beat), Math.round(T(d) * artic) - 8);
      beat += d; n++;
    }
    if (Math.abs(beat - 4) > 0.01) throw new Error(`bar ${startBar + i} sums to ${beat} beats`);
  });
}

function compBass(prog: Ch[], startBar: number, vel: number, style: "half" | "eighths" | "quarter") {
  prog.forEach((c, i) => {
    const r = 36 + c.pc;
    if (style === "half") {
      bass.note(r, vel, (startBar + i) * BAR, T(2) - 10);
      bass.note(r + 7, vel - 10, (startBar + i) * BAR + T(2), T(2) - 10);
    } else if (style === "quarter") {
      for (let b = 0; b < 4; b++) bass.note(r, vel - (b % 2) * 12, (startBar + i) * BAR + T(b), T(1) - 10);
    } else {
      for (let b = 0; b < 8; b++) {
        const pitch = b === 7 ? r + 12 : r;
        bass.note(pitch, (b === 0 ? vel + 8 : vel) - (b % 2) * 10 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.5) - 8);
      }
    }
  });
}

function compGuitar(prog: Ch[], startBar: number, beats: number[], vel: number) {
  prog.forEach((c, i) => {
    for (const b of beats) {
      const t = (startBar + i) * BAR + T(b + 0.5);
      for (const p of [48 + c.pc, 55 + c.pc, 60 + c.pc])
        guitar.note(p, vel + hum(i * 4 + b), t, T(0.45));
    }
  });
}

function compOrgan(prog: Ch[], startBar: number, vel: number) {
  for (let i = 0; i < prog.length; i += 2) {
    const c = prog[i];
    for (const p of triad(c, 48)) organ.note(p, vel, (startBar + i) * BAR, 2 * BAR - 30);
  }
}

function compStrings(prog: Ch[], startBar: number, vel: number) {
  for (let i = 0; i < prog.length; i += 2) {
    const c = prog[i];
    for (const p of triad(c, 60)) strings.note(p, vel + hum(i), (startBar + i) * BAR, 2 * BAR - 30);
  }
}

function ostinatoStrings(prog: Ch[], startBar: number, vel: number) {
  prog.forEach((c, i) => {
    const r = 48 + c.pc, third = c.minor ? 3 : 4;
    const pat = [0, third, 7, third, 0, third, 7, third];
    for (let b = 0; b < 8; b++)
      strings.note(r + pat[b], (b === 0 ? vel + 6 : vel) - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.42));
  });
}

function hornHits(prog: Ch[], startBar: number, beatsOfBar: number[], vel: number) {
  prog.forEach((c, i) => {
    for (const b of beatsOfBar) {
      const t = (startBar + i) * BAR + T(b);
      for (const p of triad(c, 48)) horns.note(p, vel + hum(i * 3 + b), t, T(0.9) - 10);
    }
  });
}

const K = 36, S = 38, HH = 42, OH = 46, CR = 49, RD = 51, TOML = 45, TOMM = 47, TOMH = 50, FLT = 41;
const d = (tick: number, pitch: number, vel: number) => drums.note(pitch, Math.max(1, Math.min(127, Math.round(vel))), tick, 120);

function hat8(bar: number, vel: number, openLast = false) {
  for (let b = 0; b < 8; b++) d(bar * BAR + T(b * 0.5), openLast && b === 7 ? OH : HH, vel - (b % 2) * 14);
}
function kickSnare(bar: number, vel: number, kicks: number[] = [0, 2, 3.5]) {
  for (const k of kicks) d(bar * BAR + T(k), K, vel);
  d(bar * BAR + T(1), S, vel + 4);
  d(bar * BAR + T(3), S, vel + 4);
}
function tomFill(bar: number, vel: number) {
  const seq = [TOMH, TOMH, TOMM, TOMM, TOML, TOML, FLT, FLT];
  for (let i = 0; i < 8; i++) d(bar * BAR + T(i * 0.5), seq[i], vel - 4 + i * 2);
}
function roll(bar: number, startBeat: number, endBeat: number, subdiv: number, velStart: number, velEnd: number) {
  const n = Math.round((endBeat - startBeat) / subdiv);
  for (let i = 0; i < n; i++) {
    const vel = velStart + (velEnd - velStart) * (i / Math.max(1, n - 1));
    d(bar * BAR + T(startBeat + i * subdiv), S, vel);
  }
}

// SECTION 1: INTRO fanfare (bars 0-7)
melody(lead, 0, [
  [[null, 2], [70, 0.5], [68, 0.5], [67, 1]],
  [[75, 4]],
  [[null, 2], [72, 0.5], [75, 0.5], [77, 1]],
  [[80, 4]],
  [[null, 4]],
  [[null, 4]],
  [[75, 2], [74, 2]],
  [[77, 2], [75, 1], [74, 1]],
], 108);
compStrings(progIntro, 0, 58);
compOrgan(progIntro, 0, 50);
compBass(progIntro, 0, 90, "half");
for (let b = 0; b < 4; b++) {
  d(b * BAR + T(0), K, 110);
  d(b * BAR + T(1), S, 100); d(b * BAR + T(2), S, 104); d(b * BAR + T(3), S, 100);
  d(b * BAR + T(3.75), S, 62);
  if (b % 2 === 1) d(b * BAR + T(0), FLT, 100);
}
for (let b = 4; b < 7; b++) roll(b, 0, 4, 0.5, 55, 85);
roll(7, 0, 4, 0.25, 70, 115);

// SECTION 2: MAIN ANTHEM (bars 8-23)
const themeA: NT[] = [
  [[72, 3], [70, 1]],
  [[70, 1.5], [68, 0.5], [67, 2]],
  [[68, 3], [67, 1]],
  [[65, 2], [67, 1], [70, 1]],
  [[75, 3], [74, 1]],
  [[72, 2], [70, 1], [68, 1]],
  [[70, 2], [72, 1], [74, 1]],
  [[75, 4]],
  [[79, 2], [77, 1], [75, 1]],
  [[75, 1], [74, 1], [72, 2]],
  [[80, 3], [77, 1]],
  [[72, 1], [74, 1], [75, 2]],
  [[75, 2], [77, 1], [74, 1]],
  [[74, 1], [75, 1], [77, 2]],
  [[79, 3], [75, 1]],
  [[74, 4]],
];
melody(lead, 8, themeA, 112);
compStrings(progA, 8, 64);
compOrgan(progA, 8, 55);
compBass(progA, 8, 100, "eighths");
compGuitar(progA, 8, [1, 3], 92);
hornHits(progA.filter((_, i) => i % 2 === 0), 8, [0], 96);
for (let b = 8; b < 24; b++) {
  kickSnare(b, 108);
  hat8(b, 78, true);
  if (b % 4 === 0) d(b * BAR, CR, 118);
}
tomFill(15, 100); tomFill(23, 112);

// SECTION 3: DOGFIGHT (bars 24-39)
const stabPitches = (c: Ch) => [72 + c.pc, 72 + c.pc + (c.minor ? 3 : 4)];
progB.forEach((c, i) => {
  const bar = 24 + i;
  const [s1, s2] = stabPitches(c);
  lead.note(s1, 112 + hum(i), bar * BAR + T(2), T(0.9) - 10);
  lead.note(s2, 110 + hum(i + 1), bar * BAR + T(3), T(0.9) - 10);
});
ostinatoStrings(progB, 24, 92);
compOrgan(progB, 24, 55);
compBass(progB, 24, 102, "eighths");
compGuitar(progB, 24, [0, 1, 2, 3], 90);
for (let b = 24; b < 40; b++) {
  kickSnare(b, 110, [0, 1.75, 2, 3.5]);
  for (let e = 0; e < 8; e++) d(b * BAR + T(e * 0.5), e % 2 ? RD : HH, 76 - (e % 2) * 12);
  d(b * BAR + T(1.75), S, 64); d(b * BAR + T(3.75), S, 68);
  if (b % 4 === 0) d(b * BAR, CR, 116);
}
tomFill(31, 104); tomFill(39, 112);

// SECTION 4: BREAKDOWN + BUILD (bars 40-55)
function arpPiano(bar: number, c: Ch, vel: number) {
  const r = 48 + c.pc, third = c.minor ? 3 : 4;
  const pat = [r, r + 7, r + 12, r + third, r + 19, r + third, r + 12, r + 7];
  for (let e = 0; e < 8; e++) piano.note(pat[e], vel + hum(e + bar), bar * BAR + T(e * 0.5), T(0.45));
}
function compOrganRest(bar: number, c: Ch) { for (const p of triad(c, 48)) organ.note(p, 46, bar * BAR, BAR - 30); }

progBreak.forEach((c, i) => {
  const bar = 40 + i;
  if (i < 4) { arpPiano(bar, c, 64 + i * 4); compOrganRest(bar, c); }
  else if (i < 8) {
    arpPiano(bar, c, 78 + i * 2);
    d(bar * BAR + T(1), S, 88); d(bar * BAR + T(3), S, 88);
    compOrganRest(bar, c);
  }
});
for (let b = 40; b < 44; b++) { d(b * BAR + T(0), K, 92); hat8(b, 54); }
for (let b = 44; b < 48; b++) { d(b * BAR + T(0), K, 98); hat8(b, 62); }

[[72, 48], [70, 49], [68, 50], [74, 51], [72, 52], [70, 53], [68, 54], [74, 55]].forEach(([p, bar], k) => {
  lead.note(p, 100 + k * 2, bar * BAR, BAR - 20);
  const c = progBreak[k % 4];
  for (const s of triad(c, 60)) strings.note(s, 66 + k * 2, bar * BAR, BAR - 30);
});
compBass(progBreak.slice(0, 8), 40, 88, "quarter");
compBass(progBreak.slice(8), 48, 96, "eighths");
for (let b = 48; b < 52; b++) { kickSnare(b, 96); hat8(b, 66); }
roll(52, 0, 4, 0.5, 55, 80);
roll(53, 0, 4, 0.5, 75, 100);
roll(54, 0, 4, 0.25, 85, 115);
tomFill(55, 114);

// SECTION 5: FINAL ANTHEM (bars 56-71)
const themeA2: NT[] = themeA.map(bar => bar.map(([p, dur]) => [p === null ? null : p + 2, dur] as [number | null, number]));
melody(lead, 56, themeA2, 118);
themeA2.forEach((barNotes, i) => {
  let beat = 0;
  for (const [p, dur] of barNotes) {
    if (p !== null) strings.note(p + 12, 64, (56 + i) * BAR + T(beat), Math.round(T(dur) * 0.98) - 8);
    beat += dur;
  }
});
compOrgan(progA2, 56, 58);
compBass(progA2, 56, 104, "eighths");
compGuitar(progA2, 56, [0, 1, 2, 3], 96);
hornHits(progA2, 56, [0, 2], 102);
for (let b = 56; b < 72; b++) {
  kickSnare(b, 112, [0, 1.75, 2, 3.5]);
  hat8(b, 80, true);
  if (b % 2 === 0) d(b * BAR, CR, 120);
}
tomFill(63, 106); tomFill(71, 116);

// SECTION 6: OUTRO fanfare (bars 72-79)
melody(lead, 72, [
  [[null, 2], [72, 0.5], [70, 0.5], [69, 1]],
  [[77, 4]],
  [[null, 2], [74, 0.5], [77, 0.5], [79, 1]],
  [[82, 4]],
  [[null, 2], [72, 0.5], [75, 0.5], [79, 1]],
  [[80, 4]],
  [[77, 2], [74, 2]],
  [[74, 1], [72, 1], [70, 2]],
], 116);
compStrings(progOutro, 72, 62);
compOrgan(progOutro, 72, 55);
compBass(progOutro, 72, 96, "half");
for (let b = 72; b < 76; b++) {
  d(b * BAR + T(0), K, 110);
  d(b * BAR + T(1), S, 100); d(b * BAR + T(2), S, 104); d(b * BAR + T(3), S, 100);
}
for (let b = 76; b < 78; b++) { kickSnare(b, 106); hat8(b, 74, true); }
roll(78, 0, 4, 0.25, 80, 120);
d(79 * BAR, CR, 125); d(79 * BAR, K, 116);

// assemble SMF
const tempoTrk = new Trk("Tempo", 0);
const mpqn = Math.round(60000000 / BPM);
const songName = "90s Bombast Combat Loop";
tempoTrk.add(0, -1, [0xFF, 0x03, songName.length, ...[...songName].map(c => c.charCodeAt(0))]);
tempoTrk.add(0, -1, [0xFF, 0x51, 0x03, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255]);
tempoTrk.add(0, -1, [0xFF, 0x58, 0x04, 4, 2, 24, 8]);

const parts = [lead, strings, bass, piano, guitar, organ, horns, drums];
const tracks = [tempoTrk, ...parts];
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

// write output
writeFileSync(new URL("./combat-loop-90s-bombast.mid", import.meta.url), Buffer.from(b64(file), "base64"));
console.log(`combat-loop-90s-bombast.mid: ${file.length} bytes, ${BPM} BPM, 80 bars, ${(80 * 4 / BPM * 60).toFixed(1)}s`);
