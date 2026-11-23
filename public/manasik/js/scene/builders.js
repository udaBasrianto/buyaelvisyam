/* eslint-disable */
/**
 * builders.js — Geometri prosedural Masjid al-Haram + kawasan manasik
 * (Mina / Jamarat, Muzdalifah, Arafah).
 *
 * Semua geometri ditulis ke "bucket" per-mode & per-material lalu di-merge
 * menjadi beberapa mesh besar agar ringan (draw call sedikit).
 */
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;

/* ============================================================================
 * Konstanta tata letak (meter, sumbu Z = atas)
 * ========================================================================== */
export const KAABA = { w: 12.6, d: 11.0, h: 12.6 };

/** Radius lintasan tawaf (di dalam mataf, di luar Ka'bah). */
export const TAWAF_RADIUS = 20;
/** Sudut mulai tawaf: sudut tenggara Ka'bah (Hajar Aswad). */
export const TAWAF_START_ANGLE = -0.72;

export const SAFA = new THREE.Vector3(131, -74, 0);
export const MARWAH = new THREE.Vector3(96, 298, 0);

export const ZONES = {
  haram: { center: new THREE.Vector3(0, 0, 0) },
  mina: { center: new THREE.Vector3(1080, 60, 0) },
  muzdalifah: { center: new THREE.Vector3(1800, 60, 0) },
  arafah: { center: new THREE.Vector3(2500, 60, 0) }
};

export const JAMARAT = [
  { id: 'sughra', name: 'Jamrat al-Sughra (Ula)', short: 'Sughra', pos: new THREE.Vector3(1000, 60, 0) },
  { id: 'wustha', name: 'Jamrat al-Wustha', short: 'Wustha', pos: new THREE.Vector3(1080, 60, 0) },
  { id: 'aqabah', name: 'Jamrat al-Aqabah (Kubra)', short: 'Aqabah', pos: new THREE.Vector3(1160, 60, 0) }
];

/* ============================================================================
 * Palet & material
 * ========================================================================== */
const PALETTE_DEFS = {
  plaza:        { hex: '#d7d3c8', rough: 0.90, metal: 0.00 },
  vault:        { hex: '#9aa8ad', rough: 0.38, metal: 0.35 },
  sky:          { hex: '#4b88c8', rough: 0.16, metal: 0.25, emissive: '#1f5aa0' },
  black:        { hex: '#121617', rough: 0.72, metal: 0.04 },
  floor1:       { hex: '#f5f9fc', rough: 0.18, metal: 0.08 },
  floor2:       { hex: '#d4e3ed', rough: 0.22, metal: 0.08 },
  floor3:       { hex: '#bdd4e2', rough: 0.24, metal: 0.08 },
  white:        { hex: '#fbfaf4', rough: 0.40, metal: 0.02 },
  sand:         { hex: '#e9dfc2', rough: 0.80, metal: 0.00 },
  cream:        { hex: '#dfd3b8', rough: 0.72, metal: 0.00 },
  light:        { hex: '#f2ece1', rough: 0.55, metal: 0.05 },
  dark:         { hex: '#2c3237', rough: 0.65, metal: 0.10 },
  terracotta:   { hex: '#c86446', rough: 0.45, metal: 0.12 },
  tile:         { hex: '#d8cfc0', rough: 0.50, metal: 0.10 },
  glass:        { hex: '#284b63', rough: 0.15, metal: 0.60 },
  gold:         { hex: '#f5c64c', rough: 0.18, metal: 0.92, emissive: '#5c3e06' },
  silver:       { hex: '#f0f4f9', rough: 0.12, metal: 0.96 },
  carpet_green: { hex: '#145a43', rough: 0.85, metal: 0.00 },
  carpet_red:   { hex: '#882426', rough: 0.85, metal: 0.00 },
  rose_marble:  { hex: '#d8b4a6', rough: 0.25, metal: 0.10 },
  teak_wood:    { hex: '#522915', rough: 0.40, metal: 0.10 },
  safa_rock:    { hex: '#5c5346', rough: 0.92, metal: 0.02 },
  green_mile:   { hex: '#22c55e', rough: 0.15, metal: 0.10, emissive: '#16a34a' },
  tawaf_line:   { hex: '#10b981', rough: 0.15, metal: 0.10, emissive: '#059669' },
  chandelier:   { hex: '#fef08a', rough: 0.15, metal: 0.60, emissive: '#f59e0b' },
  clock_face:   { hex: '#4ade80', rough: 0.15, metal: 0.20, emissive: '#16a34a' },

  /* kawasan manasik */
  ground:       { hex: '#d6c5a1', rough: 0.96, metal: 0.00 },
  rock:         { hex: '#7d6d58', rough: 0.95, metal: 0.02 },
  tent:         { hex: '#f6f3ea', rough: 0.70, metal: 0.00 },
  tent_shade:   { hex: '#ded8c8', rough: 0.70, metal: 0.00 },
  asphalt:      { hex: '#4c4a46', rough: 0.95, metal: 0.00 },
  jamrah:       { hex: '#d9d2c2', rough: 0.70, metal: 0.05 },
  foliage:      { hex: '#4e6b45', rough: 0.85, metal: 0.00 },
  lamp:         { hex: '#fff3c4', rough: 0.30, metal: 0.30, emissive: '#f5c542' }
};

export const MATERIALS = {};
for (const [name, def] of Object.entries(PALETTE_DEFS)) {
  MATERIALS[name] = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.hex),
    roughness: def.rough,
    metalness: def.metal,
    emissive: def.emissive ? new THREE.Color(def.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: def.emissive ? 0.45 : 0,
    side: THREE.DoubleSide
  });
}

/* ============================================================================
 * Utilitas matematika / transformasi
 * ========================================================================== */
function place(x, y, z = 0, yaw = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  const t = new THREE.Matrix4().makeTranslation(x, y, z);
  const r = new THREE.Matrix4().makeRotationZ(yaw);
  const s = new THREE.Matrix4().makeScale(sx, sy, sz);
  return m.multiplyMatrices(t, r).multiply(s);
}

function facingYaw(fx, fy) {
  return Math.atan2(fx, -fy);
}

export function unit(x, y) {
  const n = Math.hypot(x, y) || 1;
  return [x / n, y / n];
}

function polar(r, deg, cx = 0, cy = 0) {
  const a = THREE.MathUtils.degToRad(deg);
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

function octagon(radius, rotation = Math.PI / 8) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    pts.push([
      radius * Math.cos(rotation + (i * TAU) / 8),
      radius * Math.sin(rotation + (i * TAU) / 8)
    ]);
  }
  return pts;
}

/* Seeded RNG supaya layout kawasan selalu sama. */
function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * Builder: menampung geometri per mode & material
 * ========================================================================== */
class Builder {
  constructor() {
    this.buckets = new Map(); // mode -> Map(mat -> geometry[])
    this.mode = 'main';
    this.xf = null;
  }

