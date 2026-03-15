Agent B — Audio & Visuals (owner)

Purpose
- Implement `AudioEngine` and `visuals.js` to drive the scene with audio data.

Files owned
- `js/audio.js`
- `js/visuals.js`
- `js/README-audio.md`

Status (editable)
- Last updated by:
- Status: not-started / in-progress / blocked / ready-for-review / done

Checklist (edit as you complete items)
- [ ] Implement `AudioEngine` with mic, file upload, and demo modes.
- [ ] Configure `AnalyserNode` with `fftSize=2048`, smoothing, decibel range.
- [ ] Implement band extraction (bass/mid/treble) and smoothing.
- [ ] Implement beat detection (running average × threshold) and `onBeat` event.
- [ ] Implement `visuals.js` to map bands -> `LogoCube.setScale`, `LogoCube.pulseVoxel`, and `sceneAPI.bloomPass`.

Integration notes
- Use `window.app.sceneAPI` and `window.app.logoCube` provided by Agent A.
- Register events with `onBands` and `onBeat`; return unsubscribe fns.
- Add a short `js/README-audio.md` describing manual tests.

Handoff
- Branch: `feature/agentB-audio-visuals`
- PR template: `PRs/agentB-audio-visuals.md`