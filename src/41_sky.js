// ======================================================================
//  SKY / PLANET / SUN — fully procedural, one "look" per mission or area (LOOKS below, selected with applyLook)
//  - sky: baked ONCE per look into a cubemap (1024/face desktop, 512/face touch) and used as scene.background,
//    so the per-frame cost of the starfield, Milky Way and nebulae is a single texture fetch
//  - planet: per-pixel shader (terran world with clouds / ice / city lights, or banded gas giant with storm and
//    ring shadow), atmosphere shell, optional rings and moons
//  - sun: HDR disc baked into the sky + a screen-space glare / ghost pass (occluded by the planet), all driven by
//    the same SUN vector as the directional light
//  ?skyres=N overrides the cubemap size (testing).
// ======================================================================
const SKY_RES = parseInt(params.get('skyres')) || (isTouch ? 512 : (Q0 ? Q0.sky : 1024));
const OCT = isTouch ? 4 : 6;                // fbm octaves in the planet shaders
const PLANET_DIR = new THREE.Vector3(-0.55, -0.22, -0.8).normalize();
let PLANET_DIST = 3300;

const GLSL_NOISE = `
float h13(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec3 h33(vec3 p3){ p3=fract(p3*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x), mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x), mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y), f.z); }
// fbm; fp = footprint of one screen pixel in p-space (0 for the baked sky): octaves finer than a pixel fade out
float fbm(vec3 p, float fp){ float a=.5,s=0.,w=1.; for(int i=0;i<OCT_N;i++){ w=clamp(1.-fp*1.6,0.,1.); s+=a*w*n3(p); p=p*2.03+vec3(1.7,9.2,3.4); a*=.5; fp*=2.03; } return s; }
float fbm(vec3 p){ return fbm(p,0.); }`;

