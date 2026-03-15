# Specialist Agent Handoff Plan — Audio + Neon Polish

Owner: Specialist Agent (single owner)
Goal: Fix audio routing (no mic feedback), improve neon lighting reaction, refine audio-reactivity polish, and deliver controls + presets for users. Deliverable includes code changes, tests, and a handoff README.

Milestones

1) Audio Stabilization (Priority)
- Task A: Prevent mic feedback
  - Ensure microphone input is not directly connected to audio output by default.
  - Implement `monitorGain` node; default monitor off for mic; monitor on for demo/file playback.
  - Add `enableMonitor(bool)` public API on `AudioEngine` and wire UI `Mic`/`Demo`/`Upload` toggles appropriately.
  - Ensure switching sources (mic/demo/file) cleans up previous `MediaStream` or `Audio` element and unsubscribes from nodes.
  - Add tests: automated browser smoke tests that verify mic stream not routed to destination unless monitor enabled (manual verification may be required for hardware).
- Task B: Robust toggling
  - Add UI state machine: `idle -> mic -> demo -> file` with consistent start/stop behavior.
  - Prevent race conditions when starting/stopping multiple sources quickly.

2) Neon Lighting (Design + Implementation)
- Task A: Light API
  - Add API to `LogoCube`: `setEdgeGlow(amount)` and `setEdgeColors({})` (already partially implemented).
  - Keep geometry and interactions unchanged.
- Task B: Visual mapping
  - Map treble and mid frequencies to neon glow, chroma shift, and bloom intensity.
  - Add configurable curves and smoothing for glow (to avoid flicker).
  - Add presets ("Subtle", "Punchy", "Dream") controlling thresholds and curves.

3) Polish Audio-Reactives
- Task A: Parameter tuning
  - Expose smoothing alpha, running average alpha, bounce/backoff, and beat threshold in UI.
  - Add per-band gains for bass/mid/treble normalization.
- Task B: Particle + Glow coordination
  - Sync particle bursts with beat strength and edge glow with treble peaks.
  - Add subtle delay and easing for bloom and particles to make visuals cohesive.

4) Controls & Presets
- Task A: UI panel
  - Add a panel containing: source selection (Mic/Demo/File), sensitivity, smoothing, monitor toggle, render mode, and preset dropdown.
  - Save presets to `localStorage` with export/import JSON capability.
- Task B: Accessibility/Shortcuts
  - Add keyboard shortcuts for play/pause, cycle mode, mute monitor.

5) Testing & Deployment
- Task A: Automated Tests
  - Add headless browser tests for smoke (scripts in `tests/`) and a visual regression step for the canvas (optional).
- Task B: Deployment
  - Harden service worker to network-first for dev and cache-first for production assets; include cache-busting during deploy.

Handoff Checklist
- PR with focused commits per task
- README section: `Specialist Handoff` containing:
  - Dev steps to run locally
  - Tests to run
  - Design notes on neon behavior and parameter defaults
  - Known limitations and manual verification steps for mic hardware

Timeline Estimate (single specialist)
- Audio Stabilization: 1-2 days
- Neon Lighting: 1-2 days
- Polish & Controls: 2-3 days
- Tests & Deployment polish: 1 day

Total: ~5-8 business days for a polished MVP

Files to update during work
- `js/audio.js` — routing, monitor, cleanup, public API
- `js/visuals.js` — mappings and smoothing
- `js/logo-geometry.js` — `setEdgeGlow` API
- `js/app.js` — UI wiring + presets
- `css/main.css` — controls panel
- `tests/*` — smoke and behavior tests

Notes
- Keep geometry/interaction code untouched; only visual/material changes are allowed for neon effects.
- Keep the audio context resumed only on user gesture for demo/record permissions.
- Ensure service worker updates will not block users from seeing new deployments.

---
Saved: automatic plan for handoff to a single specialist agent.
