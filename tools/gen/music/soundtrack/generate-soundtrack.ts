// =====================================================================
// CLAUDE SPACE COMMANDER - original 10-track soundtrack (2026-11-10)
// Style: TIE Fighter / Wing Commander 2, 1990s General MIDI.
// Run with:  npx tsx generate-soundtrack.ts
// Output:    01-...mid .. 10-...mid (SMF format 1, GM, drums on ch 9,
//            seamless loops: each track ends on a chord that leads
//            back into its own bar 0)
//
// All music is original, composed for this game. No third-party
// melodies. The SMF writer and helper style follow the pattern of
// generate-combat-loop.ts / generate-dogfight-loop.ts (parent folder).
//
// Tracklist (mood slots per src/13_music.js in parentheses):
//  01 Eagle Squadron  title overture   100 BPM C minor  (title)
//  02 Hangar Deck     main menu         92 BPM D minor   (menu)
//  03 Open Space      patrol           104 BPM F major   (patrol)
//  04 Contacts        tension bed      120 BPM D minor   (tension)
//  05 Furball         dogfight bed     144 BPM E minor   (combat)
//  06 Climb and Burn  heavy anthem     148 BPM C minor   (heavy)
//  07 Broadside       capital duel      96 BPM G minor   (capital)
//  08 Hive Lord       boss             132 BPM F minor   (boss)
//  09 Medals          victory          116 BPM Eb major  (win)
//  10 Empty Bunks     loss              72 BPM A minor   (loss)
// =====================================================================

import { writeFileSync } from "fs";

// ---------------------------------------------------------------- SMF writer
const PPQ = 480;
const BAR = 4 * PPQ;
const T = (beats: number) => Math.round(beats * PPQ);
const hum = (i: number) => ((i * 37) % 7) - 3;
const v127 = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

type Ev = { tick: number; sortKey: number; bytes: number[] };

class Trk {
  evs: Ev[] = [];
  name: string;
  ch: number;
  constructor(name: string, ch: number) { this.name = name; this.ch = ch; }
  add(tick: number, sortKey: number, bytes: number[]) { this.evs.push({ tick, sortKey, bytes }); }
  note(pitch: number, vel: number, tick: number, durTicks: number, ch = this.ch) {
    if (durTicks <= 0) return;
    this.add(tick, 2, [0x90 | ch, pitch, v127(vel)]);
    this.add(tick + durTicks, 0, [0x80 | ch, pitch, 64]);
  }
  setup(program: number, vol: number, pan: number, rev: number) {
    const nb = [...this.name].map(c => c.charCodeAt(0));
    this.add(0, -2, [0xFF, 0x03, nb.length, ...nb]);
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

// ------------------------------------------------------------- vocabulary
type NT = [number | null, number][]; // [pitch (null = rest), duration in beats]
type Ch = { pc: number; minor: boolean };
const ch = (pc: number, minor = false): Ch => ({ pc, minor });
const triad = (c: Ch, base: number): number[] =>
  [base + c.pc, base + c.pc + (c.minor ? 3 : 4), base + c.pc + 7];

function melody(part: Trk, startBar: number, phrases: NT[], v: number, artic = 0.98) {
  phrases.forEach((barNotes, i) => {
    let beat = 0, n = 0;
    for (const [p, dur] of barNotes) {
      if (p !== null) part.note(p, v + hum(n + i), (startBar + i) * BAR + T(beat), Math.round(T(dur) * artic) - 8);
      beat += dur; n++;
    }
    if (Math.abs(beat - 4) > 0.01) throw new Error(`bar ${startBar + i} sums to ${beat} beats`);
  });
}

function compBass(bass: Trk, prog: Ch[], startBar: number, v: number, style: "half" | "quarter" | "eighths") {
  prog.forEach((c, i) => {
    const r = 36 + c.pc;
    if (style === "half") {
      bass.note(r, v, (startBar + i) * BAR, T(2) - 10);
      bass.note(r + 7, v - 10, (startBar + i) * BAR + T(2), T(2) - 10);
    } else if (style === "quarter") {
      for (let b = 0; b < 4; b++) bass.note(r, v - (b % 2) * 12, (startBar + i) * BAR + T(b), T(1) - 10);
    } else {
      for (let b = 0; b < 8; b++) {
        const pitch = b === 7 ? r + 12 : r;
        bass.note(pitch, (b === 0 ? v + 8 : v) - (b % 2) * 10 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.5) - 8);
      }
    }
  });
}

function padChords(part: Trk, prog: Ch[], startBar: number, v: number, base: number, every = 2) {
  for (let i = 0; i < prog.length; i += every) {
    const c = prog[i];
    for (const p of triad(c, base)) part.note(p, v + hum(i), (startBar + i) * BAR, every * BAR - 30);
  }
}

function ostinato(part: Trk, prog: Ch[], startBar: number, v: number, base: number) {
  prog.forEach((c, i) => {
    const r = base + c.pc, third = c.minor ? 3 : 4;
    const pat = [0, third, 7, third, 0, third, 7, third];
    for (let b = 0; b < 8; b++)
      part.note(r + pat[b], (b === 0 ? v + 6 : v) - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.42));
  });
}

function phrygOstinato(part: Trk, prog: Ch[], startBar: number, v: number, base: number) {
  // [0, b2, 4, b2] - TIE Fighter-style menace pattern
  prog.forEach((c, i) => {
    const r = base + c.pc;
    const pat = [0, 1, 4, 1, 0, 1, 4, 1];
    for (let b = 0; b < 8; b++)
      part.note(r + pat[b], (b === 0 ? v + 6 : v) - (b % 2) * 8 + hum(b + i), (startBar + i) * BAR + T(b * 0.5), T(0.42));
  });
}

function stabs(part: Trk, prog: Ch[], startBar: number, beats: number[], v: number, base: number) {
  prog.forEach((c, i) => {
    for (const b of beats) {
      const t = (startBar + i) * BAR + T(b);
      for (const p of triad(c, base)) part.note(p, v + hum(i * 3 + b), t, T(0.9) - 10);
    }
  });
}

function arpPiano(piano: Trk, prog: Ch[], startBar: number, v: number) {
  prog.forEach((c, i) => {
    const r = 48 + c.pc, third = c.minor ? 3 : 4;
    const pat = [r, r + 7, r + 12, r + third, r + 19, r + third, r + 12, r + 7];
    for (let e = 0; e < 8; e++) piano.note(pat[e], v + hum(e + i), (startBar + i) * BAR + T(e * 0.5), T(0.45));
  });
}

// ------------------------------------------------------------------ drums
const K = 36, S = 38, HH = 42, OH = 46, CR = 49, RD = 51, TOML = 45, TOMM = 47, TOMH = 50, FLT = 41, RIM = 37;
const d = (trk: Trk, tick: number, pitch: number, v: number) => trk.note(pitch, v127(v), tick, 120);

function hat8(trk: Trk, bar: number, v: number, openLast = false) {
  for (let b = 0; b < 8; b++) d(trk, bar * BAR + T(b * 0.5), openLast && b === 7 ? OH : HH, v - (b % 2) * 14);
}
function kickSnare(trk: Trk, bar: number, v: number, kicks: number[] = [0, 2, 3.5]) {
  for (const k of kicks) d(trk, bar * BAR + T(k), K, v);
  d(trk, bar * BAR + T(1), S, v + 4);
  d(trk, bar * BAR + T(3), S, v + 4);
}
function warSnare(trk: Trk, bar: number, v: number, density: 16 | 8, qMax = 4) {
  if (density === 16) {
    for (let q = 0; q < qMax; q++) {
      const acc = [6, -16, 0, -16][q];
      for (let s = 0; s < 4; s++)
        d(trk, bar * BAR + T(q + s * 0.25), S, v + acc - (s % 2) * 6 + hum(q * 4 + s));
    }
  } else {
    for (let q = 0; q < qMax; q++) d(trk, bar * BAR + T(q), S, v + (q % 2 === 0 ? 6 : -8));
  }
}
function roll(trk: Trk, bar: number, b0: number, b1: number, subdiv: number, v0: number, v1: number) {
  const n = Math.round((b1 - b0) / subdiv);
  for (let i = 0; i < n; i++)
    d(trk, bar * BAR + T(b0 + i * subdiv), S, v0 + (v1 - v0) * (i / Math.max(1, n - 1)));
}
function snareRun(trk: Trk, bar: number, fromBeat: number, v0: number, v1: number) {
  const n = Math.round((4 - fromBeat) / 0.25);
  for (let i = 0; i < n; i++)
    d(trk, bar * BAR + T(fromBeat + i * 0.25), S, v0 + (v1 - v0) * (i / Math.max(1, n - 1)));
}
function tomFill(trk: Trk, bar: number, v: number) {
  const seq = [TOMH, TOMH, TOMM, TOMM, TOML, TOML, FLT, FLT];
  for (let i = 0; i < 8; i++) d(trk, bar * BAR + T(i * 0.5), seq[i], v - 4 + i * 2);
}
function marchBar(trk: Trk, bar: number, v: number) {
  d(trk, bar * BAR + T(0), K, v);
  d(trk, bar * BAR + T(1), S, v - 6); d(trk, bar * BAR + T(2), S, v - 2); d(trk, bar * BAR + T(3), S, v - 6);
  d(trk, bar * BAR + T(3.75), S, v - 40);
}