  _bucket(mat) {
    if (!this.buckets.has(this.mode)) this.buckets.set(this.mode, new Map());
    const m = this.buckets.get(this.mode);
    if (!m.has(mat)) m.set(mat, []);
    return m.get(mat);
  }

  addGeom(geom, matName) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    if (g.attributes.uv) g.deleteAttribute('uv');
    if (this.xf) g.applyMatrix4(this.xf);
    g.computeVertexNormals();
    this._bucket(matName).push(g);
  }

  box(w, d, z0, z1, matName, center = [0, 0]) {
    const h = z1 - z0;
    const g = new THREE.BoxGeometry(w, d, h);
    g.translate(center[0], center[1], z0 + h / 2);
    this.addGeom(g, matName);
  }

  cylinder(rBottom, rTop, z0, z1, sides = 16, matName = 'light', offset = [0, 0], smooth = false) {
    const h = z1 - z0;
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, sides, 1, false);
    g.rotateX(Math.PI / 2);
    g.translate(offset[0], offset[1], z0 + h / 2);
    this.addGeom(g, matName);
    return g;
  }

  addQuadsAndTris(verts, faces, matName) {
    const positions = [];
    for (const f of faces) {
      if (f.length === 3) {
        positions.push(...verts[f[0]], ...verts[f[1]], ...verts[f[2]]);
      } else {
        positions.push(...verts[f[0]], ...verts[f[1]], ...verts[f[2]]);
        positions.push(...verts[f[0]], ...verts[f[2]], ...verts[f[3]]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.addGeom(g, matName);
  }
}

/* ============================================================================
 * Primitif arsitektur
 * ========================================================================== */
function extrude(b, pts, z0, z1, top = 'sand', side = 'cream') {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();

  const topGeom = new THREE.ShapeGeometry(shape).toNonIndexed();
  topGeom.translate(0, 0, z1);
  topGeom.computeVertexNormals();
  b.addGeom(topGeom, top);

  const verts = [], faces = [], n = pts.length;
  for (let i = 0; i < n; i++) verts.push([pts[i][0], pts[i][1], z0]);
  for (let i = 0; i < n; i++) verts.push([pts[i][0], pts[i][1], z1]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, n + j, n + i]);
  }
  b.addQuadsAndTris(verts, faces, side);
}

function ringSlab(b, outer, inner, z0, z1, top = 'sand', side = 'cream') {
  const n = outer.length;
  const topVerts = [], topFaces = [];
  for (let i = 0; i < n; i++) topVerts.push([outer[i][0], outer[i][1], z1]);
  for (let i = 0; i < n; i++) topVerts.push([inner[i][0], inner[i][1], z1]);
  for (let i = 0; i < n; i++) topFaces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
  b.addQuadsAndTris(topVerts, topFaces, top);

  const sideVerts = [], sideFaces = [];
  for (let i = 0; i < n; i++) sideVerts.push([outer[i][0], outer[i][1], z1]);
  for (let i = 0; i < n; i++) sideVerts.push([inner[i][0], inner[i][1], z1]);
  for (let i = 0; i < n; i++) sideVerts.push([outer[i][0], outer[i][1], z0]);
  for (let i = 0; i < n; i++) sideVerts.push([inner[i][0], inner[i][1], z0]);

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sideFaces.push([2 * n + i, 2 * n + j, j, i]);
    sideFaces.push([n + j, n + i, 3 * n + i, 3 * n + j]);
  }
  b.addQuadsAndTris(sideVerts, sideFaces, side);
}

function hemisphere(b, cx, cy, z0, r, mat = 'terracotta', segs = 20, rings = 8, squash = 1.0) {
  const verts = [], faces = [];
  for (let j = 0; j <= rings; j++) {
    const phi = (j / rings) * (Math.PI / 2);
    const rr = r * Math.cos(phi);
    const zz = r * Math.sin(phi) * squash;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU;
      verts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z0 + zz]);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const k = (i + 1) % segs;
      const rowCurr = j * segs;
      const rowNext = (j + 1) * segs;
      if (j === rings - 1) faces.push([rowCurr + i, rowCurr + k, rowNext]);
      else faces.push([rowCurr + i, rowCurr + k, rowNext + k, rowNext + i]);
    }
  }
  b.addQuadsAndTris(verts, faces, mat);
}

function domeWithDrum(b, cx, cy, z0, r, drum = 5.0, mat = 'terracotta') {
  b.cylinder(r * 1.05, r * 1.05, z0, z0 + 0.6, 16, 'light', [cx, cy]);
  b.cylinder(r, r, z0 + 0.6, z0 + drum, 16, 'tile', [cx, cy]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    b.xf = place(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98, z0 + 1.4, a - Math.PI / 2);
    b.box(1.6, 0.3, 0, 2.8, 'glass');
  }
  b.xf = null;
  b.cylinder(r * 1.08, r * 1.08, z0 + drum, z0 + drum + 0.5, 16, 'light', [cx, cy]);
  hemisphere(b, cx, cy, z0 + drum + 0.5, r, mat, 20, 8, 0.95);
  b.cylinder(0.18, 0.08, z0 + drum + 0.5 + r * 0.95, z0 + drum + r * 0.95 + 3.6, 8, 'gold', [cx, cy]);
}

function skylight(b, x, y, z, size = 9.0, yaw = 0.0) {
  b.xf = place(x, y, z, yaw);
  b.box(size + 1.6, size + 1.6, 0, 0.6, 'light');
  b.box(size, size, 0.6, 1.0, 'sky');
  b.box(0.35, size + 0.6, 0.9, 1.25, 'white');
  b.box(size + 0.6, 0.35, 0.9, 1.25, 'white');
  b.xf = null;
}

function minaretInto(b) {
  b.box(6.2, 6.2, 0, 18.5, 'cream');
  b.box(6.6, 6.6, 18.5, 20.0, 'light');
  b.cylinder(2.9, 2.75, 20.0, 48.0, 8, 'cream');
  b.cylinder(2.8, 3.6, 48.0, 50.2, 12, 'light');
  b.cylinder(3.6, 3.6, 50.2, 51.8, 12, 'white');
  b.cylinder(2.45, 2.3, 51.8, 72.0, 12, 'cream');
  b.cylinder(2.5, 2.5, 60.0, 61.2, 12, 'tile');
  b.cylinder(2.3, 3.2, 72.0, 73.8, 12, 'light');
  b.cylinder(3.2, 3.2, 73.8, 75.2, 12, 'white');
  b.cylinder(1.85, 1.85, 75.2, 82.5, 12, 'glass');
  b.cylinder(2.05, 2.05, 82.5, 83.4, 12, 'light');
  b.cylinder(1.75, 0.45, 83.4, 90.0, 12, 'white');
  b.cylinder(0.18, 0.06, 90.0, 95.5, 8, 'gold');
  b.cylinder(0.75, 0.75, 93.2, 93.5, 8, 'gold');
}

