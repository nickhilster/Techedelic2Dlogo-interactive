UI + PWA quick test

Purpose
- Manual verification steps for the settings UI, presets persistence, particles integration, and PWA registration.

How to test
1. Open `index.html`.
2. Open the settings panel (gear). Actions to try:
   - Toggle particles on/off.
   - Change render mode (neon / solid / hybrid).
   - Adjust bloom slider and save a preset.
   - Reload page — settings should persist from `localStorage`.
3. Start Demo audio: particles should respond to treble bands and burst on beat.
4. Verify service worker registration in DevTools: `navigator.serviceWorker.controller` or check `Application` → `Service Workers`.

Public hooks expected
- `window.app.logoCube.setRenderMode(mode)` — set cube render mode.
- `window.app.particles` — optional; supports `setIntensity()` and `burst()`.
- Controls UI should dispatch preset change and render-mode change events (see `js/types.d.ts`).

Console checks
```js
// verify particles exist
if (window.app && window.app.particles) console.log('particles ready');
// test preset persistence
// (open UI, change preset, reload, then verify settings are applied)
```

Notes
- If icons are not yet added, include placeholder sprites in `assets/icons/` so `manifest.json` references valid files.
- Service worker script should adopt a cache-first strategy for local assets and stale-while-revalidate for CDN imports.