// Opt-in frame recorder. Intervals use actual RAF deltas, not the simulation's clamped dt.
const PERF = {sum: 0, count: 0, worst: 0, bins: new Uint32Array(2001), window: [], windowMs: 0, windows: [], overflow: []};
function perfReset() { PERF.sum = PERF.count = PERF.worst = PERF.windowMs = 0; PERF.bins.fill(0); PERF.overflow = []; PERF.window = []; PERF.windows = []; PERF.voxelBuilds = []; }
function perfStats(samples) {
  if (!samples.length) return null;
  const sorted = samples.slice().sort((a, b) => a - b), sum = samples.reduce((a, b) => a + b, 0);
  return {count: samples.length, avg: sum / samples.length, p95: sorted[Math.ceil(samples.length * .95) - 1], worst: sorted[sorted.length - 1]};
}
function perfRecord(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return;
  PERF.sum += ms; PERF.count++; PERF.worst = Math.max(PERF.worst, ms); PERF.bins[Math.min(2000, Math.ceil(ms))]++; if (ms > 1999) PERF.overflow.push(ms);
  // Fixed wall-clock windows: a long frame can leave one or more windows with no completed frames.
  let remaining = ms;
  while (PERF.windowMs + remaining >= 10000) {
    const toBoundary = 10000 - PERF.windowMs;
    if (remaining === toBoundary) PERF.window.push(ms);
    remaining -= toBoundary;
    const stats = perfStats(PERF.window) || {count: 0, p95: null, worst: null};
    stats.avg = stats.count ? 10000 / stats.count : null;
    PERF.windows.push(stats); PERF.window = []; PERF.windowMs = 0;
    if (!remaining) return;
  }
  PERF.windowMs += remaining; PERF.window.push(ms);
}
function perfSummary() {
  if (!PERF.count) return null;
  let n = 0, p95 = 0, threshold = Math.ceil(PERF.count * .95);
  for (; p95 < PERF.bins.length; p95++) { n += PERF.bins[p95]; if (n >= threshold) break; }
  if (p95 === 2000) { const sorted = PERF.overflow.slice().sort((a,b) => a-b); p95 = Math.ceil(sorted[threshold - (n - PERF.bins[2000]) - 1]); }
  return {count: PERF.count, avg: PERF.sum / PERF.count, p95, worst: PERF.worst, windows: PERF.windows.slice()};
}
function perfReportLine() {
  const s = perfSummary(); if (!s) return 'Frame recorder (?fps): not recorded';
  const minFps = s.windows.length ? Math.min(...s.windows.map(w => w.count / 10)).toFixed(1) : 'n/a';
  const recent = s.windows.slice(-3).map(w => w.count ? `${(w.count / 10).toFixed(1)} fps / ${w.avg.toFixed(1)} avg / ${w.p95.toFixed(1)} p95 / ${w.worst.toFixed(1)} worst ms` : '0 fps / no completed frames').join(' | ') || 'none';
  return `Frame recorder (?fps): avg ${s.avg.toFixed(1)} ms, p95 ${s.p95} ms, worst ${s.worst.toFixed(1)} ms; slowest 10s ${minFps} fps; last 10s windows: ${recent}`;
}

// Reset with every sortie without coupling this module to the report branch.
const perfPlogReset = plogReset;
plogReset = (...args) => { perfPlogReset(...args); perfReset(); };

// Profile first-time voxel construction separately; cache hits remain in the sample.
const perfVoxelizeBase = voxelize;
voxelize = (...args) => {
  if (!params.has('fps')) return perfVoxelizeBase(...args);
  const start = performance.now();
  try { return perfVoxelizeBase(...args); }
  finally { const ms = performance.now() - start; if (ms >= 1) (PERF.voxelBuilds ||= []).push({id: args[0].id, res: args[1], ms}); }
};