function arcadeBay(b, width = 7.4) {
  b.box(width, 1.2, 0, 0.5, 'light', [0, -0.2]);
  for (const sx of [-1, 1]) b.box(0.9, 1.1, 0.5, 21.4, 'light', [sx * (width / 2 - 0.45), -0.1]);
  const tiers = [
    [0.5, 4.6, 3.6, 0.5],
    [7.3, 4.4, 3.0, 0.45],
    [14.0, 5.2, 4.4, 0.45]
  ];
  for (const [z0, w, spring, depth] of tiers) {
    b.box(w + 0.5, 0.3, z0, z0 + spring + 1.5, 'light', [0, -0.05]);
    b.box(w, depth, z0 + 0.1, z0 + spring + 1.2, 'dark', [0, -0.2]);
  }
  for (const z of [6.4, 13.2]) {
    b.box(width, 1.3, z, z + 0.55, 'white', [0, -0.3]);
    b.box(width - 1.2, 0.2, z + 0.55, z + 1.6, 'cream', [0, -0.15]);
  }
  b.box(width, 1.5, 21.0, 21.9, 'cream', [0, -0.3]);
  b.box(width + 0.2, 1.8, 21.9, 22.4, 'light', [0, -0.4]);
}

function bayInto(b, width = 7.4) {
  b.box(width, 0.9, 0, 1.6, 'tile', [0, -0.15]);
  for (const sx of [-1, 1]) b.box(0.85, 0.95, 1.6, 21.2, 'light', [sx * (width / 2 - 0.42), -0.15]);
  b.box(width - 1.8, 0.45, 2.2, 9.2, 'dark', [0, -0.22]);
  b.box(width - 1.8, 0.45, 11.4, 18.8, 'dark', [0, -0.22]);
  b.box(width, 1.1, 10.0, 10.8, 'white', [0, -0.25]);
  b.box(width + 0.2, 1.4, 21.2, 22.2, 'light', [0, -0.35]);
}

function runFacade(b, p0, p1, z = 0, sz = 1, width = 7.4, module = null, outward = true) {
  const modFn = module || bayInto;
  const [tx, ty] = unit(p1[0] - p0[0], p1[1] - p0[1]);
  const face = outward ? [ty, -tx] : [-ty, tx];
  const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const count = Math.max(1, Math.round(length / width));
  const step = length / count;
  const yaw = facingYaw(face[0], face[1]);

  const prevMode = b.mode;
  b.mode = 'facade';
  for (let i = 0; i < count; i++) {
    const cx = p0[0] + tx * (i + 0.5) * step;
    const cy = p0[1] + ty * (i + 0.5) * step;
    b.xf = place(cx, cy, z, yaw, step / width, 1, sz);
    modFn(b, width);
  }
  b.xf = null;
  b.mode = prevMode;
}

function interiorColumn(b, x, y, z0, z1, r = 0.65) {
  b.cylinder(r * 1.35, r * 1.35, z0, z0 + 0.8, 12, 'gold', [x, y]);
  b.cylinder(r, r, z0 + 0.8, z1 - 0.9, 12, 'white', [x, y]);
  b.cylinder(r, r * 1.45, z1 - 0.9, z1, 12, 'gold', [x, y]);
}

function wallBetween(b, p0, p1, z0, z1, thick, mat) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  b.xf = place((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, z0, Math.atan2(dy, dx));
  b.box(len, thick, 0, z1 - z0, mat);
  b.xf = null;
}

function chandelierInto(b, x, y, zTop, drop = 3.2, radius = 1.4) {
  b.cylinder(0.06, 0.06, zTop - drop, zTop, 6, 'gold', [x, y]);
  b.cylinder(radius, radius * 0.85, zTop - drop, zTop - drop + 0.45, 12, 'chandelier', [x, y]);
  b.cylinder(radius * 0.55, radius * 0.55, zTop - drop - 0.4, zTop - drop, 10, 'chandelier', [x, y]);
}

/* ============================================================================
 * MASJID AL-HARAM
 * ========================================================================== */
function buildHaram(b) {
  /* --- plaza & mataf --- */
  extrude(b, [[-640, -480], [640, -480], [640, 640], [-640, 640]], -0.8, 0.0, 'plaza', 'plaza');

  const matFloor = ['floor1', 'floor2', 'floor3'];
  let ringIdx = 0;
  for (let r = 60; r > 12; r -= 4) {
    b.cylinder(r, r, 0, 0.02 + ringIdx * 0.006, 32, matFloor[ringIdx % 3], [0, 0], false);
    ringIdx++;
  }
  b.cylinder(15.5, 15.5, 0, 0.55, 40, 'white', [0, 0]);
  b.cylinder(16.4, 16.4, 0, 0.25, 40, 'light', [0, 0]);

  /* --- Ka'bah: syadzarwan, kiswah & hizam, pintu, Hajar Aswad, atap, mizab --- */
  b.mode = 'main';

  // Syadzarwan: marmer putih di kaki Ka'bah
  b.box(13.4, 11.8, 0.55, 0.85, 'white');
  b.box(13.2, 11.6, 0.85, 0.92, 'light');

  // Pita kiswah: dasar + goresan kaligrafi (tanpa tekstur, disusun dari blok)
  const decorBand = (z0, z1, baseMat, tickMat, tickH, step) => {
    b.box(12.72, 11.12, z0, z1, baseMat);
    const zc = (z0 + z1) / 2;
    for (let x = -5.9; x <= 5.9; x += step) {
      b.box(0.09, 0.05, zc - tickH / 2, zc + tickH / 2, tickMat, [x, 5.57]);
      b.box(0.09, 0.05, zc - tickH / 2, zc + tickH / 2, tickMat, [x, -5.57]);
    }
    for (let y = -5.0; y <= 5.0; y += step) {
      b.box(0.05, 0.09, zc - tickH / 2, zc + tickH / 2, tickMat, [6.37, y]);
      b.box(0.05, 0.09, zc - tickH / 2, zc + tickH / 2, tickMat, [-6.37, y]);
    }
  };

  decorBand(8.85, 9.60, 'gold', 'dark', 0.27, 0.78);      // hizam
  decorBand(11.25, 11.78, 'black', 'gold', 0.24, 0.55);   // sulaman kaligrafi atas

  // Pintu Ka'bah di dinding timur (menghadap Maqam Ibrahim)
  b.box(0.5, 3.7, 1.80, 2.15, 'white', [6.5, -1.3]);
  b.box(0.12, 3.5, 2.15, 7.05, 'gold', [6.34, -1.3]);
  b.box(0.05, 3.0, 2.55, 6.65, 'gold', [6.42, -1.3]);
  b.box(0.06, 0.10, 2.70, 6.50, 'dark', [6.45, -2.15]);
  b.box(0.06, 0.10, 2.70, 6.50, 'dark', [6.45, -0.45]);
  b.box(0.14, 0.55, 6.35, 7.05, 'gold', [6.36, -1.3]);
  b.box(0.07, 0.18, 4.30, 4.48, 'dark', [6.47, -0.15]);

  // Hajar Aswad: bingkai perak yang membungkus sudut tenggara
  b.box(0.34, 1.30, 1.05, 2.05, 'silver', [6.38, -4.65]);
  b.box(0.36, 0.75, 1.30, 1.80, 'black', [6.42, -4.65]);
  b.box(1.30, 0.34, 1.05, 2.05, 'silver', [5.75, -5.58]);
  b.box(0.75, 0.36, 1.30, 1.80, 'black', [5.75, -5.62]);

  // Atap: pelat marmer + parapet (rata dengan dinding, tanpa overhang)
  b.mode = 'roof';
  b.box(12.5, 10.9, 13.0, 13.12, 'tile');
  b.box(12.84, 0.24, 13.12, 13.42, 'light', [0, 5.38]);
  b.box(12.84, 0.24, 13.12, 13.42, 'light', [0, -5.38]);
  b.box(0.24, 10.76, 13.12, 13.42, 'light', [6.18, 0]);
  b.box(0.24, 10.76, 13.12, 13.42, 'light', [-6.18, 0]);

  // Mizab al-Rahmah: talang emas menonjol di dinding utara
  b.box(2.0, 0.24, 12.55, 13.0, 'gold', [0, 5.58]);        // pelat penopang
  b.box(0.95, 2.8, 12.90, 13.20, 'gold', [0, 6.95]);       // badan talang
  b.box(1.15, 0.26, 13.16, 13.42, 'gold', [0, 8.20]);      // bibir talang
  b.cylinder(0.24, 0.24, 12.20, 13.0, 10, 'gold', [0, 8.20]); // pipa turun

  b.mode = 'main';

  /* --- bangunan lingkar 3 lantai --- */
  const ringIn = octagon(60.0), ringOut = octagon(98.0);
  b.mode = 'roof';
  ringSlab(b, ringOut, ringIn, 0, 22.0, 'sand', 'cream');
  b.mode = 'main';

  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    runFacade(b, ringIn[j], ringIn[i], 0, 1.0, 7.4, arcadeBay, true);
    runFacade(b, ringOut[i], ringOut[j], 0, 0.86);
  }

  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * TAU) / 8;
    for (const off of [-5, 5]) {
      const ax = Math.cos(a) * 99, ay = Math.sin(a) * 99;
      const tx = -Math.sin(a), ty = Math.cos(a);
      b.xf = place(ax + tx * off, ay + ty * off);
      minaretInto(b);
      b.xf = null;
    }
  }

  /* --- ekspansi utara (King Abdullah) --- */
  const rIn = 112.0, rOut = 232.0, a0 = 18.0, a1 = 162.0, height = 26.0, steps = 18;
  const outerArc = [], innerArc = [];
  for (let k = 0; k <= steps; k++) {
    outerArc.push(polar(rOut, a0 + ((a1 - a0) * k) / steps));
    innerArc.push(polar(rIn, a1 - ((a1 - a0) * k) / steps));
  }
  b.mode = 'roof';
  extrude(b, [...outerArc, ...innerArc], 0, height, 'sand', 'cream');
  b.mode = 'main';

  for (let k = 0; k < steps; k++) {
    runFacade(b, outerArc[k], outerArc[k + 1], 0, 1.0);
    runFacade(b, innerArc[k], innerArc[k + 1], 0, 0.95, 7.4, arcadeBay);
  }

  b.mode = 'roof';
  for (const r of [136, 164, 196]) {
    const stepDeg = r < 150 ? 12 : r < 180 ? 9 : 8;
    for (let deg = 30; deg < 151; deg += stepDeg) {
      const [x, y] = polar(r, deg);
      skylight(b, x, y, height, 9.0, THREE.MathUtils.degToRad(deg - 90));
    }
  }
  const [dcx, dcy] = polar(170, 90);
  domeWithDrum(b, dcx, dcy, height, 13.0, 7.0);
  b.mode = 'main';

  const fanMinarets = [
    [a0 + 3, rIn + 6], [a1 - 3, rIn + 6],
    [a0 + 3, rOut - 6], [a1 - 3, rOut - 6],
    [84, 176], [96, 176]
  ];
  for (const [deg, r] of fanMinarets) {
    for (const off of [-6, 6]) {
      const [x, y] = polar(r, deg);
      const rad = THREE.MathUtils.degToRad(deg);
      const tx = -Math.sin(rad), ty = Math.cos(rad);
      b.xf = place(x + tx * off, y + ty * off);
      minaretInto(b);
      b.xf = null;
    }
  }

  /* --- koridor & blok sayap radial --- */
  for (const deg of [18, 54, 90, 126, 162]) {
    const a = THREE.MathUtils.degToRad(deg);
    const ux = Math.cos(a), uy = Math.sin(a);
    const nx = -uy, ny = ux;
    const start = rOut - 2, vaultLen = 110.0, armLen = 170.0, w = 13.0;
    const end = start + armLen;
    const arm = [
      [ux * start - nx * w, uy * start - ny * w],
      [ux * end - nx * w, uy * end - ny * w],
      [ux * end + nx * w, uy * end + ny * w],
      [ux * start + nx * w, uy * start + ny * w]
    ];
    extrude(b, arm, 0, 13.0, 'sand', 'cream');
    runFacade(b, arm[0], arm[1], 0, 0.5);
    runFacade(b, arm[2], arm[3], 0, 0.5);

    const vaultEnd = start + vaultLen, stepsV = 8, profile = [];
    for (let s = 0; s <= stepsV; s++) {
      profile.push([
        Math.cos((Math.PI * s) / stepsV) * w * 0.96,
        13.0 + Math.sin((Math.PI * s) / stepsV) * 5.0
      ]);
    }
    const vVerts = [], vFaces = [];
    for (const dist of [start, vaultEnd]) {
      for (const [px, pz] of profile) vVerts.push([ux * dist + nx * px, uy * dist + ny * px, pz]);
    }
    const rowLen = stepsV + 1;
    for (let s = 0; s < stepsV; s++) vFaces.push([s, s + 1, rowLen + s + 1, rowLen + s]);
    b.addQuadsAndTris(vVerts, vFaces, 'vault');

    const bw = 26.0, bl = 56.0, bh = 22.0, c = end + bl / 2;
    const block = [
      [ux * (c - bl / 2) - nx * bw, uy * (c - bl / 2) - ny * bw],
      [ux * (c + bl / 2) - nx * bw, uy * (c + bl / 2) - ny * bw],
      [ux * (c + bl / 2) + nx * bw, uy * (c + bl / 2) + ny * bw],
      [ux * (c - bl / 2) + nx * bw, uy * (c - bl / 2) + ny * bw]
    ];
    extrude(b, block, 0, bh, 'sand', 'cream');
    for (let k = 0; k < 4; k++) runFacade(b, block[k], block[(k + 1) % 4], 0, 0.84);
  }

  /* --- teras barat --- */
  const terrace = [
    [-122, 126], [-205, 158], [-285, 112],
    [-300, 20], [-232, -62], [-118, -82]
  ].reverse();
  b.mode = 'roof';
  extrude(b, terrace, 0, 14.0, 'sand', 'cream');
  b.mode = 'main';
  for (let k = 0; k < terrace.length; k++) {
    runFacade(b, terrace[k], terrace[(k + 1) % terrace.length], 0, 0.5);
  }
  b.mode = 'roof';
  for (const [x, y] of [[-236, 104], [-262, 76], [-210, 128]]) domeWithDrum(b, x, y, 14.0, 9.0, 3.5);
  b.mode = 'main';
  for (const [x, y] of [[-296, 105], [-288, 124], [-295, 8], [-283, -12], [-122, -76], [-122, 120]]) {
    b.xf = place(x, y);
    minaretInto(b);
    b.xf = null;
  }

  /* --- galeri Masa'a (Sa'i) --- */
  const s = [SAFA.x, SAFA.y], n = [MARWAH.x, MARWAH.y];
  const [ux, uy] = unit(n[0] - s[0], n[1] - s[1]);
  const nx = -uy, ny = ux;
  const half = 15.0;
  const midX = (s[0] + n[0]) / 2;
  const midY = (s[1] + n[1]) / 2;
  const mLen = Math.hypot(n[0] - s[0], n[1] - s[1]);
  const mYaw = Math.atan2(uy, ux) - Math.PI / 2;
  const body = [
    [s[0] - ux * 12 - nx * half, s[1] - uy * 12 - ny * half],
    [n[0] + ux * 12 - nx * half, n[1] + uy * 12 - ny * half],
    [n[0] + ux * 12 + nx * half, n[1] + uy * 12 + ny * half],
    [s[0] - ux * 12 + nx * half, s[1] - uy * 12 + ny * half]
  ];
  b.mode = 'main';
  // dinding galeri (rongga di dalam agar sa'i terlihat)
  for (let k = 0; k < 4; k++) {
    wallBetween(b, body[k], body[(k + 1) % 4], 0, 15.0, 1.8, 'cream');
  }
  b.mode = 'roof';
  b.xf = place(midX, midY, 15.0, mYaw);
  b.box(half * 2 + 3.6, mLen + 24, 0, 1.2, 'sand');
  b.xf = null;
  b.mode = 'main';
  for (let k = 0; k < 4; k++) runFacade(b, body[k], body[(k + 1) % 4], 0, 0.62);
  b.mode = 'roof';
  domeWithDrum(b, s[0] + ux * 6, s[1] + uy * 6, 16.2, 11.0, 6.0);
  domeWithDrum(b, n[0] - ux * 6, n[1] - uy * 6, 16.2, 11.0, 6.0);
  b.mode = 'main';

  for (const frac of [0.18, 0.42, 0.64, 0.86]) {
    const px = s[0] + (n[0] - s[0]) * frac, py = s[1] + (n[1] - s[1]) * frac;
    const cx2 = px - nx * (half + 8), cy2 = py - ny * (half + 8);
    const wing = [
      [cx2 - ux * 10 - nx * 8, cy2 - uy * 10 - ny * 8],
      [cx2 + ux * 10 - nx * 8, cy2 + uy * 10 - ny * 8],
      [cx2 + ux * 10 + nx * 8, cy2 + uy * 10 + ny * 8],
      [cx2 - ux * 10 + nx * 8, cy2 - uy * 10 + ny * 8]
    ];
    extrude(b, wing, 0, 20.0, 'sand', 'cream');
    for (let k = 0; k < 4; k++) runFacade(b, wing[k], wing[(k + 1) % 4], 0, 0.76);
  }

  for (const [x, y] of [
    [s[0] + 16, s[1] - 26], [s[0] - 8, s[1] - 28],
    [n[0] + 18, n[1] + 24], [n[0] - 6, n[1] + 28]
  ]) {
    b.xf = place(x, y);
    minaretInto(b);
    b.xf = null;
  }

  buildInterior(b);
  buildFurniture(b);
}

