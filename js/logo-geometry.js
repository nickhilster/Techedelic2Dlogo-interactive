import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const VOXEL_MAP = [
  // y=2 top (full 3x3)
  [0,2,0],[1,2,0],[2,2,0],[0,2,1],[1,2,1],[2,2,1],[0,2,2],[1,2,2],[2,2,2],
  // y=1 middle cross
  [1,1,0],[0,1,1],[1,1,1],[2,1,1],[1,1,2],
  // y=0 bottom cross
  [1,0,0],[0,0,1],[1,0,1],[2,0,1],[1,0,2]
];

export class LogoCube {
  constructor(opts={voxelSize:1,gap:0.95}){
    this.group = new THREE.Group();
    this.voxels = [];
    this.pulseStates = new Map();
    this.baseScale = opts.voxelSize || 1;

    const geo = new THREE.BoxGeometry(opts.gap, opts.gap, opts.gap);
    const darkMat = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.1, roughness:0.5 });
    const edgeMat = new THREE.LineBasicMaterial({ color:0xffffff, linewidth:2 });

    VOXEL_MAP.forEach((p, i)=>{
      const [x,y,z] = p;
      const mesh = new THREE.Mesh(geo, darkMat.clone());
      mesh.position.set(x-1, y-1, z-1);
      mesh.userData.index = i;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone());
      edges.position.copy(mesh.position);
      this.group.add(mesh);
      this.group.add(edges);
      this.voxels.push({ mesh, edges, position: mesh.position.clone(), index: i });
      this.pulseStates.set(i, { t:0, strength:0 });
    });

    this._renderMode = 'neon';
  }

  update(dt){
    // animate pulses decay
    this.voxels.forEach(v=>{
      const state = this.pulseStates.get(v.index);
      if(state.strength>0){
        state.t += dt;
        const decay = Math.max(0, state.strength - state.t * 2.5);
        const s = 1 + decay * 0.25;
        v.mesh.scale.setScalar(s);
        v.edges.scale.setScalar(s);
        if(decay<=0){ state.strength=0; state.t=0; v.mesh.scale.setScalar(1); v.edges.scale.setScalar(1); }
      }
    });
  }

  setScale(s){ this.group.scale.setScalar(s); }

  pulseVoxel(index, strength=1.2){
    const state = this.pulseStates.get(index);
    if(state){ state.strength = Math.max(state.strength, strength); state.t = 0; }
  }

  setRenderMode(mode){ this._renderMode = mode; /* minimal: switch material transparency */
    this.voxels.forEach(v=>{
      if(mode==='neon'){
        v.mesh.material.transparent = true; v.mesh.material.opacity = 0.06; v.mesh.material.color.set(0x050505);
        // edges are colored via setEdgeColors; keep bright
        // leave existing edge color
      } else if(mode==='solid'){
        v.mesh.material.transparent = false; v.mesh.material.opacity = 1.0;
        // color faces by X side for quick visual
        if(v.position.x > 0) v.mesh.material.color.set(0x008080); else v.mesh.material.color.set(0xC2185B);
        v.edges.material.color.set(0xdddddd);
      } else {
        v.mesh.material.transparent = true; v.mesh.material.opacity = 0.45;
        v.edges.material.color.set(0xffffff);
      }
    });
  }

  setEdgeColors(colors={primary:'#ffffff'}){
    // colors: { primary, accent1, accent2, accent3 }
    this.voxels.forEach(v=>{
      const x = v.position.x; const z = v.position.z;
      let c = colors.primary || '#ffffff';
      if(Math.abs(x) >= Math.abs(z)){
        c = x > 0 ? (colors.accent1 || c) : (colors.accent2 || c);
      } else {
        c = z > 0 ? (colors.accent3 || c) : (colors.primary || c);
      }
      try{ v.edges.material.color.set(c); }catch(e){ v.edges.material.color.set(0xffffff); }
    });
  }
}

export default LogoCube;