// ----------------------------------------------------------- song assembly
type Song = { file: string; name: string; bpm: number; bars: number; trks: Trk[] };

function writeSong(s: Song) {
  const tempo = new Trk("Tempo", 0);
  const mpqn = Math.round(60000000 / s.bpm);
  tempo.add(0, -2, [0xFF, 0x03, s.name.length, ...[...s.name].map(c => c.charCodeAt(0))]);
  tempo.add(0, -1, [0xFF, 0x51, 0x03, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255]);
  tempo.add(0, -1, [0xFF, 0x58, 0x04, 4, 2, 24, 8]);
  const tracks = [tempo, ...s.trks];
  const trackBytes = tracks.map(t => t.serialize());
  const ntrks = tracks.length;
  const header = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (ntrks >> 8) & 255, ntrks & 255, (PPQ >> 8) & 255, PPQ & 255];
  const file = new Uint8Array([...header, ...trackBytes.flat()]);
  writeFileSync(new URL("./" + s.file, import.meta.url), Buffer.from(b64(file), "base64"));
  console.log(`${s.file}: ${file.length} bytes, ${s.bpm} BPM, ${s.bars} bars, ${(s.bars * 4 / s.bpm * 60).toFixed(1)}s`);
}

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

// =====================================================================
// 01 - EAGLE SQUADRON (title overture, 100 BPM, C minor, 48 bars)
// WC2-style: fanfare intro, broad heroic theme, strings answer,
// climactic reprise, fanfare outro that IS the intro restated, so the
// loop seam is the same phrase over a shifted chord.
// =====================================================================
function track01(): Song {
  const lead = new Trk("Lead Brass", 0), strings = new Trk("Strings", 1), horns = new Trk("Horns", 2),
    bass = new Trk("Bass", 3), piano = new Trk("Piano", 4), timp = new Trk("Timpani", 5), dr = new Trk("Drums", 9);
  lead.setup(61, 110, 64, 90); strings.setup(48, 92, 70, 100); horns.setup(60, 88, 84, 80);
  bass.setup(33, 100, 64, 30); piano.setup(0, 72, 40, 60); timp.setup(47, 92, 64, 60); dr.setup(0, 108, 64, 0);

  const Cm = ch(0, true), Ab = ch(8), Eb = ch(3), Bb = ch(10), Fm = ch(5, true), Db = ch(1), G = ch(7);
  const progIntro: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb];
  const progA: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb, Cm, Cm, Fm, Fm, Db, Db, G, G];
  const progB: Ch[] = [Fm, Fm, Db, Db, Eb, Eb, G, G];
  const progA2: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, G, G];
  const progOut: Ch[] = [Cm, Cm, Fm, Fm, Ab, Ab, Bb, Bb];

  const fanfare: NT[] = [
    [[null, 1], [67, 0.5], [70, 0.5], [72, 2]],
    [[75, 2], [74, 1], [72, 1]],
    [[null, 1], [72, 0.5], [75, 0.5], [77, 2]],
    [[80, 2], [79, 1], [77, 1]],
    [[null, 4]], [[null, 4]],
    [[82, 2], [80, 2]],
    [[79, 2], [77, 1], [75, 1]],
  ];
  const themeA: NT[] = [
    [[72, 2], [71, 1], [72, 1]],
    [[75, 3], [74, 1]],
    [[77, 2], [80, 2]],
    [[84, 3], [80, 1]],
    [[79, 2], [75, 2]],
    [[77, 1], [79, 1], [82, 2]],
    [[82, 2], [79, 2]],
    [[77, 4]],
    [[72, 1.5], [74, 0.5], [75, 2]],
    [[77, 2], [79, 2]],
    [[77, 2], [80, 1], [84, 1]],
    [[80, 4]],
    [[80, 2], [77, 2]],
    [[77, 4]],
    [[74, 2], [71, 2]],
    [[79, 4]],
  ];
  const themeB: NT[] = [
    [[77, 2], [80, 2]],
    [[82, 2], [80, 2]],
    [[80, 2], [77, 2]],
    [[73, 2], [75, 2]],
    [[79, 2], [77, 2]],
    [[75, 2], [74, 2]],
    [[74, 1], [71, 1], [67, 2]],
    [[71, 4]],
  ];
  const themeA2: NT[] = [
    themeA[0], themeA[1], themeA[2], themeA[3],
    [[75, 1], [77, 1], [79, 2]],
    [[82, 2], [79, 2]],
    [[74, 1], [71, 1], [74, 1], [79, 1]],
    [[79, 2], [83, 1], [86, 1]],
  ];

  // intro
  melody(lead, 0, fanfare, 104);
  padChords(strings, progIntro, 0, 56);
  padChords(horns, progIntro, 0, 50, 48);
  compBass(bass, progIntro, 0, 88, "half");
  for (let b = 0; b < 4; b++) marchBar(dr, b, 96);
  for (let b = 4; b < 7; b++) roll(dr, b, 0, 4, 0.5, 50 + (b - 4) * 8, 80 + (b - 4) * 8);
  roll(dr, 7, 0, 4, 0.25, 70, 115);
  for (let b = 0; b < 8; b++) { timp.note(36, 88, b * BAR, T(0.9)); timp.note(43, 76, b * BAR + T(2), T(0.9)); }

  // theme A
  melody(lead, 8, themeA, 112);
  padChords(strings, progA, 8, 62);
  padChords(piano, progA, 8, 38, 60);
  compBass(bass, progA, 8, 98, "eighths");
  stabs(horns, progA.filter((_, i) => i % 2 === 0), 8, [0], 88, 48);
  for (let b = 8; b < 24; b++) { kickSnare(dr, b, 104, [0, 2]); hat8(dr, b, 72, true); if (b % 4 === 0) d(dr, b * BAR, CR, 112); }
  tomFill(dr, 15, 98); tomFill(dr, 23, 108);
  for (let b = 8; b < 24; b++) timp.note(36, 84, b * BAR, T(0.9));

  // theme B (strings carry it)
  melody(strings, 24, themeB, 78);
  arpPiano(piano, progB, 24, 56);
  padChords(horns, progB, 24, 52, 48);
  compBass(bass, progB, 24, 90, "half");
  for (let b = 24; b < 32; b++) { d(dr, b * BAR, K, 92); d(dr, b * BAR + T(2), S, 88); hat8(dr, b, 56); }
  d(dr, 24 * BAR, CR, 104);

  // reprise
  melody(lead, 32, themeA2, 116);
  themeA2.forEach((barNotes, i) => {
    let beat = 0;
    for (const [p, dur] of barNotes) {
      if (p !== null) strings.note(p + 12, 60, (32 + i) * BAR + T(beat), Math.round(T(dur) * 0.98) - 8);
      beat += dur;
    }
  });
  padChords(piano, progA2, 32, 42, 60);
  compBass(bass, progA2, 32, 100, "eighths");
  stabs(horns, progA2, 32, [0, 2], 92, 48);
  for (let b = 32; b < 40; b++) { kickSnare(dr, b, 108, [0, 2]); hat8(dr, b, 76, true); if (b % 4 === 0) d(dr, b * BAR, CR, 116); }
  tomFill(dr, 39, 110);

  // outro = the intro fanfare restated over new chords; loops seamlessly
  melody(lead, 40, fanfare, 114);
  padChords(strings, progOut, 40, 60);
  padChords(horns, progOut, 40, 56, 48);
  compBass(bass, progOut, 40, 94, "half");
  for (let b = 40; b < 44; b++) marchBar(dr, b, 104);
  roll(dr, 46, 0, 4, 0.25, 80, 118);
  d(dr, 47 * BAR, CR, 122); d(dr, 47 * BAR, K, 114);
  for (let b = 40; b < 48; b++) { timp.note(36, 90, b * BAR, T(0.9)); timp.note(43, 78, b * BAR + T(2), T(0.9)); }

  return { file: "01-title-eagle-squadron.mid", name: "Eagle Squadron (Title Overture)", bpm: 100, bars: 48, trks: [lead, strings, horns, bass, piano, timp, dr] };
}

