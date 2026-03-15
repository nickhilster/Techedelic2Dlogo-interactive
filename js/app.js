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
  const preset = document.getElementById('ctrlPreset');
  const toggle = document.getElementById('ctrlToggle');
  const controlsPanel = document.getElementById('controlsPanel');
  const controlsBody = document.getElementById('controlsBody');

  // Only show panel in dev (localhost) or when window.__DEV__ is true
  try{
    const isDev = (window.__DEV__ === true) || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if(!isDev && controlsPanel) controlsPanel.style.display = 'none';
  }catch(e){}

  // Presets
  const PRESETS = {
    subtle: { glowGain:0.9, glowSmooth:0.40, sensitivity:0.9, smoothAlpha:0.12, beatThreshold:1.6 },
    punchy: { glowGain:2.2, glowSmooth:0.08, sensitivity:1.4, smoothAlpha:0.08, beatThreshold:1.2 },
    dream:  { glowGain:1.4, glowSmooth:0.28, sensitivity:1.0, smoothAlpha:0.20, beatThreshold:1.8 }
  };

  const CONTROLS_KEY = 'techedelic.controls';

  function loadControls(){
    try{
      const raw = localStorage.getItem(CONTROLS_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null; }
  }

  function saveControls(obj){ try{ localStorage.setItem(CONTROLS_KEY, JSON.stringify(obj)); }catch(e){} }

  function applyToUI(obj){
    if(!obj) return;
    if(glowGain) glowGain.value = obj.glowGain ?? glowGain.value;
    if(glowSmooth) glowSmooth.value = obj.glowSmooth ?? glowSmooth.value;
    if(sensitivity) sensitivity.value = obj.sensitivity ?? sensitivity.value;
    if(smoothAlpha) smoothAlpha.value = obj.smoothAlpha ?? smoothAlpha.value;
    if(beatThresh) beatThresh.value = obj.beatThreshold ?? beatThresh.value;
    if(monitor) monitor.checked = !!obj.monitor;
  }

  function readFromUI(){
    return {
      glowGain: Number(glowGain.value),
      glowSmooth: Number(glowSmooth.value),
      sensitivity: Number(sensitivity.value),
      smoothAlpha: Number(smoothAlpha.value),
      beatThreshold: Number(beatThresh.value),
      monitor: !!monitor.checked
    };
  }

  // Preset storage helpers (project-level presets)
  const PRESETS_KEY = 'techedelic.presets';
  function loadSavedPresets(){ try{ const p = JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}'); return p || {}; }catch(e){ return {}; } }
  function savePreset(name, obj){ if(!name) return; const all = loadSavedPresets(); all[name] = obj; try{ localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); }catch(e){} }
  function deletePreset(name){ const all = loadSavedPresets(); if(all[name]){ delete all[name]; try{ localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); }catch(e){} } }
  function getPresetList(){ const saved = loadSavedPresets(); return Object.assign({}, PRESETS, saved); }

  function refreshPresetOptions(){
    if(!preset) return;
    const saved = loadSavedPresets();
    // clear options except 'custom'
    const current = preset.value;
    preset.innerHTML = '';
    const optCustom = document.createElement('option'); optCustom.value='custom'; optCustom.textContent='Custom'; preset.appendChild(optCustom);
    // builtins
    Object.keys(PRESETS).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent = k.charAt(0).toUpperCase()+k.slice(1); preset.appendChild(o); });
    // saved
    Object.keys(saved).forEach(k=>{ const o=document.createElement('option'); o.value = '_user_'+k; o.textContent = k; preset.appendChild(o); });
    if(current) preset.value = current in PRESETS ? current : (current && current.startsWith('_user_') ? current : 'custom');
  }

  refreshPresetOptions();

  // initialize from saved or default
  const saved = loadControls();
  if(saved) applyToUI(saved);

  // collapse toggle behavior
  if(toggle && controlsPanel && controlsBody){
    const collapsed = saved && saved.collapsed;
    if(collapsed) { controlsPanel.setAttribute('data-collapsed','true'); controlsBody.style.display='none'; toggle.textContent='▸'; }
    toggle.addEventListener('click', ()=>{
      const isCollapsed = controlsPanel.getAttribute('data-collapsed') === 'true';
      controlsPanel.setAttribute('data-collapsed', String(!isCollapsed));
      controlsBody.style.display = isCollapsed ? 'block' : 'none';
      toggle.textContent = isCollapsed ? '▾' : '▸';
      const current = loadControls() || {};
      current.collapsed = !isCollapsed;
      saveControls(current);
    });
  }
  if(glowGain && window.app.visuals) glowGain.addEventListener('input', (e)=>{ window.app.visuals.setGlowGain(e.target.value); saveControls(Object.assign(loadControls()||{}, readFromUI())); });
  if(glowSmooth && window.app.visuals) glowSmooth.addEventListener('input', (e)=>{ window.app.visuals.setGlowSmoothing(e.target.value); saveControls(Object.assign(loadControls()||{}, readFromUI())); });
  if(sensitivity && window.app.audioEngine) sensitivity.addEventListener('input', (e)=>{ window.app.audioEngine.setSensitivity(Number(e.target.value)); saveControls(Object.assign(loadControls()||{}, readFromUI())); });
  if(smoothAlpha && window.app.audioEngine) smoothAlpha.addEventListener('input', (e)=>{ window.app.audioEngine.setSmoothingAlpha(Number(e.target.value)); saveControls(Object.assign(loadControls()||{}, readFromUI())); });
  if(beatThresh && window.app.audioEngine) beatThresh.addEventListener('input', (e)=>{ window.app.audioEngine.setBeatThreshold(Number(e.target.value)); saveControls(Object.assign(loadControls()||{}, readFromUI())); });
  if(monitor && window.app.audioEngine) monitor.addEventListener('change', (e)=>{ window.app.audioEngine.enableMonitor(e.target.checked); saveControls(Object.assign(loadControls()||{}, readFromUI())); });

  if(preset){
    preset.addEventListener('change', (ev)=>{
      const v = ev.target.value;
      if(v === 'custom') return;
      // user-saved presets are prefixed with _user_
      let p;
      if(v.startsWith('_user_')){
        const name = v.replace('_user_','');
        const saved = loadSavedPresets(); p = saved[name];
      } else {
        p = PRESETS[v];
      }
      if(!p) return;
      applyToUI(Object.assign({}, p, { monitor: false }));
      // apply to components
      if(window.app.visuals) { window.app.visuals.setGlowGain(p.glowGain); window.app.visuals.setGlowSmoothing(p.glowSmooth); }
      if(window.app.audioEngine){ window.app.audioEngine.setSensitivity(p.sensitivity); window.app.audioEngine.setSmoothingAlpha(p.smoothAlpha); window.app.audioEngine.setBeatThreshold(p.beatThreshold); }
      saveControls(Object.assign(loadControls()||{}, readFromUI()));
    });
  }

  // Save/Delete preset UI
  const saveBtn = document.createElement('button'); saveBtn.textContent = 'Save Preset'; saveBtn.style.marginLeft='8px';
  const delBtn = document.createElement('button'); delBtn.textContent = 'Delete Preset'; delBtn.style.marginLeft='8px';
  const nameInput = document.createElement('input'); nameInput.placeholder='preset name'; nameInput.style.marginLeft='8px'; nameInput.style.width='90px';
  if(controlsPanel){ const hdr = controlsPanel.querySelector('div'); if(hdr){ hdr.appendChild(nameInput); hdr.appendChild(saveBtn); hdr.appendChild(delBtn); } }

  saveBtn.addEventListener('click', ()=>{
    const n = (nameInput.value || '').trim(); if(!n) return alert('Enter a preset name');
    const obj = readFromUI(); savePreset(n, obj); refreshPresetOptions(); preset.value = '_user_'+n; saveControls(Object.assign(loadControls()||{}, { preset: '_user_'+n }));
  });
  delBtn.addEventListener('click', ()=>{
    const val = preset.value; if(!val || !val.startsWith('_user_')) return alert('Select a saved preset to delete');
    const name = val.replace('_user_',''); if(!confirm('Delete preset '+name+'?')) return; deletePreset(name); refreshPresetOptions(); preset.value = 'custom';
  });
}
setTimeout(wireControls, 300);

