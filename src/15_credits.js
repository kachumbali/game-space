// ======================================================================
//  CREDITS — every third-party item shipped with the game, with its licence. Source of truth for docs/CREDITS.md (keep both in sync).
//  Licences re-checked against each source page on 2026-10-22.
// ======================================================================
const GAME_VERSION = '0.2.1';                   // 0.1 = origin/main 9bc97d7 (2026-10-24, tag v0.1); 0.2 = the fun update (CHANGELOG.md)
const GAME_TITLE = 'Claude Space Commander';      // working title (owner, 2026-10-22)
const CREDITS = [
  ['GAME', [
    ['Design and direction', 'Jonas Koll'],
    ['Engine, ships, missions, game systems, procedural sound, most documentation', 'Claude (Anthropic)'],
    ['Later development passes (weapons, capital ships, magazines, balance and UX review) and documentation, from 2026-10-22', 'Mistral Vibe (Mistral AI)'],
    ['Lore proposals (history, factions, FROGG species) and the combat music loops', 'Google Gemini, adapted and integrated by the team'],
    ['AI-assisted work', 'Code, text and music were produced with AI tools under the owner\'s direction. The legal status of AI-generated work varies by jurisdiction.'],
  ]],
  ['ENGINE', [
    ['three.js r170', 'MIT licence, © 2010-2024 three.js authors. https://threejs.org. Loaded at run time from the jsDelivr CDN (needs an internet connection).'],
  ]],
  ['MUSIC', [
    ['"Dark Sci-Fi Audio Pack" by SRG774', 'CC0 1.0 Universal. https://opengameart.org/content/dark-sci-fi-audio-pack. Tracks airy, sector, victory, transmission (and the fallback combat tracks urgent, pulse), re-encoded to 96 kbps MP3.'],
    ['Combat loops (dogfight, bombast)', 'Composed for this game with the Google Gemini code tools (owner-commissioned, 2026-10-22; generators in tools/gen/music). GM MIDI rendered offline with FluidSynth and the GeneralUser GS soundfont by S. Christian Collins (GeneralUser GS License v2.0: free for private and commercial music use). Rendered files remain ours; the soundfont is not shipped.'],
  ]],
  ['SOUND SAMPLES', [
    ['"Space Sound Effects" by messersm', 'CC0 1.0. https://opengameart.org/content/space-sound-effects (explosions, laser bolts)'],
    ['"Synthesized explosion" by qubodup', 'CC0 1.0. https://opengameart.org/content/synthesized-explosion'],
    ['"Warp Engine Engage Sound" by bart', 'CC0 1.0. https://opengameart.org/content/warp-engine-engage-sound (jump drive, first 5 s)'],
  ]],
  ['ORIGINAL WORK', [
    ['Ships, weapons, effects', 'All ship models are built in code from voxel primitives. Most sound effects are synthesised live with the Web Audio API. No bitmap textures, fonts or video are used.'],
    ['Setting and story', 'The Colonial Defence Force, Eagle Flight, the FROGGs and all characters are original to this project; the history, factions and FROGG species were drafted with Google Gemini and adapted.'],
  ]],
  ['INSPIRATION ONLY', [
    ['Wing Commander, TIE Fighter, FreeSpace', 'Trademarks of their respective owners; no assets or code were taken and this game is not affiliated with or endorsed by them. FreeSpace 2 Open source was read for design ideas only.'],
  ]],
];
let credOpen = false;
function showCredits(force) {
  const el = $id('cred'); if (!el) return;
  const open = force !== undefined ? force : !credOpen;
  if (open === credOpen) return;
  credOpen = open;
  if (!open) { el.style.display = 'none'; return; }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lnk = s => esc(s).replace(/(https?:\/\/[^\s)]+)/g, u => { const m = u.match(/^(.*?)([.,;]*)$/); return `<a href="${m[1]}" target="_blank" rel="noopener">${m[1]}</a>${m[2]}`; });
  el.innerHTML = `<div class="panel"><h2>${GAME_TITLE.toUpperCase()} <small>v${GAME_VERSION}</small><br><small>CREDITS AND LICENCES</small></h2><div class="cbody">`
    + CREDITS.map(([sec, rows]) => `<div class="csec">${sec}</div>` + rows.map(([a, b]) => `<div class="crow"><b>${esc(a)}</b><span>${lnk(b)}</span></div>`).join('')).join('')
    + `<div class="onote">CC0 means the author dedicated the work to the public domain; credit is not required but given. Full text: https://creativecommons.org/publicdomain/zero/1.0/ and https://opensource.org/license/mit. The same list is in docs/CREDITS.md.</div></div>`
    + `<button id="c_close">CLOSE <small>[ESC]</small></button></div>`;
  el.style.display = 'flex';
  $id('c_close').onclick = () => showCredits(false);
}
addEventListener('keydown', e => { if (e.code === 'Escape' && credOpen) { showCredits(false); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
