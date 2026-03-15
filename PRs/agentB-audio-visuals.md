PR: Implement AudioEngine + Visual Mapping

Branch: `feature/agentB-audio-visuals`

Summary
- Adds `js/audio.js` (AudioEngine) and `js/visuals.js` (audio→visual mapping).

Files expected
- `js/audio.js` (new)
- `js/visuals.js` (new)
- `js/README-audio.md` (adds manual test steps)

Checklist
- [ ] `AudioEngine` supports mic, file upload, and demo mode.
- [ ] AnalyserNode configured as: `fftSize=2048`, `smoothingTimeConstant=0.8`, `minDecibels=-90`, `maxDecibels=-10`.
- [ ] `onBands` and `onBeat` events implemented and documented.
- [ ] `visuals.js` maps bands to `LogoCube.setScale`, `LogoCube.pulseVoxel`, and `sceneAPI.bloomPass`.
- [ ] Short manual test steps in `js/README-audio.md`.

How to test
1. Open `index.html`.
2. Click Start/Play to enable audio.
3. Click Demo — cube should breathe and bloom; beats cause voxel pulses.

Reviewers
- Agent A for API verification (`window.app.sceneAPI` / `window.app.logoCube`).
- Agent C for particle integration hooks.

Suggested commits
- feat(audio): add AudioEngine with demo/mic/file sources
- feat(visuals): audio→visual mapping (bloom, cube pulse)

Notes for integrators
- Use `AudioEngine.onBands(cb)` for per-frame mapping and `onBeat(cb)` for beat-driven pulses.
- Return an unsubscribe from event registrations to avoid leaks.