import { useState, useEffect, useRef, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCcw,
  Undo2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Check,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DzikirItem {
  id: string;
  arabic: string;
  latin: string;
  meaning: string;
  defaultTarget: number;
  virtue?: string;
}

const DZIKIR_LIST: DzikirItem[] = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    latin: "Subhanallah",
    meaning: "Maha Suci Allah",
    defaultTarget: 33,
    virtue: "Dibaca 33× ba'da shalat fardhu dan dzikir harian."
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    latin: "Alhamdulillah",
    meaning: "Segala puji bagi Allah",
    defaultTarget: 33,
    virtue: "Memenuhi timbangan kebaikan di Yaumul Mahsyar."
  },
  {
    id: "allahuakbar",
    arabic: "اللَّهُ أَكْبَرُ",
    latin: "Allahu Akbar",
    meaning: "Allah Maha Besar",
    defaultTarget: 33,
    virtue: "Menumbuhkan keagungan Allah dalam dada seorang hamba."
  },
  {
    id: "istighfar",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    latin: "Astaghfirullah wa atuubu ilaih",
    meaning: "Aku memohon ampun kepada Allah dan bertaubat kepada-Nya",
    defaultTarget: 100,
    virtue: "Rasulullah ﷺ beristighfar dan bertaubat 100× setiap hari."
  },
  {
    id: "subhanallah-wabihamdihi",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    latin: "Subhanallahi wa bihamdihi, Subhanallahil 'Azhim",
    meaning: "Maha Suci Allah dan dengan memuji-Nya, Maha Suci Allah yang Maha Agung",
    defaultTarget: 100,
    virtue: "Dua kalimat yang ringan di lisan, berat di timbangan, dan dicintai Ar-Rahman (HR. Bukhari)."
  },
  {
    id: "tahlil-lengkap",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Laa ilaha illallah wahdahu laa syarika lah, lahul mulku wa lahul hamdu, wa huwa 'ala kulli syai-in qadiir",
    meaning: "Tidak ada ilah yang berhak disembah selain Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya kerajaan dan segala pujian, dan Dia Mahakuasa atas segala sesuatu",
    defaultTarget: 100,
    virtue: "Pahala senilai memerdekakan 10 budak, dihapus 100 dosa, dan dijaga dari setan."
  },
  {
    id: "shalawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    latin: "Allahumma shalli 'ala Muhammad wa 'ala aali Muhammad",
    meaning: "Ya Allah, limpahkanlah shalawat kepada Nabi Muhammad dan keluarga Nabi Muhammad",
    defaultTarget: 10,
    virtue: "Siapa yang bershalawat satu kali, Allah bershalawat kepadanya sepuluh kali."
  },
  {
    id: "sapujagat",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbana aatina fid-dunya hasanah wa fil-akhirati hasanah wa qinaa 'adzaban-naar",
    meaning: "Wahai Rabb kami, berikanlah kami kebaikan di dunia dan kebaikan di akhirat serta lindungilah kami dari siksa neraka",
    defaultTarget: 7,
    virtue: "Doa yang paling sering dibaca Nabi ﷺ, dianjurkan saat Sa'i & Thawaf (7 putaran)."
  },
  {
    id: "custom",
    arabic: "ذِكْرٌ مُطْلَقٌ",
    latin: "Dzikir Bebas / Mandiri",
    meaning: "Dzikir dengan lafadz dan target pilihan pribadi",
    defaultTarget: 0,
    virtue: "Mengingat Allah di setiap waktu dan keadaan."
  }
];

