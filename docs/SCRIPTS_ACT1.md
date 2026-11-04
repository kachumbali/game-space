# Act I scripts: missions 1 to 4 (draft v0.1)

Status: draft by Claude, 2026-11-04, from the cards in `docs/CAMPAIGN_PROPOSAL_CODEX.md` and the plan in `docs/DESIGN_CAMPAIGN_RECONCILE.md`. For owner editing. Names are canon (MEOW, HAWK,
SPARROW, Cdr. Vance) plus the new officers (Veyr, Sorn, Arden, Morrow). Tone: terse, flight-deck, grim; no heroics without cost. MEOW speaks little; the player is a roster pilot, so
player lines are optional text beats, not voiced personality. Scene notes name the Direction C interior and the props that change with campaign state.
Flags used: `evidence` (0-3), `evacuees`, `trust_command`, `halberd_damaged`, `sparrow_alive`, `hawk_alive`.
Every mission lists: briefing, in-flight beats, debrief for **W**in / **P**artial / **F**ail. Fail never ends the campaign; the next briefing starts from the result.

---

## 1. PAPER HULL (inspect)

**Briefing room, CSS Halberd.** Cold light, a cracked wall panel taped shut. Vance at the table, Sorn leaning on the wall, Veyr standing, not sitting. HAWK and SPARROW in the back row.

- **Vance:** "Corridor 7. One Tern, Vanderbilt-Astra registry, sealed hold. The customs relay says it cleared. Customs relay is also owned by Vanderbilt-Astra."
- **Veyr:** "The shipment is proprietary. Under the corridor treaty the Defence Force may observe, not open. I am here to see that it stays observed."
- **Sorn:** "I want the manifest copied. Not opened, not touched. Scanned from standoff while the Tern is in the lane. If you see a second container signature, it is not on the paperwork. Log it."
- **Vance:** "Eagle Flight. You hold fire unless fired on. If the Tern runs, you let it run, and you tell me what it was carrying. Questions."
- **HAWK:** "If its escort lights us up, are we allowed to answer?"
- **Vance:** "You are allowed to survive."

**In flight (nav 1 Manifest, nav 2 Customs Wake).**
- On approach: **SPARROW:** "Hawk, they're sitting on us. Two blips off the Tern's stern." **HAWK:** "Stay loose. Hands off the trigger."
- On scan complete: **Sorn (comm):** "Got it. Hold your distance."
- Secret goal, a second signature: **MEOW (log line):** "Second container. Not in the manifest."
- On escort turning hostile: **HAWK:** "Weapons free on the Merlin. Tern stays intact."

**Debrief.**
- **Win (scan done, Tern intact):** Sorn pins two pages to the wall. "Manifest says survey equipment. The mass says ore sample casings, and something heavier. I'll copy this to Command whether Mr. Veyr likes it or not." Veyr: "It will be noted that you exceeded your remit." Flag `evidence+1`.
- **Partial (Tern escaped, container scanned):** Sorn: "Half a picture. Enough to say they lied, not enough to say why." `evidence+1`, `trust_command` unchanged.
- **Fail (no scan):** Vance: "We have nothing. Command will take the Vanderbilt-Astra account." Veyr says nothing; he does not have to.
- **Secret (second container):** a drawer in the ready room is left open; archive lead for mission 11.

**Interior props:** ready room table with a torn customs form pinned under a mug; a coffee ring in the shape of the corridor chart.

---

## 2. BLIND CORRIDOR (shadow)

**Ready room, Halberd, night cycle.** Half lights. Ration tallies on a whiteboard. Sorn, Vance, Arden joins by link (Exeter commander, first appearance, on a flickering screen).

- **Sorn:** "The Tern changed course. It dumped transponder data and dropped into the old patrol lane. I want to know where it goes without it knowing we are there."
- **Arden (link):** "Not my favourite use of a flight, Commander. If their escort sees you following, we have given Vanderbilt-Astra a pretext."
- **Vance:** "Then they do not see you. Shadow, no fire, no active scan. Hawk, you lead. If the lane goes dark, you break off."
- **SPARROW (to MEOW, aside):** "Last time I held fire for ninety minutes I went to sleep." **MEOW (option):** "Don't."

**In flight (nav 1 Cold Trail, nav 2 Patrol Graveyard).**
- Detection warning if too close: **HAWK:** "You are standing on his tail. Back off two clicks." 
- Detected: **Sorn:** "He knows. Stay out of weapon range. Let him think he lost you."
- Secret, a patrol distress beacon at the graveyard: **SPARROW:** "That's a Colonial beacon. Hawk, it's... that's the missing patrol."

