/* eslint-disable */
/**
 * app.js — mesin simulasi manasik umrah & haji.
 */
import * as THREE from 'three';
import { World, VIEWS, ANCHORS } from './scene/world.js';
import { STEPS, REFERENCE, HAJJ_TIMELINE, TALBIYAH, DOA, HAJJ_TYPE_INFO, TAWAF_ZONES, TOUR_LOCATIONS } from './data.js';
import { JAMARAT, SAFA, MARWAH, TAWAF_RADIUS, TAWAF_START_ANGLE } from './scene/builders.js';
import { AudioManager } from './audio.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;

const audio = new AudioManager();

/* ============================================================================
 * State
 * ========================================================================== */
const state = {
  mode: 'umrah',
  hajjType: 'tamattu',
  gender: 'male',
  started: false,
  steps: [],
  stepIndex: 0,
  stepDone: false,
  completed: new Set(),
  zone: 'haram',
  clock: { day: 1, hour: 4.5, label: 'Miqat' },
  clockAnim: null,
  quiz: null,
  tawaf: null,
  sai: null,
  ramy: null,
  nafar: null,
  pebbles: 0,
  stats: { correct: 0, wrong: 0 },
  sound: true,
  labels: true,
  highlighted: null,
  tourLocation: null
};

let selectedMode = 'umrah';
let selectedHajjType = 'tamattu';
let selectedGender = 'male';

/* ============================================================================
 * DOM
 * ========================================================================== */
const el = {
  app: $('app'),
  intro: $('intro'),
  viewport: $('viewport'),
  labels: $('labels'),

  clockLabel: $('clock-label'),
  clockTime: $('clock-time'),
  brandSub: $('brand-sub'),

  btnCam: $('btn-cam'),
  btnFontSize: $('btn-font-size'),
  btnAvatar: $('btn-avatar'),
  btnSound: $('btn-sound'),

  stepPanel: $('step-panel'),
  stepPhase: $('step-phase'),
  stepCounter: $('step-counter'),
  stepTitle: $('step-title'),
  stepSub: $('step-sub'),
  stepBody: $('step-body'),
  stepDalil: $('step-dalil'),
  stepTip: $('step-tip'),
  stepQuiz: $('step-quiz'),
  stepAction: $('step-action'),
  stepScroll: $('step-scroll'),
  nextBtn: $('next-btn'),
  nextLabel: $('next-label'),

  sidePanel: $('side-panel'),
  sideList: $('step-list'),
  sideProgress: $('side-progress'),
  zoneName: $('zone-name'),

  hud: $('action-hud'),
  hudCount: $('hud-count'),
  hudTotal: $('hud-total'),
  hudTitle: $('hud-title'),
  hudSub: $('hud-sub'),
  hudBar: $('hud-bar-fill'),
  hudCamBtn: $('hud-cam-btn'),
  hudSpeed: $('hud-speed'),
  hudStop: $('hud-stop'),

  tawafDoaHud: $('tawaf-doa-hud'),
  tawafZoneBadge: $('tawaf-zone-badge'),
  tawafDoaArabic: $('tawaf-doa-arabic'),
  tawafDoaLatin: $('tawaf-doa-latin'),
  tawafDoaMeaning: $('tawaf-doa-meaning'),
  btnTawafDoaAudio: $('btn-tawaf-doa-audio'),
  doaAudioText: $('doa-audio-text'),
  doaWaveAnim: $('doa-wave-anim'),

  tourPanel: $('tour-panel'),
  tourChips: $('tour-chips'),
  tourCard: $('tour-card'),
  tourBadge: $('tour-badge'),
  tourTitle: $('tour-title'),
  tourDesc: $('tour-desc'),
  tourDoa: $('tour-doa'),
  btnCloseTour: $('btn-close-tour'),

  drawer: $('drawer'),
  drawerTabs: $('drawer-tabs'),
  drawerBody: $('drawer-body'),

  modal: $('modal'),
  modalCard: $('modal-card'),

  toast: $('toast'),
  hintBar: $('hint-bar')
};

/* ============================================================================
 * Three.js world
 * ========================================================================== */
let world;
try {
  world = new World(el.viewport);
  world.controls.autoRotate = true;
  world.controls.autoRotateSpeed = 0.32;
} catch (err) {
  console.error(err);
  document.body.innerHTML =
    '<div style="display:grid;place-items:center;height:100vh;color:#e9eef7;font-family:sans-serif;text-align:center;padding:24px">' +
    '<div><h1>WebGL tidak tersedia</h1><p>Browser Anda belum mendukung WebGL2. Coba Chrome/Edge terbaru.</p></div></div>';
  throw err;
}

world.onFrame = (dt) => {
  updateClockAnim(dt);
  if (state.tawaf?.active) updateTawaf(dt);
  if (state.sai?.active) updateSai(dt);
  updateLabels();
};

/* ============================================================================
 * Label nama tempat
 * ========================================================================== */
const ZONE_LABELS = {
  haram: ['kaaba', 'hijr', 'maqam', 'mataf', 'safa', 'marwah', 'abraj'],
  mina: ['mina', 'jamarat'],
  muzdalifah: ['muzdalifah'],
  arafah: ['arafah']
};

const labelItems = ANCHORS.map((a) => {
  const node = document.createElement('div');
  node.className = 'map-label';
  node.innerHTML = `
    <div class="card">
      <div class="t">${a.title}</div>
      <div class="s">${a.sub}</div>
    </div>
    <div class="stem"></div>`;
  el.labels.appendChild(node);
  return { ...a, node };
});

function updateLabels() {
  if (!state.started) {
    for (const it of labelItems) it.node.style.opacity = '0';
    return;
  }
  const wanted = ZONE_LABELS[state.zone] || [];
  const candidates = [];

  for (const it of labelItems) {
    if (!state.labels || !wanted.includes(it.id)) {
      it.node.style.opacity = '0';
      continue;
    }
    const p = world.project(it.pos, {});
    if (!p.visible || p.distance > 1600 || p.distance < 18) {
      it.node.style.opacity = '0';
      continue;
    }
    if (p.x < 72 || p.x > window.innerWidth - 72) {
      it.node.style.opacity = '0';
      continue;
    }
    candidates.push({ it, p });
  }

  candidates.sort((a, b) => a.p.distance - b.p.distance);

  const placed = [];
  for (const { it, p } of candidates) {
    const w = it.node.offsetWidth || 160;
    const h = it.node.offsetHeight || 46;
    const rect = { x: p.x - w / 2 - 4, y: p.y - h - 4, w: w + 8, h: h + 8 };
    const hit = placed.some(
      (r) =>
        rect.x < r.x + r.w &&
        rect.x + rect.w > r.x &&
        rect.y < r.y + r.h &&
        rect.y + rect.h > r.y
    );
    if (hit) {
      it.node.style.opacity = '0';
      continue;
    }
    placed.push(rect);
    it.node.style.left = `${p.x}px`;
    it.node.style.top = `${p.y}px`;
    it.node.style.opacity = p.distance > 1100 ? '0.5' : '1';
  }
}

/* ============================================================================
 * Suara & Audio
 * ========================================================================== */
const sfx = {
  click: () => audio.sfxClick(),
  correct: () => audio.sfxCorrect(),
  wrong: () => audio.sfxWrong(),
  lap: () => audio.sfxLap(),
  pebble: () => audio.sfxPebble(),
  done: () => audio.sfxDone()
};

audio.onDoaPlayStateChange = (isPlaying) => {
  document.querySelectorAll('.doa-audio-pill').forEach((btn) => {
    btn.classList.toggle('playing', isPlaying);
  });
  if (el.btnTawafDoaAudio && el.doaAudioText) {
    el.doaAudioText.textContent = isPlaying ? 'Jeda' : 'Dengar';
  }
};

/* ============================================================================
 * Util
 * ========================================================================== */
function pad(n) { return String(n).padStart(2, '0'); }

