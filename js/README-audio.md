# Audio module — manual tests

Quick tests to validate the `AudioEngine` implementation locally:

1. Open `index.html` in a browser served from a local server (avoid file://).
2. In the console, create and start the engine:

```javascript
import AudioEngine from './js/audio.js';
const engine = new AudioEngine({ demoUrl: 'assets/audio/demo-loop.mp3' });
await engine.startOnUserGesture();
await engine.startDemo();
const unsub = engine.onBands(b => console.log('bands', b));
const unsubBeat = engine.onBeat(() => console.log('beat'));
```

3. Try `engine.startMic()` to test microphone input (browser will request permission).
4. Test file input by calling `engine.startFromFile(file)` with a `File` from an `<input>` element.
5. Verify that `onBands` callbacks receive `{ bass, mid, treble, raw, beat }` and that `onBeat` fires on strong bass transients.

Notes:
- iOS Safari requires a user gesture to create/resume `AudioContext`.
- The demo URL should point to `assets/audio/demo-loop.mp3` if present; replace with your own loop if needed.
Audio quick test

Purpose
- Quick manual verification steps for the `AudioEngine` and `visuals` mapping.

How to test
1. Open `index.html` in a browser (serve via simple HTTP server to avoid CORS issues).
2. Click the app Start/Play button to allow `AudioContext` (required on iOS/Chrome).
3. Click the Demo audio button. Expected behavior:
   - Cube breathes (global scale changes) synced to bass energy.
   - Bloom strength increases with bass.
   - On strong beats, random voxels should "pulse" (visible scale or pop).

Public API (integration contract)
- `AudioEngine.onBands(cb)` → `cb(bands, rawFreq)` fires each analysis frame. `bands` are normalized [0..1].
- `AudioEngine.onBeat(cb)` → `cb(time)` fires once per detected beat.

Quick console checks
```js
// If `audioInstance` is the running AudioEngine
audioInstance.onBands(b => console.log('bands', b));
audioInstance.onBeat(t => console.log('beat at', t));
```

Notes
- AnalyserNode config: `fftSize=2048`, `smoothingTimeConstant=0.8`, `minDecibels=-90`, `maxDecibels=-10`.
- Bands mapping used by visuals: bass (0-300Hz), mid (300-3000Hz), treble (3000-11000Hz).

Files added in this PR should include a short test checklist and indicate the branch used.