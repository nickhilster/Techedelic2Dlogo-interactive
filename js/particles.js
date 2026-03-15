// Simple particle system for Techedelic PWA
// Exports `Particles` with APIs: `setIntensity(value)`, `burst()`, `update(dt)`
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export default class Particles {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.count = options.count || 800;
    this.radiusMin = options.radiusMin || 3;
    this.radiusMax = options.radiusMax || 8;
    this.intensity = 1.0;
    this.velocities = new Float32Array(this.count * 3);

    const positions = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const r = this.radiusMin + Math.random() * (this.radiusMax - this.radiusMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      const idx = i * 3;
      positions[idx] = x; positions[idx + 1] = y; positions[idx + 2] = z;

      // small random initial velocity
      this.velocities[idx] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 2] = (Math.random() - 0.5) * 0.02;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: options.size || 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this._tmpPositions = positions;
  }

  setIntensity(v) {
    this.intensity = Math.max(0, v);
    this.material.opacity = 0.4 + Math.min(1, this.intensity) * 0.6;
    this.material.size = 0.04 + Math.min(1.5, 0.5 + this.intensity * 1.5) * 0.04;
  }

  burst(strength = 1.0) {
    // push particles outward from origin
    const positions = this.geometry.getAttribute('position').array;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = positions[idx], y = positions[idx + 1], z = positions[idx + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
      this.velocities[idx] += (x / len) * 0.05 * strength;
      this.velocities[idx + 1] += (y / len) * 0.05 * strength;
      this.velocities[idx + 2] += (z / len) * 0.05 * strength;
    }
  }

  update(dt) {
    const positions = this.geometry.getAttribute('position');
    const arr = positions.array;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      // apply velocity scaled by intensity
      arr[idx] += this.velocities[idx] * dt * 60 * this.intensity;
      arr[idx + 1] += this.velocities[idx + 1] * dt * 60 * this.intensity;
      arr[idx + 2] += this.velocities[idx + 2] * dt * 60 * this.intensity;

      // gentle damping
      this.velocities[idx] *= 0.995;
      this.velocities[idx + 1] *= 0.995;
      this.velocities[idx + 2] *= 0.995;

      // simple bounds: if too far, pull back slowly
      const x = arr[idx], y = arr[idx + 1], z = arr[idx + 2];
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > this.radiusMax * 1.6) {
        arr[idx] *= 0.98; arr[idx + 1] *= 0.98; arr[idx + 2] *= 0.98;
      }
    }
    positions.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
