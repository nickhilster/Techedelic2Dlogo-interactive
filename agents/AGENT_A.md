Agent A — Core Rendering (owner)

Purpose
- Primary implementer for Phase 1: scene, `LogoCube`, basic UI shell, and public API contracts.

Files owned
- `index.html`
- `css/main.css`
- `js/utils.js`
- `js/logo-geometry.js`
- `js/scene.js`
- `js/app.js`

Status (editable)
- Last updated by: 
- Status: in-progress / blocked / ready-for-review / done

Checklist (edit as you complete items)
- [ ] Build 19-voxel `LogoCube` and expose `window.app.logoCube`.
- [ ] Initialize Three.js scene, camera, `OrbitControls`, and bloom pipeline.
- [ ] Expose `window.app.sceneAPI` with `bloomPass` and `onUpdate(cb)`.
- [ ] Add Start/Play button for user gesture (AudioContext) and Demo button stub.
- [ ] Add minimal CSS for canvas and gear icon.

Notes for handoff
- Keep API backward-compatible. If you must change a signature, update `agents/AGENT_B.md` and `agents/AGENT_C.md` and notify reviewers.
- When ready, push branch `feature/agentA-core-rendering` and open PR with `PRs/agentA-core-rendering.md`.
