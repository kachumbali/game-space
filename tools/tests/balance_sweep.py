#!/usr/bin/env python3
"""Repeatable AI-vs-AI skirmish balance sweep using seeded Playwright pages.

Examples:
  python3 tools/tests/balance_sweep.py --scenario a --seeds 1-20
  python3 tools/tests/balance_sweep.py --scenario all --seeds 1-20 --batch-size 1

The game's player ship is parked off-stage after its skirmish URL initializes;
listed forces are recreated as AI ships so the whole engagement can be stepped
without real-time input. Damage is net shield + structure loss attributed to
the latest hostile attacker in an update; armour-absorbed and component-only
damage are not included.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import statistics
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlencode

from lib import Runner, REPO


SCENARIOS = {
    "a": {
        "name": "Kestrel vs 3 Darter + 3 Leaper + 3 Spitter",
        "player_ship": "kestrel", "wship": "kestrel", "wing": 0,
        "rows": [["darter", 3], ["leaper", 3], ["spitter", 3]],
        "human": [["kestrel", 1]], "frogg": [["darter", 3], ["leaper", 3], ["spitter", 3]],
    },
    "b": {
        "name": "Merlin vs 3 Darter + 3 Leaper + 3 Spitter",
        "player_ship": "merlin", "wship": "merlin", "wing": 0,
        "rows": [["darter", 3], ["leaper", 3], ["spitter", 3]],
        "human": [["merlin", 1]], "frogg": [["darter", 3], ["leaper", 3], ["spitter", 3]],
    },
    "c": {
        "name": "3 Merlin vs 2 Reaver + 2 Toad",
        "player_ship": "merlin", "wship": "merlin", "wing": 2,
        "rows": [["reaver", 2], ["toad", 2]],
        "human": [["merlin", 3]], "frogg": [["reaver", 2], ["toad", 2]],
    },
    "d0": {
        "name": "Exeter vs Bullfrog, no fighter escorts",
        "player_ship": "kestrel", "wship": "kestrel", "wing": 0, "ally": "exeter",
        "range": 4000,
        "rows": [["bullfrog", 1]],
        "human": [["exeter", 1]], "frogg": [["bullfrog", 1]],
    },
    "d2": {
        "name": "Exeter + 2 Kestrel escorts vs Bullfrog",
        "player_ship": "kestrel", "wship": "kestrel", "wing": 2, "ally": "exeter",
        "range": 4000,
        "rows": [["bullfrog", 1]],
        "human": [["exeter", 1], ["kestrel", 2]], "frogg": [["bullfrog", 1]],
    },
    "e": {
        "name": "Halberd vs 2 Gulper",
        "player_ship": "kestrel", "wship": "kestrel", "wing": 0,
        "rows": [["gulper", 2]],
        "human": [["halberd", 1]], "frogg": [["gulper", 2]],
    },
    "f": {
        "name": "3 Kestrel vs Bullfrog",
        "player_ship": "kestrel", "wship": "kestrel", "wing": 2,
        "rows": [["bullfrog", 1]],
        "human": [["kestrel", 3]], "frogg": [["bullfrog", 1]],
    },
}

for wing in (0, 2):
  count = wing + 1
  scenario_id = f"g{count}"
  SCENARIOS[scenario_id] = {
    "name": f"{count} Kestrel vs {count} Merlin",
    "player_ship": "kestrel", "wship": "kestrel", "wing": wing,
    "rows": [["merlin", count]],
    "human": [["kestrel", count]], "frogg": [["merlin", count]],
  }

SWEEP2_SCENARIOS = ["g1", "g3"]
for side_ship in ("kestrel", "merlin"):
  for per_kind in (1, 2, 3):
    scenario_id = f"h-{side_ship}-{per_kind * 3}"
    rows = [[kind, per_kind] for kind in ("darter", "leaper", "spitter")]
    SCENARIOS[scenario_id] = {
      "name": f"{side_ship.title()} x3 vs {per_kind * 3} mixed FROGG fighters ({per_kind} each)",
      "player_ship": side_ship, "wship": side_ship, "wing": 2,
      "rows": rows, "human": [[side_ship, 3]], "frogg": rows,
    }
    SWEEP2_SCENARIOS.append(scenario_id)

for skill in (2, 3, 4):
  scenario_id = f"i-skill-{skill}"
  rows = [["reaver", 2], ["toad", 2]]
  SCENARIOS[scenario_id] = {
    "name": f"3 Kestrel vs 2 Reaver + 2 Toad (enemy skill {skill})",
    "player_ship": "kestrel", "wship": "kestrel", "wing": 2,
    "enemy_skill": skill, "rows": rows,
    "human": [["kestrel", 3]], "frogg": rows,
  }
  SWEEP2_SCENARIOS.append(scenario_id)

_bullfrog = [["bullfrog", 1]]
for scenario_id, name, wing, extra_human in (
    ("j-exeter-k2", "Exeter + 2 Kestrels vs Bullfrog", 2, []),
    ("j-exeter-k2m2", "Exeter + 2 Kestrels + 2 Merlins vs Bullfrog", 1, [["merlin", 2]]),
    ("j-exeter-halberd", "Exeter + Halberd vs Bullfrog", 0, [["halberd", 1]]),
):
  human = [["exeter", 1]]
  if scenario_id == "j-exeter-halberd":
    human.append(["halberd", 1])
  else:
    human.append(["kestrel", 2])
    human.extend(extra_human)
  SCENARIOS[scenario_id] = {
    "name": name,
    "player_ship": "kestrel", "wship": "kestrel", "wing": wing, "ally": "exeter",
    "range": 4000, "rows": _bullfrog, "human": human, "frogg": _bullfrog,
  }
  SWEEP2_SCENARIOS.append(scenario_id)

for gulper_count in (1, 2, 3):
  for escorts in (0, 2):
    scenario_id = f"k-halberd-g{gulper_count}-k{escorts}"
    rows = [["gulper", gulper_count]]
    human = [["halberd", 1]]
    if escorts:
      human.append(["kestrel", escorts])
    SCENARIOS[scenario_id] = {
      "name": f"Halberd + {escorts} Kestrel escorts vs {gulper_count} Gulper",
      "player_ship": "kestrel", "wship": "kestrel", "wing": escorts,
      "rows": rows, "human": human, "frogg": rows,
    }
    SWEEP2_SCENARIOS.append(scenario_id)

_hecla_rows = [["hecla", 1]]
for side_ship in ("kestrel", "merlin"):
  for laser_count, variant in ((12, "12"), (0, "0"), (4, "4")):
    scenario_id = f"m-{side_ship}-laser{variant}"
    human = [[side_ship, 3]]
    SCENARIOS[scenario_id] = {
      "name": f"3 {side_ship.title()} vs HECLA ({laser_count} laserM turrets)",
      "player_ship": side_ship, "wship": side_ship, "wing": 2,
      "hecla_laser_turrets": laser_count,
      "rows": _hecla_rows, "human": human, "frogg": _hecla_rows,
    }
    SWEEP2_SCENARIOS.append(scenario_id)

SCENARIOS["l-cap300"] = {
  "name": "3 Merlin vs 2 Reaver + 2 Toad (300 s cap; inspect at 180 s)",
  "player_ship": "merlin", "wship": "merlin", "wing": 2,
  "rows": [["reaver", 2], ["toad", 2]],
  "human": [["merlin", 3]], "frogg": [["reaver", 2], ["toad", 2]],
  "limit": 300,
}
SWEEP2_SCENARIOS.insert(SWEEP2_SCENARIOS.index("i-skill-2"), "l-cap300")

HECLA_INIT_SCRIPT = r"""(() => {
  const count = new URL(location.href).searchParams.get('sk_hecla_lasers');
  if (count === null) return;
  Object.defineProperty(window, '__game', {
    configurable: true,
    set(g) {
      const def = g.SHIPS.hecla;
      const lasers = def.turrets.filter(t => t.w === 'laserM');
      def.turrets = def.turrets.filter(t => t.w !== 'laserM').concat(lasers.slice(0, Number(count)));
      Object.defineProperty(window, '__game', { configurable: true, writable: true, value: g });
    },
  });
})();"""

SETUP_JS = r"""([spec,seed,range,cap]) => {
  const g=__game,T=g.THREE;
  if(g.game.mode!=='skirmish') throw new Error('skirmish URL did not initialize');
  g.__paused=true;
  window.requestAnimationFrame=()=>0;
  if(spec.hecla_laser_turrets!==undefined){
    const actual=g.SHIPS.hecla.turrets.filter(t=>t.w==='laserM').length;
    if(actual!==spec.hecla_laser_turrets)throw new Error(`HECLA laser override mismatch: ${actual}`);
  }
  let rng=seed>>>0;
  Math.random=()=>{rng|=0;rng=rng+0x6D2B79F5|0;let t=Math.imul(rng^rng>>>15,1|rng);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  g.startSkirmish({
    rows:spec.rows,ship:spec.player_ship,wship:spec.wship,skill:spec.enemy_skill||3,wskill:3,
    wing:spec.wing,range,ally:spec.ally||'none',fm:'arcade',missiles:true,respawn:false
  });
  g.setLod('off',true);
  const player=g.player,playerStart=player.group.position.clone();
  player.team=2;player.group.position.set(50000,0,50000);player.vel.set(0,0,0);player.group.visible=false;
  const present=new Map();
  for(const s of g.ships)if(s.team===0&&s!==player)present.set(s.def.id,(present.get(s.def.id)||0)+1);
  let humanSerial=0;
  for(const [id,count] of spec.human){
    for(let i=present.get(id)||0;i<count;i++){
      const p=playerStart.clone().add(new T.Vector3((humanSerial%3-1)*65,Math.floor(humanSerial/3)*48,0));
      const s=g.makeShip(id,0,p,new T.Quaternion(),{
        callsign:'H'+(++humanSerial),ai:['halberd','exeter','bullfrog','hecla'].includes(id)?'capital':undefined,skill:3
      });
      s.vel.set(0,0,0);
    }
  }
  const roster=new Map(),damage=new Map(),hostileHits=new Map(),travel=new Map(),deathTime=new Map(),deathSource=new Map(),lastWeapons=new Map(),deathWeapons=new Map();
  let uid=0,sim=0,enemyKilledAt=null,humanKilledAt=null,firstHit=null,snapshot180=null;
  const register=()=>{
    for(const s of g.ships) if(s!==g.player&&!roster.has(s)){
      const key=`${s.team}:${s.def.id}:${s.callsign||'ship'}:${uid++}`;
      roster.set(s,{key,team:s.team,id:s.def.id,callsign:s.callsign||s.def.name,born:sim});
      damage.set(key,0);hostileHits.set(key,0);travel.set(key,{distance:0,pos:s.group.position.clone()});
    }
  };
  register();
  const hp=s=>Math.max(0,s.structure)+Math.max(0,s.shield.fore)+Math.max(0,s.shield.aft);
  const active=team=>[...roster.keys()].filter(s=>roster.get(s).team===team&&s.alive&&!(s.dying>0)).length;
  const step=()=>{
    register();
    const before=new Map();
    const turretFire=[];
    const turretCounts=new Map();
    const oldBolts=g.bolts.slice();
    for(const h of g.ships.filter(s=>s.def.id==='hecla')){
      h.turrets.forEach((t,i)=>turretCounts.set(`${i}`,t.fired));
    }
    for(const [s,r] of roster){
      before.set(s,{hp:hp(s),hits:s.hitsTaken||0,pos:s.group.position.clone(),alive:s.alive&&!s.dying});
    }
    g.update(0.05);sim=+(sim+0.05).toFixed(4);register();
    for(const h of g.ships.filter(s=>s.def.id==='hecla')){
      h.turrets.forEach((t,i)=>{
        if(t.fired>(turretCounts.get(`${i}`)||0)&&t.w.kind==='beam')
          turretFire.push({weapon:t.wid,component:t.comp,target:t.tgt});
      });
    }
    const heclaBolts=oldBolts.filter(b=>!g.bolts.includes(b)&&b.life<=0&&b.owner?.def.id==='hecla');
    for(const [s,r] of roster){
      const b=before.get(s);
      if(!b) continue;
      const tr=travel.get(r.key);tr.distance+=s.group.position.distanceTo(b.pos);tr.pos.copy(s.group.position);
      const dh=(s.hitsTaken||0)-b.hits;
      const a=s.lastAttacker;
      if(dh>0&&a&&a.team!==s.team){
        const ar=roster.get(a);
        if(ar){hostileHits.set(ar.key,(hostileHits.get(ar.key)||0)+dh);
          damage.set(ar.key,(damage.get(ar.key)||0)+Math.max(0,b.hp-hp(s)));}
        if(!firstHit)firstHit={time:sim,attacker:a.def.id,attacker_callsign:a.callsign||a.def.name,
          target:s.def.id,target_callsign:s.callsign||s.def.name};
        const killedByHecla=turretFire.filter(t=>t.target===s).map(t=>({weapon:t.weapon,component:t.component}));
        for(const b of heclaBolts){
          const dx=b.pos.x-b.prev.x,dy=b.pos.y-b.prev.y,dz=b.pos.z-b.prev.z;
          const lengthSq=dx*dx+dy*dy+dz*dz;
          const u=lengthSq?Math.max(0,Math.min(1,((s.group.position.x-b.prev.x)*dx+(s.group.position.y-b.prev.y)*dy+(s.group.position.z-b.prev.z)*dz)/lengthSq)):0;
          const x=b.prev.x+u*dx-s.group.position.x,y=b.prev.y+u*dy-s.group.position.y,z=b.prev.z+u*dz-s.group.position.z;
          if(x*x+y*y+z*z<=s.def.radius*s.def.radius)killedByHecla.push({weapon:b.wid,component:null});
        }
        const uniqueWeapons=[...new Map(killedByHecla.map(w=>[`${w.weapon}:${w.component||''}`,w])).values()];
        lastWeapons.set(s,a.def.id==='hecla'?uniqueWeapons:[]);
      }
      if(b.alive&&(!s.alive||s.dying)&&!deathTime.has(s)){
        deathTime.set(s,sim);
        deathSource.set(s,a?{id:a.def.id,callsign:a.callsign||a.def.name}:null);
        deathWeapons.set(s,lastWeapons.get(s)||[]);
      }
    }
    if(sim===180){
      snapshot180=[...roster].filter(([s,r])=>s.alive&&!s.dying).map(([s,r])=>({
        team:r.team===0?'human':'frogg',id:r.id,callsign:r.callsign,
        position:s.group.position.toArray().map(v=>+v.toFixed(1)),
        target:s.target&&s.target.alive?{id:s.target.def.id,callsign:s.target.callsign||s.target.def.name,team:s.target.team===0?'human':'frogg'}:null,
        last_attacker:s.lastAttacker?{id:s.lastAttacker.def.id,callsign:s.lastAttacker.callsign||s.lastAttacker.def.name}:null,
        distance_flown:+(travel.get(r.key)?.distance||0).toFixed(1)
      }));
    }
    if(enemyKilledAt===null&&active(1)===0) enemyKilledAt=sim;
    if(humanKilledAt===null&&active(0)===0) humanKilledAt=sim;
  };
  const controller={
    get sim(){return sim;},
    roster:[...roster.values()].map(r=>({...r})),
    advance(seconds){const n=Math.ceil(seconds/0.05);for(let i=0;i<n;i++){
      if(sim>=cap||active(0)===0||active(1)===0)break;step();
    }return this.result();},
    result(){
      const side=team=>{
        const ships=[...roster].filter(([s,r])=>r.team===team).map(([s,r])=>({
          id:r.id,callsign:r.callsign,born:+r.born.toFixed(2),alive:s.alive&&!s.dying,
          dying:s.dying>0,damage_dealt:+(damage.get(r.key)||0).toFixed(2),
          hostile_hits:hostileHits.get(r.key)||0,distance_flown:+(travel.get(r.key)?.distance||0).toFixed(1),
          structure:+Math.max(0,s.structure).toFixed(2),
          shield:+(Math.max(0,s.shield.fore)+Math.max(0,s.shield.aft)).toFixed(2),
          death_time:deathTime.has(s)?deathTime.get(s):null,killed_by:deathSource.get(s)||null,
          killing_weapons:deathWeapons.get(s)||[]
        }));
        return {ships,total:ships.length,survivors:ships.filter(s=>s.alive).length,
          losses:ships.filter(s=>!s.alive).length};
      };
      const h=side(0),f=side(1);
      let winner='time_cap';
      if(h.survivors===0&&f.survivors===0)winner='mutual';
      else if(f.survivors===0)winner='human';
      else if(h.survivors===0)winner='FROGG';
      return {sim_time:+sim.toFixed(2),winner,time_to_kill:enemyKilledAt,first_hit:firstHit,
        at_180_seconds:snapshot180,human:h,frogg:f,enemy_killed_at:enemyKilledAt,human_killed_at:humanKilledAt};
    }
  };
  window.__balanceSweep=controller;
  return {ready:true,seed};
}"""

RUN_JS = r"""([spec,seed,range,limit])=>{
  const S=window.__balanceSweep;
  if(!S) throw new Error('balance harness setup missing');
  let rng=seed>>>0;
  Math.random=()=>{rng|=0;rng=rng+0x6D2B79F5|0;let t=Math.imul(rng^rng>>>15,1|rng);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  while(S.sim<limit){
    const r=S.advance(Math.min(2,limit-S.sim));
    if(r.winner!=='time_cap')break;
  }
  const r=S.result();
  const odd=[];
  for(const side of ['human','frogg'])for(const s of r[side].ships){
    const age=r.sim_time-s.born;
    if(s.alive&&age>=30&&s.hostile_hits===0)odd.push(`${side}:${s.callsign} recorded no hostile hits in ${age.toFixed(1)}s`);
    if(s.alive&&age>=30&&s.distance_flown<25)odd.push(`${side}:${s.callsign} moved under 25 m in ${age.toFixed(1)}s`);
  }
  r.odd=odd;
  return r;
}"""


def parse_seeds(value: str) -> list[int]:
    try:
        if "-" in value:
            start, end = (int(part) for part in value.split("-", 1))
            seeds = list(range(start, end + 1))
        else:
            seeds = [int(part) for part in value.split(",")]
    except ValueError as exc:
        raise argparse.ArgumentTypeError("seeds must be N-M or a comma-separated list") from exc
    if not seeds or any(seed < 1 or seed > 0xFFFFFFFF for seed in seeds):
        raise argparse.ArgumentTypeError("seeds must be integers from 1 through 4294967295")
    return seeds


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * pct
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo)


def summarize(results: list[dict]) -> dict:
    wins = sum(r["winner"] == "human" for r in results)
    tk = [r["time_to_kill"] for r in results if r["winner"] == "human" and r["time_to_kill"] is not None]
    hs = [r["human"]["losses"] for r in results]
    fs = [r["frogg"]["losses"] for r in results]

    def stat(values):
        return {
            "median": statistics.median(values) if values else None,
            "p25": percentile(values, 0.25),
            "p75": percentile(values, 0.75),
        }

    return {
        "runs": len(results), "human_wins": wins, "win_rate": wins / len(results) if results else None,
        "time_to_kill_human_wins_only": stat(tk),
        "human_losses": stat(hs), "frogg_losses": stat(fs),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", choices=["all", "sweep2", *SCENARIOS], default="all")
    parser.add_argument("--seeds", type=parse_seeds, default=parse_seeds("1-20"))
    parser.add_argument("--batch-size", type=int, choices=[1, 2], default=1,
                        help="maximum open Playwright pages; 1 is the conservative default")
    parser.add_argument("--limit", type=float, default=None, help="override scenario simulation-time cap in seconds")
    parser.add_argument("--range", type=float, default=None, help="override the scenario's default separation in metres")
    parser.add_argument("--output", type=Path, default=None, help="raw JSON output path")
    parser.add_argument("--resume", action="store_true", help="continue missing seeds in an existing output file")
    args = parser.parse_args()
    selected = list(SCENARIOS) if args.scenario == "all" else (
        SWEEP2_SCENARIOS if args.scenario == "sweep2" else [args.scenario]
    )
    if (args.limit is not None and args.limit <= 0) or (args.range is not None and args.range <= 0):
        parser.error("--limit and any supplied --range must be positive")
    output = args.output or (Path(REPO) / "docs/data" / f"balance_sweep_{date.today().isoformat()}.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    source_sha = subprocess.check_output(
        ["git", "-C", REPO, "rev-parse", "HEAD"], text=True
    ).strip()
    data = {
        "date": date.today().isoformat(),
        "source_commit": source_sha,
        "harness": "tools/tests/balance_sweep.py",
        "seed_range": args.seeds,
        "time_cap_sim_seconds": args.limit or 180,
        "scenario_time_cap_overrides_seconds": {
            scenario_id: SCENARIOS[scenario_id]["limit"]
            for scenario_id in selected if "limit" in SCENARIOS[scenario_id] and args.limit is None
        },
        "default_initial_separation_m": 2000,
        "scenario_separation_overrides_m": {"d0": 4000, "d2": 4000},
        "setup": "Seeded skirmish URL; requestAnimationFrame disabled before load, game setup reseeded, LOD off; player parked off-stage and requested rosters are AI-vs-AI.",
        "damage_metric": "Net shield+structure loss attributed to latest hostile attacker in a simulation update; excludes armour absorption and component-only damage.",
        "scenarios": {},
    }
    if args.resume:
        if not output.exists():
            parser.error("--resume requires an existing --output file")
        prior = json.loads(output.read_text())
        parent_sha = subprocess.check_output(
            ["git", "-C", REPO, "rev-parse", "HEAD^"], text=True
        ).strip()
        if (prior.get("source_commit") not in (source_sha, parent_sha)
                or prior.get("seed_range") != args.seeds
                or prior.get("time_cap_sim_seconds") != (args.limit or 180)):
            parser.error("existing output does not match this source, seed range, or time cap")
        data = prior
        if source_sha != prior["source_commit"]:
            data.setdefault("resume_commits", []).append(source_sha)

    def save():
        output.write_text(json.dumps(data, indent=2) + "\n")

    try:
        for scenario_id in selected:
            spec = SCENARIOS[scenario_id]
            scenario_range = args.range if args.range is not None else spec.get("range", 2000)
            scenario_limit = args.limit if args.limit is not None else spec.get("limit", 180)
            cell = data["scenarios"].get(scenario_id) if args.resume else None
            if cell is None:
                cell = {
                    "name": spec["name"], "initial_separation_m": scenario_range,
                    "time_cap_sim_seconds": scenario_limit,
                    "enemy_skill": spec.get("enemy_skill", 3),
                    "hecla_laser_turrets": spec.get("hecla_laser_turrets"),
                    "results": [],
                }
                data["scenarios"][scenario_id] = cell
            elif (cell["name"] != spec["name"]
                  or cell["initial_separation_m"] != scenario_range
                  or cell["time_cap_sim_seconds"] != scenario_limit):
                raise RuntimeError(f"existing output scenario {scenario_id} does not match this run")
            completed_seeds = {result["seed"] for result in cell["results"]}
            missing_seeds = [seed for seed in args.seeds if seed not in completed_seeds]
            if not missing_seeds:
                continue
            save()
            with Runner() as runner:
                for batch_start in range(0, len(missing_seeds), args.batch_size):
                    batch = missing_seeds[batch_start:batch_start + args.batch_size]
                    for seed in batch:
                        q = {
                            "sk": ",".join(f"{kind}:{count}" for kind, count in spec["rows"]),
                            "sk_ship": spec["player_ship"], "sk_wship": spec["wship"],
                            "sk_wing": str(spec["wing"]), "sk_skill": str(spec.get("enemy_skill", 3)), "seed": str(seed),
                            "sk_range": str(scenario_range), "q": "low",
                        }
                        if "ally" in spec:
                            q["sk_ally"] = spec["ally"]
                        if "hecla_laser_turrets" in spec:
                            q["sk_hecla_lasers"] = str(spec["hecla_laser_turrets"])
                        err_start = len(runner.errs)
                        page = runner.page(
                            640, 360, "?" + urlencode(q),
                            init_script="window.requestAnimationFrame=()=>0;" + HECLA_INIT_SCRIPT,
                        )
                        try:
                            page.wait_for_function("window.__game?.game?.mode==='skirmish'", timeout=120000)
                            setup = page.evaluate(SETUP_JS, [spec, seed, scenario_range, scenario_limit])
                            if not setup.get("ready"):
                                raise RuntimeError(f"setup failed for {scenario_id} seed {seed}: {setup}")
                            result = page.evaluate(RUN_JS, [spec, seed, scenario_range, scenario_limit])
                            result.update({"scenario": scenario_id, "seed": seed})
                            result["console_errors"] = runner.errs[err_start:]
                        finally:
                            page.context.close()
                        cell["results"].append(result)
                        cell["summary"] = summarize(cell["results"])
                        save()
                        print(f"{scenario_id} seed={seed} winner={result['winner']} t={result['sim_time']:.2f}s "
                              f"losses={result['human']['losses']}/{result['frogg']['losses']}", flush=True)
            cell["summary"] = summarize(cell["results"])
            save()
    except Exception as exc:
        save()
        print(f"ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    print(f"RAW {output}")
    print("SUMMARY " + json.dumps({k: v["summary"] for k, v in data["scenarios"].items()}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