/* -------------------------------------------------------------------------- */
/* Interior: lantai, kolom, lampu, Hijr Ismail, Maqam Ibrahim, garis tawaf     */
/* -------------------------------------------------------------------------- */
function buildInterior(b) {
  const prev = b.mode;
  b.mode = 'interior';

  const kw = KAABA.w, kd = KAABA.d, wt = 0.65;

  // Garis penanda mulai tawaf (sejajar Hajar Aswad)
  b.xf = place(22.0, -20.0, 0.06, Math.atan2(-20, 22));
  b.box(48.0, 0.6, 0, 0.08, 'tawaf_line');
  b.xf = null;

  // Shādzarwān — dasar pondasi marmer putih pelindung Ka'bah
  b.box(kw + 0.9, kd + 0.9, 0.0, 0.62, 'white', [0, 0]);

  // Dinding utama Ka'bah (Kiswah hitam pekat)
  b.box(kw, wt, 0.6, 13.1, 'black', [0, -kd / 2 + wt / 2]);
  b.box(kw, wt, 0.6, 13.1, 'black', [0, kd / 2 - wt / 2]);
  b.box(wt, kd - wt * 2, 0.6, 13.1, 'black', [-kw / 2 + wt / 2, 0]);
  b.box(wt, kd - wt * 2, 0.6, 13.1, 'black', [kw / 2 - wt / 2, 0]);

  // Sabuk Emas Ka'bah (Hizām al-Ka'bah) mengelilingi 4 sisi di ketinggian ~9m
  b.box(kw + 0.08, wt + 0.08, 8.8, 9.65, 'gold', [0, -kd / 2 + wt / 2]);
  b.box(kw + 0.08, wt + 0.08, 8.8, 9.65, 'gold', [0, kd / 2 - wt / 2]);
  b.box(wt + 0.08, kd - wt * 2 + 0.08, 8.8, 9.65, 'gold', [-kw / 2 + wt / 2, 0]);
  b.box(wt + 0.08, kd - wt * 2 + 0.08, 8.8, 9.65, 'gold', [kw / 2 - wt / 2, 0]);

  // Pintu Emas Ka'bah (Bab al-Ka'bah) di sisi timur
  b.box(2.2, 0.18, 2.1, 5.3, 'gold', [2.2, -kd / 2 - 0.06]);
  b.box(2.5, 0.12, 5.3, 6.2, 'gold', [2.2, -kd / 2 - 0.08]); // plang kaligrafi atas pintu

  // Mīzāb ar-Raḥmah (talang air emas) di dinding atas menghadap Hijr Ismail
  b.box(0.55, 1.9, 12.9, 13.25, 'gold', [0, kd / 2 + 0.85]);

  // Bingkai Perak Hajar Aswad di sudut tenggara
  b.cylinder(0.46, 0.42, 1.05, 1.75, 12, 'silver', [kw / 2 - 0.12, -kd / 2 + 0.12]);
  b.cylinder(0.24, 0.24, 1.2, 1.6, 12, 'black', [kw / 2 - 0.12, -kd / 2 + 0.12]);

  // Dinding marmer interior
  b.box(kw - wt * 2, 0.16, 1.2, 5.6, 'rose_marble', [0, -kd / 2 + wt + 0.08]);
  b.box(kw - wt * 2, 0.16, 1.2, 5.6, 'rose_marble', [0, kd / 2 - wt - 0.08]);

  // 3 tiang kayu di dalam Ka'bah
  for (const px of [-3.1, 0, 3.1]) {
    b.cylinder(0.32, 0.32, 1.65, 12.4, 16, 'teak_wood', [px, 0]);
    b.cylinder(0.36, 0.36, 5.5, 5.75, 16, 'gold', [px, 0]);
    b.cylinder(0.36, 0.36, 9.0, 9.25, 16, 'gold', [px, 0]);
  }

  // Hijr Ismail (Hatim) — dinding setengah lingkaran sisi utara
  const hijrR = 6.2, hijrW = 1.15, hijrSteps = 16;
  const hVerts = [], hFaces = [];
  for (let i = 0; i <= hijrSteps; i++) {
    const a = (i / hijrSteps) * Math.PI;
    const cx = Math.cos(a) * hijrR, cy = 6.8 + Math.sin(a) * hijrR;
    const ox = Math.cos(a) * (hijrR + hijrW), oy = 6.8 + Math.sin(a) * (hijrR + hijrW);
    hVerts.push([cx, cy, 0.55], [ox, oy, 0.55], [cx, cy, 1.85], [ox, oy, 1.85]);
  }
  for (let i = 0; i < hijrSteps; i++) {
    // celah masuk di sisi utara (tengah busur)
    if (i >= 7 && i <= 8) continue;
    const b0 = i * 4, b1 = (i + 1) * 4;
    hFaces.push([b0 + 2, b0 + 3, b1 + 3, b1 + 2]);
    hFaces.push([b0 + 1, b1 + 1, b1 + 3, b0 + 3]);
    hFaces.push([b1, b0, b0 + 2, b1 + 2]);
  }
  b.addQuadsAndTris(hVerts, hFaces, 'white');
  b.cylinder(hijrR - 0.2, hijrR - 0.2, 0.55, 0.63, 24, 'white', [0, 6.8]);

  // Maqam Ibrahim
  const mx = 10.5, my = 1.5;
  b.cylinder(1.6, 1.7, 0.2, 0.9, 16, 'white', [mx, my]);
  b.cylinder(1.0, 1.0, 0.9, 2.0, 12, 'gold', [mx, my]);
  hemisphere(b, mx, my, 2.0, 1.0, 'gold', 16, 8, 1.1);
  b.cylinder(0.1, 0.04, 3.05, 3.6, 8, 'gold', [mx, my]);

  // Lantai mataf & karpet
  for (const fz of [0.15, 7.2, 14.0]) {
    const slabIn = octagon(61.2), slabOut = octagon(96.8);
    ringSlab(b, slabOut, slabIn, fz, fz + 0.45, fz === 0.15 ? 'carpet_green' : 'tile', 'light');
    if (fz < 10) {
      const cIn = octagon(64.5), cOut = octagon(93.5);
      ringSlab(b, cOut, cIn, fz + 0.45, fz + 0.52, 'carpet_green', 'carpet_green');
    }
  }

  // Kolom & lampu gantung lantai dasar + 1
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU;
    for (const r of [66, 79, 92]) {
      const cx = Math.cos(a) * r, cy = Math.sin(a) * r;
      interiorColumn(b, cx, cy, 0.5, 7.2, 0.55);
      interiorColumn(b, cx, cy, 7.6, 14.0, 0.50);
    }
    const chx = Math.cos(a) * 79, chy = Math.sin(a) * 79;
    chandelierInto(b, chx, chy, 7.1, 2.0, 1.1);
    chandelierInto(b, chx, chy, 13.9, 2.0, 1.1);
  }

  // Lantai ekspansi utara + karpet + kolom
  const rIn = 114.0, rOut = 230.0, a0 = 19.0, a1 = 161.0, steps = 18;
  for (const [fz, carpetMat] of [[0.2, 'carpet_green'], [8.8, 'carpet_red'], [17.2, 'carpet_green']]) {
    const oArc = [], iArc = [];
    for (let k = 0; k <= steps; k++) {
      oArc.push(polar(rOut, a0 + ((a1 - a0) * k) / steps));
      iArc.push(polar(rIn, a1 - ((a1 - a0) * k) / steps));
    }
    extrude(b, [...oArc, ...iArc], fz, fz + 0.45, carpetMat, 'light');
  }
  for (const r of [126, 148, 172, 196, 218]) {
    for (let deg = 24; deg <= 156; deg += 6) {
      const [px, py] = polar(r, deg);
      interiorColumn(b, px, py, 0.65, 8.8, 0.65);
      interiorColumn(b, px, py, 9.25, 17.2, 0.60);
      if (deg % 12 === 0 && (r === 148 || r === 196)) chandelierInto(b, px, py, 17.1, 2.8, 1.6);
    }
  }
  const [ncx, ncy] = polar(170, 90);
  chandelierInto(b, ncx, ncy, 25.5, 6.5, 4.2);

  // Teras barat (lantai)
  const wTerrace = [
    [-125, 122], [-204, 153], [-280, 109],
    [-295, 21], [-229, -58], [-121, -78]
  ].reverse();
  extrude(b, wTerrace, 0.2, 0.65, 'carpet_red', 'light');
  extrude(b, wTerrace, 6.8, 7.25, 'carpet_green', 'light');
  for (let x = -275; x <= -135; x += 18) {
    for (let y = -45; y <= 125; y += 18) {
      if (x < -250 && y < 0) continue;
      if (x < -230 && y > 120) continue;
      interiorColumn(b, x, y, 0.65, 6.8, 0.55);
      interiorColumn(b, x, y, 7.25, 13.5, 0.50);
    }
  }
  for (const [dx, dy] of [[-236, 104], [-262, 76], [-210, 128]]) chandelierInto(b, dx, dy, 13.8, 3.5, 2.6);

  // Masa'a: lantai 2 tingkat, green mile, kolom
  const s = [SAFA.x, SAFA.y], n = [MARWAH.x, MARWAH.y];
  const [ux, uy] = unit(n[0] - s[0], n[1] - s[1]);
  const nx = -uy, ny = ux;
  const half = 13.8;
  const mLen = Math.hypot(n[0] - s[0], n[1] - s[1]);
  const mYaw = Math.atan2(uy, ux) - Math.PI / 2;
  const midX = (s[0] + n[0]) / 2, midY = (s[1] + n[1]) / 2;

  for (const fz of [0.2, 7.8]) {
    b.xf = place(midX, midY, fz, mYaw);
    b.box(half * 2, mLen + 18, 0, 0.4, 'floor1');
    b.box(1.4, mLen - 24, 0.4, 1.1, 'light', [0, 0]);
    b.box(3.6, mLen - 24, 0.4, 0.48, 'floor3', [0, 0]);
    b.box(half * 2 - 1.0, 42.0, 0.41, 0.49, 'green_mile', [0, -75]);
    b.box(half * 2 - 1.0, 6.5, 6.8, 7.3, 'green_mile', [0, -96]);
    b.box(half * 2 - 1.0, 6.5, 6.8, 7.3, 'green_mile', [0, -54]);
    b.xf = null;
  }

  // gapura lampu hijau (milayn) di koridor sa'i
  for (const t of [0.38, 0.62]) {
    const px = s[0] + (n[0] - s[0]) * t;
    const py = s[1] + (n[1] - s[1]) * t;
    b.xf = place(px, py, 0, mYaw);
    b.box(0.55, 0.55, 0, 5.8, 'green_mile', [-half + 2.2, 0]);
    b.box(0.55, 0.55, 0, 5.8, 'green_mile', [half - 2.2, 0]);
    b.box(half * 2 - 4.0, 0.55, 5.4, 6.0, 'green_mile');
    b.xf = null;
  }

  const colSteps = 22;
  for (let i = 1; i < colSteps; i++) {
    const t = i / colSteps;
    const px = s[0] + (n[0] - s[0]) * t;
    const py = s[1] + (n[1] - s[1]) * t;
    for (const sideOff of [-11.5, 11.5]) {
      interiorColumn(b, px + nx * sideOff, py + ny * sideOff, 0.6, 7.8, 0.5);
      interiorColumn(b, px + nx * sideOff, py + ny * sideOff, 8.2, 15.2, 0.48);
    }
  }

  // lampu gantung di koridor Masa'a
  for (let i = 1; i <= 7; i++) {
    const t = i / 8;
    const px = s[0] + (n[0] - s[0]) * t;
    const py = s[1] + (n[1] - s[1]) * t;
    chandelierInto(b, px, py, 15.0, 2.8, 1.5);
  }

  // Bukit Safa & Marwah
  const safaX = s[0] + ux * 6, safaY = s[1] + uy * 6;
  const marwahX = n[0] - ux * 6, marwahY = n[1] - uy * 6;
  hemisphere(b, safaX, safaY, 0.4, 8.5, 'safa_rock', 14, 6, 0.55);
  b.cylinder(9.6, 9.8, 0.4, 1.4, 20, 'white', [safaX, safaY]);
  hemisphere(b, marwahX, marwahY, 0.4, 7.8, 'safa_rock', 14, 6, 0.48);
  b.cylinder(9.0, 9.2, 0.4, 1.4, 20, 'white', [marwahX, marwahY]);

  b.mode = prev;
}

