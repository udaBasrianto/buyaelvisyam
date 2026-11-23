import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { DZIKIR_LIST, DzikirItem } from "@/data/dzikirData";
import { 
  Sun, Moon, RotateCcw, Check, Sparkles, 
  ChevronRight, ChevronLeft, ChevronDown, Download, CheckCircle2,
  Sliders, ArrowLeft, Flame, ChevronsUpDown, Maximize2, Minimize2, BookOpen,
  Smartphone, LayoutList
} from "lucide-react";

export default function DzikirPage() {
  // ── TIME MODE: AUTO-DETECT (Pagi: 04:00 - 15:00, Petang: 15:00 - 04:00) ──────
  const [mode, setMode] = useState<"pagi" | "petang">(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 4 && currentHour < 15 ? "pagi" : "petang";
  });

  // ── COUNTER STATE PERSISTENCE ───────────────────────────────────────────────
  const storageKey = `dzikir_counts_${mode}`;
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem("dzikir_last_date");
      if (savedDate !== today) {
        localStorage.setItem("dzikir_last_date", today);
        return {};
      }
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(counts));
    } catch (e) {
      console.error(e);
    }
  }, [counts, storageKey]);

  // Switch mode helper: reload counts for that mode
  const handleModeChange = (newMode: "pagi" | "petang") => {
    setMode(newMode);
    setCurrentStep(0);
    try {
      const saved = localStorage.getItem(`dzikir_counts_${newMode}`);
      setCounts(saved ? JSON.parse(saved) : {});
    } catch {
      setCounts({});
    }
  };

  // ── CUSTOMIZATION SETTINGS ──────────────────────────────────────────────────
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    return Number(localStorage.getItem("dzikir_font_size")) || 2; // 1: sm, 2: md, 3: lg, 4: xl
  });
  const [showLatin, setShowLatin] = useState<boolean>(() => {
    const s = localStorage.getItem("dzikir_show_latin");
    return s !== null ? s === "true" : true;
  });
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    const s = localStorage.getItem("dzikir_show_trans");
    return s !== null ? s === "true" : true;
  });
  const [showBenefits, setShowBenefits] = useState<boolean>(() => {
    const s = localStorage.getItem("dzikir_show_benefits");
    return s !== null ? s === "true" : true;
  });
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("dzikir_font_size", fontSizeLevel.toString());
  }, [fontSizeLevel]);
  useEffect(() => {
    localStorage.setItem("dzikir_show_latin", showLatin.toString());
  }, [showLatin]);
  useEffect(() => {
    localStorage.setItem("dzikir_show_trans", showTranslation.toString());
  }, [showTranslation]);
  useEffect(() => {
    localStorage.setItem("dzikir_show_benefits", showBenefits.toString());
  }, [showBenefits]);

  const [showDalilInfo, setShowDalilInfo] = useState<boolean>(false);

  // ── FILTERED DZIKIR LIST ────────────────────────────────────────────────────
  const activeList = useMemo(() => {
    return DZIKIR_LIST.filter(item => item.timeType === "both" || item.timeType === mode);
  }, [mode]);

  // ── VIEW MODE (SWIPE / STEP-BY-STEP vs ACCORDION LIST) ──────────────────────
  const [viewMode, setViewMode] = useState<"swipe" | "list">(() => {
    try {
      const saved = localStorage.getItem("dzikir_view_mode");
      if (saved === "swipe" || saved === "list") return saved;
      return "swipe"; // default to sequential step swipe mode
    } catch {
      return "swipe";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dzikir_view_mode", viewMode);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode]);

  // Current step index in swipe mode
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | "">("");

  // Touch gesture refs for mobile swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleNextStep = () => {
    if (currentStep < activeList.length - 1) {
      setSlideDirection("next");
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setSlideDirection("");
      }, 120);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setSlideDirection("prev");
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setSlideDirection("");
      }, 120);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Minimum swipe threshold 40px and predominantly horizontal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX > 0) {
        // Swiped left -> Next Step
        handleNextStep();
      } else {
        // Swiped right -> Previous Step
        handlePrevStep();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation (ArrowLeft: prev, ArrowRight: next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "swipe") return;
      if (e.key === "ArrowRight") {
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        handlePrevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentStep, activeList.length]);



  // ── ACCORDION STATE ─────────────────────────────────────────────────────────
  // Default: open the first unfinished dzikir
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const firstItem = DZIKIR_LIST.find(i => i.timeType === "both" || i.timeType === mode);
    return firstItem ? { [firstItem.id]: true } : {};
  });

  const toggleAccordion = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    activeList.forEach(item => {
      allOpen[item.id] = true;
    });
    setOpenIds(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenIds({});
  };

  // Calculate Progress
  const completedCount = useMemo(() => {
    return activeList.filter(item => (counts[item.id] || 0) >= item.count).length;
  }, [activeList, counts]);

  const progressPercentage = Math.round((completedCount / activeList.length) * 100) || 0;

  // ── HAPTIC & AUDIO FEEDBACK ─────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio policy
    }
  };

  const handleIncrement = (item: DzikirItem) => {
    if (hapticEnabled && navigator.vibrate) {
      navigator.vibrate(35);
    }
    playClickSound();

    const current = counts[item.id] || 0;
    const next = current + 1;

    setCounts(prev => ({
      ...prev,
      [item.id]: next
    }));

    // Auto-advance: if item just completed, move to next item or next accordion!
    if (next === item.count) {
      if (viewMode === "swipe" && currentStep < activeList.length - 1) {
        setTimeout(() => {
          handleNextStep();
        }, 500);
      } else if (viewMode === "list") {
        const currentIndex = activeList.findIndex(i => i.id === item.id);
        const nextItem = activeList.slice(currentIndex + 1).find(i => (counts[i.id] || 0) < i.count);
        if (nextItem) {
          setTimeout(() => {
            setOpenIds(prev => ({
              ...prev,
              [nextItem.id]: true
            }));
            const el = document.getElementById(`dzikir-${nextItem.id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }, 350);
        }
      }
    }
  };

  const handleResetItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCounts(prev => ({
      ...prev,
      [id]: 0
    }));
  };

  const handleResetAll = () => {
    if (window.confirm(`Reset semua hitungan Dzikir ${mode === "pagi" ? "Pagi" : "Petang"}?`)) {
      setCounts({});
    }
  };

  // Scroll to first uncompleted dzikir & open its accordion
  const scrollToNextUnfinished = () => {
    const unfinished = activeList.find(item => (counts[item.id] || 0) < item.count);
    if (unfinished) {
      setOpenIds(prev => ({ ...prev, [unfinished.id]: true }));
      const el = document.getElementById(`dzikir-${unfinished.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Current active item for swipe mode
  const currentItem = activeList[currentStep] || activeList[0];
  const currentCount = currentItem ? (counts[currentItem.id] || 0) : 0;
  const targetCount = currentItem ? currentItem.count : 1;
  const isItemCompleted = currentCount >= targetCount;
  const itemArabic = currentItem ? ((mode === "petang" && currentItem.arabicPetang) ? currentItem.arabicPetang : currentItem.arabic) : "";
  const itemLatin = currentItem ? ((mode === "petang" && currentItem.latinPetang) ? currentItem.latinPetang : currentItem.latin) : "";
  const itemTrans = currentItem ? ((mode === "petang" && currentItem.translationPetang) ? currentItem.translationPetang : currentItem.translation) : "";

  // Font size classes
  const arabicSizeClasses = [
    "text-xl leading-[2.2]",
    "text-2xl leading-[2.3]",
    "text-3xl leading-[2.4]",
    "text-4xl leading-[2.5]"
  ][fontSizeLevel - 1] || "text-2xl leading-[2.3]";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <SEO 
        title={`Dzikir ${mode === "pagi" ? "Pagi" : "Petang"} Sesuai Sunnah - Buya Dr. Elvis Syam, M.A.`}
        description="Panduan lengkap Dzikir Pagi dan Petang sesuai sunnah Rasulullah shallallahu 'alaihi wa sallam dengan tasbih digital interaktif, faedah hadits, dan teks Arab berharakat."
      />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 bottom-nav-safe pb-28 max-w-3xl">
        {/* Navigation Breadcrumb / Citation Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors font-medium">Beranda</Link>
            <span>/</span>
            <Link to="/jadwal-sholat" className="hover:text-primary transition-colors font-medium">Ibadah</Link>
            <span>/</span>
            <span className="text-foreground font-bold">Dzikir Pagi Petang</span>
          </div>

          <a 
            href="https://almanhaj.or.id/11518-dzikir-pagi-dan-petang.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-full transition-all"
            title="Buka Rujukan Ilmiah Dzikir di Almanhaj.or.id"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Rujukan: Almanhaj.or.id</span>
          </a>
        </div>

        {/* HERO BANNER CARD */}
        <div className={`p-6 sm:p-8 rounded-3xl relative overflow-hidden mb-6 shadow-xl transition-all duration-500 text-white ${
          mode === "pagi" 
            ? "bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 border border-emerald-500/30" 
            : "bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 border border-indigo-500/30"
        }`}>
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-white/15">
                {mode === "pagi" ? <Sun className="h-4 w-4 text-amber-300 animate-spin-slow" /> : <Moon className="h-4 w-4 text-indigo-300" />}
                <span>{mode === "pagi" ? "Waktu Subuh - Pagi" : "Waktu Ashar - Menjelang Malam"}</span>
              </div>

              {/* Setting Toggle Trigger */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/15"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Pengaturan Teks</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
              Dzikir {mode === "pagi" ? "Pagi" : "Petang"} Sesuai Sunnah
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Benteng dan perlindungan setiap mukmin sesuai tuntunan hadits shahih Rasulullah ﷺ dengan tasbih digital interaktif.
            </p>

            {/* MODE SWITCHER BUTTONS */}
            <div className="mt-6 flex bg-black/30 p-1.5 rounded-2xl border border-white/15 max-w-md">
              <button
                onClick={() => handleModeChange("pagi")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === "pagi" 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/50 scale-[1.02]" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sun className="h-4 w-4 text-amber-300" />
                Dzikir Pagi
              </button>
              <button
                onClick={() => handleModeChange("petang")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  mode === "petang" 
                    ? "bg-gradient-to-r from-indigo-500 to-amber-600 text-white shadow-lg shadow-indigo-950/50 scale-[1.02]" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Moon className="h-4 w-4 text-amber-200" />
                Dzikir Petang
              </button>
            </div>
          </div>
        </div>

        {/* COLLAPSIBLE DALIL & KEUTAMAAN CARD DARI ALMANHAJ */}
        <div className="mb-5 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowDalilInfo(!showDalilInfo)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">
                  Dalil Al-Qur'an, Hadits & Waktu Pelaksanaan
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Rujukan: Risalah Dzikir Ust. Yazid bin 'Abdul Qadir Jawas رحمه الله (Almanhaj.or.id)
                </p>
              </div>
            </div>
            <div className={`p-1 text-muted-foreground transition-transform duration-200 ${showDalilInfo ? "rotate-180 text-primary" : ""}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>

          {showDalilInfo && (
            <div className="p-4 sm:p-5 pt-1 border-t border-border/40 text-xs text-muted-foreground leading-relaxed space-y-3.5 bg-muted/20">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-foreground">
                <p className="font-bold text-primary mb-1">Keutamaan Hadits (HR. Abu Dawud no. 3667 - Hasan):</p>
                <p className="italic text-xs text-muted-foreground">
                  Dari Anas bin Malik radhiyallahu 'anhu, Rasulullah ﷺ bersabda: "Aku duduk bersama orang-orang yang berdzikir kepada Allah dari mulai shalat Shubuh sampai terbit matahari lebih aku sukai dari memerdekakan empat orang budak... Dan aku duduk bersama orang-orang yang berdzikir kepada Allah dari mulai shalat 'Ashar sampai terbenam matahari lebih aku cintai dari memerdekakan empat orang budak."
                </p>
              </div>

              <div>
                <p className="font-bold text-foreground mb-1">Dalil Al-Qur'an:</p>
                <p className="italic">
                  "Hai orang-orang yang beriman, berdzikirlah (dengan menyebut Nama) Allah dzikir yang sebanyak-banyaknya. Dan bertasbihlah kepada-Nya di waktu pagi dan petang." (QS. Al-Ahzab: 41-42)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-card border border-border/70">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Waktu Dzikir Pagi:</span>
                  <span>Antara setelah shalat Shubuh hingga terbit matahari (boleh dilanjutkan hingga waktu Dhuha).</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/70">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Waktu Dzikir Petang:</span>
                  <span>Antara setelah shalat 'Ashar hingga terbenam matahari (boleh dilanjutkan hingga awal malam).</span>
                </div>
              </div>

              <div className="text-[11px] pt-1 border-t border-border/40 flex items-center justify-between">
                <span>Sumber artikel lengkap:</span>
                <a 
                  href="https://almanhaj.or.id/11518-dzikir-pagi-dan-petang.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline"
                >
                  almanhaj.or.id/11518-dzikir-pagi-dan-petang.html ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS TRACKER BAR */}
        <div className="sticky top-2 z-30 mb-5 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-md flex flex-col gap-2.5 transition-all">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              <span>Kemajuan:</span>
              <span className="text-primary font-black">{completedCount} / {activeList.length} Dzikir</span>
              <span className="text-muted-foreground font-medium">({progressPercentage}%)</span>
            </div>

            <div className="flex items-center gap-2">
              {completedCount < activeList.length && (
                <button
                  onClick={scrollToNextUnfinished}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  Lanjut Dzikir
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={handleResetAll}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 font-semibold p-1 hover:bg-muted rounded-lg transition-colors"
                title="Reset Hitungan"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercentage === 100 
                  ? "bg-gradient-to-r from-emerald-500 to-green-400" 
                  : "bg-gradient-to-r from-primary to-teal-400"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {progressPercentage === 100 && (
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Maa Syaa Allah! Anda telah menyelesaikan seluruh rangkaian Dzikir {mode === "pagi" ? "Pagi" : "Petang"}.</span>
            </div>
          )}
        </div>

        {/* VIEW MODE SELECTOR (SWIPE PER HALAMAN vs DAFTAR LENGKAP) */}
        <div className="flex items-center justify-between gap-2 mb-4 p-1.5 rounded-2xl bg-muted/60 border border-border/70 select-none">
          <button
            type="button"
            onClick={() => setViewMode("swipe")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              viewMode === "swipe"
                ? "bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mode Swipe (Per Halaman)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Mode Daftar (Semua)</span>
          </button>
        </div>

        {viewMode === "swipe" && currentItem ? (
              <div className="space-y-4">
                {/* STEP CONTROLLER HEADER */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-card border border-border/70 shadow-sm text-xs">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-xl font-bold transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-muted text-foreground"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-foreground bg-primary/10 text-primary px-3 py-1 rounded-full text-xs border border-primary/20">
                      Butir {currentStep + 1} / {activeList.length}
                    </span>

                    {/* Quick Step Selector */}
                    <select
                      value={currentStep}
                      onChange={(e) => setCurrentStep(Number(e.target.value))}
                      className="bg-muted/50 border border-input rounded-xl px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground max-w-[130px] sm:max-w-[180px] truncate"
                    >
                      {activeList.map((itm, idx) => (
                        <option key={itm.id} value={idx}>
                          {idx + 1}. {itm.title} {(counts[itm.id] || 0) >= itm.count ? "✓" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === activeList.length - 1}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-xl font-bold transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-muted text-foreground"
                    title="Halaman Berikutnya"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* FOCUSED SWIPE CARD WITH TOUCH GESTURE */}
                <div
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                  className={`relative rounded-3xl border bg-card p-5 sm:p-7 shadow-lg transition-all duration-200 select-none overflow-hidden ${
                    slideDirection === "next"
                      ? "opacity-60 -translate-x-3"
                      : slideDirection === "prev"
                      ? "opacity-60 translate-x-3"
                      : "opacity-100 translate-x-0"
                  } ${
                    isItemCompleted
                      ? "border-emerald-500/50 shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                      : "border-border shadow-md"
                  }`}
                >
                  {/* Card Meta & Header */}
                  <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-border/50">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Butir ke-{currentStep + 1}
                        </span>
                        {currentItem.badge && (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            {currentItem.badge}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                        {currentItem.title}
                      </h2>
                    </div>

                    {/* Target Count Pill */}
                    <div className={`px-3 py-1.5 rounded-2xl text-xs font-black shrink-0 border transition-all ${
                      isItemCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm"
                        : currentCount > 0
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border/60"
                    }`}>
                      {currentCount} / {targetCount}x {isItemCompleted && "✓"}
                    </div>
                  </div>

                  {/* Arabic Text Display */}
                  <div
                    dir="rtl"
                    className={`font-arabic text-right text-foreground font-normal tracking-wide selection:bg-primary/20 py-4 px-1 my-2 leading-relaxed ${arabicSizeClasses}`}
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                  >
                    {itemArabic}
                  </div>

                  {/* Latin Transliteration */}
                  {showLatin && itemLatin && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs sm:text-sm text-foreground/85 font-medium leading-relaxed italic">
                      {itemLatin}
                    </div>
                  )}

                  {/* Translation */}
                  {showTranslation && itemTrans && (
                    <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <span className="font-bold text-foreground/80 not-italic">Artinya: </span>
                      {itemTrans}
                    </div>
                  )}

                  {/* Benefits / Faedah Hadits */}
                  {showBenefits && currentItem.benefits && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800 dark:text-amber-300">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Keutamaan & Faedah Hadits:</span>
                      </div>
                      <p>{currentItem.benefits}</p>
                      <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                        Sumber: {currentItem.source}
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE DIGITAL TASBIH TAP BUTTON */}
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleIncrement(currentItem)}
                      className={`w-full py-4 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between transition-all duration-150 active:scale-[0.98] shadow-md select-none ${
                        isItemCompleted
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/50 hover:bg-emerald-500/20 shadow-emerald-500/10"
                          : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isItemCompleted ? "bg-emerald-500 text-white shadow-sm" : "bg-white/20 text-white"
                        }`}>
                          {isItemCompleted ? <Check className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                        </div>
                        <div className="text-left">
                          <div className="leading-tight">
                            {isItemCompleted ? "Alhamdulillah Selesai" : "Ketuk untuk Menghitung"}
                          </div>
                          <div className="text-[11px] font-medium opacity-80">
                            {isItemCompleted ? "Lanjut geser ke butir berikutnya" : "Dapat digeser / swipe layar ke kiri"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-baseline gap-1 bg-black/20 px-3.5 py-1.5 rounded-xl font-mono">
                          <span className="text-xl font-black">{currentCount}</span>
                          <span className="text-xs opacity-75">/ {targetCount}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Swipe Gesture Hint on Mobile */}
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>👈 Geser ke kanan (sebelumnya)</span>
                    {currentCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleResetItem(currentItem.id, e)}
                        className="text-muted-foreground hover:text-destructive flex items-center gap-1 font-semibold hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset Butir Ini
                      </button>
                    )}
                    <span>Geser ke kiri (berikutnya) 👉</span>
                  </div>
                </div>

                {/* BOTTOM STEPPER CONTROLS & MINI DOTS */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex-1 py-3 px-4 rounded-2xl bg-card border border-border/80 font-bold text-xs sm:text-sm text-foreground flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-30 disabled:pointer-events-none hover:bg-muted active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="text-xs font-bold text-muted-foreground">
                    {currentStep + 1} / {activeList.length}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === activeList.length - 1}
                    className="flex-1 py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-30 disabled:pointer-events-none hover:bg-primary/95 active:scale-95 transition-all"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
        ) : (
          <div>
        {/* ACCORDION CONTROLS (BUKA / TUTUP SEMUA) */}
        <div className="flex items-center justify-between px-1 mb-3 text-xs text-muted-foreground">
          <span className="font-semibold">{activeList.length} Butir Dzikir Shahih</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="inline-flex items-center gap-1 hover:text-primary font-bold px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <Maximize2 className="h-3 w-3" />
              Buka Semua
            </button>
            <span>•</span>
            <button
              onClick={handleCollapseAll}
              className="inline-flex items-center gap-1 hover:text-primary font-bold px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <Minimize2 className="h-3 w-3" />
              Tutup Semua
            </button>
          </div>
        </div>

        {/* DZIKIR ACCORDION LIST */}
        <div className="space-y-3">
          {activeList.map((item, index) => {
            const count = counts[item.id] || 0;
            const target = item.count;
            const isCompleted = count >= target;
            const isOpen = !!openIds[item.id];
            const arabicText = (mode === "petang" && item.arabicPetang) ? item.arabicPetang : item.arabic;
            const latinText = (mode === "petang" && item.latinPetang) ? item.latinPetang : item.latin;
            const transText = (mode === "petang" && item.translationPetang) ? item.translationPetang : item.translation;

            return (
              <div 
                key={item.id} 
                id={`dzikir-${item.id}`}
                className={`rounded-2xl transition-all duration-200 border overflow-hidden ${
                  isCompleted 
                    ? "bg-card/70 border-emerald-500/40 shadow-sm" 
                    : isOpen
                      ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/20"
                      : "bg-card border-border hover:border-primary/40 shadow-sm"
                }`}
              >
                {/* ACCORDION HEADER (TAP TO EXPAND/COLLAPSE) */}
                <div
                  onClick={() => toggleAccordion(item.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                      isCompleted 
                        ? "bg-emerald-500 text-white shadow-sm" 
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-bold tracking-tight truncate">
                          {item.title}
                        </h2>
                      </div>
                      {item.badge && (
                        <span className="inline-block text-[10px] font-semibold text-primary/90 mt-0.5">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Counter Pill Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                      isCompleted 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                        : count > 0 
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border/50"
                    }`}>
                      {count} / {target}x {isCompleted && "✓"}
                    </div>

                    {/* Reset Button (only if count > 0) */}
                    {count > 0 && (
                      <button 
                        onClick={(e) => handleResetItem(item.id, e)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors"
                        title="Reset hitungan item ini"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}

                    {/* Chevron Icon */}
                    <div className={`p-1 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* ACCORDION CONTENT (EXPANDED BODY) */}
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* ARABIC TEXT */}
                    <div 
                      dir="rtl"
                      className={`font-arabic text-right text-foreground font-normal tracking-wide selection:bg-primary/20 py-3 px-1 my-1 leading-relaxed ${arabicSizeClasses}`}
                      style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                    >
                      {arabicText}
                    </div>

                    {/* LATIN TRANSLITERATION */}
                    {showLatin && latinText && (
                      <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/40 text-xs sm:text-sm text-foreground/85 font-medium leading-relaxed italic">
                        {latinText}
                      </div>
                    )}

                    {/* TRANSLATION */}
                    {showTranslation && transText && (
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground/80 not-italic">Artinya: </span>
                        {transText}
                      </div>
                    )}

                    {/* BENEFITS / FAEDAH */}
                    {showBenefits && item.benefits && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800 dark:text-amber-300">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Keutamaan & Faedah Hadits:</span>
                        </div>
                        <p>{item.benefits}</p>
                        <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                          Sumber: {item.source}
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE DIGITAL TASBIH COUNTER BUTTON */}
                    <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                      <button
                        onClick={() => handleIncrement(item)}
                        className={`w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-between transition-all duration-150 active:scale-[0.98] select-none ${
                          isCompleted 
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/50 hover:bg-emerald-500/20" 
                            : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCompleted ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
                          }`}>
                            {isCompleted ? <Check className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                          </div>
                          <span className="text-left">
                            {isCompleted ? "Alhamdulillah Selesai" : "Ketuk untuk Menghitung"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-baseline gap-1 bg-black/15 px-3 py-1 rounded-lg">
                            <span className="text-lg font-black">{count}</span>
                            <span className="text-xs opacity-75">/ {target}</span>
                          </div>
                        </div>
                      </button>

                      {/* Small action footer inside accordion */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
                        <button
                          onClick={() => toggleAccordion(item.id)}
                          className="hover:underline"
                        >
                          Tutup Bagian Ini
                        </button>
                        {index < activeList.length - 1 && (
                          <button
                            onClick={() => {
                              const next = activeList[index + 1];
                              setOpenIds(prev => ({ ...prev, [next.id]: true }));
                              const el = document.getElementById(`dzikir-${next.id}`);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="text-primary font-bold flex items-center gap-0.5 hover:underline"
                          >
                            Dzikir Selanjutnya
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

          </div>
        )}
        {/* BOTTOM COMPLETION CARD */}
        {progressPercentage === 100 && (
          <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center shadow-xl">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-black mb-1">Dzikir Selesai Sempurna!</h3>
            <p className="text-white/80 text-xs sm:text-sm max-w-md mx-auto mb-4">
              Semoga Allah senantiasa menjaga, melindungi, dan melimpahkan barakah kepada Anda dan sekeluarga sepanjang hari ini.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-white text-emerald-800 hover:bg-white/90 font-bold px-6 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all"
            >
              Kembali ke Atas
            </button>
          </div>
        )}
      </main>

      {/* READING SETTINGS MODAL / SHEET */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <h3 className="font-black text-base">Pengaturan Tampilan Dzikir</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-lg"
              >
                Tutup
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Ukuran Teks Arab
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 1, label: "Kecil" },
                  { level: 2, label: "Sedang" },
                  { level: 3, label: "Besar" },
                  { level: 4, label: "Ekstra" },
                ].map(item => (
                  <button
                    key={item.level}
                    onClick={() => setFontSizeLevel(item.level)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      fontSizeLevel === item.level 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Konten yang Ditampilkan
              </label>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                <span className="text-xs sm:text-sm font-semibold">Teks Latin / Transliterasi</span>
                <input 
                  type="checkbox" 
                  checked={showLatin} 
                  onChange={(e) => setShowLatin(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                <span className="text-xs sm:text-sm font-semibold">Terjemahan Bahasa Indonesia</span>
                <input 
                  type="checkbox" 
                  checked={showTranslation} 
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                <span className="text-xs sm:text-sm font-semibold">Faedah Hadits & Keutamaan</span>
                <input 
                  type="checkbox" 
                  checked={showBenefits} 
                  onChange={(e) => setShowBenefits(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                <span className="text-xs sm:text-sm font-semibold">Getaran Saat Mengetuk (Haptic)</span>
                <input 
                  type="checkbox" 
                  checked={hapticEnabled} 
                  onChange={(e) => setHapticEnabled(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                <span className="text-xs sm:text-sm font-semibold">Suara Efek Klik Tasbih</span>
                <input 
                  type="checkbox" 
                  checked={soundEnabled} 
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-sm shadow-md"
            >
              Simpan & Lanjutkan
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
