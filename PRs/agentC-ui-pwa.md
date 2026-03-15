PR: Add Particles, Controls UI, and PWA

Branch: `feature/agentC-ui-pwa`

Summary
- Adds `js/particles.js`, `js/controls.js`, `manifest.json`, `sw.js`, and UI wiring.

Files expected
- `js/particles.js` (new)
- `js/controls.js` (new)
- `manifest.json` (new)
- `sw.js` (new)
- `assets/icons/*` (icons — include placeholders if generation not possible)
- `js/README-ui.md` (manual test steps)

Checklist
- [ ] Particles system (`Particles`) implemented (`setIntensity()` + `burst()`).
- [ ] Settings panel with render-mode toggle, bloom slider, particle toggle, presets saved to `localStorage`.
- [ ] Keyboard shortcuts: `Space`, `R`, `M`, `P`, `F`, `S`, `1-4`, `Esc`.
- [ ] `manifest.json` added and `sw.js` registered in `js/app.js`.
- [ ] Manual test steps in `js/README-ui.md`.

How to test
1. Open `index.html`.
2. Open settings: toggle particles, change preset, reload — settings persist.
3. Start Demo audio — particles should respond and burst on beats.
4. Verify `navigator.serviceWorker` registration in DevTools.

Reviewers
- Agent A for API consistency (`window.app.logoCube` contract).
- Agent B for audio→particles hookup.

Suggested commits
- feat(particles): add GPU particle system and API
- feat(ui): add controls panel, presets, keyboard shortcuts
- feat(pwa): add manifest and service worker; register in `js/app.js`