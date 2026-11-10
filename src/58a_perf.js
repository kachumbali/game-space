// Opt-in frame recorder. Intervals use actual RAF deltas, not the simulation's clamped dt.
const PERF = {sum: 0, count: 0, worst: 0, bins: new Uint32Array(2001), window: [], windowMs: 0, windows: []};
function perfReset() { PERF.sum = PERF.count = PERF.worst = PERF.windowMs = 0; PERF.bins.fill(0); PERF.window = []; PERF.windows = []; }
function perfStats(samples) {
  if (!samples.length) return null;
  const sorted = samples.slice().sort((a, b) => a - b), sum = samples.reduce((a, b) => a + b, 0);
  return {count: samples.length, avg: sum / samples.length, p95: sorted[Math.ceil(samples.length * .95) - 1], worst: sorted[sorted.length - 1]};
}
function perfRecord(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return;
  PERF.sum += ms; PERF.count++; PERF.worst = Math.max(PERF.worst, ms); PERF.bins[Math.min(2000, Math.ceil(ms))]++;
  PERF.window.push(ms); PERF.windowMs += ms;
  if (PERF.windowMs >= 10000) { PERF.windows.push(perfStats(PERF.window)); PERF.window = []; PERF.windowMs = 0; }
}
function perfSummary() {
  if (!PERF.count) return null;
  let n = 0, p95 = 0, threshold = Math.ceil(PERF.count * .95);
  for (; p95 < PERF.bins.length; p95++) { n += PERF.bins[p95]; if (n >= threshold) break; }
  return {count: PERF.count, avg: PERF.sum / PERF.count, p95, worst: PERF.worst, windows: PERF.windows.slice()};
}
function perfReportLine() {
  const s = perfSummary(); if (!s) return 'Frame recorder (?fps): not recorded';
  const minFps = s.windows.length ? (1000 / Math.max(...s.windows.map(w => w.avg))).toFixed(1) : 'n/a';
  return `Frame recorder (?fps): avg ${s.avg.toFixed(1)} ms, p95 ${s.p95} ms, worst ${s.worst.toFixed(1)} ms; slowest 10s ${minFps} fps`;
}