// =====================================================================
// 02 - HANGAR DECK (main menu, 92 BPM, D minor, 32 bars)
// TIE Fighter menu flavour: harpsichord ostinato over low strings,
// a slow horn melody, celesta sparkles. No snare backbeat.
// =====================================================================
function track02(): Song {
  const harpsi = new Trk("Harpsichord", 0), horn = new Trk("Horn", 1), strings = new Trk("Strings", 2),
    bass = new Trk("Bass", 3), celesta = new Trk("Celesta", 4), dr = new Trk("Drums", 9);
  harpsi.setup(6, 66, 72, 55); horn.setup(60, 92, 64, 85); strings.setup(48, 84, 60, 100);
  bass.setup(38, 86, 64, 25); celesta.setup(8, 46, 84, 70); dr.setup(0, 78, 64, 0);

  const Dm = ch(2, true), Bb = ch(10), F = ch(5), A = ch(9), Gm = ch(7, true);
  const progA: Ch[] = [Dm, Dm, Bb, Bb, F, F, A, A, Dm, Dm, Gm, Gm, Bb, Bb, A, A];
  const progB: Ch[] = [Gm, Gm, Dm, Dm, Bb, Bb, F, F, Gm, Gm, Bb, Bb, A, A, A, A];

  const melA: NT[] = [
    [[62, 2], [65, 1], [69, 1]],
    [[67, 3], [65, 1]],
    [[65, 2], [67, 1], [69, 1]],
    [[74, 4]],
    [[69, 2], [72, 1], [74, 1]],
    [[76, 3], [74, 1]],
    [[73, 2], [76, 2]],
    [[69, 4]],
    [[null, 2], [62, 0.5], [65, 0.5], [67, 1]],
    [[69, 3], [67, 1]],
    [[70, 2], [69, 1], [67, 1]],
    [[65, 4]],
    [[67, 2], [65, 2]],
    [[65, 2], [67, 2]],
    [[69, 1], [67, 1], [65, 1], [64, 1]],
    [[64, 4]],
  ];
  const melB: NT[] = [
    [[62, 2], [65, 2]],
    [[72, 2], [74, 2]],
    [[70, 2], [69, 2]],
    [[65, 2], [62, 2]],
    [[67, 2], [70, 2]],
    [[74, 2], [72, 2]],
    [[70, 2], [67, 2]],
    [[69, 4]],
    [[67, 1], [69, 1], [70, 2]],
    [[72, 2], [70, 2]],
    [[74, 2], [72, 2]],
    [[70, 4]],
    [[69, 1], [73, 1], [76, 1], [73, 1]],
    [[73, 2], [69, 2]],
    [[68, 2], [69, 2]],
    [[69, 4]],
  ];

  // harpsichord ostinato throughout
  for (const [prog, start] of [[progA, 0], [progB, 16]] as [Ch[], number][]) {
    prog.forEach((c, i) => {
      const r = 50 + c.pc, third = c.minor ? 3 : 4;
      const pat = [0, third, 7, 12, 7, third, 0, third];
      for (let b = 0; b < 8; b++)
        harpsi.note(r + pat[b], 58 - (b % 2) * 10 + hum(b + i), (start + i) * BAR + T(b * 0.5), T(0.4));
    });
  }
  melody(horn, 0, melA, 96);
  melody(strings, 16, melB, 70);
  padChords(strings, progA, 0, 54, 48);
  compBass(bass, progA, 0, 82, "half");
  compBass(bass, progB, 16, 84, "half");
  progB.forEach((c, i) => {
    if (i % 2 === 0) celesta.note(84 + c.pc, 40 + hum(i), (16 + i) * BAR + T(0.75), T(0.2));
    if (i % 2 === 1) celesta.note(84 + c.pc, 38 + hum(i), (16 + i) * BAR + T(2.75), T(0.2));
  });
  for (let b = 0; b < 32; b++) {
    d(dr, b * BAR, K, 58);
    hat8(dr, b, 34);
    if (b % 2 === 1) { d(dr, b * BAR + T(1.75), RIM, 40); d(dr, b * BAR + T(3.75), RIM, 40); }
  }
  roll(dr, 15, 2, 4, 0.5, 38, 58);
  roll(dr, 31, 2, 4, 0.5, 44, 66);
  d(dr, 0 * BAR, OH, 52); d(dr, 16 * BAR, OH, 52);

  return { file: "02-menu-hangar-deck.mid", name: "Hangar Deck (Main Menu)", bpm: 92, bars: 32, trks: [harpsi, horn, strings, bass, celesta, dr] };
}

// =====================================================================
// 03 - OPEN SPACE (patrol, 104 BPM, F major, 32 bars)
// Calm in-flight cue: flute melody, piano arps, nylon guitar,
// string pads. Major key, no aggression, gentle loop.
// =====================================================================
function track03(): Song {
  const flute = new Trk("Flute", 0), piano = new Trk("Piano", 1), strings = new Trk("Strings", 2),
    bass = new Trk("Bass", 3), guitar = new Trk("Guitar", 4), dr = new Trk("Drums", 9);
  flute.setup(73, 92, 64, 80); piano.setup(0, 76, 72, 55); strings.setup(48, 78, 60, 100);
  bass.setup(32, 84, 64, 25); guitar.setup(24, 60, 80, 60); dr.setup(0, 72, 64, 0);

  const F = ch(5), C = ch(0), Dm = ch(2, true), Bb = ch(10), Gm = ch(7, true), Am = ch(9, true);
  const progA: Ch[] = [F, F, C, C, Dm, Dm, Bb, Bb, F, F, C, C, Dm, Dm, Bb, C];
  const progB: Ch[] = [Bb, Bb, F, F, Dm, Dm, C, C, Bb, Bb, Gm, Gm, C, C, C, C];

  const melA: NT[] = [
    [[77, 1.5], [79, 0.5], [81, 2]],
    [[84, 3], [81, 1]],
    [[81, 2], [79, 1], [77, 1]],
    [[76, 4]],
    [[74, 2], [77, 2]],
    [[81, 3], [79, 1]],
    [[77, 2], [74, 2]],
    [[74, 4]],
    [[77, 1.5], [79, 0.5], [81, 2]],
    [[84, 2], [86, 2]],
    [[88, 3], [86, 1]],
    [[84, 4]],
    [[81, 2], [79, 2]],
    [[77, 2], [76, 2]],
    [[74, 2], [77, 2]],
    [[76, 4]],
  ];
  const melB: NT[] = [
    [[70, 2], [74, 2]],
    [[77, 2], [74, 2]],
    [[74, 2], [77, 2]],
    [[79, 2], [77, 2]],
    [[77, 2], [81, 2]],
    [[84, 2], [81, 2]],
    [[82, 2], [79, 2]],
    [[79, 4]],
    [[74, 1.5], [77, 0.5], [79, 2]],
    [[81, 2], [79, 2]],
    [[77, 2], [74, 2]],
    [[74, 4]],
    [[77, 2], [79, 2]],
    [[81, 2], [84, 2]],
    [[79, 2], [76, 2]],
    [[72, 4]],
  ];

  melody(flute, 0, melA, 96);
  arpPiano(piano, progA, 0, 54);
  padChords(strings, progA, 0, 52, 60);
  compBass(bass, progA, 0, 78, "half");
  progA.forEach((c, i) => { // gentle guitar strums
    for (const b of [0, 2]) for (const p of triad(c, 48)) guitar.note(p, 48 + hum(i + b), i * BAR + T(b), T(1.6));
  });

  melody(piano, 16, melB, 74);
  padChords(strings, progB, 16, 54, 60);
  compBass(bass, progB, 16, 80, "half");
  progB.forEach((c, i) => { // guitar takes the arps
    const r = 48 + c.pc, third = c.minor ? 3 : 4;
    const pat = [r, r + 7, r + 12, r + third, r + 12, r + 7, r + third, r + 7];
    for (let e = 0; e < 8; e++) guitar.note(pat[e], 46 + hum(e + i), (16 + i) * BAR + T(e * 0.5), T(0.45));
  });

  for (let b = 0; b < 32; b++) {
    d(dr, b * BAR, K, 62);
    hat8(dr, b, 36);
    if (b % 2 === 1) { d(dr, b * BAR + T(1.75), RIM, 34); d(dr, b * BAR + T(3.75), RIM, 34); }
  }
  d(dr, 0 * BAR, OH, 46);
  tomFill(dr, 15, 62); tomFill(dr, 31, 68);

  return { file: "03-patrol-open-space.mid", name: "Open Space (Patrol)", bpm: 104, bars: 32, trks: [flute, piano, strings, bass, guitar, dr] };
}

