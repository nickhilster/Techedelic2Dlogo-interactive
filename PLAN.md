# Techedelic Interactive Audio-Reactive PWA — Implementation Plan

## Context

The Techedelic logo is a 3D isometric cube where each of the 4 side faces displays a "T" letter formed by voxel blocks. The stylized version (techedelic_cover_alt.jpg) renders this as glowing neon edges (white, cyan, magenta, yellow) on a black background — the perfect foundation for an audio-reactive visualizer. This PWA will serve as an interactive brand piece for the Techedelic electronic music project.

**Reference images in repo:**
- `techedelic01.png` — solid 3D render on white background (teal + magenta faces)
- `techedelic_cover.jpg` — solid 3D render on black background
- `techedelic_cover_alt.jpg` — neon wireframe/glow version on black (PRIMARY visual target)

---

## Logo Geometry — The 19-Voxel T-Cube

The cube is a 3x3x3 grid where specific voxels are filled to create a "T" on each side face. Coordinate system: (x, y, z) each ranging 0–2, y=2 is top.

```
Top layer (y=2) — full 3x3 = 9 blocks:
  (0,2,0) (1,2,0) (2,2,0)
  (0,2,1) (1,2,1) (2,2,1)
  (0,2,2) (1,2,2) (2,2,2)

Middle layer (y=1) — cross/plus = 5 blocks:
           (1,1,0)
  (0,1,1)  (1,1,1)  (2,1,1)
           (1,1,2)

Bottom layer (y=0) — cross/plus = 5 blocks:
           (1,0,0)
  (0,0,1)  (1,0,1)  (2,0,1)
           (1,0,2)

TOTAL: 19 voxels
```

**Verification — each side face shows a T:**
- Front face (z=0): y=2 row has 3 blocks (crossbar), y=1 and y=0 have center only (stem) ✓
- Right face (x=2): y=2 row has 3 blocks, y=1 and y=0 have center only ✓
- Back face (z=2): same pattern ✓
- Left face (x=0): same pattern ✓
- Top face (y=2): full 3×3 square (structural)
- Bottom face (y=0): plus/cross (structural)

---

## Tech Stack

- **Three.js** via CDN ES module imports (no build tools needed)
- **Web Audio API** for frequency analysis + beat detection
- **Vanilla JavaScript** modules — clean, zero-dependency architecture
- **PWA** with service worker + manifest for installability/offline

### Why this stack:
- Single-page visual experience, not a data-driven app — no framework needed
- Three.js provides exact primitives: BoxGeometry, EdgesGeometry, UnrealBloomPass
- CDN imports with ES modules are natively supported in all modern browsers
- Zero build step = faster iteration, service worker caches CDN for offline
- Can migrate to Vite/bundler later if needed

---

## Project Structure

```
Techedelic2Dlogo_interactive/
├── index.html              — Entry point: canvas + UI overlay + PWA meta tags
├── manifest.json           — PWA manifest (app name, icons, theme, display mode)
├── sw.js                   — Service worker (cache-first + CDN pre-caching)
├── PLAN.md                 — This file
│
├── css/
│   └── main.css            — All styles: canvas, settings panel, controls, responsive
│
├── js/
│   ├── app.js              — Bootstrap: imports modules, registers SW, starts loop
│   ├── logo-geometry.js    — 19-voxel T-cube: box meshes + edge lines
│   ├── scene.js            — Three.js: renderer, camera, OrbitControls, bloom pipeline
│   ├── audio.js            — Web Audio API: analyser, frequency bands, beat detection
│   ├── visuals.js          — Audio→visual mapping: drives all reactive parameters
│   ├── controls.js         — UI: settings panel, presets, sliders, localStorage
│   ├── particles.js        — GPU particle system (THREE.Points + custom shader)
│   └── utils.js            — Helpers: color conversion, easing, lerp, debounce
│
├── assets/
│   ├── icons/              — PWA icons (192, 512, maskable variants)
│   ├── audio/
│   │   └── demo-loop.mp3   — Short electronic loop for demo mode
│   ├── techedelic01.png           — (existing) reference
│   ├── techedelic_cover.jpg       — (existing) reference
│   └── techedelic_cover_alt.jpg   — (existing) reference
│
└── screenshots/            — PWA install screenshots (wide + narrow)
```

