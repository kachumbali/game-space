// ======================================================================
//  RENDERER / SCENE
// ======================================================================
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 6000);
scene.add(camera);

const sunLight = new THREE.DirectionalLight(0xfff0d8, 3.2);
sunLight.position.copy(SUN).multiplyScalar(100);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0x4a64b0, 0.55);
fillLight.position.copy(SUN).multiplyScalar(-100);
scene.add(fillLight);
const hemiLight = new THREE.HemisphereLight(0x9fb4e8, 0x4a3626, 1.7);
scene.add(hemiLight);

let composer = null, bloomPass = null;
function setupComposer() {
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 1.0);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
  } catch (e) { console.warn('bloom disabled', e); composer = null; bloomOn = false; }
}
setupComposer();

function resize() {
  const px = PIXEL_STEPS[pixelIdx];
  const w = Math.max(1, Math.floor(innerWidth / px)), h = Math.max(1, Math.floor(innerHeight / px));
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (globalThis.__hudReady) sizeOverlay();
}
addEventListener('resize', resize);
resize();
