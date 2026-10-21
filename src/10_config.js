import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ======================================================================
//  CONFIG
// ======================================================================
const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in globalThis || params.has('touch');
const PIXEL_STEPS = [1, 2, 3, 4];
const DETAIL_STEPS = [24, 40, 64, 88, 112, 160, 224];   // voxels along a 12 m ship (larger ships scale ~ length^0.4)
let pixelIdx = 1;
let detailIdx = isTouch ? 2 : 4;
let bloomOn = !params.has('nobloom');
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