**Note:** Move existing image files into `assets/` during implementation.

---

## Three.js CDN Imports

Use ES module imports from jsdelivr, pinned to a specific version:

```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/ShaderPass.js';
```

HTML entry: `<script type="module" src="js/app.js"></script>`

---

## Detailed Module Specifications

### `js/logo-geometry.js` — T-Cube Construction

```javascript
// Core data structure
const VOXEL_MAP = [
  // y=2 (top) — full 3x3
  [0,2,0],[1,2,0],[2,2,0],[0,2,1],[1,2,1],[2,2,1],[0,2,2],[1,2,2],[2,2,2],
  // y=1 (middle) — cross
  [1,1,0],[0,1,1],[1,1,1],[2,1,1],[1,1,2],
  // y=0 (bottom) — cross
  [1,0,0],[0,0,1],[1,0,1],[2,0,1],[1,0,2],
];
```

**Construction approach:**
1. Create a `THREE.Group` called `logoCube`
2. For each voxel position:
   - Create `BoxGeometry(1, 1, 1)` scaled to ~0.95 (slight gap between voxels)
   - Create solid mesh with dark, semi-transparent `MeshStandardMaterial`
   - Create edge lines via `EdgesGeometry` → `LineSegments` with `LineBasicMaterial`
   - Position at `(x-1, y-1, z-1)` to center cube at origin
3. Store per-voxel references in array for individual animation:

```javascript
class LogoCube {
  constructor() {
    this.group = new THREE.Group();
    this.voxels = []; // Array of { mesh, edges, position, baseScale }
  }
}
```

**Face-aware coloring for solid mode:**
- BoxGeometry face order: +x, -x, +y, -y, +z, -z
- Use material array: teal for right/top/front-facing, magenta for left/bottom/back-facing

