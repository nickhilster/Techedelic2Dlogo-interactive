export function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
export function lerp(a,b,t){ return a + (b-a)*t; }
export function mapRange(v, inMin, inMax, outMin, outMax){ return outMin + (outMax-outMin) * ((v-inMin)/(inMax-inMin)); }
export function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
export function debounce(fn, wait=100){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }
