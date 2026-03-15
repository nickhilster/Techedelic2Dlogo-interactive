/* AudioEngine — Web Audio wrapper with configurable smoothing and beat detection

Usage (browser):
  const engine = new AudioEngine({ demoUrl: 'assets/audio/demo-loop.mp3' });
  await engine.startOnUserGesture();
  engine.startDemo();
  engine.onBands(payload => { console.log(payload.bass, payload.mid, payload.treble); });
  engine.onBeat(t => console.log('beat', t));
*/

export class AudioEngine {
  constructor(opts = {}) {
    this.demoUrl = opts.demoUrl || 'assets/audio/demo-loop.mp3';

    this.context = null;
    this.analyser = null;
    this.sourceNode = null;

    this.fftSize = opts.fftSize || 2048;
    this.smoothingTimeConstant = opts.smoothingTimeConstant || 0.8;

    this.freqData = null;
    this.freqBinCount = 0;

    this._bandsCallbacks = new Set();
    this._beatCallbacks = new Set();

    // smoothing / beat detection state
    this.smoothed = { bass: 0, mid: 0, treble: 0 };
    this.emaAlpha = typeof opts.smoothingAlpha === 'number' ? opts.smoothingAlpha : 0.15;

    // running average used for beat detection (EMA)
    this.runningBassAvg = 0;
    this.runningAvgAlpha = typeof opts.runningAvgAlpha === 'number' ? opts.runningAvgAlpha : 0.02;
    this.beatThreshold = typeof opts.beatThreshold === 'number' ? opts.beatThreshold : 1.4;

    this._rafId = null;
    this._lastBeatTime = 0;
    this._minBeatInterval = typeof opts.minBeatInterval === 'number' ? opts.minBeatInterval : 120; // ms

    this.audioElement = null;
    this._sensitivity = typeof opts.sensitivity === 'number' ? opts.sensitivity : 1.0;
    this.currentSource = 'idle'; // 'idle' | 'mic' | 'demo' | 'file'
  }

  // configuration helpers
  setSmoothingAlpha(a){ this.emaAlpha = Math.max(0, Math.min(1, a)); }
  setRunningAvgAlpha(a){ this.runningAvgAlpha = Math.max(0, Math.min(1, a)); }
  setBeatThreshold(t){ this.beatThreshold = Math.max(0.1, t); }
  setSensitivity(s){ this._sensitivity = Math.max(0.1, s); }
  setMinBeatInterval(ms){ this._minBeatInterval = Math.max(20, ms); }