**Edge coloring for neon mode:**
- Primary: white (#ffffff)
- Accent edges colored cyan (#00ffff), magenta (#ff00ff), yellow (#ffff00) based on face direction

### `js/scene.js` — Three.js Scene

```javascript
// Renderer
renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for mobile perf
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// Camera — isometric-ish angle matching reference images
camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
camera.position.set(4, 3, 4);

// OrbitControls
controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.minDistance = 3;
controls.maxDistance = 15;

// Post-processing
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
bloomPass = new UnrealBloomPass(resolution, 1.5, 0.4, 0.85); // strength, radius, threshold
composer.addPass(bloomPass);

// Lighting (for solid mode)
ambientLight = new THREE.AmbientLight(0x222222);
directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
pointLight1 = new THREE.PointLight(CYAN, 1, 20);  // positioned to left
pointLight2 = new THREE.PointLight(MAGENTA, 1, 20); // positioned to right
```

### `js/audio.js` — Web Audio Engine

```javascript
class AudioEngine {
  context;          // AudioContext (created on user gesture)
  analyser;         // AnalyserNode
  source;           // MediaStreamSource or MediaElementSource
  frequencyData;    // Uint8Array(1024) for frequency domain
  timeDomainData;   // Uint8Array(1024) for waveform
  bands = { bass: 0, mid: 0, treble: 0, overall: 0 };
  smoothing = { bass: 0, mid: 0, treble: 0 };
  beatDetected = false;
}
```

**Audio sources (3 modes):**
1. **Microphone:** `getUserMedia({ audio: true })` → `createMediaStreamSource()`
2. **File upload:** `<input type="file" accept="audio/*">` → `<audio>` element → `createMediaElementSource()`
3. **Demo:** bundled MP3 loop, loaded same as file upload

**AnalyserNode config:** fftSize=2048, smoothingTimeConstant=0.8, minDecibels=-90, maxDecibels=-10

**Frequency bands** (1024 bins at 44.1kHz, ~21.5Hz/bin):
- Bass: bins 0–14 (0–300Hz)
- Mid: bins 14–140 (300–3000Hz)
- Treble: bins 140–512 (3000–11000Hz)

**Beat detection:** Compare instantaneous bass energy to running average. If current > average × threshold (1.4), beat detected. Decay average over time (0.98).

**Smoothing:** EMA — `smoothed = smoothed * 0.85 + raw * 0.15`

### `js/visuals.js` — Audio→Visual Mapping

The animation loop reads audio data and applies transformations:

| Audio Band | Visual Effect | Range |
|---|---|---|
| Bass | Cube scale (breathing) | 1.0 – 1.15 |
| Bass | Bloom strength | 1.0 – 3.0 |
| Bass beat | Voxel "pop" pulse (random selection) | 1.0 – 1.3, decays |
| Bass beat | Subtle camera shake | 0 – 0.02 units |
| Mid | Auto-rotation speed | 0.2 – 2.0 |
| Mid | Edge color hue shift | 0 – 360° |
| Mid | Point light intensity | 0.5 – 2.0 |
| Treble | Edge line opacity/glow | 0.5 – 1.0 |
| Treble | Particle speed & density | 1× – 3× base |
| Treble | Voxel gap (breathing apart) | 0.95 – 0.85 scale |
| Overall | Background brightness | 0.0 – 0.05 |

### `js/particles.js` — Background Particles

- `THREE.Points` with `BufferGeometry`, ~800 particles
- Custom vertex/fragment shaders for glow effect
- Distributed in sphere around cube (radius 3–8)
- Drift slowly, accelerate with treble energy
- Burst outward on beat detection
- Color follows current accent palette

### `js/controls.js` — UI & Presets

**UI layout:**
```
+-------------------------------------------+
|  [canvas — fullscreen viewport]            |
|                                   [⚙ gear] |  ← opens settings panel
|                                            |
|              [T-CUBE LOGO]                 |
|                                            |
|  [🎤] [📁] [▶ demo]                       |  ← bottom-left audio source
|  [render mode toggle]                      |
+-------------------------------------------+
```

**Settings panel (slides from right):**
- Audio: source selector, sensitivity slider
- Visuals: render mode (Neon/Solid/Hybrid), bloom slider, glow slider, particles toggle
- Colors: primary + 3 accent color pickers
- Motion: auto-rotate toggle, speed slider, audio-driven rotation toggle
- Presets: 4 buttons + Custom + Reset
- Record: screenshot button, video record start/stop

**Keyboard shortcuts:**
- `Space` — toggle audio play/pause
- `R` — toggle auto-rotation
- `M` — cycle render modes
- `P` — cycle presets
- `F` — fullscreen toggle
- `S` — screenshot
- `1-4` — quick-select presets
- `Esc` — close settings panel

### `js/utils.js` — Shared Helpers

- Color: hex↔THREE.Color, HSL manipulation
- Math: lerp, clamp, mapRange
- Easing: easeOutCubic, easeInOutQuad
- Timing: debounce, throttle
- Device: GPU capability detection (for performance scaling)

---

## Presets

Each preset is a JSON object defining all visual parameters:

```javascript
const PRESETS = {
  synthwave: {
    name: 'Synthwave',
    mode: 'neon',
    colors: { primary: '#ffffff', accent1: '#00ffff', accent2: '#ff00ff', accent3: '#ffff00' },
    bloom: { strength: 2.0, radius: 0.4, threshold: 0.8 },
    particles: true,
    background: '#000000',
    autoRotate: true,
    rotateSpeed: 0.5,
    sensitivity: 1.0,
  },
  cyberpunk: {
    name: 'Cyberpunk',
    mode: 'hybrid',
    colors: { primary: '#ff0040', accent1: '#00ff88', accent2: '#ffaa00', accent3: '#0088ff' },
    bloom: { strength: 2.5, radius: 0.6, threshold: 0.7 },
    particles: true,
    background: '#0a0014',
    autoRotate: true,
    rotateSpeed: 1.0,
    sensitivity: 1.2,
  },
  minimal: {
    name: 'Minimal',
    mode: 'neon',
    colors: { primary: '#ffffff', accent1: '#ffffff', accent2: '#888888', accent3: '#444444' },
    bloom: { strength: 1.0, radius: 0.3, threshold: 0.9 },
    particles: false,
    background: '#000000',
    autoRotate: true,
    rotateSpeed: 0.3,
    sensitivity: 0.8,
  },
  vaporwave: {
    name: 'Vaporwave',
    mode: 'solid',
    colors: { primary: '#ff71ce', accent1: '#01cdfe', accent2: '#05ffa1', accent3: '#b967ff' },
    bloom: { strength: 1.5, radius: 0.5, threshold: 0.85 },
    particles: true,
    background: '#1a0030',
    autoRotate: true,
    rotateSpeed: 0.4,
    sensitivity: 1.0,
  },
};
```

All settings persisted to `localStorage`.

---

## Render Modes

### 1. Neon Wireframe (default — matches techedelic_cover_alt.jpg)
- Box faces: nearly black, slightly transparent `MeshStandardMaterial`
- Edges: bright `LineBasicMaterial` with emissive colors (white + accent colors by face direction)
- Bloom: heavy (strength 1.5–3.0)
- Particles: enabled

### 2. Solid 3D (matches techedelic01.png / techedelic_cover.jpg)
- Box faces: opaque teal (#008080) and magenta (#C2185B) `MeshStandardMaterial`, face-direction dependent
- Edges: subtle white highlight lines
- Bloom: moderate (strength 0.5–1.0)
- Lighting: ambient + directional + colored point lights

### 3. Hybrid
- Box faces: semi-transparent with teal/magenta tint
- Edges: glowing neon lines
- Both solid coloring and neon glow combined
- Maximum visual impact

---

## PWA Configuration

### `manifest.json`
```json
{
  "name": "Techedelic Interactive Logo",
  "short_name": "Techedelic",
  "description": "Audio-reactive 3D logo visualizer for the Techedelic electronic music brand",
  "start_url": "/index.html",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#000000",
  "theme_color": "#008080",
  "icons": [...],
  "categories": ["music", "entertainment"]
}
```

### `sw.js` — Service Worker
- **Strategy:** Cache-first for local static assets, stale-while-revalidate for CDN
- **Install:** Pre-cache all local files + all CDN Three.js module URLs
- **Fetch:** Serve from cache first, fall back to network
- Versioned cache name (`techedelic-v1`) for easy updates

### Icons
- Generate from `techedelic01.png`: 192×192, 512×512
- Maskable variants with 20% safe-zone padding

---

## Implementation Phases

### Phase 1 — Core Rendering (get the cube on screen)
**Files:** `index.html`, `css/main.css`, `js/utils.js`, `js/logo-geometry.js`, `js/scene.js`, `js/app.js`

1. Create minimal HTML with fullscreen canvas
2. Build the 19-voxel T-cube with box meshes + edge lines
3. Set up Three.js scene: renderer, camera, OrbitControls, bloom pipeline
4. Wire it up: cube auto-rotating with neon glow on black background
5. **Milestone:** Cube renders and rotates, matching the neon cover_alt aesthetic

### Phase 2 — Audio Reactivity (make it react to music)
**Files:** `js/audio.js`, `js/visuals.js` (update `js/app.js`)

1. Build AudioEngine class with mic/file/demo source management
2. Implement frequency band extraction and beat detection
3. Create the audio→visual mapping loop
4. Add audio source buttons to the UI (mic, file upload, demo)
5. Handle iOS/mobile audio context restrictions (user gesture requirement)
6. **Milestone:** Cube reacts to music — breathing, glowing, rotating

### Phase 3 — Polish (make it beautiful)
**Files:** `js/particles.js` (update `js/visuals.js`, `js/scene.js`)

1. Build GPU particle system with audio-reactive behavior
2. Implement accent edge coloring (different colors per face direction)
3. Add render mode switching (neon/solid/hybrid)
4. Fine-tune all audio→visual parameters for best feel
5. Add idle animation (gentle breathing when no audio)
6. **Milestone:** Full visual experience with particles, 3 render modes

### Phase 4 — Controls & Presets (make it interactive)
**Files:** `js/controls.js` (update `css/main.css`)

1. Build collapsible settings panel with all controls
2. Implement preset system (4 presets + custom)
3. Add localStorage persistence
4. Wire up keyboard shortcuts
5. Ensure settings panel doesn't interfere with OrbitControls
6. **Milestone:** Full UI with presets, all settings adjustable

### Phase 5 — PWA (make it installable)
**Files:** `manifest.json`, `sw.js` (update `index.html`, `js/app.js`)

1. Create manifest.json with proper metadata
2. Build service worker with cache-first strategy
3. Generate PWA icons from logo
4. Register service worker in app.js
5. Add PWA meta tags to HTML
6. **Milestone:** App installable on desktop/mobile, works offline

### Phase 6 — Enhancements (stretch goals, in priority order)
1. **Screenshot + video recording** — canvas.toDataURL for images, MediaRecorder + captureStream for video
2. **Assembly animation** — voxels fly in from random positions on first visit
3. **Gyroscope rotation** — DeviceOrientationEvent on mobile (with iOS permission handling)
4. **Ambient/screensaver mode** — Perlin noise generating fake audio data, slowly cycles presets
5. **Shareable presets via URL** — `?preset=cyberpunk&bloom=2.5`
6. **MIDI input** — Web MIDI API, map knobs/faders to visual parameters (for live VJ)
7. **Performance auto-detection** — reduce bloom/particles on weak GPUs
8. **BPM detection** — beat-locked rotations and color changes on bar boundaries

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Individual voxels (not merged geometry) | 19 boxes = 38 draw calls, well within budget. Enables per-voxel audio reactions (scale, displacement, color) |
| EdgesGeometry + LineSegments | Auto-extracts sharp edges, bloom makes them glow. Use Line2/LineMaterial if lines too thin on HiDPI |
| Energy-based beat detection | Simple, effective for electronic music. Spectral flux can be added later |
| CDN imports (not npm) | Zero build step, service worker caches for offline, can migrate to bundler later |
| localStorage for settings | Simple, synchronous, sufficient for preset/preference persistence |

---

## Potential Challenges & Mitigations

| Challenge | Mitigation |
|---|---|
| Bloom too bright on mobile | Cap bloom strength; detect via renderer.capabilities or screen size |
| iOS audio restrictions | Create AudioContext inside user gesture handler; show "Tap to start" overlay |
| iOS gyroscope permissions | Call DeviceOrientationEvent.requestPermission() from click handler |
| High DPI thin lines | Switch to Line2 + LineMaterial (fat lines) if default lines too thin |
| OrbitControls vs UI conflicts | stopPropagation on settings panel touch/mouse events |
| CDN versioning | Pin exact Three.js version in import URLs and cache name; update together |
| Audio file memory | Use MediaElement (streams) not decodeAudioData (loads entire file) |

---

## Verification Checklist

1. [ ] Open `index.html` in browser — cube renders with neon glow, auto-rotates
2. [ ] Click mic button — grant permission — cube reacts to ambient sound
3. [ ] Upload an audio file — visualizer responds to music
4. [ ] Toggle demo mode — built-in loop plays, cube reacts
5. [ ] Open settings panel — adjust sliders, switch presets, change colors
6. [ ] Switch all 3 render modes — each looks correct
7. [ ] Test on mobile — touch rotation works, UI is responsive
8. [ ] Install as PWA — app icon appears, works offline after first load
9. [ ] Test keyboard shortcuts (Space, R, M, P, F, S, 1-4, Esc)
10. [ ] Reload page — settings persist from localStorage
