import { createScene } from './scene.js';
import Particles from './particles.js';
import AudioEngine from './audio.js';
import Visuals from './visuals.js';

const canvas = document.getElementById('glcanvas');
const startBtn = document.getElementById('startBtn');
const demoBtn = document.getElementById('demoBtn');
const micBtn = document.getElementById('micBtn');
const fileInput = document.getElementById('fileInput');

const sceneAPI = createScene(canvas);
sceneAPI.init();

// Auto-start rendering so users see the logo immediately (audio still requires gesture)
try{
  sceneAPI.start();
  if(startBtn){ startBtn.disabled = true; startBtn.textContent = 'Running'; }
  if(window.app && typeof window.app.setAudioStatus === 'function') window.app.setAudioStatus('Rendering');
}catch(e){ console.warn('Auto-start render failed', e); }

// ensure global app object exists early so other scripts can attach to it
window.app = window.app || {};
const audioStatusEl = document.getElementById('audioStatus');
function setAudioStatus(text) { if (audioStatusEl) audioStatusEl.textContent = text; }
window.app.setAudioStatus = setAudioStatus;
window.app.sceneAPI = sceneAPI;
window.app.logoCube = sceneAPI.logoCube;
// instantiate particles and wire into the scene update loop
const particles = new Particles(sceneAPI.scene, { count: 800 });
window.app.particles = particles;

// Render mode helper and default edge colors (matches PLAN colours)
const RENDER_MODES = ['neon','hybrid','solid'];
let _renderIndex = 0;
function applyRenderMode(mode){
  try{
    if(window.app.logoCube && typeof window.app.logoCube.setRenderMode === 'function') window.app.logoCube.setRenderMode(mode);
    if(window.app.logoCube && typeof window.app.logoCube.setEdgeColors === 'function') window.app.logoCube.setEdgeColors({ primary:'#ffffff', accent1:'#00ffff', accent2:'#ff00ff', accent3:'#ffff00' });
  }catch(e){/* ignore */}
}
applyRenderMode(RENDER_MODES[_renderIndex]);

// Keyboard shortcut: M to cycle render modes
document.addEventListener('keydown', (ev)=>{
  if(!ev || !ev.key) return;
  if(ev.key.toLowerCase() === 'm'){
    _renderIndex = (_renderIndex + 1) % RENDER_MODES.length;
    applyRenderMode(RENDER_MODES[_renderIndex]);
    console.log('Render mode ->', RENDER_MODES[_renderIndex]);
  }
});

// Initialize audio engine and visuals (exposed for Agent B behavior)
const audioEngine = new AudioEngine({ demoUrl: 'assets/audio/demo-loop.mp3' });
window.app.audioEngine = audioEngine;
const visuals = new Visuals(audioEngine, { app: window.app });
window.app.visuals = visuals;

// update particles each frame
sceneAPI.onUpdate((dt)=>{
  if (window.app.particles && typeof window.app.particles.update === 'function') window.app.particles.update(dt);
});

// Wire controls panel to audio/visual params
function wireControls(){
  const glowGain = document.getElementById('ctrlGlowGain');
  const glowSmooth = document.getElementById('ctrlGlowSmooth');
  const sensitivity = document.getElementById('ctrlSensitivity');
  const smoothAlpha = document.getElementById('ctrlSmoothAlpha');
  const beatThresh = document.getElementById('ctrlBeatThresh');
  const monitor = document.getElementById('ctrlMonitor');
  if(glowGain && window.app.visuals) glowGain.addEventListener('input', (e)=>{ window.app.visuals.setGlowGain(e.target.value); });
  if(glowSmooth && window.app.visuals) glowSmooth.addEventListener('input', (e)=>{ window.app.visuals.setGlowSmoothing(e.target.value); });
  if(sensitivity && window.app.audioEngine) sensitivity.addEventListener('input', (e)=>{ window.app.audioEngine.setSensitivity(Number(e.target.value)); });
  if(smoothAlpha && window.app.audioEngine) smoothAlpha.addEventListener('input', (e)=>{ window.app.audioEngine.setSmoothingAlpha(Number(e.target.value)); });
  if(beatThresh && window.app.audioEngine) beatThresh.addEventListener('input', (e)=>{ window.app.audioEngine.setBeatThreshold(Number(e.target.value)); });
  if(monitor && window.app.audioEngine) monitor.addEventListener('change', (e)=>{ window.app.audioEngine.enableMonitor(e.target.checked); });
}
setTimeout(wireControls, 300);

startBtn.addEventListener('click', async ()=>{
  try{
    // resume audio context on user gesture, then start scene
    await audioEngine.startOnUserGesture();
    sceneAPI.start();
    startBtn.disabled = true; startBtn.textContent = 'Running';
    setAudioStatus('Running');
  }catch(e){ console.error(e); }
});

demoBtn.addEventListener('click', ()=>{
  (async()=>{
    try{
      await audioEngine.startOnUserGesture();
      if(audioEngine.currentSource === 'demo'){
        await audioEngine.stopCurrentSource();
        demoBtn.textContent = 'Demo';
        setAudioStatus('Idle');
      } else {
        await audioEngine.startDemo();
        demoBtn.textContent = 'Demo (on)';
        setAudioStatus('Demo');
      }
    }catch(e){ console.error('Demo start failed', e); }
  })();
});

// Microphone button
if (micBtn) micBtn.addEventListener('click', async ()=>{
  try{
    await audioEngine.startOnUserGesture();
    if(audioEngine.currentSource === 'mic'){
      await audioEngine.stopCurrentSource();
      micBtn.textContent = 'Mic';
      setAudioStatus('Idle');
    } else {
      await audioEngine.startMic();
      micBtn.textContent = 'Mic (on)';
      setAudioStatus('Mic');
    }
  }catch(e){ console.error('Mic start failed', e); }
});

// File input (upload) — user selects an audio file to play
if (fileInput) fileInput.addEventListener('change', async (ev)=>{
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  try{
    await audioEngine.startOnUserGesture();
    await audioEngine.startFromFile(f);
    // disable demo since file is playing
    demoBtn.disabled = true; demoBtn.textContent = 'Demo';
    setAudioStatus('File');
  }catch(e){ console.error('File start failed', e); }
});

// expose basic API for other agents

// Register service worker for PWA (if available)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg=>{
    console.log('Service worker registered:', reg.scope);
  }).catch(err=>{
    console.warn('Service worker registration failed:', err);
  });
}

export default sceneAPI;