// =====================================================================
// 04 - CONTACTS (tension bed, 120 BPM, D minor, 48 bars)
// Quiet menace under gameplay: staccato string ostinato, trombone
// pedal with a D-Ab tritone cluster, xylophone clockwork ticks,
// sparse muted-trumpet motif, military snare that thickens.
// =====================================================================
function track04(): Song {
  const brass = new Trk("Low Brass", 0), strings = new Trk("Ostinato Strings", 1), bass = new Trk("Synth Bass", 2),
    xylo = new Trk("Xylophone", 3), trumpet = new Trk("Muted Trumpet", 4), dr = new Trk("Drums", 9);
  brass.setup(56, 82, 72, 70); strings.setup(48, 80, 60, 85); bass.setup(38, 86, 64, 25);
  xylo.setup(12, 54, 84, 55); trumpet.setup(59, 72, 90, 65); dr.setup(0, 92, 64, 0);

  const Dm = ch(2, true), Gm = ch(7, true), Bb = ch(10), A = ch(9), F = ch(5);
  const progA: Ch[] = [Dm, Dm, Dm, Dm, Gm, Gm, Dm, Dm, Bb, Bb, A, A, Dm, Dm, Dm, Dm];
  const progB: Ch[] = [Dm, Dm, Dm, Dm, F, F, Dm, Dm, Gm, Gm, Bb, Bb, A, A, A, A];
  const progC: Ch[] = [Dm, Dm, Gm, Gm, Bb, Bb, A, A];
  const progA2: Ch[] = [Dm, Dm, Gm, Gm, Bb, Bb, A, A];

  ostinato(strings, progA, 0, 64);
  ostinato(strings, progB, 16, 68);
  ostinato(strings, progA2, 40, 72);
  compBass(bass, progA, 0, 82, "eighths");
  compBass(bass, progB, 16, 86, "eighths");
  compBass(bass, progC, 32, 74, "half");
  compBass(bass, progA2, 40, 90, "eighths");

  // A: tritone cluster pedal; B: root-fifth pulses; C: swell; A': pulses + cluster
  progA.forEach((c, i) => {
    const r = 36 + c.pc;
    brass.note(r, 66 + hum(i), i * BAR, BAR - 30);
    if (i % 4 !== 2) brass.note(r + 6, 52 + hum(i), i * BAR, BAR - 30); // tritone
  });
  progB.forEach((c, i) => {
    const r = 36 + c.pc;
    for (const b of [0, 2]) for (const p of [r, r + 7]) brass.note(p, 70 + hum(i + b), (16 + i) * BAR + T(b), T(0.9));
  });
  progC.forEach((c, i) => {
    const r = 36 + c.pc;
    for (const p of triad(c, 48)) brass.note(p, 54 + i * 2.5 + hum(i), (32 + i) * BAR, BAR - 30);
  });
  progA2.forEach((c, i) => {
    const r = 36 + c.pc;
    for (const b of [0, 2]) for (const p of [r, r + 7]) brass.note(p, 76 + hum(i + b), (40 + i) * BAR + T(b), T(0.9));
    if (i % 2 === 1) brass.note(r + 6, 58, (40 + i) * BAR, BAR - 30);
  });

  // xylophone clockwork + sparse trumpet motif
  for (const [prog, start] of [[progA, 0], [progB, 16], [progA2, 40]] as [Ch[], number][]) {
    prog.forEach((c, i) => {
      xylo.note(74 + c.pc, 44 + hum(i), (start + i) * BAR + T(0.75), T(0.2));
      xylo.note(74 + c.pc, 42 + hum(i + 1), (start + i) * BAR + T(2.75), T(0.2));
    });
  }
  for (const bar of [3, 7, 11, 15]) {
    trumpet.note(62, 62, bar * BAR + T(2), T(0.45));
    trumpet.note(65, 60, bar * BAR + T(2.5), T(0.45));
    trumpet.note(69, 62, bar * BAR + T(3), T(0.45));
    trumpet.note(65, 58, bar * BAR + T(3.5), T(0.45));
  }
  for (const bar of [19, 27]) {
    trumpet.note(69, 66, bar * BAR + T(2), T(0.45));
    trumpet.note(74, 64, bar * BAR + T(2.5), T(0.45));
    trumpet.note(72, 66, bar * BAR + T(3), T(0.45));
    trumpet.note(69, 62, bar * BAR + T(3.5), T(0.45));
  }

  // drums: thin -> thick -> build -> hot
  for (let b = 0; b < 16; b++) {
    d(dr, b * BAR, K, 78);
    warSnare(dr, b, 44, 8, b % 4 === 3 ? 3 : 4);
    if (b % 2 === 1) { d(dr, b * BAR + T(1.75), RIM, 44); d(dr, b * BAR + T(3.75), RIM, 44); }
  }
  d(dr, 0, CR, 84);
  for (let b = 16; b < 32; b++) {
    d(dr, b * BAR, K, 86); d(dr, b * BAR + T(2), K, 80);
    warSnare(dr, b, 56, 16, b % 4 === 3 ? 3 : 4);
  }
  d(dr, 16 * BAR, CR, 88); snareRun(dr, 31, 3, 58, 88);
  for (let b = 32; b < 36; b++) { d(dr, b * BAR, K, 76); warSnare(dr, b, 48 + (b - 32) * 3, 8); }
  for (let b = 36; b < 40; b++) { d(dr, b * BAR, K, 82); warSnare(dr, b, 60 + (b - 36) * 4, 16); }
  roll(dr, 38, 0, 4, 0.5, 62, 84); roll(dr, 39, 0, 4, 0.25, 74, 100);
  for (let b = 40; b < 48; b++) {
    d(dr, b * BAR, K, 92); d(dr, b * BAR + T(2), K, 88); d(dr, b * BAR + T(3.5), K, 84);
    warSnare(dr, b, 66, 16, b % 4 === 3 ? 3 : 4);
  }
  d(dr, 40 * BAR, CR, 92); tomFill(dr, 47, 96);

  return { file: "04-tension-contacts.mid", name: "Contacts (Tension)", bpm: 120, bars: 48, trks: [brass, strings, bass, xylo, trumpet, dr] };
}

// =====================================================================
// 05 - FURBALL (dogfight bed, 144 BPM, E minor, 48 bars)
// Fast combat bed with no lead melody: string ostinato, brass stabs,
// power-guitar chugs, driving 16th snare. Sits under gameplay audio.
// =====================================================================
function track05(): Song {
  const brass = new Trk("Brass Stabs", 0), strings = new Trk("Ostinato Strings", 1), bass = new Trk("Synth Bass", 2),
    guitar = new Trk("Power Guitar", 3), dr = new Trk("Drums", 9);
  brass.setup(56, 88, 76, 70); strings.setup(48, 82, 60, 85); bass.setup(38, 88, 64, 25);
  guitar.setup(30, 84, 80, 40); dr.setup(0, 100, 64, 0);

  const Em = ch(4, true), C = ch(0), D = ch(2), Am = ch(9, true), B = ch(11);
  const progA: Ch[] = [Em, Em, C, C, D, D, Em, Em, Em, Em, C, C, Am, Am, B, B];
  const progB: Ch[] = [C, C, D, D, Em, Em, Em, Em, C, C, Am, Am, B, B, B, B];
  const progC: Ch[] = [Em, Em, C, C, D, D, B, B];
  const progA2: Ch[] = [Em, Em, C, C, D, D, B, B];

  ostinato(strings, progA, 0, 78);
  ostinato(strings, progB, 16, 82);
  ostinato(strings, progC, 32, 66);
  ostinato(strings, progA2, 40, 86);
  compBass(bass, progA, 0, 92, "eighths");
  compBass(bass, progB, 16, 94, "eighths");
  compBass(bass, progC, 32, 80, "half");
  compBass(bass, progA2, 40, 96, "eighths");
  stabs(brass, progA, 0, [0, 2.5], 84, 48);
  stabs(brass, progB, 16, [0, 1.5, 2.5, 3.5], 86, 48);
  stabs(brass, progC, 32, [0], 72, 48);
  stabs(brass, progA2, 40, [0, 1.5, 2.5, 3.5], 90, 48);

  const chugs = (prog: Ch[], start: number, v: number, beats: number[]) => {
    prog.forEach((c, i) => {
      for (const b of beats) for (const p of [48 + c.pc, 55 + c.pc])
        guitar.note(p, v + hum(i * 4 + b), (start + i) * BAR + T(b), T(0.45));
    });
  };
  chugs(progA, 0, 80, [0, 1, 2, 3]);
  chugs(progB, 16, 84, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  chugs(progA2, 40, 88, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);

  for (let b = 0; b < 32; b++) {
    kickSnare(dr, b, 100, [0, 1.75, 2, 3.5]);
    warSnare(dr, b, 58, 16, b % 4 === 3 ? 3 : 4);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 62 - (e % 2) * 10);
    if (b % 4 === 0) d(dr, b * BAR, CR, 104);
    if (b % 8 === 7) tomFill(dr, b, 96);
  }
  snareRun(dr, 23, 3, 66, 92); snareRun(dr, 31, 3, 70, 98);
  for (let b = 32; b < 40; b++) {
    d(dr, b * BAR, K, b < 36 ? 78 : 86); d(dr, b * BAR + T(2), K, b < 36 ? 72 : 82);
    warSnare(dr, b, b < 36 ? 50 : 58, 8);
    hat8(dr, b, 44);
  }
  roll(dr, 38, 0, 4, 0.5, 60, 84); roll(dr, 39, 0, 4, 0.25, 76, 104);
  for (let b = 40; b < 48; b++) {
    kickSnare(dr, b, 106, [0, 1.75, 2, 3.5]);
    warSnare(dr, b, 66, 16, b % 4 === 3 ? 3 : 4);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 66 - (e % 2) * 10);
    if (b % 4 === 0) d(dr, b * BAR, CR, 108);
  }
  tomFill(dr, 47, 104);

  return { file: "05-dogfight-furball.mid", name: "Furball (Dogfight)", bpm: 144, bars: 48, trks: [brass, strings, bass, guitar, dr] };
}

