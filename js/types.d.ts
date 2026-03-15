// Type declarations / integration contracts (reference only)

export interface Bands { bass: number; mid: number; treble: number; overall: number; }
export type BeatCallback = (time: number) => void;
export type BandsCallback = (bands: Bands, rawFreq: Uint8Array) => void;

export class AudioEngine {
  constructor(options?: { smoothing?: number; fftSize?: number });
  initOnGesture(triggerElement: HTMLElement): Promise<void>;
  startDemo(): Promise<void>;
  connectMediaElement(audioEl: HTMLAudioElement): void;
  connectMicrophone(stream: MediaStream): void;
  start(): void;
  stop(): void;
  getBands(): Bands;
  onBeat(cb: BeatCallback): () => void;
  onBands(cb: BandsCallback): () => void;
  setSensitivity(s: number): void;
}

export type RenderMode = 'neon' | 'solid' | 'hybrid';

export interface VoxelRef { mesh: any; edges: any; position: { x:number;y:number;z:number }; index: number; }

export class LogoCube {
  readonly group: any;
  readonly voxels: VoxelRef[];
  constructor(opts?: { voxelSize?: number; gap?: number });
  setScale(s: number): void;
  pulseVoxel(index: number, strength: number): void;
  setRenderMode(mode: RenderMode): void;
  setEdgeColors(colors: { primary: string; accent1: string; accent2: string; accent3: string }): void;
}

export interface SceneAPI {
  init(canvas: HTMLCanvasElement): void;
  start(): void;
  onUpdate(cb: (dt: number, t: number) => void): () => void;
  logoCube: LogoCube;
  composer?: any;
  bloomPass?: { strength: number; radius: number; threshold: number };
  camera: any;
}

export class Particles {
  constructor(scene: any, opts?: { count?: number });
  setIntensity(v: number): void;
  burst(strength?: number): void;
  setColor(hex: string): void;
  dispose(): void;
}

export class ControlsUI {
  constructor(opts?: { container?: HTMLElement });
  open(): void;
  close(): void;
  onPresetSelect(cb: (presetName: string) => void): () => void;
  onRenderModeChange(cb: (mode: RenderMode) => void): () => void;
  saveToLocalStorage(): void;
  loadFromLocalStorage(): void;
}
