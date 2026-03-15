# Agent: Specialist — Audio & Neon Polish

Role: single specialist responsible for implementing the Audio Stabilization and Neon Lighting workstream from `PLANS/SPECIALIST_AGENT.md`.

Scope
- Prevent mic feedback and implement robust source switching
- Add neon edge-glow visuals mapped to audio bands (treble/mid) without changing geometry
- Expose tuning controls and presets for smoothing, sensitivity, and glow
- Add tests, deployment previews, and documentation for handoff

Deliverables
- Working PRs that implement each task in the issue list
- Passing smoke tests (headless smoke tests in `tests/`) on preview deployments
- Updated `PLANS/SPECIALIST_AGENT.md` with parameter defaults and verification steps
- A short developer README section with local test steps and acceptance criteria

Branching & Workflow
- Branch name: `work/specialist/audio-neon-polish`
- Create small focused PRs (one feature or bug per PR). Use the `PR_TEMPLATE.md` checklist (if present).
- Tag PRs with labels: `needs-review`, `qa`, `design`, `blocking` as appropriate.

Access & Notes
- Requires: repo push access, Vercel preview access, Git LFS quota.
- Tests: the repo already includes `tools/capture_deploy.js` and Puppeteer scripts — use these for smoke verification.

Acceptance Criteria (must be met before merge)
- No audible microphone feedback by default; monitor toggle works and persists in session
- Edge glow reacts to treble smoothly (no flicker) and is configurable via presets
- Controls panel implemented with save/load presets to `localStorage`
- Service worker does not block deploy previews or updates during development

Estimated time: 5–8 business days (see `PLANS/SPECIALIST_AGENT.md` for breakdown)

Contact: add your name and set yourself as assignee for the generated issues.

---
Created from `PLANS/SPECIALIST_AGENT.md` to onboard the specialist.