// =====================================================================
// 06 - CLIMB AND BURN (heavy combat anthem, 148 BPM, C minor, 64 bars)
// The big WC2-style anthem: fanfare intro, broad theme, strings
// answer, piano breakdown with a snare build, truck-driver modulation
// up to D minor for the final statement, dominant outro for the loop.
// =====================================================================
function track06(): Song {
  const lead = new Trk("Lead Brass", 0), strings = new Trk("Strings", 1), bass = new Trk("Bass", 2),
    piano = new Trk("Piano", 3), guitar = new Trk("Power Guitar", 4), organ = new Trk("Organ", 5),
    horns = new Trk("Horn Stabs", 6), dr = new Trk("Drums", 9);
  lead.setup(61, 112, 64, 90); strings.setup(48, 95, 70, 100); bass.setup(33, 100, 64, 30);
  piano.setup(0, 76, 40, 60); guitar.setup(30, 94, 80, 40); organ.setup(16, 60, 32, 70);
  horns.setup(59, 98, 96, 80); dr.setup(0, 110, 64, 0);

  const Cm = ch(0, true), Ab = ch(8), Eb = ch(3), Bb = ch(10), Fm = ch(5, true), Db = ch(1), G = ch(7),
    Dm = ch(2, true), F = ch(5), C = ch(0);
  const progIntro: Ch[] = [Cm, Cm, Cm, Cm, Fm, Fm, G, G];
  const progA: Ch[] = [Cm, Cm, Ab, Ab, Eb, Eb, Bb, Bb, Cm, Cm, Fm, Fm, Db, Db, G, G];
  const progB: Ch[] = [Ab, Ab, Eb, Eb, Fm, Fm, Cm, Cm, Db, Db, Bb, Bb, G, G, G, G];
  const progBreak: Ch[] = [Cm, Bb, Ab, Bb, Cm, Bb, Ab, G];
  const progA2: Ch[] = [Dm, Dm, Bb, Bb, F, F, C, C, Dm, Dm, Bb, Bb, G, G, G, G];

  const introMel: NT[] = [
    [[null, 2], [72, 0.5], [71, 0.5], [70, 1]],
    [[72, 4]],
    [[null, 2], [75, 0.5], [74, 0.5], [72, 1]],
    [[75, 4]],
    [[null, 4]], [[null, 4]],
    [[79, 2], [77, 2]],
    [[74, 2], [76, 1], [79, 1]],
  ];
  const themeA: NT[] = [
    [[72, 2], [71, 1], [72, 1]],
    [[75, 3], [74, 1]],
    [[77, 2], [80, 2]],
    [[84, 3], [80, 1]],
    [[79, 2], [75, 2]],
    [[77, 1], [79, 1], [82, 2]],
    [[82, 2], [79, 2]],
    [[77, 4]],
    [[72, 1.5], [74, 0.5], [75, 2]],
    [[77, 2], [79, 2]],
    [[77, 2], [80, 1], [84, 1]],
    [[80, 4]],
    [[80, 2], [77, 2]],
    [[77, 4]],
    [[74, 2], [71, 2]],
    [[79, 4]],
  ];
  const themeB: NT[] = [
    [[80, 2], [84, 2]],
    [[86, 2], [84, 2]],
    [[80, 2], [77, 2]],
    [[75, 4]],
    [[77, 2], [80, 2]],
    [[84, 2], [82, 2]],
    [[80, 2], [77, 2]],
    [[72, 4]],
    [[77, 1.5], [80, 0.5], [82, 2]],
    [[84, 2], [82, 2]],
    [[80, 2], [77, 2]],
    [[74, 4]],
    [[74, 1], [77, 1], [79, 2]],
    [[81, 2], [79, 2]],
    [[79, 1], [77, 1], [74, 1], [71, 1]],
    [[74, 4]],
  ];
  const themeA2: NT[] = [
    [[74, 2], [73, 1], [74, 1]],
    [[77, 3], [76, 1]],
    [[79, 2], [82, 2]],
    [[86, 3], [82, 1]],
    [[81, 2], [77, 2]],
    [[79, 1], [81, 1], [84, 2]],
    [[84, 2], [81, 2]],
    [[79, 4]],
    [[74, 1.5], [76, 0.5], [77, 2]],
    [[79, 2], [81, 2]],
    [[79, 2], [82, 1], [86, 1]],
    [[82, 4]],
    [[81, 2], [79, 2]],
    [[77, 4]],
    [[74, 2], [71, 2]],
    [[79, 4]],
  ];

  // intro
  melody(lead, 0, introMel, 106);
  padChords(strings, progIntro, 0, 56);
  padChords(organ, progIntro, 0, 48, 48);
  compBass(bass, progIntro, 0, 90, "half");
  for (let b = 0; b < 4; b++) marchBar(dr, b, 98);
  for (let b = 4; b < 7; b++) roll(dr, b, 0, 4, 0.5, 52 + (b - 4) * 8, 82 + (b - 4) * 8);
  roll(dr, 7, 0, 4, 0.25, 72, 116);

  // theme A
  melody(lead, 8, themeA, 112);
  padChords(strings, progA, 8, 64);
  padChords(organ, progA, 8, 54, 48);
  compBass(bass, progA, 8, 100, "eighths");
  progA.forEach((c, i) => { for (const b of [1, 3]) for (const p of [48 + c.pc, 55 + c.pc, 60 + c.pc]) guitar.note(p, 88 + hum(i * 4 + b), (8 + i) * BAR + T(b + 0.5), T(0.45)); });
  stabs(horns, progA.filter((_, i) => i % 2 === 0), 8, [0], 94, 48);
  for (let b = 8; b < 24; b++) { kickSnare(dr, b, 108, [0, 1.75, 2, 3.5]); hat8(dr, b, 78, true); if (b % 4 === 0) d(dr, b * BAR, CR, 116); }
  tomFill(dr, 15, 100); tomFill(dr, 23, 112);

  // theme B (strings carry the line)
  melody(strings, 24, themeB, 76);
  padChords(organ, progB, 24, 54, 48);
  compBass(bass, progB, 24, 98, "eighths");
  stabs(horns, progB, 24, [0, 2], 92, 48);
  progB.forEach((c, i) => { for (const b of [0, 1, 2, 3]) for (const p of [48 + c.pc, 55 + c.pc]) guitar.note(p, 84 + hum(i * 4 + b), (24 + i) * BAR + T(b), T(0.45)); });
  for (let b = 24; b < 40; b++) {
    kickSnare(dr, b, 104, [0, 2]);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 70 - (e % 2) * 12);
    if (b % 8 === 0) d(dr, b * BAR, CR, 112);
  }
  tomFill(dr, 31, 102); tomFill(dr, 39, 110);

  // breakdown + build
  arpPiano(piano, progBreak, 40, 62);
  progBreak.forEach((c, i) => {
    const longNote = [72, 70, 68, 74, 72, 70, 68, 74][i];
    lead.note(longNote, 96 + i * 2, (40 + i) * BAR, BAR - 20);
    for (const p of triad(c, 60)) strings.note(p, 60 + i * 2, (40 + i) * BAR, BAR - 30);
    for (const p of triad(c, 48)) organ.note(p, 44, (40 + i) * BAR, BAR - 30);
  });
  compBass(bass, progBreak, 40, 88, "quarter");
  for (let b = 40; b < 44; b++) { d(dr, b * BAR, K, 90); hat8(dr, b, 52); }
  for (let b = 44; b < 48; b++) { d(dr, b * BAR, K, 96); d(dr, b * BAR + T(1), S, 86); d(dr, b * BAR + T(3), S, 86); hat8(dr, b, 62); }
  roll(dr, 45, 0, 4, 0.5, 55, 80); roll(dr, 46, 0, 4, 0.5, 75, 100); roll(dr, 47, 0, 4, 0.25, 85, 115);
  tomFill(dr, 47, 114);

  // final statement in D minor
  melody(lead, 48, themeA2, 118);
  themeA2.forEach((barNotes, i) => {
    let beat = 0;
    for (const [p, dur] of barNotes) {
      if (p !== null) strings.note(p + 12, 62, (48 + i) * BAR + T(beat), Math.round(T(dur) * 0.98) - 8);
      beat += dur;
    }
  });
  padChords(organ, progA2, 48, 58, 48);
  compBass(bass, progA2, 48, 104, "eighths");
  stabs(horns, progA2, 48, [0, 2], 100, 48);
  progA2.forEach((c, i) => { for (const b of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) for (const p of [48 + c.pc, 55 + c.pc]) guitar.note(p, 90 + hum(i * 8 + b), (48 + i) * BAR + T(b), T(0.45)); });
  for (let b = 48; b < 64; b++) {
    kickSnare(dr, b, 112, [0, 1.75, 2, 3.5]);
    hat8(dr, b, 80, true);
    if (b % 2 === 0) d(dr, b * BAR, CR, 120);
  }
  tomFill(dr, 55, 106); tomFill(dr, 63, 116);

  return { file: "06-heavy-climb-and-burn.mid", name: "Climb and Burn (Heavy Combat)", bpm: 148, bars: 64, trks: [lead, strings, bass, piano, guitar, organ, horns, dr] };
}

