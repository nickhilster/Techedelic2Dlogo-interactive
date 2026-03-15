# Specialist Issue List — Audio & Neon Polish

This file enumerates focused issues split from `PLANS/SPECIALIST_AGENT.md`. Create GitHub issues from each section and assign to the specialist.

## Audio Stabilization

- A1 — Prevent mic feedback
  - Ensure mic input is not routed to output by default. Implement `monitorGain` and default monitor off.
  - Add `enableMonitor(bool)` API.

- A2 — Robust source switching
  - Implement state machine `idle -> mic -> demo -> file`.
  - Ensure cleanup of previous `MediaStream` or `Audio` element when switching.

- A3 — Toggle & UI wiring
  - Add monitor toggle to UI and ensure it updates `AudioEngine`.
  - Persist last source in session (not localStorage) so toggles reflect current state.

## Neon Lighting

- V1 — Edge glow API
  - Finalize `LogoCube.setEdgeGlow(amount)` smoothing and clamps.

- V2 — Visual mapping
  - Map `treble` -> edge glow, `mid` -> bloom strength. Add smoothing to avoid flicker.

- V3 — Presets
  - Implement presets (Subtle, Punchy, Dream) and a preset picker in controls.

## Polish Audio-Reactives

- P1 — Tuning controls
  - Expose smoothing alpha, runningAvgAlpha, beatThreshold, and per-band gain.

- P2 — Particle sync
  - Coordinate particle bursts with beat strength and edge glow with treble peaks.

## Controls & Presets

- UI1 — Controls panel skeleton
  - Create the UI panel and wire up controls to `AudioEngine` and `Visuals`.

- UI2 — Preset save/load
  - Save presets to `localStorage`, add import/export as JSON.

## Tests & Deployment

- T1 — Headless smoke tests
  - Add CI job to run `tools/capture_deploy.js` against Vercel preview and fail on console errors.

- T2 — Manual QA checklist
  - Document steps for human verification (mic/no-feedback, toggle flows, presets).

---
When ready, create GitHub issues from these items and link them to the main parent issue `work/specialist/audio-neon-polish`.