function formatHour(h) {
  const total = Math.round(((h % 24) + 24) % 24 * 60);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

function defaultClockLabel(day) {
  return state.mode === 'hajj' ? `${day} Dzulhijjah 1447 H` : 'Hari Umrah';
}

function setClock(day, hour, label) {
  state.clock.day = day;
  state.clock.hour = hour;
  if (label) state.clock.label = label;
  const text = state.clock.label || defaultClockLabel(day);
  el.clockLabel.textContent = state.mode === 'umrah' ? `Umrah • ${text}` : text;
  el.clockTime.textContent = formatHour(hour);
  world.setTimeOfDay(hour);
}

function animateClock(toDay, toHour, seconds, onDone) {
  state.clockAnim = {
    fromDay: state.clock.day,
    fromHour: state.clock.hour,
    toDay,
    toHour,
    t: 0,
    dur: Math.max(0.4, seconds),
    onDone
  };
}

function updateClockAnim(dt) {
  const a = state.clockAnim;
  if (!a) return;
  a.t += dt;
  const p = Math.min(1, a.t / a.dur);
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const span = (a.toDay - a.fromDay) * 24 + (a.toHour - a.fromHour);
  const hrs = a.fromHour + span * e;
  const day = a.fromDay + Math.floor(hrs / 24);
  const hour = ((hrs % 24) + 24) % 24;
  setClock(day, hour);
  if (p >= 1) {
    setClock(a.toDay, a.toHour);
    state.clockAnim = null;
    a.onDone?.();
  }
}

let toastTimer = null;
function toast(msg, type = 'ok') {
  el.toast.textContent = msg;
  el.toast.className = `toast show${type === 'error' ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.className = 'toast';
  }, 2800);
}

function visibleSteps() {
  return state.steps.filter((s) => !s.when || s.when(state));
}

function isVisible(step) {
  return !step.when || step.when(state);
}

function findNext(index) {
  for (let i = index; i < state.steps.length; i++) {
    if (isVisible(state.steps[i])) return i;
  }
  return -1;
}

function current() {
  return state.steps[state.stepIndex];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================================
 * Mulai / keluar
 * ========================================================================== */
function startSimulation(mode, gender, hajjType = 'tamattu') {
  if (mode === 'tour') {
    startTourMode(gender);
    return;
  }

  state.mode = mode;
  state.hajjType = mode === 'hajj' ? hajjType : null;
  state.gender = gender;
  state.started = true;
  state.steps = mode === 'hajj' ? STEPS.hajj[hajjType] : STEPS.umrah;
  state.stepIndex = 0;
  state.stepDone = false;
  state.completed = new Set();
  state.stats = { correct: 0, wrong: 0 };
  state.nafar = null;
  state.pebbles = 0;
  state.clockAnim = null;
  state.tawaf = null;
  state.sai = null;
  state.ramy = null;

  world.setAvatarGender(gender);
  world.controls.autoRotate = false;

  el.intro.hidden = true;
  el.app.hidden = false;
  el.stepPanel.hidden = false;
  el.sidePanel.hidden = false;
  if (el.tourPanel) el.tourPanel.hidden = true;
  el.brandSub.textContent =
    mode === 'hajj'
      ? `Haji ${HAJJ_TYPE_INFO[hajjType].label} • 3D`
      : 'Simulasi Umrah • 3D';
  el.hintBar && (el.hintBar.hidden = false);

  audio.ensureContext();
  audio.startAmbience('haram');
  sfx.done();
  loadStep(0);
}

function startTourMode(gender = 'male') {
  state.mode = 'tour';
  state.started = true;
  state.gender = gender;
  world.setAvatarGender(gender);
  world.controls.autoRotate = true;
  world.controls.autoRotateSpeed = 0.24;

  el.intro.hidden = true;
  el.app.hidden = false;
  el.stepPanel.hidden = true;
  el.sidePanel.hidden = true;
  el.hud.hidden = true;
  el.tawafDoaHud.hidden = true;
  if (el.tourPanel) el.tourPanel.hidden = false;
  el.brandSub.textContent = 'Jelajah 3D Bebas • Tur Virtual';

  renderTourChips();
  selectTourLocation(TOUR_LOCATIONS[0].id);
  audio.ensureContext();
  audio.startAmbience('haram');
  sfx.done();
}

function exitToMenu() {
  audio.stopAll();
  world.setCameraMode('drone');
  world.controls.autoRotate = false;
  state.started = false;
  state.mode = null;
  state.tawaf = null;
  state.sai = null;
  state.ramy = null;
  if (el.hudCamBtn) el.hudCamBtn.textContent = '🎥 Mata';
  if (el.btnCam) el.btnCam.classList.remove('active');
  el.app.hidden = true;
  el.intro.hidden = false;
  if (el.tourPanel) el.tourPanel.hidden = true;
  if (el.tawafDoaHud) el.tawafDoaHud.hidden = true;
  if (el.hud) el.hud.hidden = true;
  if (el.stepPanel) el.stepPanel.hidden = true;
  if (el.sidePanel) el.sidePanel.hidden = true;
  world.flyTo('overview', 1.2);
  toast('Kembali ke menu utama');
}

function renderTourChips() {
  if (!el.tourChips) return;
  el.tourChips.innerHTML = `
    <button class="tour-chip tour-chip-menu" id="btn-tour-menu" title="Kembali ke menu utama">
      ← Menu
    </button>
  ` + TOUR_LOCATIONS.map((loc, idx) => `
    <button class="tour-chip${idx === 0 ? ' active' : ''}" data-tour="${loc.id}">
      ${loc.title.split(' ')[0]}
    </button>
  `).join('');

  $('btn-tour-menu')?.addEventListener('click', () => {
    sfx.click();
    exitToMenu();
  });

  el.tourChips.querySelectorAll('.tour-chip[data-tour]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.click();
      selectTourLocation(btn.dataset.tour);
    });
  });
}

function selectTourLocation(id) {
  const loc = TOUR_LOCATIONS.find((l) => l.id === id);
  if (!loc) return;

  state.tourLocation = id;
  el.tourChips?.querySelectorAll('.tour-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tour === id);
  });

  world.flyToPoint(loc.pos, loc.target, loc.fov || 45, 1.8);
  setZone(loc.zone || 'haram');

  if (el.tourBadge) el.tourBadge.textContent = loc.badge;
  if (el.tourTitle) el.tourTitle.textContent = loc.title;
  if (el.tourDesc) el.tourDesc.textContent = loc.desc;

  if (el.tourDoa) {
    if (loc.doa) {
      el.tourDoa.innerHTML = `
        <div class="talbiyah" style="margin-top:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;font-weight:700;color:var(--amber)">${loc.doa.title}</span>
            <button class="doa-audio-pill" id="btn-tour-doa-audio">
              <span>🔊 Dengar</span>
            </button>
          </div>
          <div class="talbiyah-arabic" style="font-size:20px">${loc.doa.arabic}</div>
          <div class="talbiyah-latin">${loc.doa.latin}</div>
          <div class="talbiyah-meaning">“${loc.doa.meaning}”</div>
        </div>
      `;
      $('btn-tour-doa-audio')?.addEventListener('click', () => {
        audio.toggleDoaAudio(loc.doa, () => {});
      });
    } else {
      el.tourDoa.innerHTML = '';
    }
  }
}

function jumpToStep(index) {
  const step = state.steps[index];
  if (!step) return;
  if (step.time) setClock(step.time.day, step.time.hour, step.time.label);
  loadStep(index);
}

/* Posisi avatar + kamera untuk tiap jenis tahap */
function prepareScene(step) {
  world.controls.enabled = true;
  world.controls.autoRotate = false;
  world.tween = null;
  world.clearJamarahHighlight();

  switch (step.kind) {
    case 'tawaf': {
      const a = TAWAF_START_ANGLE;
      world.setAvatarPosition(Math.cos(a) * TAWAF_RADIUS, Math.sin(a) * TAWAF_RADIUS, 0.06);
      world.faceAvatarTowards(-Math.sin(a), Math.cos(a));
      world.flyTo('kaaba', { duration: 1.8 });
      break;
    }
    case 'sai': {
      world.setAvatarPosition(SAFA.x, SAFA.y, 0.06);
      world.faceAvatarTowards(MARWAH.x - SAFA.x, MARWAH.y - SAFA.y);
      world.flyTo('masaa', { duration: 1.8 });
      break;
    }
    case 'ramy': {
      const ids = step.ramy.targets;
      const pts = JAMARAT.filter((j) => ids.includes(j.id));
      const cx = pts.reduce((sum, p) => sum + p.pos.x, 0) / pts.length;
      world.setAvatarPosition(cx, 15, 0.06);
      world.faceAvatarTowards(0, 1);
      world.flyToPoint([cx, -140, 40], [cx, 72, 7], 50, 1.8);
      break;
    }
    case 'wukuf': {
      world.setAvatarPosition(2500, 40, 0.06);
      world.faceAvatarTowards(0, 1);
      world.flyToPoint([2500, -390, 145], [2500, 165, 20], 50, 1.8);
      break;
    }
    case 'mabit': {
      world.setAvatarPosition(1080, -80, 0.06);
      world.flyTo('mina', { duration: 1.8 });
      break;
    }
    case 'pebbles': {
      world.setAvatarPosition(1790, 20, 0.06);
      world.flyTo('muzdalifah', { duration: 1.8 });
      break;
    }
    default: {
      if (step.view) world.flyTo(step.view, { duration: 1.8 });
      break;
    }
  }
}

/* ============================================================================
 * Render langkah
 * ========================================================================== */
function loadStep(index) {
  const step = state.steps[index];
  if (!step) return;

  state.stepIndex = index;
  state.stepDone = false;
  state.quiz = null;
  state.tawaf = null;
  state.sai = null;
  state.ramy = null;
  state.clockAnim = null;

  world.clearJamarahHighlight();
  state.highlighted = null;

  if (step.time) setClock(step.time.day, step.time.hour, step.time.label);
  setZone(step.zone || 'haram');

  el.stepPhase.textContent = step.phase;
  el.stepTitle.textContent = step.title;
  el.stepSub.textContent = step.subtitle || '';
  el.stepCounter.textContent = `${visibleSteps().indexOf(step) + 1} / ${visibleSteps().length}`;

  el.stepBody.innerHTML = (step.body || []).map((p) => `<p>${p}</p>`).join('');
  renderDalil(step.dalil);
  renderTip(step.tip);

  el.stepQuiz.innerHTML = '';
  el.stepAction.innerHTML = '';
  el.nextBtn.disabled = true;
  el.nextLabel.textContent = step.kind === 'finish' ? 'Lihat ringkasan' : 'Lanjut';
  el.stepScroll.scrollTop = 0;

  prepareScene(step);
  renderKind(step);
  renderSidebar();
}

function setZone(zone) {
  state.zone = zone;
  const names = {
    haram: 'Masjidil Haram',
    mina: 'Mina • Jamarat',
    muzdalifah: 'Muzdalifah',
    arafah: 'Padang Arafah'
  };
  el.zoneName.textContent = names[zone] || 'Masjidil Haram';
  audio.startAmbience(zone);
}

function renderDalil(dalil) {
  if (!dalil) {
    el.stepDalil.innerHTML = '';
    return;
  }
  el.stepDalil.innerHTML = `
    <div class="dalil">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="dalil-source" style="margin-top:0">${dalil.source}</div>
        <button class="doa-audio-pill" id="btn-dalil-audio" title="Dengarkan bacaan ayat">
          <span>🔊 Dengar</span>
        </button>
      </div>
      <div class="dalil-arabic">${dalil.arabic}</div>
      <div class="dalil-latin">${dalil.latin}</div>
      <div class="dalil-meaning">“${dalil.meaning}”</div>
    </div>`;
  el.stepDalil.querySelector('#btn-dalil-audio')?.addEventListener('click', () => {
    audio.toggleDoaAudio(dalil, () => {});
  });
}

function renderTip(tip) {
  el.stepTip.innerHTML = tip ? `<div class="tip">${tip}</div>` : '';
}

function renderKind(step) {
  switch (step.kind) {
    case 'info': return renderInfo(step);
    case 'quiz': return renderQuiz(step);
    case 'tawaf': return renderTawaf(step);
    case 'sai': return renderSai(step);
    case 'ramy': return renderRamy(step);
    case 'wukuf': return renderWukuf(step);
    case 'mabit': return renderMabit(step);
    case 'pebbles': return renderPebbles(step);
    case 'halq': return renderHalq(step);
    case 'nafar': return renderNafar(step);
    case 'finish': return renderFinish(step);
    default: return renderInfo(step);
  }
}

function markDone() {
  state.stepDone = true;
  el.nextBtn.disabled = false;
}

/* ------------------------------- info ------------------------------------ */
function renderInfo(step) {
  let html = '';
  if (step.talbiyah) {
    html += `
      <div class="talbiyah">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;font-weight:700;color:var(--amber)">Lafaz Talbiyah</span>
          <button class="doa-audio-pill" id="btn-talbiyah-audio" title="Dengarkan talbiyah">
            <span>🔊 Dengar</span>
          </button>
        </div>
        <div class="talbiyah-arabic">${TALBIYAH.arabic}</div>
        <div class="talbiyah-latin">${TALBIYAH.latin}</div>
        <div class="talbiyah-meaning">${TALBIYAH.meaning}</div>
        <div class="talbiyah-actions">
          <button class="chip" id="btn-talbiyah">Buka Talbiyah</button>
        </div>
      </div>`;
  }
  if (step.doa && DOA[step.doa]) {
    const d = DOA[step.doa];
    html += `
      <div class="talbiyah">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;font-weight:700;color:var(--amber)">${d.title}</span>
          <button class="doa-audio-pill" id="btn-doa-audio" title="Dengarkan doa">
            <span>🔊 Dengar</span>
          </button>
        </div>
        <div class="talbiyah-arabic">${d.arabic}</div>
        <div class="talbiyah-latin">${d.latin}</div>
        <div class="talbiyah-meaning">${d.meaning}</div>
      </div>`;
  }
  el.stepAction.innerHTML = html;
  el.stepAction.querySelector('#btn-talbiyah-audio')?.addEventListener('click', () => {
    audio.toggleDoaAudio(TALBIYAH, () => {});
  });
  el.stepAction.querySelector('#btn-doa-audio')?.addEventListener('click', () => {
    audio.toggleDoaAudio(DOA[step.doa], () => {});
  });
  el.stepAction.querySelector('#btn-talbiyah')?.addEventListener('click', () => {
    openTalbiyah();
  });
  markDone();
}

/* -------------------------------- quiz ----------------------------------- */
function renderQuiz(step) {
  const quiz = step.quiz;
  const options = shuffle(quiz.options);
  state.quiz = { solved: false, options, attempts: 0 };

  const html = `
    <div class="quiz">
      <div class="quiz-q">${quiz.question}</div>
      <div class="quiz-opts" id="quiz-opts"></div>
      <div id="quiz-feedback"></div>
    </div>`;

  el.stepQuiz.innerHTML = html;
  const wrap = $('quiz-opts');

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.innerHTML = `<span class="key">${'ABCD'[i]}</span><span>${opt.text}</span>`;
    btn.addEventListener('click', () => onQuizAnswer(btn, opt, step));
    wrap.appendChild(btn);
  });
}

function onQuizAnswer(btn, opt, step) {
  const quiz = state.quiz;
  if (!quiz || quiz.solved) return;

  if (opt.ok) {
    quiz.solved = true;
    state.stats.correct++;
    sfx.correct();
    btn.classList.add('correct');
    document.querySelectorAll('#quiz-opts .quiz-opt').forEach((b) => (b.disabled = true));
    const box = $('quiz-feedback');
    box.innerHTML = `<div class="quiz-explain">${step.quiz.explain}</div>`;
    markDone();
  } else {
    state.stats.wrong++;
    quiz.attempts++;
    sfx.wrong();
    btn.classList.add('wrong');
    btn.disabled = true;
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    const box = $('quiz-feedback');
    box.innerHTML = `<div class="quiz-feedback">${opt.feedback}</div>`;
  }
}

/* -------------------------------- tawaf ---------------------------------- */
function renderTawaf(step) {
  const cfg = step.tawaf || { laps: 7, ramlLaps: 0 };
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint">
        ${cfg.ifadah ? 'Tawaf ifadah (rukun haji)' : cfg.qudum ? 'Tawaf qudum (sunnah)' : cfg.wada ? 'Tawaf wada\'' : 'Tawaf umrah'}
        • ${cfg.laps} putaran • arah berlawanan jarum jam
      </div>
      <button class="action-btn" id="act-start">Mulai tawaf</button>
      <div class="action-hint">Ka'bah harus selalu berada di sisi kiri Anda.</div>
    </div>`;
  $('act-start').addEventListener('click', () => startTawaf(step));
}

let activeTawafZone = null;
let currentActiveDoa = null;

function updateTawafDoaTicker(frac) {
  let matched = TAWAF_ZONES[0];
  for (const z of TAWAF_ZONES) {
    if (z.minFrac > z.maxFrac) {
      if (frac >= z.minFrac || frac < z.maxFrac) { matched = z; break; }
    } else if (frac >= z.minFrac && frac < z.maxFrac) {
      matched = z;
      break;
    }
  }
  if (activeTawafZone !== matched) {
    activeTawafZone = matched;
    currentActiveDoa = matched;
    if (el.tawafZoneBadge) el.tawafZoneBadge.textContent = matched.name;
    if (el.tawafDoaArabic) el.tawafDoaArabic.textContent = matched.arabic;
    if (el.tawafDoaLatin) el.tawafDoaLatin.textContent = matched.latin;
    if (el.tawafDoaMeaning) el.tawafDoaMeaning.textContent = `“${matched.meaning}”`;
  }
}

function startTawaf(step) {
  const cfg = step.tawaf || { laps: 7, ramlLaps: 0 };
  state.tawaf = {
    active: true,
    paused: false,
    theta: TAWAF_START_ANGLE,
    laps: 0,
    total: cfg.laps,
    speed: 2.0,
    ramlLaps: cfg.ramlLaps || 0,
    ifadah: !!cfg.ifadah,
    qudum: !!cfg.qudum,
    wada: !!cfg.wada
  };

  world.tween = null;
  world.controls.enabled = true;
  world.controls.autoRotate = false;

  // Jika bukan FPV, arahkan kamera ke sudut tinjauan atas yang kokoh mengarah ke Ka'bah
  if (world.cameraMode !== 'fpv') {
    world.flyToPoint([0, -78, 52], [0, 0, 6], 46, 1.0);
  }

  el.hud.hidden = false;
  if (el.tawafDoaHud) {
    el.tawafDoaHud.hidden = false;
    updateTawafDoaTicker(0);
  }

  el.hudTotal.textContent = `/ ${cfg.laps}`;
  el.hudTitle.textContent = cfg.ifadah ? 'Tawaf ifadah' : cfg.qudum ? 'Tawaf qudum' : cfg.wada ? 'Tawaf wada\'' : 'Tawaf';
  el.hudSub.textContent = "Ka'bah di sisi kiri • hitung putaran";
  el.hudCount.textContent = '0';
  el.hudBar.style.width = '0%';
  el.hudSpeed.textContent = '2.0×';

  renderTawafProgress();
  sfx.click();
}

function renderTawafProgress() {
  const t = state.tawaf;
  if (!t) return;
  const pct = (t.laps / t.total) * 100;
  const raml = t.laps < t.ramlLaps;
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="live">
        <div class="live-row">
          <div class="live-count"><b>${t.laps}</b><span>/ ${t.total}</span></div>
          <div class="live-meta">
            <div class="live-title">Putaran tawaf</div>
            <div class="live-sub">${t.paused ? 'Dijeda' : raml ? 'Raml — jalan cepat (sunah 3 putaran pertama)' : "Ka'bah di sisi kiri"}</div>
          </div>
        </div>
        <div class="hud-bar"><i style="width:${pct}%"></i></div>
      </div>
    </div>`;
}

function updateTawaf(dt) {
  const t = state.tawaf;
  if (!t || !t.active) return;
  if (t.paused) return;

  const boost = t.laps < t.ramlLaps ? 1.12 : 1;
  t.theta += (TAU / 10) * t.speed * boost * dt;

  const progress = (t.theta - TAWAF_START_ANGLE) / TAU;
  const lapFrac = ((progress % 1) + 1) % 1;
  updateTawafDoaTicker(lapFrac);

  const laps = Math.min(t.total, Math.floor(progress));
  if (laps !== t.laps) {
    t.laps = laps;
    if (laps > 0) sfx.lap();
    el.hudCount.textContent = String(laps);
    el.hudBar.style.width = `${(laps / t.total) * 100}%`;
    renderTawafProgress();
  }

  const c = Math.cos(t.theta);
  const s = Math.sin(t.theta);
  world.setAvatarPosition(c * TAWAF_RADIUS, s * TAWAF_RADIUS, 0.06);
  world.faceAvatarTowards(-s, c);

  if (world.cameraMode === 'fpv') {
    // Mode Mata Jamaah: tinggi 1.65m, pandangan maju & condong ke Ka'bah di kiri
    const camPos = new THREE.Vector3(c * TAWAF_RADIUS, s * TAWAF_RADIUS, 1.65);
    const forwardX = -s * 0.74 - c * 0.26;
    const forwardY = c * 0.74 - s * 0.26;
    const lookTarget = new THREE.Vector3(
      camPos.x + forwardX * 22,
      camPos.y + forwardY * 22,
      2.8
    );
    const k = 1 - Math.exp(-dt * 6.0);
    world.camera.position.lerp(camPos, k);
    world.controls.target.lerp(lookTarget, k);
  }
  // Pada mode Drone / Tinjauan Atas: Ka'bah TETAP DIAM & KOKOH di tengah layar!
  // Hanya avatar dan kerumunan yang berputar mengelilingi Ka'bah.
  // Kamera tidak dipaksa ikut berputar 360°, sehingga Ka'bah tidak terputar-putar.
  // Pengguna tetap bebas drag / zoom kamera lewat OrbitControls.

  if (progress >= t.total) finishTawaf();
}

function finishTawaf() {
  const t = state.tawaf;
  if (!t) return;
  t.active = false;
  el.hud.hidden = true;
  if (el.tawafDoaHud) el.tawafDoaHud.hidden = true;
  audio.stopDoaAudio();
  world.controls.enabled = true;

  const label = t.ifadah
    ? 'Tawaf ifadah selesai'
    : t.qudum
      ? 'Tawaf qudum selesai'
      : t.wada
        ? 'Tawaf wada\' selesai'
        : 'Tawaf 7 putaran selesai';
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="done-card">
        <div class="done-check">✓</div>
        <div>
          <div class="done-title">${label}</div>
          <div class="done-sub">${t.wada ? 'Siap meninggalkan Makkah.' : t.qudum ? 'Tetap ihram; sa\'i menyusul setelah tawaf ifadah.' : t.ifadah ? 'Larangan ihram terakhir gugur.' : 'Lanjut ke Maqam Ibrahim.'}</div>
        </div>
      </div>
    </div>`;
  sfx.done();
  toast(label);
  markDone();
  world.flyTo(t.wada || t.ifadah ? 'kaaba' : 'kaaba', { duration: 1.4 });
}

/* --------------------------------- sa'i ---------------------------------- */
function renderSai(step) {
  const cfg = step.sai || { legs: 7 };
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint">${cfg.legs} perjalanan • mulai dari Safa, berakhir di Marwah</div>
      <button class="action-btn" id="act-sai">Mulai sa'i</button>
      <div class="action-hint">Hijau: ${state.gender === 'male' ? 'berlari kecil' : 'berjalan biasa'} di antara dua lampu hijau.</div>
    </div>`;
  $('act-sai').addEventListener('click', () => startSai(step));
}

function startSai(step) {
  const total = (step.sai && step.sai.legs) || 7;
  state.sai = {
    active: true,
    paused: false,
    leg: 0,
    t: 0,
    total,
    speed: 1.6
  };
  world.tween = null;
  world.controls.enabled = false;
  world.controls.autoRotate = false;

  el.hud.hidden = false;
  if (el.tawafDoaHud) {
    el.tawafDoaHud.hidden = false;
    currentActiveDoa = {
      title: 'Doa Perjalanan Sa\'i',
      arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ الْأَعَزُّ الْأَكْرَمُ',
      latin: 'Rabbighfir warḥam wa antal-a‘azzul-akram.',
      meaning: 'Ya Tuhanku, ampunilah, sayangilah, dan Engkau adalah Yang Maha Perkasa lagi Maha Mulia.'
    };
    el.tawafZoneBadge.textContent = "Lintasan Sa'i (Safa → Marwah)";
    el.tawafDoaArabic.textContent = currentActiveDoa.arabic;
    el.tawafDoaLatin.textContent = currentActiveDoa.latin;
    el.tawafDoaMeaning.textContent = `“${currentActiveDoa.meaning}”`;
  }

  el.hudTotal.textContent = `/ ${total}`;
  el.hudTitle.textContent = 'Perjalanan sa\'i';
  el.hudSub.textContent = 'Safa → Marwah';
  el.hudCount.textContent = '0';
  el.hudBar.style.width = '0%';
  el.hudSpeed.textContent = '2.0×';

  renderSaiProgress();
  sfx.click();
}

function renderSaiProgress() {
  const s = state.sai;
  if (!s) return;
  const fromSafa = s.leg % 2 === 0;
  const pct = ((s.leg + s.t) / s.total) * 100;
  const green = s.t > 0.4 && s.t < 0.6;
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="live">
        <div class="live-row">
          <div class="live-count"><b>${s.leg + 1}</b><span>/ ${s.total}</span></div>
          <div class="live-meta">
            <div class="live-title">${fromSafa ? 'Safa → Marwah' : 'Marwah → Safa'}</div>
            <div class="live-sub">${s.paused ? 'Dijeda' : green ? (state.gender === 'male' ? 'Lari kecil (milayn)' : 'Area lampu hijau') : 'Berjalan tenang'}</div>
          </div>
        </div>
        <div class="hud-bar"><i style="width:${pct}%"></i></div>
      </div>
    </div>`;
}

function updateSai(dt) {
  const s = state.sai;
  if (!s || !s.active || s.paused) return;

  s.t += dt * s.speed * 0.09;
  if (s.t >= 1) {
    if (s.leg >= s.total - 1) {
      finishSai();
      return;
    }
    s.leg++;
    s.t = 0;
    sfx.lap();
    renderSaiProgress();
  }

  const fromSafa = s.leg % 2 === 0;
  const a = fromSafa ? SAFA : MARWAH;
  const b = fromSafa ? MARWAH : SAFA;
  const x = a.x + (b.x - a.x) * s.t;
  const y = a.y + (b.y - a.y) * s.t;
  world.setAvatarPosition(x, y, 0.06);
  world.faceAvatarTowards(b.x - a.x, b.y - a.y);

  const [ux, uy] = normalize(b.x - a.x, b.y - a.y);
  const nx = -uy;
  const ny = ux;

  if (world.cameraMode === 'fpv') {
    const camPos = new THREE.Vector3(x, y, 1.65);
    const lookTarget = new THREE.Vector3(x + ux * 18, y + uy * 18, 1.85);
    const k = 1 - Math.exp(-dt * 7.0);
    world.camera.position.lerp(camPos, k);
    world.controls.target.lerp(lookTarget, k);
  } else {
    const desired = new THREE.Vector3(x - ux * 10 + nx * 3.5, y - uy * 10 + ny * 3.5, 4.6);
    const look = new THREE.Vector3(x, y, 2.0);
    const k = 1 - Math.exp(-dt * 9);
    world.camera.position.lerp(desired, k);
    world.controls.target.lerp(look, k);
  }

  el.hudCount.textContent = String(s.leg + 1);
  el.hudBar.style.width = `${((s.leg + s.t) / s.total) * 100}%`;
  if (Math.floor(s.t * 10) % 2 === 0) renderSaiProgressThrottled(s);
}

let saiPaint = 0;
function renderSaiProgressThrottled(s) {
  const now = performance.now();
  if (now - saiPaint < 300) return;
  saiPaint = now;
  renderSaiProgress();
}

function finishSai() {
  const s = state.sai;
  if (!s) return;
  s.active = false;
  el.hud.hidden = true;
  if (el.tawafDoaHud) el.tawafDoaHud.hidden = true;
  audio.stopDoaAudio();
  world.controls.enabled = true;
  world.setAvatarPosition(MARWAH.x, MARWAH.y, 0.06);
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="done-card">
        <div class="done-check">✓</div>
        <div>
          <div class="done-title">Sa'i 7 perjalanan selesai</div>
          <div class="done-sub">Anda berakhir di Marwah. Lanjut tahallul.</div>
        </div>
      </div>
    </div>`;
  sfx.done();
  toast('Sa\'i selesai — berakhir di Marwah');
  markDone();
  world.flyTo('masaa', { duration: 1.4 });
}

function normalize(x, y) {
  const n = Math.hypot(x, y) || 1;
  return [x / n, y / n];
}

/* --------------------------------- ramy ---------------------------------- */
function renderRamy(step) {
  const cfg = step.ramy;
  state.ramy = {
    targets: cfg.targets,
    per: cfg.pebbles || 7,
    order: !!cfg.order,
    afterZawal: !!cfg.afterZawal,
    counts: { sughra: 0, wustha: 0, aqabah: 0 },
    gateOpen: !cfg.afterZawal || state.clock.hour >= 12.16
  };
  paintRamy(step);
}

function ramyExpected() {
  const r = state.ramy;
  if (!r) return null;
  return r.targets.find((id) => r.counts[id] < r.per) || null;
}

function paintRamy(step) {
  const r = state.ramy;
  const expected = ramyExpected();

  if (!r.gateOpen) {
    el.stepAction.innerHTML = `
      <div class="action-box">
        <div class="gate">
          <div class="gate-title">Waktu melontar belum masuk</div>
          <div class="gate-desc">Pada hari tasyrik, melontar hanya boleh setelah <b>zawal</b> (matahari tergelincir, ± 12:10). Sekarang ${formatHour(state.clock.hour)}.</div>
          <button class="action-btn" id="act-wait">Tunggu zawal</button>
        </div>
      </div>`;
    $('act-wait').addEventListener('click', () => {
      sfx.click();
      el.stepAction.innerHTML = `<div class="action-box"><div class="action-hint">Menunggu matahari tergelincir…</div></div>`;
      animateClock(state.clock.day, 12.2, 1.6, () => {
        r.gateOpen = true;
        toast('Matahari tergelincir — waktu melontar telah masuk.');
        paintRamy(step);
      });
    });
    return;
  }

  const cards = JAMARAT.map((j) => {
    const enabled = r.targets.includes(j.id);
    const count = r.counts[j.id];
    const done = count >= r.per;
    const active = j.id === expected;
    const dots = Array.from({ length: r.per }, (_, i) => `<i class="pebble${i < count ? ' on' : ''}"></i>`).join('');
    return `
      <button class="ramy-card${done ? ' done' : ''}${active ? ' active' : ''}" data-jamrah="${j.id}" ${enabled ? '' : 'disabled'}>
        <div class="ramy-name">${j.short}</div>
        <div class="ramy-count" data-count="${j.id}">${enabled ? count : '—'}</div>
        <div class="pebbles" data-dots="${j.id}">${enabled ? dots : '<i class="pebble"></i>'.repeat(7)}</div>
      </button>`;
  }).join('');

  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint" id="ramy-hint">
        ${r.order ? 'Urutan: Sughra → Wustha → Aqabah.' : 'Khusus Jamrat Aqabah.'}
        Klik jumrah di layar 3D atau tombol di bawah.
      </div>
      <div class="ramy-grid">${cards}</div>
      <div class="action-hint" id="ramy-status">${expected ? `Sedang dilontar: ${JAMARAT.find((j) => j.id === expected)?.name || ''}` : 'Selesai.'}</div>
    </div>`;

  el.stepAction.querySelectorAll('.ramy-card').forEach((card) => {
    card.addEventListener('click', () => throwAt(card.dataset.jamrah));
  });

  if (expected) {
    world.highlightJamarah(expected, true);
    state.highlighted = expected;
  } else {
    world.clearJamarahHighlight();
    state.highlighted = null;
  }
}

function throwAt(id) {
  const step = current();
  const r = state.ramy;
  if (!r || step.kind !== 'ramy') return;
  if (!r.gateOpen) {
    toast('Belum masuk waktu melontar — tunggu zawal.', 'error');
    return;
  }
  if (!r.targets.includes(id)) {
    toast('Hari ini hanya melontar ' + r.targets.map((t) => JAMARAT.find((j) => j.id === t)?.short).join(', ') + '.', 'error');
    return;
  }
  if (r.counts[id] >= r.per) {
    toast('Jumrah ini sudah 7 kerikil.', 'error');
    return;
  }
  const expected = ramyExpected();
  if (r.order && expected && id !== expected) {
    state.stats.wrong++;
    sfx.wrong();
    toast('Urutan sunnah: Sughra → Wustha → Aqabah. Selesaikan ' + (JAMARAT.find((j) => j.id === expected)?.short) + ' dulu.', 'error');
    el.stepAction.querySelector(`[data-jamrah="${id}"]`)?.classList.add('shake');
    return;
  }

  const jamrah = JAMARAT.find((j) => j.id === id);
  r.counts[id]++;
  const count = r.counts[id];
  const card = el.stepAction.querySelector(`[data-jamrah="${id}"]`);
  if (card) {
    card.querySelector(`[data-count="${id}"]`).textContent = count;
    card.querySelectorAll('.pebble').forEach((p, i) => p.classList.toggle('on', i < count));
  }
  world.throwPebble(new THREE.Vector3(jamrah.pos.x, jamrah.pos.y, 9));
  sfx.pebble();
  toast(`Allahu Akbar • ${count}/${r.per}`);

  if (count >= r.per) {
    world.highlightJamarah(id, false);
    card?.classList.add('done');
  }

  const nextExpected = ramyExpected();
  if (nextExpected) {
    world.clearJamarahHighlight();
    world.highlightJamarah(nextExpected, true);
    state.highlighted = nextExpected;
    const st = $('ramy-status');
    if (st) st.textContent = `Sedang dilontar: ${JAMARAT.find((j) => j.id === nextExpected)?.name || ''}`;
    el.stepAction.querySelectorAll('.ramy-card').forEach((c) => c.classList.toggle('active', c.dataset.jamrah === nextExpected));
  } else {
    finishRamy();
  }
}

function finishRamy() {
  world.clearJamarahHighlight();
  const total = state.ramy.targets.length * state.ramy.per;
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="done-card">
        <div class="done-check">✓</div>
        <div>
          <div class="done-title">Melontar selesai</div>
          <div class="done-sub">${total} kerikil • takbir pada setiap lemparan.</div>
        </div>
      </div>
    </div>`;
  sfx.done();
  toast('Melontar selesai. Hentikan talbiyah.');
  markDone();
}

/* -------------------------------- wukuf ---------------------------------- */
function renderWukuf(step) {
  const cfg = step.wukuf;
  if (state.clock.hour < cfg.startHour) {
    el.stepAction.innerHTML = `
      <div class="action-box">
        <div class="gate">
          <div class="gate-title">Menunggu zawal</div>
          <div class="gate-desc">Wukuf dimulai setelah matahari tergelincir. Sekarang ${formatHour(state.clock.hour)}.</div>
          <button class="action-btn" id="act-zawal">Tunggu zawal</button>
        </div>
      </div>`;
    $('act-zawal').addEventListener('click', () => {
      sfx.click();
      el.stepAction.innerHTML = `<div class="action-box"><div class="action-hint">Menunggu zawal…</div></div>`;
      animateClock(state.clock.day, cfg.startHour, 1.6, () => renderWukuf(step));
    });
    return;
  }

  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint">Wukuf berlangsung sampai maghrib — jangan pulang lebih awal.</div>
      <button class="action-btn" id="act-wukuf">Mulai wukuf</button>
    </div>`;
  $('act-wukuf').addEventListener('click', () => {
    sfx.click();
    el.stepAction.innerHTML = `
      <div class="action-box">
        <div class="live">
          <div class="live-row">
            <div class="live-count"><b id="wukuf-time">12:10</b><span>WIB</span></div>
            <div class="live-meta">
              <div class="live-title">Wukuf di Arafah</div>
              <div class="live-sub">Menghadap kiblat, berdoa, talbiyah</div>
            </div>
          </div>
          <div class="hud-bar"><i id="wukuf-bar" style="width:0%"></i></div>
        </div>
      </div>`;
    animateClock(state.clock.day, cfg.endHour, 12, () => {
      const timeEl = $('wukuf-time');
      if (timeEl) timeEl.textContent = '18:21';
      el.stepAction.innerHTML = `
        <div class="action-box">
          <div class="done-card">
            <div class="done-check">✓</div>
            <div>
              <div class="done-title">Wukuf selesai — matahari terbenam</div>
              <div class="done-sub">Sekarang berangkat ke Muzdalifah tanpa shalat Maghrib di jalan.</div>
            </div>
          </div>
        </div>`;
      sfx.done();
      toast('Maghrib di Arafah — wukuf selesai. Menuju Muzdalifah.');
      markDone();
      world.flyToPoint([2500, -280, 180], [2500, 120, 40], 46, 1.6);
    });
  });
}

/* -------------------------------- mabit ---------------------------------- */
function renderMabit(step) {
  const cfg = step.mabit;
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint">Mabit hingga Subuh • ${formatHour(state.clock.hour)}</div>
      <button class="action-btn" id="act-mabit">${cfg.title || 'Mabit'}</button>
    </div>`;
  $('act-mabit').addEventListener('click', () => {
    sfx.click();
    el.stepAction.innerHTML = `<div class="action-box"><div class="action-hint">Bermalam… waktu dipercepat.</div></div>`;
    animateClock(cfg.untilDay, cfg.untilHour, 4.5, () => {
      el.stepAction.innerHTML = `
        <div class="action-box">
          <div class="done-card">
            <div class="done-check">✓</div>
            <div>
              <div class="done-title">Subuh tiba</div>
              <div class="done-sub">${formatHour(state.clock.hour)} • siap melanjutkan rangkaian.</div>
            </div>
          </div>
        </div>`;
      sfx.done();
      toast('Mabit selesai — Subuh tiba.');
      markDone();
    });
  });
}

/* ------------------------------- pebbles --------------------------------- */
function renderPebbles(step) {
  const need = step.pebbles?.take || 7;
  state.pebbles = 0;
  const tray = () => {
    let dots = '';
    for (let i = 0; i < need; i++) dots += `<div class="stone${i < state.pebbles ? '' : ' empty'}"></div>`;
    return dots;
  };

  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="action-hint">Kumpulkan ${need} kerikil untuk Jamrat Aqabah.</div>
      <div class="stone-tray" id="stone-tray">${tray()}</div>
      <div class="ramy-grid" style="grid-template-columns: 1fr 1fr;">
        <button class="action-btn" id="act-stone">Ambil 1 kerikil</button>
        <button class="action-btn" id="act-stone-all">Ambil 7 sekaligus</button>
      </div>
      <div class="action-hint" id="pebble-status">0 / ${need} kerikil</div>
      <button class="action-btn" id="act-mabit2" disabled>Mabit hingga Subuh</button>
    </div>`;

  const refresh = () => {
    $('stone-tray').innerHTML = tray();
    $('pebble-status').textContent = `${state.pebbles} / ${need} kerikil`;
    $('act-mabit2').disabled = state.pebbles < need;
    $('act-stone').disabled = state.pebbles >= need;
    $('act-stone-all').disabled = state.pebbles >= need;
  };

  $('act-stone').addEventListener('click', () => {
    if (state.pebbles >= need) return;
    state.pebbles++;
    sfx.pebble();
    refresh();
    if (state.pebbles >= need) toast('Kerikil lengkap — 7 butir.');
  });

  $('act-stone-all').addEventListener('click', () => {
    state.pebbles = need;
    refresh();
  });

  $('act-mabit2').addEventListener('click', () => {
    sfx.click();
    el.stepAction.innerHTML = `<div class="action-box"><div class="action-hint">Mabit di Muzdalifah…</div></div>`;
    animateClock(10, 5.4, 4.5, () => {
      el.stepAction.innerHTML = `
        <div class="action-box">
          <div class="done-card">
            <div class="done-check">✓</div>
            <div>
              <div class="done-title">Subuh 10 Dzulhijjah</div>
              <div class="done-sub">7 kerikil siap untuk Jamrat Aqabah.</div>
            </div>
          </div>
        </div>`;
      sfx.done();
      toast('Muzdalifah selesai — menuju Jamarat.');
      markDone();
    });
  });
}

/* --------------------------------- halq ---------------------------------- */
function renderHalq(step) {
  const female = state.gender === 'female';
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="choice-grid">
        <button class="choice-card" id="pick-halq" ${female ? 'disabled' : ''}>
          <span class="mode-icon" style="margin:0;width:30px;height:30px">✂</span>
          <span>
            <span class="choice-title">Halq — cukur habis</span>
            <span class="choice-desc">${female ? 'Tidak berlaku untuk perempuan.' : 'Lebih utama bagi laki-laki.'}</span>
          </span>
        </button>
        <button class="choice-card" id="pick-taqsir">
          <span class="mode-icon" style="margin:0;width:30px;height:30px">✳</span>
          <span>
            <span class="choice-title">Taqsir — potong sebagian</span>
            <span class="choice-desc">Laki-laki: seluruh rambut dipotong. Perempuan: sepanjang ujung jari.</span>
          </span>
        </button>
      </div>
      <div class="action-hint">Keduanya sah. Larangan ihram berakhir setelah tahallul.</div>
    </div>`;

  const finish = (label) => {
    sfx.done();
    toast(label);
    el.stepAction.innerHTML = `
      <div class="action-box">
        <div class="done-card">
          <div class="done-check">✓</div>
          <div>
            <div class="done-title">Tahallul selesai</div>
            <div class="done-sub">${label}</div>
          </div>
        </div>
      </div>`;
    markDone();
  };

  $('pick-halq')?.addEventListener('click', () => finish('Halq — rambut dicukur habis.'));
  $('pick-taqsir').addEventListener('click', () => finish(female ? 'Taqsir — ujung rambut dipotong sepanjang jari.' : 'Taqsir — rambut dipotong sebagian.'));
}

/* --------------------------------- nafar --------------------------------- */
function renderNafar(step) {
  el.stepAction.innerHTML = `
    <div class="action-box">
      <div class="choice-grid">
        ${step.options.map((o) => `
          <button class="choice-card" data-nafar="${o.id}">
            <span class="mode-icon" style="margin:0;width:30px;height:30px">${o.id === 'awal' ? '⏱' : '🌙'}</span>
            <span>
              <span class="choice-title">${o.title}</span>
              <span class="choice-desc">${o.desc}</span>
            </span>
          </button>`).join('')}
      </div>
    </div>`;

  el.stepAction.querySelectorAll('[data-nafar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.nafar = btn.dataset.nafar;
      sfx.click();
      if (state.nafar === 'tsani') {
        toast('Nafar tsani — mabit malam 12 dan lontar jumrah 13 Dzulhijjah.');
      } else {
        toast('Nafar awal — keluar Mina sebelum maghrib.');
      }
      el.stepAction.innerHTML = `
        <div class="action-box">
          <div class="done-card">
            <div class="done-check">✓</div>
            <div>
              <div class="done-title">${state.nafar === 'tsani' ? 'Nafar tsani dipilih' : 'Nafar awal dipilih'}</div>
              <div class="done-sub">${state.nafar === 'tsani' ? 'Lanjut mabit malam 12.' : 'Lanjut tawaf wada\'.'}</div>
            </div>
          </div>
        </div>`;
      markDone();
      renderSidebar();
    });
  });
}

/* -------------------------------- finish --------------------------------- */
function renderFinish(step) {
  el.stepAction.innerHTML = `
    <div class="action-box">
      <button class="action-btn" id="act-summary">Lihat ringkasan manasik</button>
    </div>`;
  $('act-summary').addEventListener('click', showSummary);
  markDone();
  sfx.done();
}

/* ============================================================================
 * Sidebar
 * ========================================================================== */
function renderSidebar() {
  if (!state.steps.length) return;
  const list = visibleSteps();
  const cur = current();
  const doneCount = state.completed.size;

  el.sideList.innerHTML = list.map((s, i) => {
    const done = state.completed.has(s.id);
    const isCur = s === cur;
    return `<li class="step-item${done ? ' done' : ''}${isCur ? ' current' : ''}">
      <span class="idx">${done ? '✓' : i + 1}</span>
      <span class="txt">${s.title}</span>
    </li>`;
  }).join('');

  el.sideProgress.textContent = `${Math.round((doneCount / list.length) * 100)}%`;
}

/* ============================================================================
 * Navigasi
 * ========================================================================== */
function goNext() {
  if (el.nextBtn.disabled) return;
  const step = current();
  if (step.kind === 'finish') {
    showSummary();
    return;
  }
  if (step.checklist) state.completed.add(step.id);
  sfx.click();

  const next = findNext(state.stepIndex + 1);
  if (next < 0) {
    showSummary();
    return;
  }
  loadStep(next);
  renderSidebar();
}

el.nextBtn.addEventListener('click', goNext);

/* ============================================================================
 * Modal & drawer
 * ========================================================================== */
function openModal(html) {
  el.modalCard.innerHTML = html;
  el.modal.hidden = false;
}

function closeModal() {
  el.modal.hidden = true;
}

function closeDrawer() {
  el.drawer.hidden = true;
  el.drawer.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-close="modal"]').forEach((n) => n.addEventListener('click', closeModal));
document.querySelectorAll('[data-close="drawer"]').forEach((n) => n.addEventListener('click', closeDrawer));

el.modal.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'close') closeModal();
  else if (action === 'restart') window.location.reload();
  else if (action === 'exit-to-menu') { closeModal(); exitToMenu(); }
  else if (action === 'summary') { closeModal(); showSummary(); }
});

function openTalbiyah() {
  openModal(`
    <div class="result-hero">
      <div class="result-badge" style="background:linear-gradient(145deg,#f8d79a,#e9a13b)">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 10v4h3l4 3V7L7 10H4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </div>
      <div>
        <h2 style="margin:0">Talbiyah</h2>
        <p style="margin:2px 0 0">Dibaca sejak niat hingga mulai melontar Jamrat Aqabah.</p>
      </div>
    </div>
    <div class="talbiyah" style="margin-top:8px">
      <div class="talbiyah-arabic" style="font-size:24px">${TALBIYAH.arabic}</div>
      <div class="talbiyah-latin" style="font-size:12px">${TALBIYAH.latin}</div>
      <div class="talbiyah-meaning" style="font-size:12px">${TALBIYAH.meaning}</div>
    </div>
    <p class="note-box">Bagi laki-laki disunahkan mengeraskan suara, bagi perempuan cukup terdengar sendiri.</p>
    <div class="modal-actions">
      <button class="btn-primary" style="width:auto;padding:11px 18px" data-action="close">Tutup</button>
    </div>
  `);
}

function showSummary() {
  const step = current();
  if (step && step.checklist) state.completed.add(step.id);
  const items = state.steps
    .filter((s) => state.completed.has(s.id) && s.checklist)
    .map((s) => `<li><span class="tick">✓</span>${s.checklist}</li>`)
    .join('');

  const total = visibleSteps().length;
  const hajjTypeLabel = state.mode === 'hajj' ? HAJJ_TYPE_INFO[state.hajjType]?.label || '' : '';
  openModal(`
    <div class="result-hero">
      <div class="result-badge">
        <svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div>
        <h2>${state.mode === 'umrah' ? 'Umrah selesai' : `Haji ${hajjTypeLabel} selesai`}</h2>
        <p>${state.mode === 'umrah'
          ? 'Ihram → tawaf → sa\'i → tahallul. Semoga menjadi umrah yang mabrur.'
          : state.hajjType === 'tamattu'
            ? 'Umrah dahulu, lalu haji: ihram, wukuf, mabit, ramy, hadyu, tahallul, ifadah, dan wada\'.'
            : state.hajjType === 'qiran'
              ? 'Ihram umrah+haji, tawaf qudum, wukuf, mabit, ramy, hadyu, satu tawaf ifadah, satu sa\'i, dan wada\'.'
              : 'Ihram haji saja, tawaf qudum, wukuf, mabit, ramy, tahallul, ifadah, sa\'i, dan wada\' — tanpa hadyu.'}</p>
      </div>
    </div>
    <div class="result-stats">
      <div class="stat"><div class="k">Tahap</div><div class="v">${state.completed.size}/${total}</div></div>
      <div class="stat"><div class="k">Jawaban benar</div><div class="v">${state.stats.correct}</div></div>
      <div class="stat"><div class="k">Koreksi</div><div class="v">${state.stats.wrong}</div></div>
    </div>
    <h3 style="font-size:10px;letter-spacing:.08em;color:#f6bd60;margin:16px 0 4px">RANGKAIAN YANG DILAKUKAN</h3>
    <ul class="result-list">${items || '<li>—</li>'}</ul>
    <div class="note-box">
      Simulasi ini mengikuti madzhab Syafi'i. Bila ada wajib yang ditinggalkan, berlaku dam;
      bila melanggar larangan ihram, berlaku fidyah. Konsultasikan dengan pembimbing manasik.
    </div>
    <div class="modal-actions">
      <button class="btn-primary" style="width:auto;padding:11px 18px" data-action="restart">Ulangi simulasi</button>
      <button class="btn-ghost" data-action="close">Tutup</button>
    </div>
  `);
}

/* ------------------------------- drawer ---------------------------------- */
function openDrawer(tab = 'rukun') {
  el.drawer.hidden = false;
  el.drawer.setAttribute('aria-hidden', 'false');
  renderDrawer(tab);
}

function renderDrawer(tab) {
  const tabs = [
    ['jenis', 'Jenis Haji'],
    ['rukun', 'Rukun & Wajib'],
    ['larangan', 'Larangan Ihram'],
    ['doa', 'Doa & Talbiyah'],
    ['miqat', 'Miqat & Dam'],
    ['istilah', 'Istilah']
  ];
  el.drawerTabs.innerHTML = tabs
    .map(([id, label]) => `<button class="tab${id === tab ? ' active' : ''}" data-tab="${id}">${label}</button>`)
    .join('');
  el.drawerTabs.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => renderDrawer(b.dataset.tab))
  );

  let html = '';
  if (tab === 'jenis') {
    html += `<h3>Tiga Jenis Manasik Haji</h3>`;
    html += `<p>Ketiganya sah dan boleh dipilih (ijma' ulama; lihat <em>Al-Minhaj Syarh Shahih Muslim</em> 8:169). Yang diperselisihkan hanya mana yang lebih utama.</p>`;
    html += `<div class="item"><strong>Tamattu' — paling utama</strong><span>Umrah dahulu di bulan haji, tahallul, lalu berihram haji pada 8 Dzulhijjah. Wajib hadyu. Ini yang diperintahkan Nabi ﷺ kepada para sahabat yang tidak membawa hadyu.</span></div>`;
    html += `<div class="item"><strong>Qiran</strong><span>Umrah dan haji sekaligus dalam satu ihram — “Labbaika ‘umratan wa ḥajjan”. Wajib hadyu. Cukup satu tawaf ifadah dan satu sa'i untuk keduanya; tetap ihram sampai hari raya.</span></div>`;
    html += `<div class="item"><strong>Ifrad</strong><span>Haji saja — “Labbaika ḥajjan”. Tidak wajib hadyu. Sa'i dikerjakan untuk haji; boleh berumrah setelahnya dengan ihram baru dari Tan'im atau Ji'ranah.</span></div>`;
    html += `<h3>Dalil & Catatan</h3>`;
    html += `<div class="arabic">لَوْ أَنِّي اسْتَقْبَلْتُ مِنْ أَمْرِي مَا اسْتَدْبَرْتُ لَمْ أَسُقِ الْهَدْيَ وَجَعَلْتُهَا عُمْرَةً</div>`;
    html += `<p><em>“Jikalau aku mengetahui apa yang akan terjadi, aku tidak akan membawa hadyu dan aku jadikan ihramku ini umrah.”</em> (HR. Muslim no. 1218)</p>`;
    html += `<p>Karena itu <b>tamattu' lebih utama</b> bagi yang tidak membawa hadyu: lebih banyak amal dan lebih mudah. Qiran dipilih ketika membawa hadyu, dan itulah yang diucapkan Nabi ﷺ. Qiran lebih utama daripada ifrad; ifrad tetap sah, hanya tanpa keutamaan tambahan.</p>`;
    html += `<p class="muted">Rujukan: <a href="https://muslim.or.id/10110-fikih-haji-2-tiga-cara-manasik-haji.html" target="_blank" rel="noopener">Muslim.or.id — Tiga Cara Manasik Haji</a>; <a href="https://almanhaj.or.id/84056-jenis-jenis-ibadah-haji.html" target="_blank" rel="noopener">Almanhaj — Jenis-jenis Ibadah Haji</a>. Hadyu tamattu' dan qiran wajib menurut ijma'.</p>`;
  } else if (tab === 'rukun') {
    html += `<h3>Rukun Umrah</h3><ol>${REFERENCE.rukun.umrah.map((x) => `<li>${x}</li>`).join('')}</ol>`;
    html += `<h3>Rukun Haji</h3><ol>${REFERENCE.rukun.haji.map((x) => `<li>${x}</li>`).join('')}</ol>`;
    html += `<h3>Wajib Umrah</h3><ul>${REFERENCE.wajib.umrah.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    html += `<h3>Wajib Haji</h3><ul>${REFERENCE.wajib.haji.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    html += `<h3>Timeline Haji</h3>${HAJJ_TIMELINE.map((t) => `<div class="item"><strong>${t.day} • ${t.title}</strong><span>${t.desc}</span></div>`).join('')}`;
    html += `<p class="muted">Rukun tidak dapat diganti dam. Wajib dapat ditutup dengan dam.</p>`;
  } else if (tab === 'larangan') {
    html += `<h3>Larangan Selama Ihram</h3>`;
    html += REFERENCE.larangan.map((x) => `<div class="item"><strong>${x.title}</strong><span>${x.note}</span></div>`).join('');
    html += `<p class="muted">Melanggar larangan karena lupa atau tidak tahu tetap dikenakan fidyah menurut jumhur, kecuali berhubungan intim yang membatalkan.</p>`;
  } else if (tab === 'doa') {
    html += `<h3>Talbiyah</h3><div class="arabic">${TALBIYAH.arabic}</div><p><em>${TALBIYAH.latin}</em></p><p>${TALBIYAH.meaning}</p>`;
    for (const key of Object.keys(DOA)) {
      const d = DOA[key];
      html += `<h4>${d.title}</h4><div class="arabic">${d.arabic}</div><p><em>${d.latin}</em></p><p>${d.meaning}</p>`;
    }
  } else if (tab === 'miqat') {
    html += `<h3>Miqat Makani</h3>${REFERENCE.miqat.map((m) => `<div class="item"><strong>${m.name}</strong><span>${m.for}${m.note ? ' • ' + m.note : ''}</span></div>`).join('')}`;
    html += `<h3>Dam & Fidyah</h3>${REFERENCE.dam.map((d) => `<div class="item"><strong>${d.title}</strong><span>${d.desc}</span></div>`).join('')}`;
  } else {
    html += `<h3>Istilah Manasik</h3>${REFERENCE.istilah.map((i) => `<div class="item"><strong>${i.term}</strong><span>${i.desc}</span></div>`).join('')}`;
  }
  el.drawerBody.innerHTML = html;
  el.drawerBody.scrollTop = 0;
}

document.querySelectorAll('.ref-btn').forEach((b) =>
  b.addEventListener('click', () => openDrawer(b.dataset.ref))
);
$('btn-ref').addEventListener('click', () => openDrawer('rukun'));
$('btn-help').addEventListener('click', showHelp);
$('btn-exit').addEventListener('click', () => {
  if (state.mode === 'tour') {
    exitToMenu();
    return;
  }
  openModal(`
    <h2>Keluar dari simulasi?</h2>
    <p>Progres rangkaian akan dihapus dan Anda kembali ke menu utama.</p>
    <div class="modal-actions">
      <button class="btn-primary" style="width:auto;padding:11px 18px" data-action="exit-to-menu">Ya, keluar</button>
      <button class="btn-ghost" data-action="close">Batal</button>
    </div>`);
});

function showHelp() {
  openModal(`
    <h2>Cara memakai simulasi</h2>
    <p><b>1.</b> Baca pengantar tiap tahap, lalu jawab kuis atau jalankan aksinya.</p>
    <p><b>2.</b> Tawaf & sa'i berjalan otomatis. Gunakan tombol <b>1.6×</b> untuk mempercepat dan <b>Jeda</b> untuk berhenti.</p>
    <p><b>3.</b> Pada tahap melontar, klik jumrah di layar 3D atau tombol jumrah. Urutannya harus benar.</p>
    <p><b>4.</b> Waktu simulasi ditampilkan di atas. Wukuf dan mabit mempercepat waktu.</p>
    <div class="note-box">Kamera: drag untuk memutar, scroll untuk zoom. Selama tawaf/sa'i kamera mengikuti jamaah.</div>
    <div class="modal-actions">
      <button class="btn-primary" style="width:auto;padding:11px 18px" data-action="close">Mengerti</button>
    </div>
  `);
}

/* ============================================================================
 * Interaksi 3D (klik jumrah)
 * ========================================================================== */
let downX = 0;
let downY = 0;
const canvas = world.renderer.domElement;

canvas.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
});

canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  if (!state.started) return;
  const step = current();
  if (step?.kind !== 'ramy') return;
  const id = world.pickJamarah(e.clientX, e.clientY);
  if (id) throwAt(id);
});

/* ============================================================================
 * HUD & Fitur Baru (Kamera, Font, Audio)
 * ========================================================================== */
function toggleCameraMode() {
  const mode = world.toggleCameraMode();
  const isFpv = mode === 'fpv';
  toast(isFpv ? 'Sudut pandang: Mata Jamaah (1.65m FPV)' : "Sudut pandang: Tinjauan Atas (Ka'bah Kokoh di Tengah)");
  if (el.hudCamBtn) el.hudCamBtn.textContent = isFpv ? '🛸 Tinjau' : '🎥 Mata';
  if (el.btnCam) el.btnCam.classList.toggle('active', isFpv);
  if (!isFpv && state.tawaf?.active) {
    world.flyToPoint([0, -78, 52], [0, 0, 6], 46, 1.0);
  }
  sfx.click();
}

el.btnCam?.addEventListener('click', toggleCameraMode);
el.hudCamBtn?.addEventListener('click', toggleCameraMode);

el.btnFontSize?.addEventListener('click', () => {
  document.body.classList.toggle('font-large');
  const isLarge = document.body.classList.contains('font-large');
  toast(isLarge ? 'Ukuran teks doa diperbesar (A+)' : 'Ukuran teks doa normal');
  el.btnFontSize.classList.toggle('active', isLarge);
  sfx.click();
});

