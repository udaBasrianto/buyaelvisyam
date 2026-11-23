/* eslint-disable */
/**
 * world.js — renderer, kamera, pencahayaan, avatar jamaah, kerumunan,
 * dan interaksi 3D (Jamarat).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  MATERIALS,
  JAMARAT,
  SAFA,
  MARWAH,
  ZONES,
  TAWAF_RADIUS,
  TAWAF_START_ANGLE,
  buildGeometries,
  mergeIntoGroups,
  unit
} from './builders.js';

export const ANCHORS = [
  { id: 'kaaba', title: "Ka'bah", sub: 'Baitullah • Hajar Aswad di sudut tenggara', pos: new THREE.Vector3(0, 0, 19) },
  { id: 'hijr', title: 'Hijr Ismail', sub: 'Hatim • di bawah Mizab emas', pos: new THREE.Vector3(0, 8.5, 3.2) },
  { id: 'maqam', title: 'Maqam Ibrahim', sub: 'Shalat 2 rakaat setelah tawaf', pos: new THREE.Vector3(10.5, 1.5, 5.2) },
  { id: 'mataf', title: 'Mataf', sub: 'Area tawaf mengelilingi Ka\'bah', pos: new THREE.Vector3(-20, -20, 3) },
  { id: 'safa', title: 'Bukit Safa', sub: 'Awal sa\'i — 7 kali', pos: new THREE.Vector3(SAFA.x, SAFA.y, 8) },
  { id: 'marwah', title: 'Bukit Marwah', sub: 'Akhir sa\'i ke-7', pos: new THREE.Vector3(MARWAH.x, MARWAH.y, 8) },
  { id: 'mina', title: 'Mina', sub: 'Mabit & melontar jumrah', pos: new THREE.Vector3(1080, -80, 24) },
  { id: 'jamarat', title: 'Jamarat', sub: 'Sughra • Wustha • Aqabah', pos: new THREE.Vector3(1080, 60, 26) },
  { id: 'muzdalifah', title: 'Muzdalifah', sub: 'Mabit setelah wukuf', pos: new THREE.Vector3(1800, 60, 22) },
  { id: 'arafah', title: 'Padang Arafah', sub: 'Wukuf — inti haji', pos: new THREE.Vector3(2500, 250, 100) },
  { id: 'abraj', title: 'Abraj Al-Bait', sub: 'Menara jam • di selatan Masjidil Haram', pos: new THREE.Vector3(0, -365, 470) }
];

export const VIEWS = {
  overview:  { pos: [0, -85, 55],    target: [0, 0, 7],    fov: 46 },
  gate:      { pos: [0, -330, 42],   target: [0, -100, 22], fov: 52 },
  kaaba:     { pos: [38, -44, 28],   target: [0, 0, 6],    fov: 45 },
  kabahTop:  { pos: [0, -65, 80],    target: [0, 0, 6],    fov: 42 },
  masaa:     { pos: [132, -50, 9],   target: [120, 90, 6], fov: 58 },
  mina:      { pos: [1040, -300, 200], target: [1080, 40, 30], fov: 42 },
  jamarat:   { pos: [1105, -120, 52],  target: [1080, 70, 16], fov: 45 },
  muzdalifah:{ pos: [1750, -230, 130], target: [1800, 50, 16], fov: 45 },
  arafah:    { pos: [2440, -250, 210], target: [2500, 120, 30], fov: 45 },
  arafahJbl: { pos: [2500, 120, 110],  target: [2500, 255, 55], fov: 45 },
  miqat:     { pos: [0, -85, 55],    target: [0, 0, 7],    fov: 46 }
};

const TAWAF_COUNT = 2000;
const SAI_COUNT = 700;
const MINA_STATIC = 420;
const ARAFAH_STATIC = 380;
export const CROWD_TOTAL = TAWAF_COUNT + SAI_COUNT + MINA_STATIC + ARAFAH_STATIC;

function makePilgrimMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.02 });
}

function buildCrowd() {
  const bodyGeom = new THREE.CylinderGeometry(0.23, 0.34, 1.66, 7);
  bodyGeom.rotateX(Math.PI / 2);
  bodyGeom.translate(0, 0, 0.83);

  const headGeom = new THREE.SphereGeometry(0.19, 7, 5);
  headGeom.translate(0, 0, 1.72);

  const merged = BufferGeometryUtils.mergeGeometries([bodyGeom, headGeom], false);
  const mesh = new THREE.InstancedMesh(merged, makePilgrimMaterial(), CROWD_TOTAL);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const cylinderZ = (rt, rb, h, seg = 12, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, openEnded, thetaStart, thetaLength);
  g.rotateX(Math.PI / 2);
  return g;
};

function makeLatheZ(points, segs = 32) {
  const v2 = points.map(([r, z]) => new THREE.Vector2(r, z));
  const geom = new THREE.LatheGeometry(v2, segs);
  geom.rotateX(Math.PI / 2);
  return geom;
}

function createFemalePilgrim(human, customOptions = {}) {
  const isBlackTheme = customOptions.femaleTheme === 'black';
  const hasLace = customOptions.lace !== false;
  const hasBag = customOptions.bag !== false;

  // Palet Warna & Material Kain Syar'i Anggun
  const clothColor = isBlackTheme ? 0x22262d : 0xfcfbfa; // Putih bersih berseri
  const trimColor = isBlackTheme ? 0x3d4450 : 0xe8e4dc; // Renda bordir krem lembut
  const innerCapColor = isBlackTheme ? 0x181a1d : 0xe5dfd5; // Ciput dahi
  const skinColor = 0xd4a373;

  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.82,
    metalness: 0.02
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.70,
    metalness: 0.05
  });
  const innerCapMat = new THREE.MeshStandardMaterial({
    color: innerCapColor,
    roughness: 0.75
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.55,
    metalness: 0.02
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  const browMat = new THREE.MeshBasicMaterial({ color: 0x38281b });
  const lipsMat = new THREE.MeshStandardMaterial({ color: 0xbd6262, roughness: 0.5 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: isBlackTheme ? 0x1f242b : 0xf4f4f5, roughness: 0.65 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.8 });
  const bagMat = new THREE.MeshStandardMaterial({ color: isBlackTheme ? 0x181a1f : 0xded9ce, roughness: 0.55 });
  const strapMat = new THREE.MeshStandardMaterial({ color: isBlackTheme ? 0x303642 : 0xc7c2b5, roughness: 0.6 });

  // 1. KEPALA & KHIMAR BERGO SYAR'I (LatheGeometry: Kontur Halus Organik Tanpa Sudut Kaku)
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  human.add(headGroup);

  const khimarGeom = makeLatheZ([
    [0.001, 1.70], // Puncak mahkota kepala
    [0.07, 1.685],
    [0.125, 1.64],
    [0.155, 1.57], // Dahi & pelipis
    [0.158, 1.48], // Pipi samping & rahang belakang
    [0.145, 1.40], // Lekukan lembut leher
    [0.175, 1.33], // Bahu atas
    [0.235, 1.25], // Pundak
    [0.285, 1.17], // Dada & punggung atas
    [0.325, 1.09], // Menjuntai di bawah dada
    [0.340, 1.04], // Tepi bawah khimar (flare bergo syar'i)
    [0.320, 1.04]  // Lipatan dalam
  ], 32);

  const khimarMesh = new THREE.Mesh(khimarGeom, clothMat);
  khimarMesh.castShadow = true;
  khimarMesh.receiveShadow = true;
  headGroup.add(khimarMesh);

  // Renda Bordir Tepi Bawah Khimar
  if (hasLace) {
    const laceGeom = makeLatheZ([
      [0.336, 1.055],
      [0.345, 1.040],
      [0.338, 1.035]
    ], 32);
    const laceMesh = new THREE.Mesh(laceGeom, trimMat);
    headGroup.add(laceMesh);
  }

  // 2. WAJAH OVAL ANGGUN (Muncul Jelas & Cantik di Depan Khimar)
  const faceGroup = new THREE.Group();
  faceGroup.position.set(0, 0.065, 1.49);
  headGroup.add(faceGroup);

  // Bentuk Wajah Oval Lembut
  const faceMesh = new THREE.Mesh(new THREE.SphereGeometry(0.118, 20, 18), skinMat);
  faceMesh.scale.set(0.92, 1.08, 1.15);
  faceMesh.castShadow = true;
  faceGroup.add(faceMesh);

  // Ciput / Inner Hijab di Dahi
  const ciputGeom = new THREE.TorusGeometry(0.115, 0.015, 10, 24, Math.PI);
  const ciputMesh = new THREE.Mesh(ciputGeom, innerCapMat);
  ciputMesh.position.set(0, 0.025, 0.045);
  ciputMesh.rotation.x = -Math.PI / 2.3;
  faceGroup.add(ciputMesh);

  // Mata Teduh & Tenang
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 10), eyeMat);
  eyeL.position.set(-0.040, 0.108, 0.012);
  faceGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 10), eyeMat);
  eyeR.position.set(0.040, 0.108, 0.012);
  faceGroup.add(eyeR);

  // Alis Lembut Alami
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.005), browMat);
  browL.position.set(-0.040, 0.105, 0.034);
  browL.rotation.z = 0.12;
  faceGroup.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.005), browMat);
  browR.position.set(0.040, 0.105, 0.034);
  browR.rotation.z = -0.12;
  faceGroup.add(browR);

  // Hidung Mancung Mungil
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.044, 5), skinMat);
  nose.rotation.x = Math.PI / 2.2;
  nose.position.set(0, 0.125, -0.015);
  faceGroup.add(nose);

  // Bibir Cantik Senyum Teduh
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.012, 0.014), lipsMat);
  lips.position.set(0, 0.110, -0.052);
  faceGroup.add(lips);

  // 3. GAMIS SYAR'I ANGGUN (A-Line Maxi Dress Kontur Halus)
  const skirtGroup = new THREE.Group();
  skirtGroup.name = 'skirtGroup';
  human.add(skirtGroup);

  const gamisGeom = makeLatheZ([
    [0.170, 1.22],  // Dada tertutup di bawah khimar
    [0.185, 1.12],  // Dada bawah
    [0.175, 0.98],  // Pinggang gamis langsing anggun syar'i
    [0.215, 0.82],  // Pinggul
    [0.255, 0.62],  // Paha
    [0.295, 0.42],  // Lutut
    [0.335, 0.22],  // Betis
    [0.365, 0.05],  // Hem bawah gamis
    [0.345, 0.05]   // Lipatan ke dalam
  ], 32);

  const gamisMesh = new THREE.Mesh(gamisGeom, clothMat);
  gamisMesh.castShadow = true;
  gamisMesh.receiveShadow = true;
  skirtGroup.add(gamisMesh);

  // Renda Mewah Keliling Bawah Gamis
  if (hasLace) {
    const hemLaceGeom = makeLatheZ([
      [0.360, 0.065],
      [0.370, 0.048],
      [0.355, 0.045]
    ], 32);
    const hemLaceMesh = new THREE.Mesh(hemLaceGeom, trimMat);
    skirtGroup.add(hemLaceMesh);
  }

  // Tas Selempang Haji Akhwat (Passport & Doa)
  if (hasBag) {
    const bagGroup = new THREE.Group();
    bagGroup.position.set(0.18, 0.07, 0.88);
    bagGroup.rotation.z = -0.25;

    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, 0.14), bagMat);
    bagBody.castShadow = true;
    bagGroup.add(bagBody);

    const bagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.052, 0.065), trimMat);
    bagFlap.position.set(0, 0.005, 0.038);
    bagGroup.add(bagFlap);

    human.add(bagGroup);

    // Tali selempang dari pundak kiri ke pinggul kanan
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.48, 0.012), strapMat);
    strap.position.set(0.04, 0.06, 1.12);
    strap.rotation.z = 0.62;
    strap.rotation.y = 0.18;
    human.add(strap);
  }

  // 4. LENGAN & TANGAN SYAR'I (Tertutup Kain Hingga Pergelangan Sesuai Syariat)
  // Lengan Kiri
  const armPivotL = new THREE.Group();
  armPivotL.position.set(-0.21, 0, 1.25);
  human.add(armPivotL);

  const upperArmL = new THREE.Mesh(cylinderZ(0.050, 0.044, 0.22, 12), clothMat);
  upperArmL.position.set(0, 0.02, -0.11);
  upperArmL.rotation.x = 0.25;
  upperArmL.castShadow = true;
  armPivotL.add(upperArmL);

  const forearmPivotL = new THREE.Group();
  forearmPivotL.position.set(0, 0.06, -0.22);
  armPivotL.add(forearmPivotL);

  const lowerArmL = new THREE.Mesh(cylinderZ(0.044, 0.038, 0.20, 12), clothMat);
  lowerArmL.position.set(0.06, 0.08, -0.06);
  lowerArmL.rotation.x = 0.65;
  lowerArmL.rotation.z = -0.42;
  lowerArmL.castShadow = true;
  forearmPivotL.add(lowerArmL);

  if (hasLace) {
    const cuffL = new THREE.Mesh(cylinderZ(0.042, 0.042, 0.025, 12), trimMat);
    cuffL.position.set(0.10, 0.14, -0.11);
    cuffL.rotation.x = 0.65;
    cuffL.rotation.z = -0.42;
    forearmPivotL.add(cuffL);
  }

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.030, 10, 10), skinMat);
  handL.position.set(0.12, 0.17, -0.13);
  handL.scale.set(0.7, 1.2, 0.5);
  forearmPivotL.add(handL);

  // Lengan Kanan
  const armPivotR = new THREE.Group();
  armPivotR.position.set(0.21, 0, 1.25);
  human.add(armPivotR);

  const upperArmR = new THREE.Mesh(cylinderZ(0.050, 0.044, 0.22, 12), clothMat);
  upperArmR.position.set(0, 0.02, -0.11);
  upperArmR.rotation.x = 0.25;
  upperArmR.castShadow = true;
  armPivotR.add(upperArmR);

  const forearmPivotR = new THREE.Group();
  forearmPivotR.position.set(0, 0.06, -0.22);
  armPivotR.add(forearmPivotR);

  const lowerArmR = new THREE.Mesh(cylinderZ(0.044, 0.038, 0.20, 12), clothMat);
  lowerArmR.position.set(-0.06, 0.08, -0.06);
  lowerArmR.rotation.x = 0.65;
  lowerArmR.rotation.z = 0.42;
  lowerArmR.castShadow = true;
  forearmPivotR.add(lowerArmR);

  if (hasLace) {
    const cuffR = new THREE.Mesh(cylinderZ(0.042, 0.042, 0.025, 12), trimMat);
    cuffR.position.set(-0.10, 0.14, -0.11);
    cuffR.rotation.x = 0.65;
    cuffR.rotation.z = 0.42;
    forearmPivotR.add(cuffR);
  }

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.030, 10, 10), skinMat);
  handR.position.set(-0.12, 0.17, -0.13);
  handR.scale.set(0.7, 1.2, 0.5);
  forearmPivotR.add(handR);

  // 5. KAKI & SEPATU HAJI AKHWAT (Melangkah Tenang di Bawah Hem Gamis)
  const legPivotL = new THREE.Group();
  legPivotL.position.set(-0.09, 0, 0.38);
  human.add(legPivotL);

  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.175, 0.044), shoeMat);
  shoeL.position.set(0, 0.04, -0.32);
  shoeL.castShadow = true;
  legPivotL.add(shoeL);

  const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.180, 0.010), soleMat);
  soleL.position.set(0, 0.04, -0.345);
  legPivotL.add(soleL);

  // Kaki Kanan
  const legPivotR = new THREE.Group();
  legPivotR.position.set(0.09, 0, 0.38);
  human.add(legPivotR);

  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.175, 0.044), shoeMat);
  shoeR.position.set(0, 0.04, -0.32);
  shoeR.castShadow = true;
  legPivotR.add(shoeR);

  const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.180, 0.010), soleMat);
  soleR.position.set(0, 0.04, -0.345);
  legPivotR.add(soleR);

  return { headGroup, legPivotL, legPivotR, armPivotL, armPivotR, skirtGroup };
}

function createMalePilgrim(human, customOptions = {}) {
  const idtiba = customOptions.idtiba !== false;
  const hasKufi = customOptions.kufi !== false;
  const hasBelt = customOptions.belt !== false;
  const hasSandals = customOptions.sandals !== false;

  const skin = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.68, metalness: 0.04 });
  const whiteCloth = new THREE.MeshStandardMaterial({ color: 0xfaf9f6, roughness: 0.90 });
  const greenBelt = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.45 });
  const goldBuckle = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
  const sandalSole = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75 });
  const sandalStrap = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

  // 1. KEPALA & WAJAH
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.set(0, 0, 1.58);
  human.add(headGroup);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 14), skin);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const jaw = new THREE.Mesh(cylinderZ(0.12, 0.08, 0.12, 10), skin);
  jaw.position.set(0, 0.04, -0.07);
  headGroup.add(jaw);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeL.position.set(-0.052, 0.138, 0.02);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeR.position.set(0.052, 0.138, 0.02);
  headGroup.add(eyeR);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 4), skin);
  nose.rotation.x = Math.PI / 2.4;
  nose.position.set(0, 0.165, -0.015);
  headGroup.add(nose);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skin);
  earL.position.set(-0.152, 0, 0.01);
  earL.scale.set(0.35, 0.8, 1.2);
  headGroup.add(earL);
  const earR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skin);
  earR.position.set(0.152, 0, 0.01);
  earR.scale.set(0.35, 0.8, 1.2);
  headGroup.add(earR);

  if (hasKufi) {
    const peci = new THREE.Mesh(cylinderZ(0.152, 0.156, 0.09, 16), whiteCloth);
    peci.position.set(0, -0.01, 0.09);
    peci.castShadow = true;
    headGroup.add(peci);
    const peciRim = new THREE.Mesh(cylinderZ(0.158, 0.158, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xedebe4, roughness: 0.7 }));
    peciRim.position.set(0, -0.01, 0.05);
    headGroup.add(peciRim);
  }

  // Leher
  const neck = new THREE.Mesh(cylinderZ(0.068, 0.078, 0.10, 10), skin);
  neck.position.set(0, 0, 1.45);
  human.add(neck);

  // 2. DADA & TUBUH ATAS (RIDA')
  const chestGroup = new THREE.Group();
  chestGroup.name = 'chest';
  chestGroup.position.set(0, 0, 1.22);
  human.add(chestGroup);

  const chestBase = new THREE.Mesh(cylinderZ(0.23, 0.20, 0.36, 12), idtiba ? skin : whiteCloth);
  chestBase.castShadow = true;
  chestGroup.add(chestBase);

  if (idtiba) {
    const rightShoulderSkin = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), skin);
    rightShoulderSkin.position.set(0.22, 0, 0.14);
    chestGroup.add(rightShoulderSkin);

    const ridaDrape = new THREE.Mesh(cylinderZ(0.24, 0.22, 0.38, 12, false, 0, Math.PI * 1.35), whiteCloth);
    ridaDrape.position.set(-0.03, 0, 0.01);
    ridaDrape.rotation.z = Math.PI * 0.88;
    ridaDrape.castShadow = true;
    chestGroup.add(ridaDrape);

    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.04), whiteCloth);
    sash.position.set(-0.04, 0.13, 0.04);
    sash.rotation.z = -0.58;
    sash.rotation.y = 0.22;
    sash.castShadow = true;
    chestGroup.add(sash);

    const backFold = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.40, 0.04), whiteCloth);
    backFold.position.set(-0.06, -0.13, 0.02);
    backFold.rotation.z = 0.45;
    chestGroup.add(backFold);
  } else {
    const ridaFull = new THREE.Mesh(cylinderZ(0.245, 0.22, 0.38, 14), whiteCloth);
    ridaFull.castShadow = true;
    chestGroup.add(ridaFull);
  }

  // 3. SABUK PINGGANG (HAJJ BELT)
  if (hasBelt) {
    const belt = new THREE.Mesh(cylinderZ(0.225, 0.225, 0.065, 14), greenBelt);
    belt.position.set(0, 0, 1.01);
    belt.castShadow = true;
    human.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.075), goldBuckle);
    buckle.position.set(0, 0.22, 1.01);
    human.add(buckle);

    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.08), greenBelt);
    pouch.position.set(0.14, 0.16, 1.01);
    pouch.rotation.z = -0.7;
    human.add(pouch);
  }

  // 4. KAIN BAWAH (IZAR)
  const izarCloth = new THREE.Mesh(cylinderZ(0.22, 0.24, 0.60, 14), whiteCloth);
  izarCloth.position.set(0, 0, 0.68);
  izarCloth.castShadow = true;
  human.add(izarCloth);

  const foldOver = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.58), whiteCloth);
  foldOver.position.set(0.02, 0.23, 0.68);
  foldOver.castShadow = true;
  human.add(foldOver);

  // 5. LENGAN & TANGAN
  const armPivotL = new THREE.Group();
  armPivotL.position.set(-0.25, 0, 1.35);
  human.add(armPivotL);

  const upperArmL = new THREE.Mesh(cylinderZ(0.06, 0.054, 0.26, 8), whiteCloth);
  upperArmL.position.set(0, 0, -0.13);
  upperArmL.castShadow = true;
  armPivotL.add(upperArmL);

  const forearmPivotL = new THREE.Group();
  forearmPivotL.position.set(0, 0, -0.26);
  armPivotL.add(forearmPivotL);

  const lowerArmL = new THREE.Mesh(cylinderZ(0.052, 0.046, 0.24, 8), skin);
  lowerArmL.position.set(0, 0.06, -0.11);
  lowerArmL.rotation.x = 0.35;
  lowerArmL.castShadow = true;
  forearmPivotL.add(lowerArmL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skin);
  handL.position.set(0, 0.13, -0.21);
  handL.scale.set(0.8, 1.3, 0.5);
  forearmPivotL.add(handL);

  const armPivotR = new THREE.Group();
  armPivotR.position.set(0.25, 0, 1.35);
  human.add(armPivotR);

  const upperArmR = new THREE.Mesh(cylinderZ(0.062, 0.056, 0.26, 8), idtiba ? skin : whiteCloth);
  upperArmR.position.set(0, 0, -0.13);
  upperArmR.castShadow = true;
  armPivotR.add(upperArmR);

  const forearmPivotR = new THREE.Group();
  forearmPivotR.position.set(0, 0, -0.26);
  armPivotR.add(forearmPivotR);

  const lowerArmR = new THREE.Mesh(cylinderZ(0.054, 0.046, 0.24, 8), skin);
  lowerArmR.position.set(0, 0.06, -0.11);
  lowerArmR.rotation.x = 0.35;
  lowerArmR.castShadow = true;
  forearmPivotR.add(lowerArmR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skin);
  handR.position.set(0, 0.13, -0.21);
  handR.scale.set(0.8, 1.3, 0.5);
  forearmPivotR.add(handR);

  // 6. KAKI & SANDAL JEPIT
  const legPivotL = new THREE.Group();
  legPivotL.position.set(-0.11, 0, 0.42);
  human.add(legPivotL);

  const calfL = new THREE.Mesh(cylinderZ(0.058, 0.048, 0.36, 8), skin);
  calfL.position.set(0, 0, -0.17);
  calfL.castShadow = true;
  legPivotL.add(calfL);

  if (hasSandals) {
    const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.024), sandalSole);
    soleL.position.set(0, 0.04, -0.36);
    soleL.castShadow = true;
    legPivotL.add(soleL);

    const strapL = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 12, Math.PI), sandalStrap);
    strapL.rotation.x = Math.PI / 2;
    strapL.position.set(0, 0.06, -0.34);
    legPivotL.add(strapL);
  }

  const legPivotR = new THREE.Group();
  legPivotR.position.set(0.11, 0, 0.42);
  human.add(legPivotR);

  const calfR = new THREE.Mesh(cylinderZ(0.058, 0.048, 0.36, 8), skin);
  calfR.position.set(0, 0, -0.17);
  calfR.castShadow = true;
  legPivotR.add(calfR);

  if (hasSandals) {
    const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.024), sandalSole);
    soleR.position.set(0, 0.04, -0.36);
    soleR.castShadow = true;
    legPivotR.add(soleR);

    const strapR = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 12, Math.PI), sandalStrap);
    strapR.rotation.x = Math.PI / 2;
    strapR.position.set(0, 0.06, -0.34);
    legPivotR.add(strapR);
  }

  return { headGroup, legPivotL, legPivotR, armPivotL, armPivotR };
}

function createPilgrimAvatar(gender = 'male', customOptions = {}) {
  const group = new THREE.Group();
  group.name = 'avatar';

  const isMale = gender === 'male';

  // 1. Locator Ring di lantai
  const locator = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  locator.position.z = 0.08;
  locator.name = 'locator';
  group.add(locator);

  // 2. Floating Beacon Pin di atas kepala
  const pinGroup = new THREE.Group();
  pinGroup.name = 'pin';
  pinGroup.position.set(0, 0, 2.22);
  const pinCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.42, 6),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  pinCone.rotation.x = Math.PI;
  pinGroup.add(pinCone);
  const pinJewel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshBasicMaterial({ color: 0xfde68a })
  );
  pinJewel.position.z = 0.24;
  pinGroup.add(pinJewel);
  group.add(pinGroup);

  // 3. Human Hierarchy
  const human = new THREE.Group();
  human.name = 'human';
  group.add(human);

  const parts = isMale
    ? createMalePilgrim(human, customOptions)
    : createFemalePilgrim(human, customOptions);

  const { headGroup, legPivotL, legPivotR, armPivotL, armPivotR, skirtGroup } = parts;

  // --- ANIMASI METODE KUSTOM ---
  group.animate = (dt, elapsed, speed = 0) => {
    pinGroup.rotation.z = elapsed * 1.8;
    pinGroup.position.z = 2.22 + Math.sin(elapsed * 4) * 0.04;

    if (speed > 0.25) {
      const stepFreq = 8.5 * Math.min(speed, 2.2);
      const angle = Math.sin(elapsed * stepFreq);

      legPivotL.rotation.x = angle * 0.40;
      legPivotR.rotation.x = -angle * 0.40;

      armPivotL.rotation.x = -angle * 0.30;
      armPivotR.rotation.x = angle * 0.30;

      if (skirtGroup) {
        skirtGroup.rotation.x = Math.sin(elapsed * stepFreq) * 0.05;
        skirtGroup.rotation.z = Math.cos(elapsed * stepFreq * 0.5) * 0.025;
      }

      human.position.z = Math.abs(Math.sin(elapsed * stepFreq)) * 0.038;
      headGroup.rotation.x = Math.sin(elapsed * stepFreq) * 0.035;
    } else {
      legPivotL.rotation.x = THREE.MathUtils.lerp(legPivotL.rotation.x, 0, dt * 6);
      legPivotR.rotation.x = THREE.MathUtils.lerp(legPivotR.rotation.x, 0, dt * 6);
      armPivotL.rotation.x = THREE.MathUtils.lerp(armPivotL.rotation.x, 0, dt * 6);
      armPivotR.rotation.x = THREE.MathUtils.lerp(armPivotR.rotation.x, 0, dt * 6);
      if (skirtGroup) {
        skirtGroup.rotation.x = THREE.MathUtils.lerp(skirtGroup.rotation.x, 0, dt * 6);
        skirtGroup.rotation.z = THREE.MathUtils.lerp(skirtGroup.rotation.z, 0, dt * 6);
      }
      human.position.z = Math.sin(elapsed * 2.2) * 0.012;
      headGroup.rotation.x = Math.sin(elapsed * 1.5) * 0.02;
    }
  };

  return group;
}

const createAvatar = createPilgrimAvatar;

export class World {
  constructor(container) {
    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fc6e6);
    this.scene.fog = new THREE.FogExp2(0x9fc6e6, 0.00016);

    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 9000);
    this.camera.up.set(0, 0, 1);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.8;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 2200;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.target.set(0, 0, 15);

    this.camera.position.set(...VIEWS.overview.pos);
    this.controls.update();

    /* --- cahaya --- */
    this.hemiLight = new THREE.HemisphereLight(0xfffdf5, 0x3a4654, 0.9);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0x9fb8d4, 0.18);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff2df, 2.0);
    this.sunLight.position.set(-520, -420, 700);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 2600;
    const d = 620;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.fillLight = new THREE.DirectionalLight(0x9fc0dd, 0.45);
    this.fillLight.position.set(600, 500, 300);
    this.scene.add(this.fillLight);

    /* --- geometri --- */
    const builder = buildGeometries();
    const { groups, triangles } = mergeIntoGroups(builder);
    this.groups = groups;
    this.triangles = triangles;

    this.roofGroup = groups.roof || new THREE.Group();
    this.bridgeGroup = groups.bridge || new THREE.Group();
    this.interiorGroup = groups.interior || new THREE.Group();
    this.contextGroup = groups.context || new THREE.Group();
    this.zoneGroup = groups.zone || new THREE.Group();

    for (const key of Object.keys(groups)) this.scene.add(groups[key]);

    /* --- pedestrian & kerumunan --- */
    this.crowd = buildCrowd();
    this.scene.add(this.crowd);
    this._initCrowd();

    /* --- avatar --- */
    this.avatar = createAvatar('male');
    this.avatar.position.set(TAWAF_RADIUS * Math.cos(TAWAF_START_ANGLE), TAWAF_RADIUS * Math.sin(TAWAF_START_ANGLE), 0.02);
    this.scene.add(this.avatar);
    this._avatarPrev = this.avatar.position.clone();

    /* --- jamarat (mesh terpisah agar bisa di-highlight & di-raycast) --- */
    this.jamaratMeshes = [];
    this._buildJamarat();

    /* --- pelemparan kerikil --- */
    this.pebbles = [];
    this.pebbleGeometry = new THREE.SphereGeometry(0.16, 8, 6);
    this.pebbleMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6257, roughness: 0.9 });

    /* --- kamera --- */
    this.tween = null;
    this.following = false;
    this.cameraMode = 'drone'; // 'drone' | 'fpv'
    this.followOffset = new THREE.Vector3(6, -10, 6.5);
    this.lookOffset = new THREE.Vector3(0, 0, 1.35);
    this._followTarget = new THREE.Vector3();

    /* --- starfield malam --- */
    this.starfield = this._buildStarfield();
    this.scene.add(this.starfield);

    this.timeOfDay = 9.5;
    this.setTimeOfDay(9.5);
    this.setCutaway(false);
    this.setCrowdVisible(true);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.clock = new THREE.Clock();
    this.lastTime = performance.now();
    this.onFrame = null;
    this.running = true;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  /* ====================================================================== */
  /* inisialisasi kerumunan                                                 */
  /* ====================================================================== */
  _initCrowd() {
    this.tawafAgents = [];
    this.saiAgents = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const maxCount = CROWD_TOTAL;

    for (let i = 0; i < TAWAF_COUNT; i++) {
      const onBridge = i > TAWAF_COUNT * 0.86;
      const t = Math.pow(Math.random(), 1.25);
      const r = onBridge ? 36.5 + Math.random() * 6 : 12.5 + t * 44;
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.7 / Math.sqrt(r)) * (0.85 + Math.random() * 0.3);
      this.tawafAgents.push({ r, angle, speed, phase: Math.random() * Math.PI * 2, z: onBridge ? 6.98 : 0.05 });

      color.setHSL(0.09, 0.08, 0.9 + Math.random() * 0.09);
      if (Math.random() < 0.14) color.setHSL(0.58, 0.18, 0.13 + Math.random() * 0.12);
      this.crowd.setColorAt(i, color);
    }

    const [ux, uy] = unit(MARWAH.x - SAFA.x, MARWAH.y - SAFA.y);
    this.saiUx = ux;
    this.saiUy = uy;
    this.saiNx = -uy;
    this.saiNy = ux;

    for (let i = 0; i < SAI_COUNT; i++) {
      const idx = TAWAF_COUNT + i;
      const dir = i % 2 === 0 ? 1 : -1;
      const laneOffset = dir > 0 ? 2.2 + Math.random() * 8.6 : -2.2 - Math.random() * 8.6;
      this.saiAgents.push({
        dir,
        progress: Math.random(),
        laneOffset,
        floorZ: Math.random() < 0.72 ? 0.6 : 8.2,
        speed: 0.0011 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2
      });
      color.setHSL(0.09, 0.08, 0.9 + Math.random() * 0.09);
      if (Math.random() < 0.14) color.setHSL(0.55, 0.18, 0.14 + Math.random() * 0.1);
      this.crowd.setColorAt(idx, color);
    }

    // jamaah statis: Mina & Arafah
    for (let i = 0; i < MINA_STATIC + ARAFAH_STATIC; i++) {
      const idx = TAWAF_COUNT + SAI_COUNT + i;
      const inMina = i < MINA_STATIC;
      const base = inMina ? ZONES.mina.center : ZONES.arafah.center;
      const spanX = inMina ? 210 : 250;
      const spanY = inMina ? 160 : 140;
      dummy.position.set(
        base.x + (Math.random() - 0.5) * spanX,
        inMina ? base.y - 150 + Math.random() * spanY : base.y + (Math.random() - 0.5) * spanY,
        0.15
      );
      dummy.rotation.set(0, 0, Math.random() * Math.PI * 2);
      const s = 0.9 + Math.random() * 0.2;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.crowd.setMatrixAt(idx, dummy.matrix);
      color.setHSL(0.09, 0.06, 0.9 + Math.random() * 0.08);
      this.crowd.setColorAt(idx, color);
    }
    dummy.scale.set(1, 1, 1);

    this.crowd.instanceColor.needsUpdate = true;
    this.crowd.instanceMatrix.needsUpdate = true;
    this._crowdDummy = dummy;
    this._crowdColor = color;
  }

  _updateCrowd(dt, elapsed) {
    if (!this.crowd.visible) return;
    const dummy = this._crowdDummy;
    const speedMul = this.crowdSpeed || 1;

    for (let i = 0; i < TAWAF_COUNT; i++) {
      const ag = this.tawafAgents[i];
      ag.angle += ag.speed * dt * speedMul;
      const bob = Math.abs(Math.sin(elapsed * 6.5 + ag.phase)) * 0.07;
      dummy.position.set(Math.cos(ag.angle) * ag.r, Math.sin(ag.angle) * ag.r, ag.z + bob);
      dummy.rotation.set(0, 0, ag.angle + Math.PI / 2);
      dummy.updateMatrix();
      this.crowd.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < SAI_COUNT; i++) {
      const idx = TAWAF_COUNT + i;
      const ag = this.saiAgents[i];
      const inGreen = ag.progress > 0.2 && ag.progress < 0.32;
      ag.progress += ag.dir * ag.speed * (dt * 60) * speedMul * (inGreen ? 1.5 : 1);
      if (ag.progress > 1) {
        ag.progress = 1;
        ag.dir = -1;
        ag.laneOffset = -Math.abs(ag.laneOffset);
      } else if (ag.progress < 0) {
        ag.progress = 0;
        ag.dir = 1;
        ag.laneOffset = Math.abs(ag.laneOffset);
      }
      const px = SAFA.x + (MARWAH.x - SAFA.x) * ag.progress + this.saiNx * ag.laneOffset;
      const py = SAFA.y + (MARWAH.y - SAFA.y) * ag.progress + this.saiNy * ag.laneOffset;
      const bob = Math.abs(Math.sin(elapsed * (inGreen ? 11 : 6.5) + ag.phase)) * 0.08;
      dummy.position.set(px, py, ag.floorZ + bob);
      dummy.rotation.set(0, 0, Math.atan2(this.saiUy * ag.dir, this.saiUx * ag.dir));
      dummy.updateMatrix();
      this.crowd.setMatrixAt(idx, dummy.matrix);
    }

    this.crowd.instanceMatrix.needsUpdate = true;
  }

  /* ====================================================================== */
  /* Jamarat                                                                */
  /* ====================================================================== */
  _buildJamarat() {
    for (const j of JAMARAT) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd9d2c2,
        roughness: 0.72,
        metalness: 0.04
      });
      const parts = [];
      const base = new THREE.BoxGeometry(24, 46, 3.4);
      base.translate(0, 0, 1.7);
      parts.push(base);
      const shaft = new THREE.BoxGeometry(13, 40, 10.5);
      shaft.translate(0, 0, 8.6);
      parts.push(shaft);

      const geom = BufferGeometryUtils.mergeGeometries(parts, false);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(j.pos.x, j.pos.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.jamrahId = j.id;
      mesh.name = `jamrah-${j.id}`;
      this.scene.add(mesh);
      this.jamaratMeshes.push(mesh);

      // landasan (silinder Y-up harus dimiringkan agar rebah di lantai)
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(26, 26, 0.4, 24),
        new THREE.MeshStandardMaterial({ color: 0xb9b2a3, roughness: 0.95 })
      );
      pad.rotation.x = Math.PI / 2;
      pad.position.set(j.pos.x, j.pos.y, 0.15);
      pad.receiveShadow = true;
      this.scene.add(pad);
    }
  }

  highlightJamarah(id, on = true) {
    for (const mesh of this.jamaratMeshes) {
      if (mesh.userData.jamrahId !== id) continue;
      mesh.material.emissive.setHex(on ? 0x6b5a1f : 0x000000);
      mesh.material.emissiveIntensity = on ? 0.85 : 0;
    }
  }

  clearJamarahHighlight() {
    for (const mesh of this.jamaratMeshes) {
      mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
    }
  }

  pickJamarah(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.jamaratMeshes, false);
    return hits.length ? hits[0].object.userData.jamrahId : null;
  }

  throwPebble(targetPos) {
    const mesh = new THREE.Mesh(this.pebbleGeometry, this.pebbleMaterial);
    const from = this.avatar.position.clone().add(new THREE.Vector3(0, 0, 1.6));
    const to = targetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0));
    mesh.position.copy(from);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.pebbles.push({ mesh, from, to, t: 0, dur: 0.5 + Math.random() * 0.15 });
  }

  _updatePebbles(dt) {
    for (let i = this.pebbles.length - 1; i >= 0; i--) {
      const p = this.pebbles[i];
      p.t += dt / p.dur;
      if (p.t >= 1) {
        this.scene.remove(p.mesh);
        this.pebbles.splice(i, 1);
        continue;
      }
      const t = p.t;
      p.mesh.position.lerpVectors(p.from, p.to, t);
      p.mesh.position.z += Math.sin(t * Math.PI) * 3.2;
    }
  }

  /* ====================================================================== */
  /* pencahayaan & waktu                                                    */
  /* ====================================================================== */
  setTimeOfDay(hour) {
    this.timeOfDay = hour;
    const day = THREE.MathUtils.clamp(Math.sin(((hour - 5.3) / 13.9) * Math.PI), 0, 1);
    const elevation = THREE.MathUtils.degToRad(-12 + day * 78);
    const azimuth = -((hour - 5.3) / 13.9) * Math.PI;
    const radius = 1000;

    this.sunLight.position.set(
      Math.cos(elevation) * Math.cos(azimuth) * radius,
      Math.cos(elevation) * Math.sin(azimuth) * radius,
      Math.sin(elevation) * radius
    );
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.intensity = 0.14 + day * 2.35;
    this.hemiLight.intensity = 0.4 + day * 0.42;
    this.hemiLight.color.setHex(day > 0.35 ? 0xfff4e2 : 0x9fb4d6);
    this.fillLight.intensity = 0.18 + day * 0.3;
    this.ambientLight.intensity = 0.14 + day * 0.06;

    const night = new THREE.Color(0x081120);
    const dawn = new THREE.Color(0x6b5a44);
    const noon = new THREE.Color(0x8fbedd);
    const bg = new THREE.Color();
    if (day < 0.18) bg.lerpColors(night, dawn, day / 0.18);
    else bg.lerpColors(dawn, noon, Math.min(1, (day - 0.18) / 0.55));

    if (this.scene.background?.isColor) this.scene.background.copy(bg);
    this.scene.fog.color.copy(bg);

    MATERIALS.sky.emissiveIntensity = 1.7 - day * 1.2;
    MATERIALS.gold.emissiveIntensity = 0.9 - day * 0.55;
    MATERIALS.chandelier.emissiveIntensity = 1.9 - day * 1.15;
    MATERIALS.green_mile.emissiveIntensity = 1.5 - day * 0.85;
    MATERIALS.clock_face.emissiveIntensity = 2.1 - day * 1.3;
    MATERIALS.lamp.emissiveIntensity = 1.8 - day * 0.9;

    // Bintang menyala saat malam
    if (this.starfield && this.starfield.material) {
      const starOpacity = THREE.MathUtils.clamp((0.26 - day) / 0.26, 0, 0.95);
      this.starfield.material.opacity = starOpacity;
    }

    return day;
  }

  _buildStarfield() {
    const count = 1000;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3600;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = Math.abs(r * Math.cos(phi)) + 120;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 9.0,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });
    return new THREE.Points(geom, mat);
  }

  setCameraMode(mode) {
    this.cameraMode = mode === 'fpv' ? 'fpv' : 'drone';
    if (this.avatar) {
      this.avatar.visible = (this.cameraMode !== 'fpv');
    }
    return this.cameraMode;
  }

  toggleCameraMode() {
    return this.setCameraMode(this.cameraMode === 'drone' ? 'fpv' : 'drone');
  }

  setCutaway(on) {
    this.roofGroup.visible = !on;
  }

  setCrowdVisible(on) {
    this.crowd.visible = on;
  }

  setCrowdSpeed(mul) {
    this.crowdSpeed = mul;
  }

  setBridgeVisible(on) {
    this.bridgeGroup.visible = on;
  }

  setInteriorVisible(on) {
    this.interiorGroup.visible = on;
    this.bridgeGroup.visible = on;
  }

  setContextVisible(on) {
    this.contextGroup.visible = on;
  }

  /* ====================================================================== */
  /* avatar & kamera                                                        */
  /* ====================================================================== */
  setAvatarGender(gender, options = {}) {
    this._avatarGender = gender;
    this._avatarOptions = { ...(this._avatarOptions || {}), ...options };
    const pos = this.avatar ? this.avatar.position.clone() : new THREE.Vector3(0, -TAWAF_RADIUS, 0.02);
    if (this.avatar) this.scene.remove(this.avatar);
    this.avatar = createPilgrimAvatar(gender, this._avatarOptions);
    this.avatar.position.copy(pos);
    this.avatar.rotation.z = this._avatarRot || 0;
    this.avatar.visible = (this.cameraMode !== 'fpv');
    this.scene.add(this.avatar);
  }

  setAvatarOptions(options = {}) {
    this.setAvatarGender(this._avatarGender || 'male', options);
  }

  loadCustomGLBAvatar(url, onLoadSuccess, onLoadError) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.74 / (size.z > 0.5 ? size.z : maxDim || 1);
        model.scale.setScalar(scale);

        box.setFromObject(model);
        model.position.z -= box.min.z;

        const group = new THREE.Group();
        group.name = 'avatar';
        group.add(model);

        const locator = new THREE.Mesh(
          new THREE.RingGeometry(0.75, 1.35, 32),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        locator.position.z = 0.08;
        locator.name = 'locator';
        group.add(locator);

        const pinGroup = new THREE.Group();
        pinGroup.name = 'pin';
        pinGroup.position.set(0, 0, 2.22);
        const pinCone = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.42, 6),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        pinCone.rotation.x = Math.PI;
        pinGroup.add(pinCone);
        group.add(pinGroup);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          group.animate = (dt, elapsed, speed) => {
            mixer.update(dt);
            pinGroup.rotation.z = elapsed * 1.8;
          };
        } else {
          group.animate = (dt, elapsed, speed) => {
            pinGroup.rotation.z = elapsed * 1.8;
          };
        }

        const prevPos = this.avatar ? this.avatar.position.clone() : new THREE.Vector3(0, -TAWAF_RADIUS, 0.02);
        const prevRot = this._avatarRot || 0;
        if (this.avatar) this.scene.remove(this.avatar);
        this.avatar = group;
        this.avatar.position.copy(prevPos);
        this.avatar.rotation.z = prevRot;
        this.avatar.visible = (this.cameraMode !== 'fpv');
        this.scene.add(this.avatar);

        onLoadSuccess?.(model);
      },
      undefined,
      (err) => {
        console.error('Failed to load custom GLB avatar', err);
        onLoadError?.(err);
      }
    );
  }

  setAvatarPosition(x, y, z = 0.02) {
    this.avatar.position.set(x, y, z);
  }

  faceAvatarTowards(dx, dy) {
    this._avatarRot = Math.atan2(dy, dx) + Math.PI / 2;
    if (this.avatar) this.avatar.rotation.z = this._avatarRot;
  }

  startFollow(offset) {
    this.following = true;
    this.tween = null;
    if (offset) this.followOffset.copy(offset);
  }

  stopFollow() {
    this.following = false;
  }

  setFollowOffset(x, y, z) {
    this.followOffset.set(x, y, z);
  }

  _updateFollow(dt) {
    if (!this.following) return;
    const target = this._followTarget.copy(this.avatar.position).add(this.lookOffset);
    const delta = target.clone().sub(this.controls.target).multiplyScalar(Math.min(1, dt * 7));
    this.controls.target.add(delta);
    this.camera.position.add(delta);
  }

  flyTo(view, opts = {}) {
    const v = typeof view === 'string' ? VIEWS[view] : view;
    if (!v) return;
    this.following = false;
    this.tween = {
      startPos: this.camera.position.clone(),
      endPos: new THREE.Vector3(...v.pos),
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(...v.target),
      startFov: this.camera.fov,
      endFov: v.fov ?? this.camera.fov,
      t: 0,
      dur: opts.duration ?? 1.6
    };
  }

  flyToPoint(pos, target, fov = 45, duration = 1.6) {
    this.flyTo({ pos, target, fov }, { duration });
  }

  _updateTween(dt) {
    if (!this.tween) return;
    this.tween.t += dt / this.tween.dur;
    const raw = Math.min(1, this.tween.t);
    const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    this.camera.position.lerpVectors(this.tween.startPos, this.tween.endPos, t);
    this.controls.target.lerpVectors(this.tween.startTarget, this.tween.endTarget, t);
    this.camera.fov = THREE.MathUtils.lerp(this.tween.startFov, this.tween.endFov, t);
    this.camera.updateProjectionMatrix();
    if (raw >= 1) this.tween = null;
  }

  project(position, out = {}) {
    const v = position.clone().project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.container.clientWidth;
    out.y = (-v.y * 0.5 + 0.5) * this.container.clientHeight;
    out.visible = v.z < 1 && v.z > -1;
    out.distance = this.camera.position.distanceTo(position);
    return out;
  }

  /* ====================================================================== */
  /* loop                                                                   */
  /* ====================================================================== */
  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const elapsed = now / 1000;

    this._updateCrowd(dt, elapsed);
    this._updateFollow(dt);
    this._updateTween(dt);
    this._updatePebbles(dt);

    // langkah & animasi pergerakan avatar
    const moved = this.avatar.position.distanceToSquared(this._avatarPrev);
    const speed = Math.sqrt(moved) / Math.max(dt, 0.0001);
    this._avatarPrev.copy(this.avatar.position);
    const locator = this.avatar.getObjectByName('locator');
    if (locator) {
      locator.position.z = 0.06 + Math.abs(Math.sin(elapsed * 6)) * 0.02;
      locator.material.opacity = 0.55 + Math.abs(Math.sin(elapsed * 3)) * 0.3;
    }
    if (typeof this.avatar.animate === 'function') {
      this.avatar.animate(dt, elapsed, speed);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame(dt, elapsed);
  }

  dispose() {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