// ---------------------------------------------------------------------------------------------- looks
// colours are linear RGB triples. neb: [scale, lo, hi, intensity]. planet.pal: 6 colours (see planet shader).
const LOOKS = {
  // OPERATION LILYPAD: blue-green water world, warm white sun, violet/teal nebulae
  lilypad: {
    sun: [0.6, 0.4, 0.55], sunCol: [1, 0.86, 0.64], light: 0xfff0d8, fill: 0x4a64b0, hemi: [0x9fb4e8, 0x4a3626],
    base: [0.004, 0.007, 0.016], seed: 1.3, starK: 1,
    neb: { a: [0.10, 0.035, 0.17], b: [0.02, 0.12, 0.17], c: [0.22, 0.09, 0.03], v: [1.9, 0.46, 0.80, 1.0] },
    mw: { n: [0.35, 0.9, 0.25], c: [0.8, 0.1, -0.6], i: 0.9 },
    planet: { type: 0, R: 760, dist: 3300, dir: [-0.55, -0.22, -0.8], atmo: [0.25, 0.5, 1.0], atmoI: 1, sea: 0.53, city: 1, seed: 2.0,
      pal: [[0.02, 0.085, 0.26], [0.05, 0.30, 0.42], [0.09, 0.20, 0.05], [0.30, 0.22, 0.12], [0.80, 0.86, 0.92], [0.92, 0.94, 0.97]] },
    moons: [{ dir: [-0.12, 0.2, -0.97], R: 58, col: [0.5, 0.5, 0.52], seed: 3 }],
    flare: 1,
  },
  // REEDBED (departure): marsh world under an olive haze, slightly redder sun
  reed: {
    sun: [0.6, 0.4, 0.55], sunCol: [1, 0.8, 0.55], light: 0xffe6c0, fill: 0x546a58, hemi: [0xa8b49a, 0x4a3a26],
    base: [0.006, 0.008, 0.012], seed: 7.9, starK: 1,
    neb: { a: [0.14, 0.10, 0.03], b: [0.03, 0.12, 0.07], c: [0.18, 0.05, 0.03], v: [1.7, 0.44, 0.78, 1.0] },
    mw: { n: [-0.5, 0.75, 0.4], c: [0.2, 0.2, -0.9], i: 0.9 },
    planet: { type: 0, R: 700, dist: 3300, dir: [-0.55, -0.22, -0.8], atmo: [0.55, 0.72, 0.38], atmoI: 1.0, sea: 0.5, city: 0.35, seed: 9.0,
      pal: [[0.045, 0.085, 0.06], [0.14, 0.24, 0.12], [0.14, 0.21, 0.04], [0.30, 0.20, 0.08], [0.62, 0.66, 0.6], [0.8, 0.78, 0.6]] },
    moons: [],
    flare: 1,
  },
  // NAV 2 BOG RELAY: deep space, no planet, dense amber/green nebula, Milky Way across the view, dimmer reddish sun
  ao2: {
    sun: [-0.5, 0.45, 0.7], sunCol: [1, 0.66, 0.42], light: 0xffd2a0, fill: 0x3c5a48, hemi: [0x9aae98, 0x4a3822],
    base: [0.006, 0.008, 0.010], seed: 21.1, starK: 1.25,
    neb: { a: [0.20, 0.12, 0.025], b: [0.035, 0.18, 0.08], c: [0.25, 0.04, 0.03], v: [1.5, 0.42, 0.78, 0.85] },
    mw: { n: [0.15, 0.95, -0.3], c: [0.3, 0.1, -0.9], i: 1.35 },
    planet: null, moons: [],
    flare: 0.9,
  },
  // NAV 3 FROGG OUTPOST: ringed gas giant with two moons, quarter-lit; blue-white sun from astern, violet nebula
  ao3: {
    sun: [0.35, 0.25, 0.9], sunCol: [0.9, 0.95, 1], light: 0xe8f0ff, fill: 0x6a4a8a, hemi: [0xa4aef0, 0x3e3048],
    base: [0.005, 0.005, 0.016], seed: 33.7, starK: 1,
    neb: { a: [0.11, 0.03, 0.20], b: [0.03, 0.07, 0.20], c: [0.20, 0.06, 0.12], v: [2.1, 0.47, 0.82, 1.0] },
    mw: { n: [0.5, 0.7, 0.5], c: [-0.6, 0.2, -0.7], i: 0.7 },
    planet: { type: 1, R: 900, dist: 3500, dir: [0.7, 0.25, -0.65], atmo: [0.9, 0.75, 0.45], atmoI: 0.7, seed: 5.0, spot: [-0.62, -0.3, 0.72],
      ring: [1.45, 2.45], ringTilt: [0.42, 0, 0.18],
      pal: [[0.42, 0.30, 0.17], [0.66, 0.54, 0.36], [0.30, 0.15, 0.08], [0.50, 0.42, 0.30], [0.50, 0.14, 0.06], [0.75, 0.68, 0.55]] },
    moons: [{ dir: [0.35, 0.55, -0.75], R: 70, col: [0.62, 0.58, 0.5], seed: 5 }, { dir: [0.97, -0.12, -0.2], R: 42, col: [0.45, 0.4, 0.4], seed: 11 }],
    flare: 1,
  },
};

