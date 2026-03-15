/* visuals.js — maps AudioEngine outputs to scene / logoCube

Expectations:
- `window.app.logoCube` may be a THREE.Group or have helper methods.
- `window.app.sceneAPI` may provide `bloomPass` object with `strength`.

This module exports `Visuals` which subscribes to an AudioEngine instance
and applies simple, lightweight mappings: cube scaling, bloom, and beat pulse.
*/

export class Visuals {
  constructor(audioEngine, opts = {}) {
    this.audio = audioEngine;
    this.app = opts.app || (typeof window !== 'undefined' ? window.app || {} : {});

    this.scaleBase = opts.scaleBase || 1.0;
    this.maxScale = opts.maxScale || 1.15;
    this.bloomBase = (this.app.sceneAPI && this.app.sceneAPI.bloomPass && this.app.sceneAPI.bloomPass.strength) || 1.0;
    this.bloomMax = opts.bloomMax || 3.0;

    this._bandsUnsub = null;
    this._beatUnsub = null;

    this._local = {
      cubeScale: 1,
      targetCubeScale: 1,
      beatPulse: 0,
    };

    this._start();
  }

  _start() {
    if (!this.audio) return;
    this._bandsUnsub = this.audio.onBands(b => this._onBands(b));
    this._beatUnsub = this.audio.onBeat(() => this._onBeat());
    this._raf = requestAnimationFrame(()=>this._tick());
  }

  _stop() {
    if (this._bandsUnsub) this._bandsUnsub();
    if (this._beatUnsub) this._beatUnsub();
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _onBands(b) {
    // map bass -> cube breathing scale
    const bass = b.bass || 0;
    const t = this.scaleBase + Math.min(1, bass) * (this.maxScale - this.scaleBase);
    this._local.targetCubeScale = t;

    // map mid -> subtle bloom/color adjustments
    const mid = b.mid || 0;
    if (this.app.sceneAPI && this.app.sceneAPI.bloomPass) {
      const bp = this.app.sceneAPI.bloomPass;
      bp.strength = this.bloomBase + mid * (this.bloomMax - this.bloomBase);
    }

    // treble drives particle intensity (if present)
    this._lastBands = b;
    const p = (this.app && this.app.particles) || (typeof window !== 'undefined' && window.app && window.app.particles) || null;
    if (p && typeof p.setIntensity === 'function') {
      const treble = b.treble || 0;
      // Map treble (0..1) to intensity range (0.2 .. 1.6)
      const intensity = 0.2 + Math.min(1, treble) * 1.4;
      try { p.setIntensity(intensity); } catch (e) {}
    }
    // Edge glow reaction: map treble to edge glow (keeps geometry intact)
    try{
      const lc = this.app.logoCube;
      if(lc && typeof lc.setEdgeGlow === 'function') lc.setEdgeGlow(Math.min(1, (b.treble||0) * 1.6));
    }catch(e){}
  }

  _onBeat() {
    // small pulse
    this._local.beatPulse = 1.0;
    // if logoCube exposes pulseVoxel, call it
    try {
      const lc = this.app.logoCube;
      if (lc && typeof lc.pulseVoxel === 'function') {
        const idx = Math.floor(Math.random() * (lc.voxels ? lc.voxels.length : 19));
        lc.pulseVoxel(idx, 1.2);
      }
    } catch (e) {}
    // trigger particle burst on beat
    const p = (this.app && this.app.particles) || (typeof window !== 'undefined' && window.app && window.app.particles) || null;
    if (p && typeof p.burst === 'function') {
      const bass = (this._lastBands && this._lastBands.bass) || 0;
      const strength = 0.8 + Math.min(1, bass) * 2.0;
      try { p.burst(strength); } catch (e) {}
    }
  }

  _tick() {
    // smooth cube scale
    const l = this._local;
    l.cubeScale += (l.targetCubeScale - l.cubeScale) * 0.12;
    // beatPulse decay
    l.beatPulse *= 0.85;

    // apply to logoCube
    try {
      const lc = this.app.logoCube;
      if (lc) {
        // if logoCube is a Group or Object3D
        if (lc.scale) {
          const pulse = 1 + l.beatPulse * 0.12;
          const s = l.cubeScale * pulse;
          lc.scale.set(s, s, s);
        } else if (typeof lc.setScale === 'function') {
          lc.setScale(l.cubeScale);
        }
      }
    } catch (e) {}

    this._raf = requestAnimationFrame(()=>this._tick());
  }

  dispose() {
    this._stop();
  }
}

export default Visuals;