/* -------------------------------------------------------------------------- */
/* Jembatan tawaf mezzanine + gerbang + Abraj Al-Bait                          */
/* -------------------------------------------------------------------------- */
function buildFurniture(b) {
  const prev = b.mode;

  // Jembatan tawaf (kursi roda)
  b.mode = 'bridge';
  const bIn = [], bOut = [], bSegs = 40;
  for (let i = 0; i < bSegs; i++) {
    const a = (i / bSegs) * TAU;
    bIn.push([Math.cos(a) * 35.5, Math.sin(a) * 35.5]);
    bOut.push([Math.cos(a) * 43.5, Math.sin(a) * 43.5]);
  }
  ringSlab(b, bOut, bIn, 6.2, 6.95, 'white', 'light');
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    b.cylinder(0.42, 0.42, 0, 6.2, 12, 'light', [Math.cos(a) * 39.5, Math.sin(a) * 39.5]);
  }

  // Gerbang & Abraj
  b.mode = 'context';

  b.xf = place(0, -101, 0, 0);
  b.box(28, 12, 0, 26, 'cream');
  b.box(29, 13, 24.5, 26.8, 'gold');
  for (const gx of [-8.5, 0, 8.5]) {
    b.box(5.4, 12.6, 0, 17.5, 'dark', [gx, 0]);
    b.box(6.0, 12.8, 17.5, 19.0, 'gold', [gx, 0]);
  }
  b.xf = null;

  b.xf = place(-292, 64, 0, Math.atan2(-64, 292));
  b.box(26, 11, 0, 23, 'cream');
  b.box(27, 12, 21.5, 23.8, 'gold');
  for (const gx of [-7.5, 0, 7.5]) b.box(4.8, 11.6, 0, 15.5, 'dark', [gx, 0]);
  b.xf = null;

  const cX = 0, cY = -365;
  b.box(230, 95, 0, 85, 'cream', [cX, cY]);
  b.box(234, 98, 82, 86, 'gold', [cX, cY]);
  for (const sx of [-1, 1]) {
    b.box(42, 48, 85, 250, 'sand', [cX + sx * 82, cY + 10]);
    b.box(38, 44, 85, 285, 'cream', [cX + sx * 42, cY - 8]);
  }
  b.box(58, 58, 85, 380, 'cream', [cX, cY]);
  b.box(54, 54, 120, 375, 'glass', [cX, cY]);
  b.box(52, 52, 380, 442, 'light', [cX, cY]);
  b.box(43, 53.5, 386, 434, 'clock_face', [cX, cY]);
  b.box(53.5, 43, 386, 434, 'clock_face', [cX, cY]);
  b.box(56, 56, 442, 448, 'gold', [cX, cY]);
  b.cylinder(22, 14, 448, 515, 8, 'cream', [cX, cY]);
  b.cylinder(12, 3.5, 515, 575, 12, 'gold', [cX, cY]);
  b.cylinder(11.0, 11.0, 578, 586, 16, 'gold', [cX, cY]);

  b.mode = prev;
}

