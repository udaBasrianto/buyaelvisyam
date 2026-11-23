/**
 * audio.js — Mesin Audio Manasik Live:
 * 1. Audio Lantunan Doa & Talbiyah (Web Speech API suara bahasa Arab + Online Audio stream fallback)
 * 2. Suasana Ambience Prosedural WebAudio (Courtyard Reverb Haramain, Angin Padang Arafah/Muzdalifah, Takbir Jamarat)
 * 3. Efek suara interaksi (pebbles, lap, click, correct, wrong, fanfare)
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.ambientEnabled = true;
    this.ambientGain = null;
    this.ambientSource = null;
    this.currentZone = 'haram';
    this.currentSpeech = null;
    this.currentAudio = null;
    this.isPlayingDoa = false;
    this.arabicVoice = null;
    this.onDoaPlayStateChange = null;

    this._initSpeechVoices();
  }

  _initSpeechVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Cari suara bahasa Arab terbaik
        this.arabicVoice =
          voices.find((v) => v.lang.startsWith('ar-SA')) ||
          voices.find((v) => v.lang.startsWith('ar')) ||
          null;
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  ensureContext() {
    if (!this.soundEnabled) return null;
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn('Web Audio not supported', e);
      return null;
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopDoaAudio();
      this.stopAmbience();
    } else {
      this.ensureContext();
      this.startAmbience(this.currentZone);
    }
  }

  /* ==========================================================================
   * EFek Suara Pendek (SFX)
   * ======================================================================== */
  playTone(freq = 520, dur = 0.09, type = 'sine', vol = 0.045, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  sfxClick() {
    this.playTone(520, 0.06, 'sine', 0.03);
  }

  sfxCorrect() {
    this.playTone(660, 0.1, 'sine', 0.05);
    this.playTone(880, 0.14, 'sine', 0.04, 0.08);
  }

  sfxWrong() {
    this.playTone(190, 0.16, 'sawtooth', 0.035);
    this.playTone(140, 0.2, 'sawtooth', 0.03, 0.1);
  }

  sfxLap() {
    // Bunyi lonceng tawaf/sai lembut
    this.playTone(760, 0.12, 'sine', 0.04);
    this.playTone(1140, 0.18, 'triangle', 0.02, 0.04);
  }

  sfxPebble() {
    // Bunyi lemparan kerikil membentur dinding Jamarat
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    
    // Suara clack batu
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 150, t0);
    osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.06);
    gain.gain.setValueAtTime(0.05, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.09);

    // Gemuruh takbir halus saat melontar
    this.playTone(220, 0.22, 'sine', 0.025, 0.02);
  }

  sfxDone() {
    this.playTone(523, 0.12, 'sine', 0.05);
    this.playTone(659, 0.12, 'sine', 0.045, 0.1);
    this.playTone(784, 0.2, 'sine', 0.04, 0.2);
    this.playTone(1046, 0.28, 'sine', 0.035, 0.3);
  }

  /* ==========================================================================
   * SUASANA AMBIENCE PROSEDURAL (WebAudio Zero-Asset Ambience)
   * ======================================================================== */
  startAmbience(zone = 'haram') {
    if (!this.soundEnabled || !this.ambientEnabled) return;
    this.currentZone = zone;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopAmbience();

    // Buat noise buffer (Brown / Pink noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = noiseBuffer.getChannelData(0);
    const right = noiseBuffer.getChannelData(1);

    let lastLeft = 0;
    let lastRight = 0;
    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      // Brown noise integration
      left[i] = (lastLeft + 0.02 * whiteL) / 1.02;
      right[i] = (lastRight + 0.02 * whiteR) / 1.02;
      lastLeft = left[i];
      lastRight = right[i];
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter akustik per kawasan
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (zone === 'haram') {
      // Suasana mataf: gema lembut ruangan marmer megah
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.028, ctx.currentTime);
    } else if (zone === 'arafah' || zone === 'muzdalifah') {
      // Suasana padang terbuka: desau angin tenang
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.032, ctx.currentTime);
    } else {
      // Mina / Jamarat
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.026, ctx.currentTime);
    }

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start();
    this.ambientSource = noiseSource;
    this.ambientGain = gain;
  }

  stopAmbience() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
  }

  /* ==========================================================================
   * AUDIO LANTUNAN DOA & TALBIYAH
   * ======================================================================== */
  playDoaAudio(doaItem, onEndedCallback) {
    if (!this.soundEnabled) return;
    this.stopDoaAudio();

    this.isPlayingDoa = true;
    this.onDoaPlayStateChange?.(true, doaItem);

    // 1. Coba putar dari audioUrl jika ada
    if (doaItem.audioUrl) {
      try {
        const audio = new Audio(doaItem.audioUrl);
        audio.volume = 0.85;
        audio.onended = () => {
          this.isPlayingDoa = false;
          this.currentAudio = null;
          this.onDoaPlayStateChange?.(false, null);
          onEndedCallback?.();
        };
        audio.onerror = () => {
          // Fallback ke Web Speech jika audio URL gagal
          this.playDoaSpeech(doaItem, onEndedCallback);
        };
        audio.play().then(() => {
          this.currentAudio = audio;
        }).catch(() => {
          this.playDoaSpeech(doaItem, onEndedCallback);
        });
        return;
      } catch (e) {
        console.warn('Audio URL playback failed, falling back to speech', e);
      }
    }

    // 2. Fallback: Lantunan Web Speech API
    this.playDoaSpeech(doaItem, onEndedCallback);
  }

  playDoaSpeech(doaItem, onEndedCallback) {
    if (!('speechSynthesis' in window)) {
      this.isPlayingDoa = false;
      this.onDoaPlayStateChange?.(false, null);
      return;
    }

    window.speechSynthesis.cancel();

    const arabicText = doaItem.arabic || '';
    const utter = new SpeechSynthesisUtterance(arabicText);
    utter.lang = 'ar-SA';
    utter.rate = 0.84; // Kecepatan tartil tenang dan khusyuk
    utter.pitch = 0.98;

    if (this.arabicVoice) {
      utter.voice = this.arabicVoice;
    }

    utter.onend = () => {
      this.isPlayingDoa = false;
      this.currentSpeech = null;
      this.onDoaPlayStateChange?.(false, null);
      onEndedCallback?.();
    };

    utter.onerror = () => {
      this.isPlayingDoa = false;
      this.currentSpeech = null;
      this.onDoaPlayStateChange?.(false, null);
    };

    this.currentSpeech = utter;
    window.speechSynthesis.speak(utter);
  }

  stopDoaAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentSpeech = null;
    }
    this.isPlayingDoa = false;
    this.onDoaPlayStateChange?.(false, null);
  }

  toggleDoaAudio(doaItem, onEndedCallback) {
    if (this.isPlayingDoa) {
      this.stopDoaAudio();
    } else {
      this.playDoaAudio(doaItem, onEndedCallback);
    }
  }

  stopAll() {
    this.stopDoaAudio();
    this.stopAmbience();
  }
}