// =====================================================================
// 07 - BROADSIDE (capital ship duel, 96 BPM, G minor, 48 bars)
// Massive and slow: timpani war pulse, trombone chorales, half-time
// snare, horn melody. Two corvettes trading broadsides.
// =====================================================================
function track07(): Song {
  const horn = new Trk("Horn", 0), brass = new Trk("Low Brass", 1), strings = new Trk("Strings", 2),
    bass = new Trk("Bass", 3), timp = new Trk("Timpani", 4), piano = new Trk("Piano", 5), dr = new Trk("Drums", 9);
  horn.setup(60, 96, 64, 85); brass.setup(56, 92, 72, 80); strings.setup(48, 88, 60, 100);
  bass.setup(32, 90, 64, 25); timp.setup(47, 94, 64, 60); piano.setup(0, 60, 40, 55); dr.setup(0, 96, 64, 0);

  const Gm = ch(7, true), Eb = ch(3), Cm = ch(0, true), D = ch(2), Bb = ch(10), F = ch(5);
  const progA: Ch[] = [Gm, Gm, Eb, Eb, Cm, Cm, D, D, Gm, Gm, Eb, Eb, Bb, Bb, D, D];
  const progB: Ch[] = [Eb, Eb, Bb, Bb, Cm, Cm, Gm, Gm, Eb, Eb, F, F, D, D, D, D];
  const progC: Ch[] = [Gm, Gm, Eb, Eb, Cm, Cm, D, D];
  const progA2: Ch[] = [Gm, Gm, Eb, Eb, Cm, Cm, D, D];

  const melA: NT[] = [
    [[67, 3], [70, 1]],
    [[74, 2], [72, 2]],
    [[70, 2], [74, 2]],
    [[75, 4]],
    [[74, 2], [70, 2]],
    [[67, 4]],
    [[69, 2], [67, 2]],
    [[66, 4]],
    [[67, 3], [70, 1]],
    [[74, 4]],
    [[77, 2], [75, 2]],
    [[75, 4]],
    [[75, 2], [77, 2]],
    [[79, 4]],
    [[74, 2], [71, 2]],
    [[69, 2], [66, 2]],
  ];
  const melB: NT[] = [
    [[75, 2], [79, 2]],
    [[82, 2], [79, 2]],
    [[75, 2], [72, 2]],
    [[72, 4]],
    [[72, 2], [75, 2]],
    [[79, 2], [77, 2]],
    [[75, 2], [72, 2]],
    [[67, 4]],
    [[70, 2], [72, 2]],
    [[74, 2], [77, 2]],
    [[77, 2], [79, 2]],
    [[81, 4]],
    [[81, 2], [79, 2]],
    [[78, 2], [74, 2]],
    [[74, 2], [69, 2]],
    [[69, 4]],
  ];

  melody(horn, 0, melA, 100);
  padChords(brass, progA, 0, 72, 43, 1);
  padChords(strings, progA, 0, 56, 60);
  padChords(piano, progA, 0, 36, 48, 1);
  compBass(bass, progA, 0, 84, "half");

  melody(strings, 16, melB, 72);
  padChords(brass, progB, 16, 74, 43, 1);
  padChords(piano, progB, 16, 38, 48, 1);
  compBass(bass, progB, 16, 86, "half");

  // C: no melody, swells + build
  progC.forEach((c, i) => {
    const v = 58 + i * 3;
    for (const p of triad(c, 43)) brass.note(p, v + hum(i), (32 + i) * BAR, BAR - 30);
    for (const p of triad(c, 60)) strings.note(p, v - 8 + hum(i), (32 + i) * BAR, BAR - 30);
  });
  compBass(bass, progC, 32, 88, "quarter");

  melody(horn, 40, melA.slice(0, 8), 104);
  padChords(brass, progA2, 40, 76, 43, 1);
  padChords(strings, progA2, 40, 60, 60);
  compBass(bass, progA2, 40, 88, "half");

  // timpani war pulse throughout, 8ths in the build
  for (let b = 0; b < 32; b++) {
    timp.note(43, 88, b * BAR, T(0.9));
    timp.note(38, 74, b * BAR + T(1.5), T(0.9));
    timp.note(43, 80, b * BAR + T(3), T(0.9));
  }
  for (let b = 32; b < 40; b++) for (let e = 0; e < 8; e++)
    timp.note(e % 2 ? 38 : 43, 70 + (b - 32) * 3 - (e % 2) * 10, b * BAR + T(e * 0.5), T(0.4));
  for (let b = 40; b < 48; b++) {
    timp.note(43, 92, b * BAR, T(0.9));
    timp.note(38, 78, b * BAR + T(1.5), T(0.9));
    timp.note(43, 84, b * BAR + T(3), T(0.9));
  }

  // half-time drums
  for (let b = 0; b < 32; b++) {
    d(dr, b * BAR, K, 90);
    d(dr, b * BAR + T(2), S, 82);
    hat8(dr, b, 38);
    if (b % 4 === 0) d(dr, b * BAR, CR, 96);
  }
  d(dr, 0 * BAR, OH, 70);
  tomFill(dr, 31, 92);
  for (let b = 32; b < 36; b++) { d(dr, b * BAR, K, 80); d(dr, b * BAR + T(2), S, 70); }
  for (let b = 36; b < 40; b++) { d(dr, b * BAR, K, 88); warSnare(dr, b, 62 + (b - 36) * 5, 8); }
  roll(dr, 38, 0, 4, 0.5, 66, 90); roll(dr, 39, 0, 4, 0.25, 80, 106);
  for (let b = 40; b < 48; b++) {
    d(dr, b * BAR, K, 94); d(dr, b * BAR + T(2), K, 84);
    d(dr, b * BAR + T(2), S, 86);
    hat8(dr, b, 44);
    if (b % 4 === 0) d(dr, b * BAR, CR, 100);
  }
  tomFill(dr, 47, 100);

  return { file: "07-capital-broadside.mid", name: "Broadside (Capital Duel)", bpm: 96, bars: 48, trks: [horn, brass, strings, bass, timp, piano, dr] };
}