  async _ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.freqBinCount = this.analyser.frequencyBinCount;
      this.freqData = new Uint8Array(this.freqBinCount);
    }
    return this.context;
  }

  async startOnUserGesture(){
    await this._ensureContext();
    if(this.context.state === 'suspended') await this.context.resume();
  }

  async startDemo(){
    await this._ensureContext();
    await this.stopCurrentSource();
    if(this.audioElement){ this.audioElement.pause(); this.audioElement.src=''; this.audioElement=null; }
    const a = document.createElement('audio');
    a.src = this.demoUrl; a.loop = true; a.crossOrigin='anonymous';
    try{ await a.play(); }catch(e){}
    this.audioElement = a;
    const src = this.context.createMediaElementSource(a);
    this._connectSourceNode(src);
    this.currentSource = 'demo';
    // demo should be audible by default
    this.enableMonitor(true);
  }

  async startFromFile(fileOrUrl){
    await this._ensureContext();
    await this.stopCurrentSource();
    const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    if(this.audioElement) this.audioElement.pause();
    const a = document.createElement('audio'); a.src = url; a.loop = true; a.crossOrigin='anonymous';
    try{ await a.play(); }catch(e){}
    this.audioElement = a;
    const src = this.context.createMediaElementSource(a);
    this._connectSourceNode(src);
    this.currentSource = 'file';
    this.enableMonitor(true);
  }

  async startMic(){
    await this._ensureContext();
    await this.stopCurrentSource();
    // request mic stream and keep reference so we can stop it later
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this._micStream = stream;
    const mic = this.context.createMediaStreamSource(stream);
    // when using mic, do not enable monitor by default to avoid feedback
    this._connectSourceNode(mic);
    this.enableMonitor(false);
    this.currentSource = 'mic';
  }

  _connectSourceNode(node){
    // Disconnect previous source safely
    try{ if(this.sourceNode && this.sourceNode.disconnect) this.sourceNode.disconnect(); }catch(e){}
    this.sourceNode = node;
    // Ensure monitor gain exists and is connected to destination
    if(!this.monitorGain){
      this.monitorGain = this.context.createGain();
      this.monitorGain.gain.value = 0; // muted by default
      this.monitorGain.connect(this.context.destination);
    }
    // Connect source to analyser and to monitorGain (monitor controlled separately)
    try{ this.sourceNode.connect(this.analyser); }catch(e){}
    try{ this.sourceNode.connect(this.monitorGain); }catch(e){}
    this._startLoop();
  }

  // Stop and cleanup whichever source is active
  async stopCurrentSource(){
    // stop RAF loop
    if(this._rafId){ cancelAnimationFrame(this._rafId); this._rafId = null; }
    // stop audio element if present
    try{ if(this.audioElement){ this.audioElement.pause(); try{ this.audioElement.src=''; }catch(e){} this.audioElement = null; } }catch(e){}
    // stop mic stream tracks
    try{ if(this._micStream && this._micStream.getTracks){ this._micStream.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} }); this._micStream = null; } }catch(e){}
    // disconnect source node
    try{ if(this.sourceNode && this.sourceNode.disconnect) this.sourceNode.disconnect(); }catch(e){}
    this.sourceNode = null;
    this.currentSource = 'idle';
    // mute monitor by default
    this.enableMonitor(false);
  }

  // Control whether the current source is audibly monitored (useful for demo/file playback).
  enableMonitor(enabled = true){ if(this.monitorGain) this.monitorGain.gain.value = enabled ? 1 : 0; }

  _startLoop(){
    if(this._rafId) return;
    const tick = ()=>{
      this.analyser.getByteFrequencyData(this.freqData);
      const bands = this._computeBands();

      // apply sensitivity
      bands.bass = Math.min(1, bands.bass * this._sensitivity);
      bands.mid = Math.min(1, bands.mid * this._sensitivity);
      bands.treble = Math.min(1, bands.treble * this._sensitivity);

      // smoothing (EMA)
      this.smoothed.bass = this.smoothed.bass * (1 - this.emaAlpha) + bands.bass * this.emaAlpha;
      this.smoothed.mid = this.smoothed.mid * (1 - this.emaAlpha) + bands.mid * this.emaAlpha;
      this.smoothed.treble = this.smoothed.treble * (1 - this.emaAlpha) + bands.treble * this.emaAlpha;

      const now = performance.now();
      const currentBass = this.smoothed.bass;

      // running average (EMA) for beat detection
      this.runningBassAvg = this.runningBassAvg * (1 - this.runningAvgAlpha) + currentBass * this.runningAvgAlpha;

      let beat = false;
      if(now - this._lastBeatTime > this._minBeatInterval && this.runningBassAvg > 0){
        if(currentBass > this.runningBassAvg * this.beatThreshold){
          beat = true; this._lastBeatTime = now; for(const cb of this._beatCallbacks) try{ cb(now); }catch(e){}
        }
      }

      const payload = { bass: this.smoothed.bass, mid: this.smoothed.mid, treble: this.smoothed.treble, raw: this.freqData, beat };
      for(const cb of this._bandsCallbacks) try{ cb(payload); }catch(e){}

      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  stop(){ if(this._rafId) cancelAnimationFrame(this._rafId); this._rafId=null; if(this.audioElement) this.audioElement.pause(); if(this.sourceNode && this.sourceNode.disconnect) this.sourceNode.disconnect(); this.sourceNode=null; }

  _computeBands(){
    const sampleRate = (this.context && this.context.sampleRate) || 44100;
    const binHz = sampleRate / this.fftSize;
    const bassMaxHz = 300;
    const midMaxHz = 3000;
    const bassMaxBin = Math.min(Math.floor(bassMaxHz / binHz), this.freqBinCount - 1);
    const midMaxBin = Math.min(Math.floor(midMaxHz / binHz), this.freqBinCount - 1);

    const avgRange = (arr, start, end) => { start = Math.max(0, start); end = Math.min(arr.length - 1, end); let sum=0,count=0; for(let i=start;i<=end;i++){ sum += arr[i]; count++; } return count? sum/count/255 : 0; };

    const bass = avgRange(this.freqData, 0, Math.max(2, bassMaxBin));
    const mid = avgRange(this.freqData, Math.max(3, Math.floor(bassMaxBin)+1), Math.max(5, midMaxBin));
    const treble = avgRange(this.freqData, Math.max(midMaxBin+1, 6), this.freqBinCount - 1);
    return { bass, mid, treble };
  }

  onBands(cb){ this._bandsCallbacks.add(cb); return ()=>this._bandsCallbacks.delete(cb); }
  onBeat(cb){ this._beatCallbacks.add(cb); return ()=>this._beatCallbacks.delete(cb); }
}

export default AudioEngine;
