import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ======================================================================
//  CONFIG
// ======================================================================
const params = new URLSearchParams(location.search);
// global sim speed (human-testing build: 37.5%). Override with ?speed=1
const SIM_SPEED = Math.max(0.1, Math.min(2, parseFloat(params.get('speed')) || 0.375));
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in globalThis || params.has('touch');
const PIXEL_STEPS = [0.5, 1, 2, 3, 4];                  // render-pixel size; 0.5 = 2x supersampling (HUD label SS)
const DETAIL_STEPS = [24, 40, 64, 88, 112, 160, 224, 288];   // voxels along a 12 m ship (larger ships scale ~ length^0.4)
const RES_CAP = parseInt(params.get('rescap')) || 420;       // upper limit on voxels along any ship (build time and memory grow with the cube)
// graphics presets: ?q=low|mid|high|ultra, key P cycles them. px = PIXEL_STEPS value, det = DETAIL_STEPS index, aa = MSAA samples (needs bloom/composer), sky = cubemap size
const QUALITY = {
  low:   { px: 3,   det: 2, aa: 0, sky: 512,  bloom: false },
  mid:   { px: 2,   det: 4, aa: 0, sky: 1024, bloom: true },
  high:  { px: 1,   det: 6, aa: 4, sky: 1536, bloom: true },
  ultra: { px: 0.5, det: 7, aa: 4, sky: 2048, bloom: true },
};
const QORDER = ['low', 'mid', 'high', 'ultra'];
// device presets (options panel O): graphics values plus the distance-LOD level. phone / tablet / laptop keep the former defaults; desktop and max are the old high / ultra.
// LOD: a ship far from the camera is re-voxelised 1-3 detail steps lower (thresholds are the apparent radius in rad, see LOD_LEVELS); damage is replayed on rebuild.
const DEVICES = {
  phone:   { label: 'PHONE',          px: 2,   det: 2, aa: 0, sky: 512,  bloom: true, lod: 'aggressive' },
  tablet:  { label: 'TABLET (IPAD)',  px: 2,   det: 2, aa: 0, sky: 512,  bloom: true, lod: 'normal' },
  laptop:  { label: 'LAPTOP',         px: 2,   det: 4, aa: 0, sky: 1024, bloom: true, lod: 'normal' },
  desktop: { label: 'DESKTOP GPU',    px: 1,   det: 6, aa: 4, sky: 1536, bloom: true, lod: 'gentle' },
  max:     { label: 'MAX (NO LOD)',   px: 0.5, det: 7, aa: 4, sky: 2048, bloom: true, lod: 'off' },
};
const DEV_ORDER = ['auto', 'phone', 'tablet', 'laptop', 'desktop', 'max'];
const LOD_LEVELS = { off: null, gentle: [0.012, 0.005, 0.002], normal: [0.02, 0.008, 0.0035], aggressive: [0.035, 0.015, 0.007] };
const LOD_ORDER = ['off', 'gentle', 'normal', 'aggressive'];
let GFX = {};
try { GFX = JSON.parse(localStorage.getItem('gs_gfx') || '{}') || {}; } catch (e) { /* private mode: defaults */ }
const gfxSave = () => { try { localStorage.setItem('gs_gfx', JSON.stringify(GFX)); } catch (e) { /* ignore */ } };
function autoDevice() {
  if (isTouch) return Math.min(innerWidth, innerHeight) < 520 ? 'phone' : 'tablet';
  return (navigator.hardwareConcurrency || 4) > 8 ? 'desktop' : 'laptop';
}
const deviceName = () => (GFX.device && GFX.device !== 'auto' && DEVICES[GFX.device]) ? GFX.device : autoDevice();
const Q0 = QUALITY[params.get('q')] || DEVICES[deviceName()];
let pixelIdx = PIXEL_STEPS.indexOf(Q0.px);
let detailIdx = Q0.det;
let qualityName = QUALITY[params.get('q')] ? params.get('q') : deviceName();
let lodLevel = LOD_LEVELS[GFX.lod] !== undefined ? GFX.lod : (QUALITY[params.get('q')] ? 'normal' : Q0.lod);
const AA_SAMPLES = params.has('aa') ? Math.max(0, parseInt(params.get('aa')) || 4) : Q0.aa;
let bloomOn = !params.has('nobloom') && Q0.bloom;
const SUN = new THREE.Vector3(0.6, 0.4, 0.55).normalize();

// ======================================================================
//  PRIMITIVE HELPERS  (ships are data: solid primitives in ship space, -Z = nose)
//  tap = tapered box along Z with optional sweep (x shift per z) and roll (rz)
// ======================================================================
const tap = (c, hz, h0, h1, col, o = {}) => ({ t: 'tap', c, hz, h0, h1, sweep: 0, sweepY: 0, sh: 'r', col, ...o });
const box = (c, h, col, o = {}) => tap(c, h[2], [h[0], h[1]], [h[0], h[1]], col, o);
const ell = (c, r, col, o = {}) => ({ t: 'ell', c, r, col, ...o });
const seg = (a, b, ra, rb, col, o = {}) => ({ t: 'seg', a, b, ra, rb, col, ...o });
// smooth curved limb through points with radii (organic horns, legs, tails)
const chain = (pts, rs, col, o = {}) => pts.slice(1).map((p, i) => seg(pts[i], p, rs[i], rs[i + 1], col, o));

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// pointer lock: the request returns a promise that can reject (headless/test browsers, no user engagement yet);
// swallow it so it never surfaces as an unhandled-rejection console error
function lockPointer() { try { canvas.requestPointerLock?.()?.catch?.(() => { /* lock unavailable */ }); } catch (e) { /* lock unavailable */ } }
let FS = 1;      // HUD canvas font scale (phones use a smaller one)
