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
scene.add(new THREE.HemisphereLight(0x9fb4e8, 0x4a3626, 1.7));

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

// ---- sky (nebula + sun) and planet, both follow the camera
const noiseGLSL = `
float h31(vec3 p){ p=fract(p*0.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }`;

const sky = new THREE.Mesh(new THREE.SphereGeometry(4500, 32, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false,
  uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vDir; ${noiseGLSL}
    void main(){
      vec3 d=normalize(vDir);
      float n=fbm(d*2.2+vec3(3.1,1.7,.5)), n2=fbm(d*4.5+10.);
      float neb=smoothstep(.45,.85,n)*.55;
      vec3 col=vec3(.006,.008,.018);
      col+=neb*mix(vec3(.09,.04,.14),vec3(.03,.12,.18),n2);
      col+=smoothstep(.55,.9,n2)*neb*vec3(.11,.055,.02);
      float sd=max(dot(d,uSun),0.);
      col+=vec3(1.,.86,.62)*(pow(sd,1100.)*45.+pow(sd,70.)*.55+pow(sd,7.)*.08);
      gl_FragColor=vec4(col,1.);
    }`,
}));
sky.renderOrder = -10; sky.frustumCulled = false;
scene.add(sky);

const PLANET_DIR = new THREE.Vector3(-0.55, -0.22, -0.8).normalize();
const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({
  uniforms: { uSun: { value: SUN } },
  vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW;
    void main(){ vN=normalize(normal); vP=normal; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz;
      gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vP; varying vec3 vW; ${noiseGLSL}
    void main(){
      vec3 p=vP;
      float c=fbm(p*2.6), land=smoothstep(.5,.56,c), cl=fbm(p*5.5+vec3(7.));
      vec3 ocean=vec3(.02,.08,.22), ground=mix(vec3(.16,.26,.09),vec3(.42,.33,.2),fbm(p*9.));
      vec3 base=mix(ocean,ground,land);
      base=mix(base,vec3(.85),smoothstep(.55,.78,cl)*.85);
      float l=clamp(dot(vN,uSun),0.,1.), term=smoothstep(0.,.3,l);
      vec3 col=base*(.015+term*1.5);
      vec3 v=normalize(cameraPosition-vW);
      float rim=pow(1.-max(dot(vN,v),0.),3.);
      col+=vec3(.25,.5,1.)*rim*(.12+term*.9);
      gl_FragColor=vec4(col,1.);
    }`,
}));
planet.scale.setScalar(520);
planet.frustumCulled = false;
scene.add(planet);

// stars + dust
const starGeo = new THREE.BufferGeometry();
{
  const a = new Float32Array(1100 * 3), cl = new Float32Array(1100 * 3);
  for (let i = 0; i < 1100; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(4000);
    a.set([v.x, v.y, v.z], i * 3);
    const b = 0.35 + Math.random() * 0.65, t = Math.random();
    cl.set([b * (0.85 + 0.15 * t), b * 0.9, b * (1 - 0.2 * t)], i * 3);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ vertexColors: true, size: 1, sizeAttenuation: false, depthWrite: false }));
stars.frustumCulled = false;
scene.add(stars);

const DUST_N = 300, DUST_R = 220;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_N * 3);
for (let i = 0; i < dustPos.length; i++) dustPos[i] = (Math.random() * 2 - 1) * DUST_R;
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x6f819e, size: 1, sizeAttenuation: false }));
dust.frustumCulled = false;
scene.add(dust);

// ---- image-based lighting for the metal hulls: sky + a faint blue/brown ambient gradient, prefiltered once
{
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene();
  const skyM = sky.material.clone(); skyM.depthTest = false;
  const skyMesh = new THREE.Mesh(sky.geometry, skyM); skyMesh.renderOrder = -10; es.add(skyMesh);
  const grad = new THREE.Mesh(new THREE.SphereGeometry(100, 16, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ gl_FragColor=vec4(mix(vec3(.16,.12,.08),vec3(.22,.3,.5),smoothstep(-.6,.8,vP.y)),1.); }',
  }));
  grad.renderOrder = -5; es.add(grad);
  scene.environment = pm.fromScene(es, 0.03).texture;
  scene.environmentIntensity = 0.9;
  pm.dispose();
}
