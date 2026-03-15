Agent C — Particles, UI & PWA (owner)

Purpose
- Implement particles, settings UI, presets, keyboard shortcuts and PWA manifest/service-worker.

Files owned
- `js/particles.js`
- `js/controls.js`
- `manifest.json`
- `sw.js`
- `js/README-ui.md`

Status (editable)
- Last updated by:
- Status: not-started / in-progress / blocked / ready-for-review / done

Checklist (edit as you complete items)
- [ ] Create particle system with `setIntensity()` and `burst()` APIs.
- [ ] Build settings panel with render-mode, bloom slider, particles toggle, and presets saved to `localStorage`.
- [ ] Implement keyboard shortcuts and screenshot recording stub.
- [ ] Add `manifest.json` and `sw.js`; register SW in `js/app.js`.

Integration notes
- Subscribe to `AudioEngine.onBands` and `onBeat` (provided by Agent B) to drive particle intensity and burst.
- Use `window.app.logoCube.setRenderMode()` to switch render modes.

Handoff
- Branch: `feature/agentC-ui-pwa`
- PR template: `PRs/agentC-ui-pwa.md`