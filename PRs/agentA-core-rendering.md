PR: Core Rendering — T-Cube, Scene, and Boot

Branch: `feature/agentA-core-rendering`

Summary
- Implements Phase 1: `index.html`, `css/main.css`, `js/utils.js`, `js/logo-geometry.js`, `js/scene.js`, `js/app.js`.

Files expected
- `index.html` (entry + canvas + UI shell)
- `css/main.css` (basic styles)
- `js/utils.js` (helpers)
- `js/logo-geometry.js` (LogoCube class)
- `js/scene.js` (Three.js setup + composer + bloom)
- `js/app.js` (bootstrap + SW registration stub)

Checklist
- [ ] `LogoCube` builds 19 voxels and exposes `group` and `voxels[]`.
- [ ] Scene initializes renderer, camera, `OrbitControls`, bloom pipeline.
- [ ] `window.app.sceneAPI` and `window.app.logoCube` are exposed for integrators.
- [ ] Minimal UI: start button to enable audio, gear icon to open future settings.

How to test
1. Open `index.html` served locally.
2. Cube should be visible, centered, auto-rotating, with neon-like bloom.

Suggested commits
- feat(core): add scene + logo geometry + basic styles

Notes
- Keep public API stable: `window.app.sceneAPI`, `window.app.logoCube`.
- Other agents must not change these contracts without coordinating.