// =====================================================================
// 08 - HIVE LORD (boss: the Bullfrog, 132 BPM, F minor, 48 bars)
// TIE Fighter imperial menace: phrygian ostinato (F - Gb - Ab),
// organ pads, muted-trumpet lead, tritone-tinged brass, 16th snare.
// =====================================================================
function track08(): Song {
  const organ = new Trk("Organ", 0), trumpet = new Trk("Muted Trumpet", 1), strings = new Trk("Ostinato Strings", 2),
    bass = new Trk("Synth Bass", 3), xylo = new Trk("Xylophone", 4), brass = new Trk("Low Brass", 5), dr = new Trk("Drums", 9);
  organ.setup(16, 74, 40, 75); trumpet.setup(59, 96, 72, 70); strings.setup(48, 84, 60, 85);
  bass.setup(38, 90, 64, 25); xylo.setup(12, 54, 84, 55); brass.setup(56, 86, 76, 70); dr.setup(0, 100, 64, 0);

  const Fm = ch(5, true), Db = ch(1), Eb = ch(3), C = ch(0), Ab = ch(8);
  const progA: Ch[] = [Fm, Fm, Db, Db, Eb, Eb, C, C, Fm, Fm, Db, Db, C, C, C, C];
  const progB: Ch[] = [Db, Db, Ab, Ab, Fm, Fm, C, C, Db, Db, Eb, Eb, C, C, C, C];
  const progC: Ch[] = [Fm, Fm, Db, Db, Eb, Eb, C, C];
  const progA2: Ch[] = [Fm, Fm, Db, Db, C, C, C, C];

  const melA: NT[] = [
    [[77, 0.5], [78, 0.5], [77, 1], [75, 1], [72, 1]],
    [[72, 4]],
    [[73, 2], [75, 2]],
    [[77, 4]],
    [[75, 2], [79, 2]],
    [[79, 2], [84, 2]],
    [[77, 1], [75, 1], [73, 2]],
    [[72, 4]],
    [[77, 0.5], [78, 0.5], [77, 1], [80, 1], [82, 1]],
    [[85, 3], [82, 1]],
    [[82, 2], [80, 2]],
    [[77, 4]],
    [[80, 1], [82, 1], [84, 2]],
    [[84, 2], [88, 2]],
    [[84, 2], [83, 1], [79, 1]],
    [[84, 4]],
  ];
  const melB: NT[] = [
    [[73, 2], [77, 2]],
    [[80, 2], [77, 2]],
    [[77, 2], [75, 2]],
    [[72, 4]],
    [[73, 1], [75, 1], [77, 2]],
    [[79, 2], [84, 2]],
    [[82, 2], [80, 2]],
    [[82, 2], [84, 2]],
    [[84, 2], [82, 2]],
    [[80, 2], [77, 2]],
    [[79, 1], [80, 1], [84, 2]],
    [[84, 2], [79, 2]],
    [[79, 2], [77, 2]],
    [[73, 2], [72, 2]],
    [[76, 1], [79, 1], [84, 2]],
    [[84, 4]],
  ];

  phrygOstinato(strings, progA, 0, 74);
  phrygOstinato(strings, progB, 16, 78);
  phrygOstinato(strings, progC, 32, 64);
  phrygOstinato(strings, progA2, 40, 82);
  compBass(bass, progA, 0, 90, "eighths");
  compBass(bass, progB, 16, 92, "eighths");
  compBass(bass, progC, 32, 78, "half");
  compBass(bass, progA2, 40, 94, "eighths");
  padChords(organ, progA, 0, 56, 48);
  padChords(organ, progB, 16, 58, 48);
  padChords(organ, progC, 32, 50, 48);
  padChords(organ, progA2, 40, 60, 48);
  stabs(brass, progA, 0, [0, 2.5], 82, 48);
  stabs(brass, progB, 16, [0, 1.5, 2.5, 3.5], 84, 48);
  stabs(brass, progC, 32, [0], 70, 48);
  stabs(brass, progA2, 40, [0, 1.5, 2.5, 3.5], 88, 48);
  // low organ pedal F under the A sections
  for (let b = 0; b < 16; b++) organ.note(29, 62, b * BAR, BAR - 30);
  for (let b = 40; b < 48; b++) organ.note(29, 66, b * BAR, BAR - 30);

  melody(trumpet, 0, melA, 100);
  melody(trumpet, 16, melB, 96);
  melody(trumpet, 40, melA.slice(0, 8), 106);

  // xylophone 16th clockwork in B and A'
  for (const [prog, start] of [[progB, 16], [progA2, 40]] as [Ch[], number][]) {
    prog.forEach((c, i) => {
      if (i % 2 === 0) { xylo.note(72 + c.pc, 48 + hum(i), (start + i) * BAR + T(0.75), T(0.2)); xylo.note(72 + c.pc, 46, (start + i) * BAR + T(2.75), T(0.2)); }
      else { xylo.note(72 + c.pc, 44 + hum(i), (start + i) * BAR + T(1.75), T(0.2)); xylo.note(72 + c.pc, 42, (start + i) * BAR + T(3.75), T(0.2)); }
    });
  }

  for (let b = 0; b < 16; b++) {
    kickSnare(dr, b, 94, [0, 2, 3.5]);
    warSnare(dr, b, 56, 16, b % 4 === 3 ? 3 : 4);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 58 - (e % 2) * 10);
    if (b % 4 === 0) d(dr, b * BAR, CR, 100);
  }
  tomFill(dr, 15, 94);
  for (let b = 16; b < 32; b++) {
    kickSnare(dr, b, 100, [0, 1.75, 2, 3.5]);
    warSnare(dr, b, 62, 16, b % 4 === 3 ? 3 : 4);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 62 - (e % 2) * 10);
    if (b % 4 === 0) d(dr, b * BAR, CR, 104);
  }
  snareRun(dr, 23, 3, 64, 90); snareRun(dr, 31, 3, 68, 96);
  for (let b = 32; b < 36; b++) { d(dr, b * BAR, K, 80); warSnare(dr, b, 50 + (b - 32) * 3, 8); hat8(dr, b, 42); }
  for (let b = 36; b < 40; b++) { d(dr, b * BAR, K, 86); d(dr, b * BAR + T(2), K, 82); warSnare(dr, b, 58 + (b - 36) * 4, 16); }
  roll(dr, 38, 0, 4, 0.5, 62, 86); roll(dr, 39, 0, 4, 0.25, 76, 102);
  for (let b = 40; b < 48; b++) {
    kickSnare(dr, b, 104, [0, 1.75, 2, 3.5]);
    warSnare(dr, b, 68, 16, b % 4 === 3 ? 3 : 4);
    for (let e = 0; e < 8; e++) d(dr, b * BAR + T(e * 0.5), e % 2 ? RD : HH, 66 - (e % 2) * 10);
    if (b % 4 === 0) d(dr, b * BAR, CR, 108);
  }
  tomFill(dr, 47, 104);

  return { file: "08-boss-hive-lord.mid", name: "Hive Lord (Boss)", bpm: 132, bars: 48, trks: [organ, trumpet, strings, bass, xylo, brass, dr] };
}

