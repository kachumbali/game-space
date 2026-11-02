# P1 capital-laser split — measurement record

Status: **implementation verified statically; seeded balance measurements pending.**

The P1 data and runtime contract are covered by `tools/tests/capital_laser_t.py`:

- LS-8 (`laserM`) can select only corvette, frigate, and capital hulls; it has
  18 deg/s slew, a 1.8 s re-target delay, and a 1.5 s charge.
- The new S-class P-4 defence pulse is the only newly introduced fast-slew beam
  (100 deg/s), with a 900 m range and 1.35 damage.
- HECLA still mounts exactly six LS-8s.
- Runtime selection applies class filtering, same-ship target spreading, and
  speed/skill-dependent beam hit probability.

I attempted the required 20-seed `balance_sweep.py` run for `d2` (Exeter plus
two Kestrels against Bullfrog) on 2026-11-02 using the repository's Playwright
environment and local Chrome. The browser process did not complete even one
seed before the harness timeout and wrote an empty result set. No seeded number
is claimed here. This needs to be rerun in Claude's cloud browser environment
before merge, including the two HECLA checks required by
`docs/BRIEF_CAPITAL_LASERS.md`.

Required pending measurements:

1. Exeter + two Kestrels vs Bullfrog: median FROGG kills target 12–18 and below
   30, 20 seeds.
2. HECLA vs three Kestrels: survival above 60 sim-seconds, 20 seeds.
3. HECLA vs three Merlins: survival above 20 sim-seconds, 20 seeds.

This record deliberately replaces neither the prior baseline nor any balance
claim. It is an explicit handoff gate.