// ---------------------------------------------------------------------------------------------- sky bake
const skyCube = new THREE.WebGLCubeRenderTarget(SKY_RES, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
const skyCam = new THREE.CubeCamera(0.1, 20, skyCube);
const V3 = () => ({ value: new THREE.Vector3() });
const bakeMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthTest: false, depthWrite: false,
  defines: { OCT_N: 5 },
  uniforms: { uSun: { value: SUN }, uSunCol: V3(), uBase: V3(), uNebA: V3(), uNebB: V3(), uNebC: V3(), uNeb: { value: new THREE.Vector4() },
    uMWn: V3(), uMWc: V3(), uMWi: { value: 1 }, uStarK: { value: 1 }, uSeed: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uSun,uSunCol,uBase,uNebA,uNebB,uNebC,uMWn,uMWc; uniform vec4 uNeb; uniform float uMWi,uStarK,uSeed;
    varying vec3 vDir; ${GLSL_NOISE}
    // one layer of point stars on a 3D cell grid: random position, colour temperature and magnitude per cell
    vec3 starLayer(vec3 d,float S,float prob,float rad,float gain,float seed){
      vec3 p=d*S+seed*17., id=floor(p), f=p-id;
      if(h13(id+seed)>prob) return vec3(0.);
      vec3 o=.22+.56*h33(id+seed*3.7);
      float m=h13(id*1.37+seed+5.1), mag=m*m*m;
      float r=rad*(.45+1.1*mag), c=1.-smoothstep(0.,r,length(f-o)); c*=c;
      float t=h13(id+seed+9.7);
      vec3 col=t<.55? mix(vec3(1.,.62,.38),vec3(1.,.93,.8),t/.55) : mix(vec3(1.,.93,.8),vec3(.62,.76,1.),(t-.55)/.45);
      return col*c*gain*(.14+mag*2.2);
    }
    void main(){
      vec3 d=normalize(vDir);
      vec3 col=uBase;
      // Milky Way: band about a plane, brighter toward a "core" direction, dust lanes cut into it
      float lat=dot(d,normalize(uMWn));
      float band=exp(-lat*lat/(2.*.15*.15));
      float gc=pow(max(dot(d,normalize(uMWc)),0.),3.);
      float dn=fbm(d*6.+uSeed), lane=smoothstep(.42,.66,fbm(d*10.5+3.1*uSeed+vec3(0.,lat*5.,0.)));
      float mw=band*(.3+.7*dn)*(.5+gc*1.3)*(1.-.8*lane*band);
      col+=uMWi*mw*mix(vec3(.5,.6,.9),vec3(1.,.78,.5),clamp(gc*1.3,0.,1.))*.17;
      // nebulae: warped fbm, two palette mixes, bright filaments
      vec3 q=d*uNeb.x+uSeed;
      vec3 w=vec3(fbm(q+3.1),fbm(q+7.7),fbm(q+1.3));
      float n=fbm(q+(w-.5)*1.7);
      float m1=smoothstep(uNeb.y,uNeb.z,n);
      float fil=pow(1.-abs(2.*fbm(q*2.3+w)-1.),4.);
      vec3 nc=mix(uNebA,uNebB,smoothstep(.3,.7,fbm(q*.8+11.)));
      nc=mix(nc,uNebC,smoothstep(.55,.8,fbm(q*1.7+5.))*.85);
      col+=nc*(m1*.75+fil*m1*.9)*uNeb.w*.38;
      col+=uNebB*smoothstep(.4,.9,fbm(d*.9+20.+uSeed))*.05*uNeb.w;     // wide soft glow
      // stars: three magnitude tiers, denser inside the Milky Way, thinned by dense nebula
      float dens=uStarK*(1.+1.4*band*(1.-.6*lane));
      vec3 st=starLayer(d,130.,.32*dens,.14,1.,1.)+starLayer(d,56.,.13*dens,.11,1.4,2.)+starLayer(d,23.,.10*dens,.07,2.4,3.);
      col+=st*(1.-.55*m1);
      // sun: HDR disc + corona
      float sd=dot(d,uSun), a=sqrt(max(2.*(1.-sd),0.));
      float disc=1.-smoothstep(.0085,.0115,a);
      col+=uSunCol*(disc*30.+exp(-a*42.)*2.4+exp(-a*10.)*.38+exp(-a*2.6)*.05);
      gl_FragColor=vec4(col,1.);
    }`,
});
const bakeScene = new THREE.Scene();
bakeScene.add(new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), bakeMat));
scene.background = skyCube.texture;

function bakeSky(L) {
  const u = bakeMat.uniforms;
  u.uSunCol.value.fromArray(L.sunCol); u.uBase.value.fromArray(L.base);
  u.uNebA.value.fromArray(L.neb.a); u.uNebB.value.fromArray(L.neb.b); u.uNebC.value.fromArray(L.neb.c); u.uNeb.value.fromArray(L.neb.v);
  u.uMWn.value.fromArray(L.mw.n); u.uMWc.value.fromArray(L.mw.c); u.uMWi.value = L.mw.i;
  u.uStarK.value = L.starK; u.uSeed.value = L.seed;
  skyCam.update(renderer, bakeScene);
}

// ---------------------------------------------------------------------------------------------- planet
const GLSL_RING = `
uniform vec2 uRing;
float ringDens(float r,float fw){
  float t=(r-uRing.x)/(uRing.y-uRing.x); if(t<0.||t>1.) return 0.;
  float k=smoothstep(.02,.004,fw/(uRing.y-uRing.x));        // fine banding fades out when finer than a pixel
  float b=.55+.22*sin(t*31.)+.18*k*sin(t*83.+1.3);
  float x=t*110., xi=floor(x), xf=smoothstep(0.,1.,x-xi);
  b*=1.-.45*k*mix(h13(vec3(xi,1.,2.)),h13(vec3(xi+1.,1.,2.)),xf);
  b*=1.-.9*smoothstep(.028,.0,abs(t-.63));
  b*=smoothstep(0.,.05,t)*smoothstep(1.,.9,t);
  return clamp(b,0.,1.);
}`;
const GLSL_ATMO = `
vec3 atmoCol(vec3 ac,float l){
  float day=smoothstep(-.35,.45,l);
  vec3 warm=vec3(1.,.42,.18)*exp(-pow((l-.03)/.16,2.))*.45;
  return ac*day+warm*smoothstep(-.4,.1,l);
}`;
const planetUniforms = {
  uSun: { value: SUN }, uTime: { value: 0 }, uType: { value: 0 },
  uC0: V3(), uC1: V3(), uC2: V3(), uC3: V3(), uC4: V3(), uC5: V3(),
  uP: { value: new THREE.Vector4() }, uAtmo: V3(), uAtmoI: { value: 1 }, uSpot: V3(),
  uRing: { value: new THREE.Vector2() }, uRingN: { value: new THREE.Vector3(0, 1, 0) },
};
const planetMat = new THREE.ShaderMaterial({
  defines: isTouch ? { OCT_N: OCT, LOW: 1 } : { OCT_N: OCT }, uniforms: planetUniforms,
  vertexShader: `varying vec3 vN; varying vec3 vW;
    void main(){ vN=normal; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun,uC0,uC1,uC2,uC3,uC4,uC5,uAtmo,uSpot,uRingN; uniform float uTime,uType,uAtmoI; uniform vec4 uP;
    varying vec3 vN; varying vec3 vW; ${GLSL_NOISE} ${GLSL_RING} ${GLSL_ATMO}
    float PF;
    vec3 terran(vec3 p,vec3 N,vec3 V,float l,out float spec){
      float sea=uP.x, seed=uP.z;
      vec3 q=p*2.1+seed;
      vec3 w=vec3(fbm(q*1.7,PF*3.6),fbm(q*1.7+4.1,PF*3.6),fbm(q*1.7+8.3,PF*3.6));
      float h=fbm(q+(w-.5)*.9,PF*2.1)*.55+.45*fbm(q*3.3+(w-.5)*.4,PF*6.9);
      h=(h-.49)*2.3+.5;
      float land=smoothstep(sea,sea+.012,h), shallow=smoothstep(sea-.07,sea,h);
      float elev=clamp((h-sea)/(1.-sea)*2.2,0.,1.);
      float lat=abs(p.y);
      float polar=smoothstep(.78,.92,lat+(fbm(p*5.+2.,PF*5.)-.5)*.22);
      vec3 lc=mix(uC2,uC3,smoothstep(.35,.65,fbm(q*2.2+3.,PF*4.6)));
      lc=mix(lc,lc*.5,smoothstep(.4,.8,elev))*(.75+.5*fbm(p*18.,PF*18.));
      vec3 oc=mix(uC0,uC1,shallow*shallow)*(.85+.3*fbm(p*12.,PF*12.));
      vec3 surf=mix(mix(oc,lc,land),uC4,polar);
      float ice=polar;
      // clouds, drifting; their shadow is cast on the surface toward the sun
      vec3 cq=p*3.1+vec3(uTime*.006,0.,uTime*.003)+(w-.5)*.6;
      float cd=(fbm(cq,PF*3.1)*.7+.3*fbm(cq*3.1,PF*9.6)-.49)*2.1+.5;
      float cloud=smoothstep(.5,.9,cd);
      #ifndef LOW
      vec3 cs=cq+uSun*.06;
      float csh=smoothstep(.5,.72,(fbm(cs,PF*3.1)*.7+.3*fbm(cs*3.1,PF*9.6)-.49)*2.1+.5);
      surf*=1.-.55*csh*(1.-cloud);
      #endif
      float dif=max(l,0.)*.9+.15*smoothstep(0.,.3,l);
      vec3 H=normalize(uSun+V);
      spec=pow(max(dot(N,H),0.),380.)*(1.-land)*(1.-ice)*(1.-cloud)*step(0.,l);
      vec3 col=surf*(.02+dif*1.7)+vec3(1.,.95,.85)*spec*.7;
      // night side: city lights on populated low land, hidden by cloud
      float night=smoothstep(.1,-.12,l);
      float pop=smoothstep(.5,.75,fbm(p*7.+seed,PF*7.))*land*(1.-ice)*(1.-smoothstep(.4,.8,elev));
      vec3 cp=p*34.; vec3 id=floor(cp);
      float c=step(.5,h13(id))*smoothstep(.45,.0,length(fract(cp)-.5))*smoothstep(1.2,.4,PF*34.);
      col+=vec3(1.,.7,.38)*c*pop*night*uP.y*(1.-cloud*.85)*2.2;
      col=mix(col,uC5*(.012+dif*1.9)*(.8+.2*smoothstep(-.1,.4,l)),cloud*.94);
      return col;
    }
    vec3 gas(vec3 p,vec3 N,float l){
      float seed=uP.z, lat=p.y;
      vec3 s=vec3(p.x*2.2,p.y*7.,p.z*2.2)+seed;
      float t1=fbm(s*vec3(1.,2.5,1.),PF*3.), wp=(fbm(p*3.+5.+seed,PF*3.)-.5);
      float b1=.5+.5*sin(lat*17.+3.2*(t1-.5)+wp*2.6);
      vec3 col=mix(uC0,uC1,b1);
      col=mix(col,uC2,smoothstep(.55,.9,.5+.5*sin(lat*41.+7.*(t1-.5)+wp*3.))*.65);
      col=mix(col,uC3,smoothstep(.6,.85,fbm(s*vec3(3.,6.,3.),PF*6.))*.5);
      col*=.88+.24*fbm(vec3(p.x*6.,p.y*60.,p.z*6.)+seed,PF*40.);
      // storm: oval with a swirl
      vec3 e=normalize(uSpot), east=normalize(cross(vec3(0.,1.,0.),e)), north=cross(e,east);
      vec2 uv=vec2(dot(p,east)/.2,dot(p,north)/.1); float ell=length(uv);
      float ang=(1.-clamp(ell,0.,1.))*2.6; float ca=cos(ang), sa=sin(ang);
      vec2 ru=vec2(ca*uv.x-sa*uv.y,sa*uv.x+ca*uv.y);
      float sw=fbm(vec3(ru*3.,seed),PF*3.);
      col=mix(col,uC4*(.75+.5*sw),smoothstep(1.08,.72,ell)*step(0.,dot(p,e))*.9);
      col=mix(col,uC5*.8,pow(abs(lat),4.)*.45);                         // polar haze
      // ring shadow on the globe
      float dn=dot(uSun,uRingN), sh=0.;
      if(uRing.y>0. && abs(dn)>.01){ float t=-dot(p,uRingN)/dn; if(t>0.) sh=ringDens(length(p+uSun*t),.02); }
      float dif=smoothstep(-.12,.5,l)*(1.-.8*sh);
      return col*(.02+dif*1.05);
    }
    void main(){
      vec3 N=normalize(vN), p=N, V=normalize(cameraPosition-vW);
      PF=length(fwidth(p));
      float l=dot(N,uSun), spec=0.;
      vec3 col = uType<.5 ? terran(p,N,V,l,spec) : gas(p,N,l);
      float ndv=max(dot(N,V),0.);
      col+=atmoCol(uAtmo,l)*(pow(1.-ndv,3.5)*1.3+pow(1.-ndv,1.6)*.06)*uAtmoI;
      gl_FragColor=vec4(col,1.);
    }`,
});
// atmosphere shell: glow outside the limb, computed from the ray's closest approach so it matches the globe's rim term
const shellMat = new THREE.ShaderMaterial({
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  uniforms: { uSun: { value: SUN }, uAtmo: planetUniforms.uAtmo, uAtmoI: planetUniforms.uAtmoI, uPC: V3(), uPR: { value: 1 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun,uAtmo,uPC; uniform float uAtmoI,uPR; varying vec3 vW; ${GLSL_ATMO}
    void main(){
      vec3 ro=cameraPosition, rd=normalize(vW-ro), oc=uPC-ro;
      vec3 cp=ro+rd*dot(oc,rd); float b=length(cp-uPC);
      float h=(b-uPR)/(uPR*.08);
      if(h<-.08||h>1.) discard;
      float l=dot(normalize(cp-uPC),uSun);
      gl_FragColor=vec4(atmoCol(uAtmo,l)*pow(1.-max(h,0.),3.)*smoothstep(-.08,0.,h)*uAtmoI*1.3,1.);
    }`,
});
const ringMat = new THREE.ShaderMaterial({
  transparent: true, side: THREE.DoubleSide, depthWrite: false, defines: { OCT_N: 2 },
  uniforms: { uSun: { value: SUN }, uRing: planetUniforms.uRing, uRingN: planetUniforms.uRingN, uPC: shellMat.uniforms.uPC, uPR: shellMat.uniforms.uPR },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun,uRingN,uPC; uniform float uPR; varying vec3 vW; ${GLSL_NOISE} ${GLSL_RING}
    void main(){
      vec3 q=(vW-uPC)/uPR; float r=length(q);
      float d=ringDens(r,fwidth(r)); if(d<.01) discard;
      float s=dot(q,uSun), sh=(s<0. && dot(q,q)-s*s<1.)? 1. : 0.;      // planet shadow on the ring
      float lit=(.18+.82*abs(dot(uRingN,uSun)))*(1.-.92*sh);
      vec3 base=mix(vec3(.62,.52,.38),vec3(.78,.7,.58),.5+.5*sin(r*40.));
      gl_FragColor=vec4(base*(.012+lit*1.5),d*.92);
    }`,
});
const planet = new THREE.Group();
const planetBody = new THREE.Mesh(new THREE.SphereGeometry(1, isTouch ? 48 : 96, isTouch ? 32 : 64), planetMat);
const planetShell = new THREE.Mesh(new THREE.SphereGeometry(1.09, 48, 32), shellMat);
const planetRing = new THREE.Mesh(new THREE.RingGeometry(1, 1, 8, 1), ringMat);   // geometry rebuilt per look
planetShell.renderOrder = 2; planetRing.renderOrder = 1;
for (const m of [planetBody, planetShell, planetRing]) { m.frustumCulled = false; planet.add(m); }
planet.frustumCulled = false;
scene.add(planet);

// ---------------------------------------------------------------------------------------------- moons
const moonMatBase = new THREE.ShaderMaterial({
  defines: { OCT_N: isTouch ? 3 : 4 },
  uniforms: { uSun: { value: SUN }, uCol: V3(), uSeed: { value: 0 } },
  vertexShader: `varying vec3 vN; void main(){ vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uSun,uCol; uniform float uSeed; varying vec3 vN; ${GLSL_NOISE}
    void main(){
      vec3 n=normalize(vN), p=n+uSeed*3.7; float PF=length(fwidth(n));
      vec3 alb=uCol*(.55+.6*fbm(p*3.,PF*3.))*(1.-.35*smoothstep(.45,.6,fbm(p*1.6+3.,PF*1.6)));
      for(int k=0;k<2;k++){
        vec3 pc=p*(7.+6.*float(k))+float(k)*13.; vec3 id=floor(pc);
        float d=length(fract(pc)-.2-.6*h33(id)), rr=.26*step(.4,h13(id));
        alb*=1.-.4*smoothstep(rr,rr*.5,d)+.3*smoothstep(rr*.2,0.,abs(d-rr));
      }
      float l=dot(n,uSun);
      gl_FragColor=vec4(alb*(.01+pow(max(l,0.),.8)*1.7),1.);
    }`,
});
const moons = [0, 1].map(() => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), moonMatBase.clone());
  m.material.uniforms.uSun = { value: SUN };
  m.frustumCulled = false; m.visible = false; scene.add(m); return m;
});
const moonDirs = [new THREE.Vector3(), new THREE.Vector3()];

// ---------------------------------------------------------------------------------------------- sun glare / lens flare
// one full-screen additive quad: halo, anamorphic streak and a few ghosts along the sun-centre line
const flareMat = new THREE.ShaderMaterial({
  transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  defines: isTouch ? { LOW: 1 } : {},
  uniforms: { uS: { value: new THREE.Vector2() }, uA: { value: 1 }, uI: { value: 0 }, uCol: V3() },
  vertexShader: `varying vec2 vN; void main(){ vN=position.xy; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform vec2 uS; uniform float uA,uI; uniform vec3 uCol; varying vec2 vN;
    void main(){
      vec2 p=vec2(vN.x*uA,vN.y), s=vec2(uS.x*uA,uS.y), d=p-s; float r=length(d);
      float g=exp(-r*3.2)*.06+exp(-r*14.)*.10+exp(-r*55.)*.35;
      float streak=exp(-abs(d.y)*60.)*exp(-abs(d.x)*1.5)*.10;
      vec3 c=uCol*(g+streak);
      #ifndef LOW
      float fade=smoothstep(2.6,.6,length(s));
      for(int i=0;i<4;i++){
        float k=i==0?.35:i==1?.7:i==2?1.3:-.55, rad=i==0?.07:i==1?.12:i==2?.05:.16;
        vec2 gp=-s*k; float gr=length(p-gp)/rad;
        float ring=smoothstep(1.,.75,gr)*(.35+.65*smoothstep(.55,1.,gr));
        vec3 tint=i==0?vec3(.4,.7,1.):i==1?vec3(1.,.65,.35):i==2?vec3(.5,1.,.6):vec3(.8,.5,1.);
        c+=tint*ring*(i==3?.012:.02)*fade;
      }
      #endif
      gl_FragColor=vec4(c*uI,1.);
    }`,
});
const flare = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flareMat);
flare.frustumCulled = false; flare.renderOrder = 1000; flare.visible = false;
scene.add(flare);
let flareK = 1;

// ---------------------------------------------------------------------------------------------- dust (speed cue, wraps around the camera)
const DUST_N = 300, DUST_R = 220;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_N * 3);
for (let i = 0; i < dustPos.length; i++) dustPos[i] = (Math.random() * 2 - 1) * DUST_R;
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x6f819e, size: 1, sizeAttenuation: false }));
dust.frustumCulled = false;
scene.add(dust);

// ---------------------------------------------------------------------------------------------- environment (hull IBL)
{
  // same faint blue/brown ambient gradient as before, prefiltered once (the sky itself is deliberately not in it)
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene();
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

// ---------------------------------------------------------------------------------------------- applyLook / per-frame
let curLook = null;
function applyLook(name, force) {
  const L = LOOKS[name] || LOOKS.lilypad;
  if (curLook === L && !force) return;
  curLook = L;
  SUN.fromArray(L.sun).normalize();
  sunLight.position.copy(SUN).multiplyScalar(100); sunLight.color.setHex(L.light);
  fillLight.position.copy(SUN).multiplyScalar(-100); fillLight.color.setHex(L.fill);
  hemiLight.color.setHex(L.hemi[0]); hemiLight.groundColor.setHex(L.hemi[1]);
  bakeSky(L);
  flareMat.uniforms.uCol.value.fromArray(L.sunCol); flareK = L.flare;
  const P = L.planet;
  planet.visible = !!P;
  if (P) {
    PLANET_DIR.fromArray(P.dir).normalize(); PLANET_DIST = P.dist; planet.scale.setScalar(P.R);
    const u = planetUniforms;
    u.uType.value = P.type; u.uAtmo.value.fromArray(P.atmo); u.uAtmoI.value = P.atmoI;
    ['uC0', 'uC1', 'uC2', 'uC3', 'uC4', 'uC5'].forEach((k, i) => u[k].value.fromArray(P.pal[i]));
    u.uP.value.set(P.sea || 0.5, P.city || 0, P.seed || 0, 0);
    if (P.spot) u.uSpot.value.fromArray(P.spot);
    shellMat.uniforms.uPR.value = P.R;
    planetRing.visible = !!P.ring;
    if (P.ring) {
      u.uRing.value.set(P.ring[0], P.ring[1]);
      planetRing.geometry.dispose(); planetRing.geometry = new THREE.RingGeometry(P.ring[0], P.ring[1], isTouch ? 96 : 192, 1);
      planetRing.rotation.set(P.ringTilt[0] + Math.PI / 2, P.ringTilt[1], P.ringTilt[2]);
      planetRing.updateMatrix(); u.uRingN.value.set(0, 0, 1).applyEuler(planetRing.rotation).normalize();
    } else u.uRing.value.set(0, 0);
  }
  moons.forEach((m, i) => {
    const d = L.moons[i]; m.visible = !!d;
    if (!d) return;
    moonDirs[i].fromArray(d.dir).normalize(); m.scale.setScalar(d.R);
    m.material.uniforms.uCol.value.fromArray(d.col); m.material.uniforms.uSeed.value = d.seed;
  });
}
const _sq = new THREE.Quaternion(), _sv = new THREE.Vector3();
function updateSky(c) {
  if (curLook.planet) {
    planet.position.copy(c).addScaledVector(PLANET_DIR, PLANET_DIST);
    shellMat.uniforms.uPC.value.copy(planet.position);
    planetUniforms.uTime.value = time;
  }
  moons.forEach((m, i) => { if (m.visible) m.position.copy(c).addScaledVector(moonDirs[i], 3000); });
  // sun glare: sun direction in view space; faded by view angle and occluded by the planet's disc
  _sv.copy(SUN).applyQuaternion(_sq.copy(camera.quaternion).invert());
  let I = 0;
  if (_sv.z < 0) {
    const w = -_sv.z, x = camera.projectionMatrix.elements[0] * _sv.x / w, y = camera.projectionMatrix.elements[5] * _sv.y / w;
    I = THREE.MathUtils.smoothstep(w, 0.05, 0.5) * flareK;
    if (curLook.planet) {
      const ang = Math.acos(clamp(SUN.dot(PLANET_DIR), -1, 1)), pr = Math.asin(curLook.planet.R / PLANET_DIST);
      I *= THREE.MathUtils.smoothstep(ang, pr * 0.9, pr * 1.06);
    }
    I *= THREE.MathUtils.smoothstep(Math.hypot(x, y), 4, 2.2);
    flareMat.uniforms.uS.value.set(x, y); flareMat.uniforms.uA.value = camera.aspect;
  }
  flareMat.uniforms.uI.value = I; flare.visible = I > 0.002;
}
applyLook('lilypad');