// =====================================================================
// 09 - MEDALS (victory, 116 BPM, Eb major, 40 bars)
// Debrief fanfare: march snare, timpani, broad major theme, strings
// answer, final statement with a cymbal-roll ending.
// =====================================================================
function track09(): Song {
  const lead = new Trk("Lead Brass", 0), strings = new Trk("Strings", 1), horns = new Trk("Horns", 2),
    bass = new Trk("Bass", 3), piano = new Trk("Piano", 4), timp = new Trk("Timpani", 5), dr = new Trk("Drums", 9);
  lead.setup(61, 112, 64, 90); strings.setup(48, 94, 70, 100); horns.setup(60, 92, 84, 80);
  bass.setup(33, 100, 64, 30); piano.setup(0, 70, 40, 60); timp.setup(47, 92, 64, 60); dr.setup(0, 106, 64, 0);

  const Eb = ch(3), Ab = ch(8), Bb = ch(10), C = ch(0), Fm = ch(5, true), Db = ch(1);
  const progIntro: Ch[] = [Eb, Eb, Ab, Ab, Bb, Bb, Eb, Eb];
  const progA: Ch[] = [Eb, Eb, Bb, Bb, Ab, Ab, Eb, Eb, C, C, Fm, Fm, Bb, Bb, Eb, Eb];
  const progB: Ch[] = [Ab, Ab, Db, Db, Eb, Eb, Bb, Bb];
  const progA2: Ch[] = [C, C, Fm, Fm, Bb, Bb, Eb, Eb];

  const introMel: NT[] = [
    [[null, 1], [75, 0.5], [77, 0.5], [79, 2]],
    [[79, 1], [77, 1], [75, 2]],
    [[null, 1], [80, 0.5], [82, 0.5], [84, 2]],
    [[84, 1], [82, 1], [80, 2]],
    [[null, 4]], [[null, 4]],
    [[84, 2], [82, 2]],
    [[80, 2], [79, 1], [77, 1]],
  ];
  const themeA: NT[] = [
    [[75, 1.5], [77, 0.5], [79, 2]],
    [[82, 3], [79, 1]],
    [[79, 2], [82, 2]],
    [[82, 4]],
    [[82, 2], [79, 2]],
    [[75, 4]],
    [[77, 1.5], [79, 0.5], [82, 2]],
    [[84, 2], [82, 2]],
    [[88, 3], [84, 1]],
    [[79, 4]],
    [[84, 2], [82, 2]],
    [[80, 4]],
    [[80, 2], [84, 2]],
    [[86, 2], [84, 2]],
    [[82, 2], [79, 2]],
    [[75, 4]],
  ];
  const themeB: NT[] = [
    [[80, 2], [84, 2]],
    [[89, 2], [87, 2]],
    [[87, 2], [84, 2]],
    [[82, 4]],
    [[84, 2], [87, 2]],
    [[84, 2], [82, 2]],
    [[82, 2], [80, 2]],
    [[82, 4]],
  ];
  const themeA2: NT[] = [
    [[88, 3], [84, 1]],
    [[79, 4]],
    [[84, 2], [82, 2]],
    [[80, 4]],
    [[80, 2], [84, 2]],
    [[86, 2], [84, 2]],
    [[82, 2], [79, 2]],
    [[75, 2], [79, 1], [82, 1]],
  ];

  melody(lead, 0, introMel, 108);
  padChords(strings, progIntro, 0, 58);
  stabs(horns, progIntro, 0, [0], 92, 48);
  compBass(bass, progIntro, 0, 92, "half");
  for (let b = 0; b < 7; b++) marchBar(dr, b, 100);
  roll(dr, 7, 0, 4, 0.25, 72, 112);
  for (let b = 0; b < 8; b++) { timp.note(39, 88, b * BAR, T(0.9)); timp.note(46, 76, b * BAR + T(2), T(0.9)); }

  melody(lead, 8, themeA, 112);
  padChords(strings, progA, 8, 64);
  stabs(horns, progA.filter((_, i) => i % 2 === 0), 8, [0], 94, 48);
  compBass(bass, progA, 8, 100, "eighths");
  for (let b = 8; b < 24; b++) { kickSnare(dr, b, 102, [0, 2]); hat8(dr, b, 70, true); if (b % 4 === 0) d(dr, b * BAR, CR, 110); }
  tomFill(dr, 15, 98); tomFill(dr, 23, 106);
  for (let b = 8; b < 24; b++) timp.note(39, 82, b * BAR, T(0.9));

  melody(strings, 24, themeB, 76);
  arpPiano(piano, progB, 24, 58);
  padChords(horns, progB, 24, 56, 48);
  compBass(bass, progB, 24, 92, "half");
  for (let b = 24; b < 32; b++) { d(dr, b * BAR, K, 94); d(dr, b * BAR + T(2), S, 90); hat8(dr, b, 54); }
  d(dr, 24 * BAR, CR, 102);

  melody(lead, 32, themeA2, 116);
  themeA2.forEach((barNotes, i) => {
    let beat = 0;
    for (const [p, dur] of barNotes) {
      if (p !== null) strings.note(p + 12, 62, (32 + i) * BAR + T(beat), Math.round(T(dur) * 0.98) - 8);
      beat += dur;
    }
  });
  stabs(horns, progA2, 32, [0, 2], 98, 48);
  compBass(bass, progA2, 32, 102, "eighths");
  for (let b = 32; b < 40; b++) { kickSnare(dr, b, 108, [0, 2]); hat8(dr, b, 74, true); if (b % 2 === 0) d(dr, b * BAR, CR, 114); }
  roll(dr, 38, 0, 4, 0.5, 80, 108);
  roll(dr, 39, 0, 4, 0.25, 90, 120);
  d(dr, 39 * BAR, CR, 124); d(dr, 39 * BAR, K, 116);
  for (let b = 32; b < 40; b++) { timp.note(39, 88, b * BAR, T(0.9)); timp.note(46, 78, b * BAR + T(2), T(0.9)); }

  return { file: "09-victory-medals.mid", name: "Medals (Victory)", bpm: 116, bars: 40, trks: [lead, strings, horns, bass, piano, timp, dr] };
}

// =====================================================================
// 10 - EMPTY BUNKS (loss, 72 BPM, A minor, 32 bars)
// Somber debrief: solo horn over slow strings, piano chords, timpani
// heartbeat. Ends on the dominant so the loop stays unresolved.
// =====================================================================
function track10(): Song {
  const horn = new Trk("Horn", 0), strings = new Trk("Strings", 1), piano = new Trk("Piano", 2),
    bass = new Trk("Bass", 3), timp = new Trk("Timpani", 4), dr = new Trk("Drums", 9);
  horn.setup(60, 96, 64, 90); strings.setup(48, 84, 60, 100); piano.setup(0, 66, 72, 60);
  bass.setup(32, 80, 64, 25); timp.setup(47, 78, 64, 60); dr.setup(0, 66, 64, 0);

  const Am = ch(9, true), F = ch(5), C = ch(0), G = ch(7), Dm = ch(2, true), E = ch(4);
  const progA: Ch[] = [Am, Am, F, F, C, C, G, G, Am, Am, Dm, Dm, E, E, Am, Am];
  const progB: Ch[] = [Dm, Dm, Am, Am, F, F, C, C, Dm, Dm, E, E, Am, Am, E, E];

  const melA: NT[] = [
    [[69, 2], [72, 1], [76, 1]],
    [[77, 3], [76, 1]],
    [[76, 2], [72, 2]],
    [[67, 4]],
    [[67, 2], [64, 2]],
    [[62, 3], [64, 1]],
    [[64, 2], [65, 2]],
    [[64, 2], [62, 2]],
    [[64, 2], [62, 2]],
    [[62, 4]],
    [[64, 2], [65, 2]],
    [[64, 2], [62, 2]],
    [[61, 2], [64, 2]],
    [[69, 4]],
    [[null, 4]],
    [[null, 4]],
  ];
  const melB: NT[] = [
    [[74, 2], [77, 2]],
    [[76, 2], [74, 2]],
    [[72, 2], [69, 2]],
    [[69, 4]],
    [[69, 2], [72, 2]],
    [[76, 4]],
    [[74, 2], [72, 2]],
    [[67, 4]],
    [[65, 2], [69, 2]],
    [[72, 2], [74, 2]],
    [[76, 2], [80, 2]],
    [[71, 4]],
    [[69, 2], [72, 2]],
    [[73, 2], [76, 2]],
    [[76, 2], [74, 2]],
    [[69, 2], [64, 2]],
  ];

  melody(horn, 0, melA, 92);
  padChords(strings, progA, 0, 52, 48);
  progA.forEach((c, i) => { for (const p of triad(c, 48)) piano.note(p, 38 + hum(i), i * BAR, T(1.4)); });
  compBass(bass, progA, 0, 72, "half");

  melody(strings, 16, melB, 66);
  padChords(piano, progB, 16, 36, 48, 1);
  compBass(bass, progB, 16, 74, "half");

  // timpani heartbeat
  for (let b = 0; b < 32; b++) {
    timp.note(45, 54, b * BAR, T(0.9));
    timp.note(45, 38, b * BAR + T(2.5), T(0.9));
  }

  roll(dr, 7, 2, 4, 0.5, 30, 44);
  roll(dr, 15, 2, 4, 0.5, 32, 50);
  roll(dr, 23, 2, 4, 0.5, 36, 54);
  roll(dr, 31, 2, 4, 0.5, 40, 58);
  d(dr, 0 * BAR, OH, 42);

  return { file: "10-loss-empty-bunks.mid", name: "Empty Bunks (Loss)", bpm: 72, bars: 32, trks: [horn, strings, piano, bass, timp, dr] };
}

// ------------------------------------------------------------------- main
const songs: Song[] = [track01(), track02(), track03(), track04(), track05(), track06(), track07(), track08(), track09(), track10()];
for (const s of songs) writeSong(s);
console.log(`\n${songs.length} tracks written. All loops are seamless: each ends on a chord that leads back into its own bar 0.`);