function openAvatarCustomizer() {
  const currentGender = state.gender || 'male';
  const opts = world._avatarOptions || {
    idtiba: true,
    kufi: true,
    belt: true,
    sandals: true,
    femaleTheme: 'white',
    lace: true,
    bag: true
  };

  openModal(`
    <div class="result-hero" style="margin-bottom:14px">
      <div class="result-badge" style="background:linear-gradient(145deg,#34d399,#059669)">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20v-1a7 7 0 0114 0v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </div>
      <div>
        <h2 style="margin:0">Desain Avatar Jamaah 3D</h2>
        <p style="margin:2px 0 0">Kustomisasi pakaian ihram syar'i atau muat model 3D (GLB).</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Model Karakter</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="avatar-gender-picker">
          <button class="seg ${currentGender === 'male' ? 'active' : ''}" data-avatar-gender="male" style="padding:10px 14px;border-radius:10px;text-align:center">
            👳‍♂️ Jamaah Pria (Ihram)
          </button>
          <button class="seg ${currentGender === 'female' ? 'active' : ''}" data-avatar-gender="female" style="padding:10px 14px;border-radius:10px;text-align:center">
            🧕 Jamaah Wanita (Syar'i)
          </button>
        </div>
      </div>

      <!-- OPSI KHUSUS JAMAAH PRIA -->
      <div id="avatar-male-options" style="${currentGender === 'male' ? '' : 'display:none'}">
        <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Detail Busana & Sunnah Ihram Pria</label>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-idtiba" ${opts.idtiba !== false ? 'checked' : ''} />
            <span><b>Idtiba'</b> (Bahu kanan terbuka saat Thawaf)</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-kufi" ${opts.kufi !== false ? 'checked' : ''} />
            <span><b>Peci Putih Haji</b> (Kufi)</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-belt" ${opts.belt !== false ? 'checked' : ''} />
            <span><b>Sabuk Haji Hijau</b> & Saku Paspor</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-sandals" ${opts.sandals !== false ? 'checked' : ''} />
            <span><b>Sandal Jepit Haji</b> (Tumit & mata kaki terbuka)</span>
          </label>
        </div>
      </div>

      <!-- OPSI KHUSUS JAMAAH WANITA (AKHWAT) -->
      <div id="avatar-female-options" style="${currentGender === 'female' ? '' : 'display:none'}">
        <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Busana & Ketentuan Ihram Wanita</label>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Warna Busana Syar'i:</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="female-theme-picker">
              <button class="seg ${opts.femaleTheme !== 'black' ? 'active' : ''}" data-female-theme="white" style="padding:8px;border-radius:8px;font-size:12px;text-align:center">
                ⚪ Putih Bersih (Mukena/Gamis)
              </button>
              <button class="seg ${opts.femaleTheme === 'black' ? 'active' : ''}" data-female-theme="black" style="padding:8px;border-radius:8px;font-size:12px;text-align:center">
                ⚫ Hitam (Abaya Syar'i)
              </button>
            </div>
          </div>

          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-female-lace" ${opts.lace !== false ? 'checked' : ''} />
            <span><b>Renda Bordir Syar'i</b> (Tepi khimar & manset tangan)</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px">
            <input type="checkbox" id="chk-female-bag" ${opts.bag !== false ? 'checked' : ''} />
            <span><b>Tas Selempang Haji Akhwat</b> (Untuk paspor & doa)</span>
          </label>

          <div style="font-size:11px;color:var(--muted);line-height:1.5;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:8px;padding:8px 10px">
            💡 <b>Ketentuan Aurat Ihram:</b> Menutup seluruh aurat wanita kecuali wajah dan telapak tangan. Dilengkapi manset tangan tertutup rapat, rok gamis syar'i anti-clipping, serta kaos kaki & sepatu tertutup.
          </div>
        </div>
      </div>

      <div style="border-top:1px solid var(--line);padding-top:12px">
        <label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Muat Model 3D Sendiri (threejsassets.com / GLB)</label>
        <p style="font-size:12px;color:var(--muted);margin:0 0 8px">Masukkan URL model 3D berformat <code>.glb</code> (mendukung animasi rig Mixamo / humanoid):</p>
        <div style="display:flex;gap:8px">
          <input type="url" id="glb-url-input" placeholder="https://.../model.glb" style="flex:1;padding:8px 12px;background:rgba(0,0,0,0.3);border:1px solid var(--line);border-radius:8px;color:#fff;font-size:12px" />
          <button class="btn-primary" id="btn-load-glb" style="width:auto;padding:8px 16px;font-size:12px">Muat GLB</button>
        </div>
      </div>
    </div>

    <div class="modal-actions" style="margin-top:18px">
      <button class="btn-primary" data-action="close">Terapkan & Tutup</button>
    </div>
  `);

  const chkIdtiba = $('chk-idtiba');
  const chkKufi = $('chk-kufi');
  const chkBelt = $('chk-belt');
  const chkSandals = $('chk-sandals');
  const chkFemaleLace = $('chk-female-lace');
  const chkFemaleBag = $('chk-female-bag');
  let selectedFemaleTheme = opts.femaleTheme || 'white';

  const updateOpts = () => {
    world.setAvatarOptions({
      idtiba: chkIdtiba ? chkIdtiba.checked : true,
      kufi: chkKufi ? chkKufi.checked : true,
      belt: chkBelt ? chkBelt.checked : true,
      sandals: chkSandals ? chkSandals.checked : true,
      femaleTheme: selectedFemaleTheme,
      lace: chkFemaleLace ? chkFemaleLace.checked : true,
      bag: chkFemaleBag ? chkFemaleBag.checked : true
    });
  };

  chkIdtiba?.addEventListener('change', updateOpts);
  chkKufi?.addEventListener('change', updateOpts);
  chkBelt?.addEventListener('change', updateOpts);
  chkSandals?.addEventListener('change', updateOpts);
  chkFemaleLace?.addEventListener('change', updateOpts);
  chkFemaleBag?.addEventListener('change', updateOpts);

  document.querySelectorAll('#female-theme-picker .seg').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#female-theme-picker .seg').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFemaleTheme = btn.dataset.femaleTheme;
      updateOpts();
      sfx.click();
    });
  });

  document.querySelectorAll('#avatar-gender-picker .seg').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#avatar-gender-picker .seg').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const g = btn.dataset.avatarGender;
      state.gender = g;
      const maleOpts = $('avatar-male-options');
      const femaleOpts = $('avatar-female-options');
      if (maleOpts) maleOpts.style.display = g === 'male' ? '' : 'none';
      if (femaleOpts) femaleOpts.style.display = g === 'female' ? '' : 'none';
      world.setAvatarGender(g);
      sfx.click();
    });
  });

  $('btn-load-glb')?.addEventListener('click', () => {
    const url = $('glb-url-input')?.value.trim();
    if (!url) return toast('Masukkan URL file .glb terlebih dahulu');
    toast('Memuat model 3D GLB...');
    world.loadCustomGLBAvatar(
      url,
      () => {
        toast('Model 3D berhasil dimuat!');
        closeModal();
      },
      (err) => {
        toast('Gagal memuat GLB: pastikan URL valid dan mendukung CORS');
      }
    );
  });
}

