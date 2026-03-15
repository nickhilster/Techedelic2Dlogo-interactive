import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import LogoCube from './logo-geometry.js';

export function createScene(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(4,3,4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.4;

  const ambient = new THREE.AmbientLight(0x222222);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5,10,7);
  scene.add(ambient, dir);

  const composer = new EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0.85);
  bloomPass.strength = 1.5;
  composer.addPass(bloomPass);

  const logo = new LogoCube();
  scene.add(logo.group);

  const onUpdateCbs = new Set();
  let last = performance.now();
  let running = false;

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w,h,false);
    composer.setSize(w,h);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function frame(){
    const now = performance.now();
    const dt = (now - last)/1000; last = now;
    controls.update();
    logo.update(dt);
    onUpdateCbs.forEach(cb=>cb(dt, now));
    composer.render();
    if(running) requestAnimationFrame(frame);
  }

  return {
    init(){ resize(); },
    start(){ if(!running){ running=true; last = performance.now(); requestAnimationFrame(frame); } },
    stop(){ running=false; },
    onUpdate(cb){ onUpdateCbs.add(cb); return ()=>onUpdateCbs.delete(cb); },
    logoCube: logo,
    composer,
    bloomPass,
    camera,
    scene,
    renderer
  };
}