// Create the dev controls panel dynamically only in dev environments
function createDevControls(){
  const isDev = (window.__DEV__ === true) || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(!isDev) return null;

  // styles
  const style = document.createElement('style');
  style.textContent = `
    #controlsPanel{position:fixed;right:12px;top:12px;background:rgba(0,0,0,0.6);color:#fff;padding:10px;border-radius:6px;font-size:13px;z-index:60;width:260px}
    #controlsPanel label{display:block;margin-top:8px}
    #controlsPanel input[type=range]{width:100%}
    #controlsPanel .row{display:flex;justify-content:space-between;align-items:center}
    #controlsPanel strong{font-size:14px}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div'); panel.id = 'controlsPanel'; panel.setAttribute('data-collapsed','false');
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong>Controls (dev)</strong>
      <div>
        <select id="ctrlPreset" title="Presets">
          <option value="custom">Custom</option>
          <option value="subtle">Subtle</option>
          <option value="punchy">Punchy</option>
          <option value="dream">Dream</option>
        </select>
        <button id="ctrlToggle" aria-label="toggle controls" style="margin-left:8px">▾</button>
      </div>
    </div>
    <div id="controlsBody">
      <label>Glow Gain <input id="ctrlGlowGain" type="range" min="0" max="3" step="0.05" value="1.6"></label>
      <label>Glow Smooth <input id="ctrlGlowSmooth" type="range" min="0" max="1" step="0.01" value="0.2"></label>
      <label>Sensitivity <input id="ctrlSensitivity" type="range" min="0.1" max="3" step="0.05" value="1.0"></label>
      <label>Smooth Alpha <input id="ctrlSmoothAlpha" type="range" min="0" max="1" step="0.01" value="0.15"></label>
      <label>Beat Threshold <input id="ctrlBeatThresh" type="range" min="0.5" max="3" step="0.05" value="1.4"></label>
      <label class="row">Monitor <input id="ctrlMonitor" type="checkbox"></label>
      <div style="margin-top:8px;font-size:12px;opacity:0.9">Note: Monitor can cause feedback. Disabled by default for mic.</div>
    </div>
  `;
  document.body.appendChild(panel);
  // wire controls after DOM insertion
  setTimeout(wireControls, 50);
  return panel;
}

// create controls only in dev
createDevControls();

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