el.btnAvatar?.addEventListener('click', () => {
  openAvatarCustomizer();
  sfx.click();
});

el.btnSound?.addEventListener('click', () => {
  state.sound = !state.sound;
  audio.setSoundEnabled(state.sound);
  el.btnSound.setAttribute('aria-pressed', String(state.sound));
  toast(state.sound ? 'Suara & audio doa aktif' : 'Suara dimatikan');
});

el.btnTawafDoaAudio?.addEventListener('click', () => {
  if (currentActiveDoa) {
    audio.toggleDoaAudio(currentActiveDoa, () => {});
  }
});

el.btnCloseTour?.addEventListener('click', () => {
  if (el.tourCard) el.tourCard.hidden = !el.tourCard.hidden;
});

el.hudSpeed?.addEventListener('click', () => {
  const obj = state.tawaf?.active ? state.tawaf : state.sai;
  if (!obj) return;
  const speeds = [1, 2, 2.8, 3.6];
  const idx = speeds.indexOf(obj.speed);
  obj.speed = speeds[(idx + 1) % speeds.length];
  el.hudSpeed.textContent = `${obj.speed}×`;
  toast(`Kecepatan simulasi ${obj.speed}×`);
});

el.hudStop?.addEventListener('click', () => {
  const obj = state.tawaf?.active ? state.tawaf : state.sai;
  if (!obj) return;
  obj.paused = !obj.paused;
  el.hudStop.textContent = obj.paused ? 'Lanjut' : 'Jeda';
  if (state.tawaf?.active) renderTawafProgress();
  if (state.sai?.active) renderSaiProgress();
});