/* ============================================================================
 * KAWASAN MANASIK: MINA, MUZDALIFAH, ARAFAH
 * ========================================================================== */
function buildZones(b) {
  const prev = b.mode;
  b.mode = 'zone';

  /* --- gurun & perbukitan --- */
  b.box(7200, 5200, -2.4, -1.2, 'ground', [1200, 100]);

  const rand = rng(20261027);

  /* --- jalan poros Makkah–Mina–Muzdalifah–Arafah --- */
  b.box(2900, 30, -0.3, 0.1, 'asphalt', [1450, 60]);
  b.box(2900, 2.2, 0.1, 0.16, 'light', [1450, 47]);
  b.box(2900, 2.2, 0.1, 0.16, 'light', [1450, 73]);

  /* ------------------------------- MINA ---------------------------------- */
  const mina = ZONES.mina.center;
  b.box(520, 430, -0.4, 0.1, 'plaza', [mina.x, mina.y - 40]);
  // batas & gerbang
  b.box(520, 6, 0.1, 4.0, 'light', [mina.x, mina.y - 250]);

  // perkemahan tenda
  const tentRows = 7, tentCols = 13;
  for (let r0 = 0; r0 < tentRows; r0++) {
    for (let c0 = 0; c0 < tentCols; c0++) {
      const x = mina.x - 210 + c0 * 34;
      const y = mina.y - 235 + r0 * 27;
      b.box(22, 18, 0.1, 4.2, 'tent', [x, y]);
      b.cylinder(16.0, 0.4, 4.2, 7.0, 4, 'tent_shade', [x, y]);
      b.cylinder(0.12, 0.12, 4.7, 6.6, 6, 'light', [x, y]);
    }
  }

  // kompleks Jamarat: landasan + jalan masuk
  const jx = mina.x, jy = mina.y + 20;
  b.box(260, 60, 0.1, 0.5, 'asphalt', [jx, jy - 40]);
  b.box(190, 34, 0.1, 0.4, 'asphalt', [jx - 120, jy]);

  // lampu & pohon
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    b.cylinder(0.35, 0.3, 0, 18, 8, 'light', [jx + Math.cos(a) * 175, jy + Math.sin(a) * 175]);
    b.cylinder(2.6, 2.2, 18, 19.2, 8, 'lamp', [jx + Math.cos(a) * 175, jy + Math.sin(a) * 175]);
  }

  /* ---------------------------- MUZDALIFAH ------------------------------- */
  const muz = ZONES.muzdalifah.center;
  b.box(440, 320, -0.3, 0.12, 'plaza', [muz.x, muz.y]);
  b.box(360, 4, 0.12, 3.2, 'light', [muz.x, muz.y - 160]);
  // Masjid Masy'ar al-Haram (penyederhanaan)
  b.box(90, 54, 0.12, 16, 'cream', [muz.x, muz.y - 40]);
  b.box(92, 56, 15.6, 16.6, 'gold', [muz.x, muz.y - 40]);
  domeWithDrum(b, muz.x - 22, muz.y - 40, 16.6, 9.0, 4.0);
  domeWithDrum(b, muz.x + 22, muz.y - 40, 16.6, 9.0, 4.0);
  // tenda & lampu
  for (let r0 = 0; r0 < 5; r0++) {
    for (let c0 = 0; c0 < 9; c0++) {
      const x = muz.x - 150 + c0 * 38;
      const y = muz.y + 30 + r0 * 26;
      b.box(20, 17, 0.12, 3.6, 'tent', [x, y]);
      b.box(21, 18, 3.6, 4.0, 'tent_shade', [x, y]);
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = muz.x - 190 + i * 44;
    b.cylinder(0.45, 0.35, 0, 14, 8, 'light', [x, muz.y - 120]);
    b.cylinder(3.0, 2.4, 14, 15, 8, 'lamp', [x, muz.y - 120]);
  }

  /* ------------------------------- ARAFAH -------------------------------- */
  const araf = ZONES.arafah.center;
  b.box(680, 460, -0.3, 0.12, 'sand', [araf.x, araf.y]);
  // Jabal Rahmah
  b.cylinder(78, 30, 0.12, 46, 9, 'rock', [araf.x, araf.y + 250]);
  b.cylinder(30, 14, 46, 62, 9, 'rock', [araf.x, araf.y + 250]);
  b.cylinder(3.2, 1.6, 62, 92, 8, 'white', [araf.x, araf.y + 250]);
  b.box(14, 8, 62, 63.5, 'white', [araf.x, araf.y + 250]);

  // Masjid Namirah (penyederhanaan)
  b.box(120, 60, 0.12, 14, 'cream', [araf.x - 20, araf.y - 150]);
  b.box(122, 62, 13.6, 14.6, 'gold', [araf.x - 20, araf.y - 150]);
  domeWithDrum(b, araf.x - 50, araf.y - 150, 14.6, 8.0, 3.0);
  domeWithDrum(b, araf.x + 10, araf.y - 150, 14.6, 8.0, 3.0);

  // tenda jamaah
  for (let r0 = 0; r0 < 6; r0++) {
    for (let c0 = 0; c0 < 12; c0++) {
      const x = araf.x - 230 + c0 * 40;
      const y = araf.y - 40 + r0 * 30;
      if (Math.abs(x - (araf.x - 20)) < 80 && Math.abs(y - (araf.y - 150)) < 50) continue;
      b.box(24, 20, 0.12, 4.4, 'tent', [x, y]);
      b.cylinder(17.0, 0.4, 4.4, 7.2, 4, 'tent_shade', [x, y]);
    }
  }

  // pohon akasia
  for (let i = 0; i < 40; i++) {
    const x = araf.x + (rand() - 0.5) * 620;
    const y = araf.y + (rand() - 0.5) * 400;
    if (Math.abs(x - araf.x) < 260 && Math.abs(y - (araf.y - 40)) < 200) continue;
    b.cylinder(0.6, 0.5, 0.12, 7, 6, 'teak_wood', [x, y]);
    hemisphere(b, x, y, 6.0, 5.4, 'foliage', 8, 3, 0.55);
  }

  b.mode = prev;
}