**Debrief.**
- **Win:** Sorn: "Route recorded. The Tern holds station at the graveyard, and the graveyard is on a lane no one flies. Command will want a reason." `evidence+1`.
- **Partial:** courier detected, beacon found: "We have the beacon and a guess." Lane inferred, no evidence increment.
- **Fail:** Vance, flat: "We lost it. Next time the briefing opens with that sentence." 
- **Secret (beacon):** the SAR medical pack: `medical+1`. A short deck scene: Morrow carries a battered emergency pack into the hangar; nobody says whose it was.

**Interior props:** the whiteboard tally has one tick fewer than last sortie, and a name rubbed off a ration chit.

---

## 3. FIRST HEAT (sample) 

**Briefing room, Exeter, the first time the player is on the carrier.** Larger, colder, cleaner than the Halberd; Arden at the head of the table. This is where the poorer-than-Earth look reads: the Exeter's paint is the Halberd's second hand.

- **Arden:** "The listening post at the Dead Array stopped talking six days ago. We have a hull torn open from the inside and a burn pattern I cannot attribute to anything in the registry."
- **Sorn:** "I want a sensor sample. A close one, on a living craft, not a wreck. And I want it back at this ship."
- **Veyr:** "Vanderbilt-Astra will need to see that data."
- **Arden:** "Vanderbilt-Astra will see what Command releases."
- **Vance:** "Eagle Flight, Halberd covers. The Exeter jumps on your recall. You are the only thing between her and a decision I do not want to make."

**In flight (nav 1 Dead Array, nav 2 Return Screen).**
- First contact (Darter, Leaper): **SPARROW:** "That's not ours. That's not anybody's." **HAWK:** "Contact. Weapons free. Stay on my wing."
- Sample taken: **Sorn:** "Recording. Whatever you do, do not lose the carrier."
- Heavy contact (Toad): **HAWK:** "Big one. Keep it off the Exeter's lane."

**Debrief.**
- **Win (sample returned, Halberd up):** Sorn plays a blurred frame in the dark: a toothed prow. "Classified. This is the first image of what is on the other side of the corridor." `evidence+1`.
- **Partial (sample lost with the carrier loss option / or recorded but not returned):** "A trace. Enough to know it is alive and fast."
- **Fail:** "Visual estimates. Eyewitnesses." The briefing for mission 4 has no telemetry.
- **Secret (second weapon signature):** Sorn adds one line: "The weapon is not a gun. It is wet." Extra intelligence line only; no damage bonus.

**Interior props:** the carrier's hangar, a patched Kestrel with a hand-painted wing number; the damaged Halberd silhouette in the window.

---

## 4. OPEN GATE (escort)

**Hangar throat, Exeter, with the civilian queue visible through a bulkhead window.** A line of Vanderbilt-Astra staff in clean coats beside a line of families with bags.

- **Arden:** "One departure lane, two liners. Two lists. One of them is Mr. Veyr's."
- **Veyr:** "The passenger list is accurate. Seventeen essential staff are on the first departure."
- **Morrow (deck chief):** "Seventeen staff, four hundred civilians, one lane. I can give you six hundred rounds for the escort. Not seven."
- **Vance:** "Hold the lane until both clear. If I have to choose, I will tell you which."
- **HAWK (to the wing):** "Nobody is told which. We do both."

**In flight (nav 1 Departure Lane, nav 2 Rear Screen).**
- Liners spooling: **Morrow (comm):** "Liner one is spooled. Liner two, thirty seconds."
- Casualty: **Vance:** "Liner two is hit. Tell me your count."
- Secret, the hidden SAR craft in the Rear Screen: **SPARROW:** "Hawk, there's something behind the screen. Small. Transponder is a rescue craft."

**Debrief.**
- **Win (both depart):** `evacuees+400`. Arden, quiet: "Orderly clearance. It will not stay that easy."
- **Partial (one departs):** `evacuees+200`. "We lost a liner. The name will be read at the memorial this evening."
- **Fail (neither):** casualty count; the memorial wall in the ready room gains two rows.
- **Secret:** the SAR craft is preserved for mission 5; if lost, mission 5 starts with no free resource.

**Interior props:** the ready-room memorial wall: rows of paper tags, new ones depending on the result; a child's drawing taped to Morrow's stores cage.

---

## Writing notes for editing

- Every beat tells the player what was decided, who paid and what changes next. No exposition about Oasis-9 yet; it arrives through documents (mission 11).
- Fail is never treated as a punishment scene. The next briefing starts from the result: "we have nothing", "Vanderbilt-Astra has the account".
- Vance is steady, short, hard; her death in mission 10 should feel like the loss of a fixed point. The scripts set her up as the person who tells the truth about the choices.
- Veyr is not a villain. He argues the corporate position consistently and is sometimes right about the treaty.
- Language: no real names, no real organisations; the in-universe corporation is Vanderbilt-Astra.