/* ============================================================================
 * Intro & pilihan mode
 * ========================================================================== */
document.querySelectorAll('.mode-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedMode = card.dataset.mode;
    const typeRow = $('hajj-type-row');
    if (typeRow) typeRow.hidden = selectedMode !== 'hajj';
    sfx.click();
  });
});

document.querySelectorAll('#hajj-type-toggle .seg').forEach((seg) => {
  seg.addEventListener('click', () => {
    document.querySelectorAll('#hajj-type-toggle .seg').forEach((s) => s.classList.remove('active'));
    seg.classList.add('active');
    selectedHajjType = seg.dataset.hajj;
    const hint = $('hajj-type-hint');
    if (hint) hint.textContent = HAJJ_TYPE_INFO[selectedHajjType].hint;
    sfx.click();
  });
});

document.querySelectorAll('#gender-toggle .seg').forEach((seg) => {
  seg.addEventListener('click', () => {
    document.querySelectorAll('#gender-toggle .seg').forEach((s) => s.classList.remove('active'));
    seg.classList.add('active');
    selectedGender = seg.dataset.gender;
    sfx.click();
  });
});

$('start-btn').addEventListener('click', () => {
  startSimulation(selectedMode, selectedGender, selectedHajjType);
});

/* ============================================================================
 * Keyboard
 * ========================================================================== */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!el.modal.hidden) return closeModal();
    if (!el.drawer.hidden) return closeDrawer();
  }
  if (!state.started) {
    if (e.key === 'Enter') $('start-btn').click();
    return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === 'Enter' && !el.nextBtn.disabled && el.modal.hidden) {
    e.preventDefault();
    goNext();
  }
  if (/^[1-4]$/.test(e.key) && state.quiz && !state.quiz.solved) {
    const btns = document.querySelectorAll('#quiz-opts .quiz-opt');
    const btn = btns[Number(e.key) - 1];
    if (btn && !btn.disabled) btn.click();
  }
  if (e.key.toLowerCase() === 'c') {
    toggleCameraMode();
  }
});

/* ============================================================================
 * URL deep link (berguna untuk pratinjau & pengujian)
 * ========================================================================== */
(function bootFromQuery() {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');
  if (mode === 'umrah' || mode === 'hajj' || mode === 'tour') {
    const gender = params.get('gender') === 'female' ? 'female' : 'male';
    const requestedType = params.get('type');
    const hajjType = ['tamattu', 'qiran', 'ifrad'].includes(requestedType) ? requestedType : 'tamattu';
    setTimeout(() => {
      startSimulation(mode, gender, hajjType);
      const step = Number(params.get('step'));
      if (Number.isFinite(step) && step > 0 && state.steps) jumpToStep(Math.min(step, state.steps.length - 1));
    }, 60);
  }
})();

/* ekspos untuk debug */
window.__manasik = { state, world, audio, loadStep, startSimulation, goNext, throwAt, VIEWS, TOUR_LOCATIONS };