/* ============================================================================
 * Build + merge
 * ========================================================================== */
export function buildGeometries() {
  const b = new Builder();
  buildHaram(b);
  buildZones(b);
  return b;
}

/**
 * Merge seluruh bucket menjadi grup per mode.
 * @returns {{groups: Record<string, THREE.Group>, triangles: number}}
 */
export function mergeIntoGroups(builder) {
  const groups = {};
  let triangles = 0;

  for (const [mode, mats] of builder.buckets) {
    const group = new THREE.Group();
    group.name = mode;
    for (const [matName, geoms] of mats) {
      if (!geoms.length) continue;
      const merged = BufferGeometryUtils.mergeGeometries(geoms, false);
      if (!merged) {
        console.warn('[manasik] gagal merge material', matName, mode);
        continue;
      }
      const mesh = new THREE.Mesh(merged, MATERIALS[matName]);
      const shadowCaster = mode === 'main' || mode === 'facade' || mode === 'roof' || mode === 'interior' || mode === 'bridge';
      mesh.castShadow = shadowCaster && matName !== 'plaza';
      mesh.receiveShadow = true;
      mesh.name = `${mode}:${matName}`;
      group.add(mesh);
      triangles += merged.attributes.position.count / 3;
      for (const g of geoms) g.dispose();
    }
    groups[mode] = group;
  }

  return { groups, triangles };
}