export default function TasbihPage() {
  const [currentDzikirIndex, setCurrentDzikirIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [customInputVal, setCustomInputVal] = useState("70");
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isDzikirModalOpen, setIsDzikirModalOpen] = useState(false);
  const [isCustomTargetModalOpen, setIsCustomTargetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize and load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bes_tasbih_data");
      if (saved) {
        const d = JSON.parse(saved);
        if (typeof d.count === "number") setCount(d.count);
        if (typeof d.target === "number") setTarget(d.target);
        if (typeof d.roundsCompleted === "number") setRoundsCompleted(d.roundsCompleted);
        if (typeof d.totalCount === "number") setTotalCount(d.totalCount);
        if (typeof d.todayCount === "number") setTodayCount(d.todayCount);
        if (typeof d.currentDzikirIndex === "number") setCurrentDzikirIndex(d.currentDzikirIndex);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "bes_tasbih_data",
        JSON.stringify({
          count,
          target,
          roundsCompleted,
          totalCount,
          todayCount,
          currentDzikirIndex
        })
      );
    } catch (e) {
      console.error(e);
    }
  }, [count, target, roundsCompleted, totalCount, todayCount, currentDzikirIndex]);

  // Audio synthesize click sound
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  const triggerHaptic = (duration: number | number[] = 25) => {
    if (!hapticEnabled) return;
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  };

  const showCelebrationToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const increment = () => {
    playClickSound();
    triggerHaptic(20);

    const nextCount = count + 1;
    setCount(nextCount);
    setTodayCount((prev) => prev + 1);
    setTotalCount((prev) => prev + 1);

    if (target > 0 && nextCount === target) {
      setRoundsCompleted((prev) => prev + 1);
      triggerHaptic([60, 50, 100]);
      showCelebrationToast(`Alhamdulillah! Target ${target}× Telah Tercapai.`);
    }
  };

  const decrement = () => {
    if (count > 0) {
      triggerHaptic(15);
      setCount((prev) => prev - 1);
      setTodayCount((prev) => Math.max(0, prev - 1));
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  };

  const resetCount = () => {
    if (window.confirm("Apakah Anda ingin mereset hitungan saat ini ke nol?")) {
      triggerHaptic(35);
      setCount(0);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        increment();
      } else if (e.code === "Backspace") {
        decrement();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, target, soundEnabled, hapticEnabled]);

  const activeDzikir = DZIKIR_LIST[currentDzikirIndex] || DZIKIR_LIST[0];

  // SVG Progress Ring calculations
  const CIRCLE_RADIUS = 120;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const progressOffset = useMemo(() => {
    if (target <= 0) return CIRCLE_CIRCUMFERENCE * 0.75;
    const progress = Math.min(count / target, 1);
    return CIRCLE_CIRCUMFERENCE - progress * CIRCLE_CIRCUMFERENCE;
  }, [count, target, CIRCLE_CIRCUMFERENCE]);

  return (
    <div className={`min-h-screen bg-[#061510] text-[#f0fdf4] transition-all duration-300 relative selection:bg-emerald-500/30 font-sans flex flex-col justify-between ${isZenMode ? "justify-center items-center" : ""}`}>
      <SEO
        title="Tasbih Digital Sunnah - Buya Dr. Elvis Syam, M.A."
        description="Aplikasi Tasbih Digital Islami dengan lafadz dzikir shahih, target fleksibel (33x, 100x, custom), getaran haptic, dan mode layar penuh bebas distraksi."
      />

      {/* Background radial glow */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-radial from-emerald-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Target Achievement Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl shadow-emerald-900/50 flex items-center gap-2.5 z-50 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {!isZenMode && <Navbar />}

      <main className="max-w-md mx-auto px-4 py-4 flex flex-col items-center relative z-10 w-full flex-1 justify-center">
        {/* Sub-header controls */}
        {!isZenMode && (
          <div className="w-full flex items-center justify-between pb-3 mb-2">
            <Link
              to="/haji-umroh"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 hover:text-white hover:border-emerald-400 transition"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              <span>Portal</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={`w-9 h-9 rounded-xl border-emerald-500/20 bg-emerald-950/40 transition ${
                  hapticEnabled ? "text-emerald-400 border-emerald-400/50 bg-emerald-900/40" : "text-slate-400"
                }`}
                title={hapticEnabled ? "Getaran Aktif" : "Getaran Mati"}
              >
                <Smartphone className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playClickSound();
                }}
                className={`w-9 h-9 rounded-xl border-emerald-500/20 bg-emerald-950/40 transition ${
                  soundEnabled ? "text-emerald-400 border-emerald-400/50 bg-emerald-900/40" : "text-slate-400"
                }`}
                title={soundEnabled ? "Suara Klik Aktif" : "Suara Klik Senyap"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsZenMode(true)}
                className="w-9 h-9 rounded-xl border-emerald-500/20 bg-emerald-950/40 text-slate-300 hover:text-white hover:border-emerald-400 transition"
                title="Mode Zen (Layar Penuh)"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Title & Badge */}
        {!isZenMode && (
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Buya Elvi Syam • Ibadah Harian
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-100">
              Tasbih Digital Sunnah
            </h1>
          </div>
        )}

        {/* Dzikir selector interactive card */}
        {!isZenMode && (
          <button
            onClick={() => setIsDzikirModalOpen(true)}
            className="w-full bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/25 hover:border-emerald-400/60 rounded-2xl p-4 mb-4 backdrop-blur-md shadow-lg shadow-emerald-950/30 text-center transition group relative"
          >
            <div className="text-2xl sm:text-3xl font-serif text-amber-200 mb-1 leading-relaxed" dir="rtl">
              {activeDzikir.arabic}
            </div>
            <div className="font-bold text-sm text-emerald-50">{activeDzikir.latin}</div>
            <div className="text-xs text-slate-300 italic mt-0.5 line-clamp-1">{activeDzikir.meaning}</div>

            <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition">
              <BookOpen className="w-3 h-3" />
              <span>Ganti Lafadz Dzikir</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </div>
          </button>
        )}

        {/* Target Tabs Pills */}
        {!isZenMode && (
          <div className="w-full flex items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border border-emerald-500/20 mb-4">
            <button
              onClick={() => setTarget(33)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                target === 33 ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}
            >
              33×
            </button>
            <button
              onClick={() => setTarget(100)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                target === 100 ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}
            >
              100×
            </button>
            <button
              onClick={() => setTarget(7)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                target === 7 ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}
            >
              7× (Thawaf)
            </button>
            <button
              onClick={() => setIsCustomTargetModalOpen(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                target !== 33 && target !== 100 && target !== 7 && target !== 0
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {target !== 33 && target !== 100 && target !== 7 && target !== 0 ? `${target}×` : "Custom"}
            </button>
            <button
              onClick={() => setTarget(0)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                target === 0 ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}
              title="Mode Bebas (Tanpa Batas)"
            >
              ∞ Bebas
            </button>
          </div>
        )}

        {/* Main Big Circular Counter Button with SVG Ring */}
        <div className={`relative flex items-center justify-center ${isZenMode ? "w-80 h-80 my-8" : "w-64 h-64 sm:w-72 sm:h-72 my-1"}`}>
          {/* Progress Ring SVG */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
            <defs>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle
              cx="130"
              cy="130"
              r={CIRCLE_RADIUS}
              className="fill-none stroke-emerald-950/40"
              strokeWidth="10"
            />
            <circle
              cx="130"
              cy="130"
              r={CIRCLE_RADIUS}
              stroke="url(#emeraldGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              className="fill-none transition-[stroke-dashoffset] duration-150 ease-out"
              style={{
                strokeDasharray: CIRCLE_CIRCUMFERENCE,
                strokeDashoffset: progressOffset
              }}
            />
          </svg>

          {/* Center clickable circular button */}
          <button
            onClick={increment}
            aria-label="Hitung dzikir"
            className="absolute w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full bg-gradient-to-b from-emerald-900/60 to-emerald-950/95 border-2 border-emerald-500/30 hover:border-emerald-400/60 active:scale-95 transition-all duration-100 flex flex-col items-center justify-center shadow-2xl shadow-emerald-950/60 select-none group"
          >
            <div className="font-serif text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-[0_4px_16px_rgba(16,185,129,0.5)]">
              {count}
            </div>

            <div className="text-xs font-semibold text-amber-300/90 mt-1.5 tracking-wider">
              {target > 0 ? `Target: ${target}` : `Mode Bebas (∞)`}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mt-1 group-active:text-white transition">
              Ketuk Layar
            </div>
          </button>
        </div>

        {/* Action Controls: Undo & Reset */}
        <div className="w-full flex items-center justify-center gap-3 my-3">
          <Button
            variant="outline"
            onClick={decrement}
            disabled={count === 0}
            className="bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-400/50 text-slate-200 hover:text-white rounded-xl px-4 py-2 text-xs font-bold gap-2 transition"
          >
            <Undo2 className="w-4 h-4 text-emerald-400" />
            <span>Undo (-1)</span>
          </Button>

          <Button
            variant="outline"
            onClick={resetCount}
            disabled={count === 0}
            className="bg-emerald-950/40 border-emerald-500/20 hover:border-rose-500/50 hover:bg-rose-950/30 text-slate-200 hover:text-rose-300 rounded-xl px-4 py-2 text-xs font-bold gap-2 transition"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Daily Stats Summary */}
        {!isZenMode && (
          <div className="w-full bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-around text-center mt-1">
            <div>
              <div className="text-lg font-extrabold text-emerald-300">{todayCount}</div>
              <div className="text-[11px] font-semibold text-slate-400">Hari Ini</div>
            </div>
            <div className="h-6 w-px bg-emerald-500/20" />
            <div>
              <div className="text-lg font-extrabold text-amber-300">{roundsCompleted}</div>
              <div className="text-[11px] font-semibold text-slate-400">Putaran Selesai</div>
            </div>
            <div className="h-6 w-px bg-emerald-500/20" />
            <div>
              <div className="text-lg font-extrabold text-teal-300">{totalCount}</div>
              <div className="text-[11px] font-semibold text-slate-400">Total Seluruhnya</div>
            </div>
          </div>
        )}

        {/* Exit Zen Mode Button */}
        {isZenMode && (
          <Button
            variant="outline"
            onClick={() => setIsZenMode(false)}
            className="mt-6 bg-black/50 border-emerald-500/30 text-slate-300 hover:text-white rounded-full px-5 py-2 text-xs font-bold gap-2"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Keluar Mode Zen</span>
          </Button>
        )}
      </main>

      {!isZenMode && <Footer />}
      {!isZenMode && <BottomNav />}

      {/* Sheet Modal: Dzikir Selection */}
      {isDzikirModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setIsDzikirModalOpen(false)}
        >
          <div
            className="bg-[#092118] border border-emerald-500/30 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h2 className="text-center font-bold text-lg text-emerald-100 mb-3">Pilih Lafadz Dzikir Sunnah</h2>

            <div className="space-y-2.5">
              {DZIKIR_LIST.map((item, index) => {
                const isSelected = index === currentDzikirIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentDzikirIndex(index);
                      if (item.defaultTarget !== undefined) {
                        setTarget(item.defaultTarget);
                      }
                      setIsDzikirModalOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1 ${
                      isSelected
                        ? "bg-emerald-900/50 border-emerald-400/80 shadow-md shadow-emerald-950/40"
                        : "bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-400/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-100">{item.latin}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="text-xl font-serif text-amber-200 text-right my-1" dir="rtl">
                      {item.arabic}
                    </div>
                    <div className="text-xs text-slate-300 italic">{item.meaning}</div>
                    {item.virtue && <div className="text-[11px] text-emerald-400/90 mt-0.5">{item.virtue}</div>}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setIsDzikirModalOpen(false)}
              className="w-full mt-4 bg-emerald-950/40 border-emerald-500/20 text-slate-200 rounded-xl"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Custom Target */}
      {isCustomTargetModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsCustomTargetModalOpen(false)}
        >
          <div
            className="bg-[#092118] border border-emerald-500/30 w-full max-w-sm rounded-2xl p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-emerald-100 mb-1">Target Bilangan Dzikir</h3>
            <p className="text-xs text-slate-300 mb-4">Tentukan angka target yang ingin Anda capai:</p>

            <input
              type="number"
              min="1"
              max="999999"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-400 mb-4"
              placeholder="Misal: 70 atau 500"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCustomTargetModalOpen(false)}
                className="flex-1 bg-emerald-950/40 border-emerald-500/20 text-slate-300 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  const val = parseInt(customInputVal, 10);
                  if (val && val > 0) {
                    setTarget(val);
                    setIsCustomTargetModalOpen(false);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
