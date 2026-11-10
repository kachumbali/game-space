// SMF structural validator for the soundtrack (dev tool, not shipped).
// Usage: node validate-mid.mjs
import { readFileSync, readdirSync } from "fs";

let failures = 0;
for (const file of readdirSync(new URL(".", import.meta.url)).filter(f => f.endsWith(".mid")).sort()) {
  const data = readFileSync(new URL("./" + file, import.meta.url));
  const problems = [];
  if (data.length < 14 || data.toString("latin1", 0, 4) !== "MThd") { console.log(`BAD  ${file}: no MThd`); failures++; continue; }
  const hlen = data.readUInt32BE(4), fmt = data.readUInt16BE(8), ntrks = data.readUInt16BE(10), ppq = data.readUInt16BE(12);
  let pos = 14;
  let totalOn = 0, totalOff = 0;
  const chans = new Set(), progs = new Set();
  for (let t = 0; t < ntrks; t++) {
    if (data.toString("latin1", pos, pos + 4) !== "MTrk") { problems.push(`track ${t}: no MTrk marker`); break; }
    const tlen = data.readUInt32BE(pos + 4);
    const body = data.subarray(pos + 8, pos + 8 + tlen);
    if (body.length !== tlen) { problems.push(`track ${t}: truncated`); break; }
    pos += 8 + tlen;
    let i = 0;
    const open = new Map();
    while (i < body.length) {
      while (body[i] & 0x80) i++;
      i++; // delta time
      const b = body[i];
      if (b === 0xff) { i += 3 + body[i + 2]; }
      else if (b & 0x80) {
        const st = b; i++;
        const hi = st & 0xf0, ch = st & 0x0f;
        if (hi === 0x90 || hi === 0x80) {
          const p = body[i], v = body[i + 1]; i += 2;
          chans.add(ch);
          if (hi === 0x90 && v > 0) { open.set(ch + ":" + p, (open.get(ch + ":" + p) || 0) + 1); totalOn++; }
          else if ((open.get(ch + ":" + p) || 0) > 0) { open.set(ch + ":" + p, open.get(ch + ":" + p) - 1); totalOff++; }
          else problems.push(`track ${t}: note-off without note-on ch${ch} p${p}`);
        } else if (hi === 0xc0) { progs.add(body[i]); i += 1; chans.add(ch); }
        else if (hi === 0xb0) { i += 2; chans.add(ch); }
        else { problems.push(`track ${t}: unexpected status 0x${st.toString(16)}`); i += 1; }
      } else { problems.push(`track ${t}: running status not expected`); i += 1; }
    }
    for (const [k, n] of open) if (n > 0) problems.push(`track ${t}: ${n} hanging note ${k}`);
  }
  if (pos !== data.length) problems.push(`trailing bytes: file ${data.length}, parsed ${pos}`);
  const ok = problems.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "BAD "} ${file}: fmt${fmt}, ${ntrks} tracks, ppq${ppq}, ${totalOn} note-ons, chans [${[...chans].sort((a, b) => a - b).join(",")}], programs [${[...progs].sort((a, b) => a - b).join(",")}]${ok ? "" : "  -- " + problems.slice(0, 4).join("; ")}`);
}
console.log(failures === 0 ? "\nAll files valid." : `\n${failures} file(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
