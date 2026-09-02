import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, Calendar, User, ChevronRight, ChevronLeft, Pause, Play } from "lucide-react";
import { heroSlides as defaultSlides } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_POST_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238B5CF6;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%236366F1;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='600' fill='url(%23grad1)'/%3E%3Ctext x='600' y='300' font-size='48' fill='white' opacity='0.3' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3E📖 Blog Islami%3C/text%3E%3C/svg%3E";
const SLIDE_DURATION = 7000;

interface HeroSliderV2Props {
  slides?: Post[];
}

export function HeroSliderV2({ slides }: HeroSliderV2Props) {
  const { settings } = useSiteSettings();
  const defaultImage = settings?.default_article_image || DEFAULT_POST_IMAGE;
  const data = slides && slides.length > 0 ? (slides.length > 5 ? slides.slice(0, 5) : slides) : defaultSlides.slice(0, 5);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % data.length);
    setProgressKey((k) => k + 1);
  }, [data.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + data.length) % data.length);
    setProgressKey((k) => k + 1);
  }, [data.length]);

  const goTo = useCallback(
    (index: number) => {
      if (index === current) return;
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      setProgressKey((k) => k + 1);
    },
    [current],
  );

  // Auto-slide timer
  useEffect(() => {
    if (data.length <= 1) return;

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      next();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, isPaused, next, data.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

  const slide = data[current];
  if (!slide) return null;

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Main Slider */}
      <div
        className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:min-h-[520px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Slide */}
        <div className="lg:col-span-3 relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all duration-500 bg-muted h-[220px] sm:h-[280px] md:h-full">
          {/* SVG Border Progress Trace */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Background track */}
              <rect
                x="1"
                y="1"
                width="98"
                height="98"
                rx="3"
                fill="none"
                stroke="white"
                strokeOpacity="0.15"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
              {/* Animated progress */}
              <motion.rect
                key={`progress-${progressKey}`}
                x="1"
                y="1"
                width="98"
                height="98"
                rx="3"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={isPaused ? { pathLength: 0 } : { pathLength: 1 }}
                transition={
                  isPaused
                    ? { duration: 0 }
                    : { duration: SLIDE_DURATION / 1000, ease: "linear" }
                }
              />
            </svg>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full"
            >
              <Link to={`/${slide.slug || slide.id}`} className="block h-full relative overflow-hidden">
                {/* Background image with subtle Ken Burns */}
                <motion.img
                  src={slide.image || defaultImage}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  animate={isPaused ? { scale: 1 } : { scale: 1.12 }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                  }}
                />

                {/* Gradient overlay — opacity capped at 75 max so image stays visible */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
                  style={{ opacity: Math.min((settings?.slider_overlay_opacity ?? 60), 75) / 100 }}
                />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-14">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-wrap gap-2 mb-4 md:mb-6"
                  >
                    <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] md:text-xs font-black uppercase tracking-widest shadow-2xl">
                      {slide.category}
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 md:mb-8 drop-shadow-2xl line-clamp-3"
                  >
                    {slide.title}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="flex items-center gap-4 md:gap-8 text-white/80 text-xs md:text-sm font-bold uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                        <User className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <span className="text-[11px] md:text-sm">{slide.author}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="text-[11px] md:text-sm">{slide.date}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 md:gap-3">
                      <Eye className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="text-[11px] md:text-sm">{slide.views || 0}</span>
                    </div>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Pause/Play toggle — top right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsPaused((p) => !p);
            }}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-30 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/15 text-white hover:bg-primary transition-colors shadow-2xl"
            aria-label={isPaused ? "Putar slideshow" : "Jeda slideshow"}
          >
            {isPaused ? <Play className="h-4 w-4 md:h-5 md:w-5 fill-white" /> : <Pause className="h-4 w-4 md:h-5 md:w-5 fill-white" />}
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-primary hover:scale-110 transition-all shadow-2xl"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-primary hover:scale-110 transition-all shadow-2xl"
            aria-label="Slide selanjutnya"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Thumbnails — desktop only: 2 upcoming cards */}
        <div className="hidden lg:flex flex-col gap-3 h-full justify-center">
          {[data[(current + 1) % data.length], data[(current + 2) % data.length]].map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => goTo(data.indexOf(item))}
              className={`group relative w-full aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                data.indexOf(item) === current
                  ? "border-primary scale-[1.03] shadow-xl shadow-primary/20 ring-2 ring-primary/30"
                  : "border-white/10 hover:border-white/30 hover:scale-[1.02]"
              }`}
              aria-label={`Slide ${data.indexOf(item) + 1}: ${item.title}`}
            >
              <img
                src={item.image || defaultImage}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultImage;
                }}
              />
              <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-all duration-500" />
              {/* Next/upcoming indicator label */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-lg">
                  {idx === 0 ? "Selanjutnya" : "Berikutnya"}
                </span>
              </div>
              <div className="absolute inset-0 p-3 flex flex-col justify-end text-left">
                <p className="text-[9px] font-black text-primary uppercase mb-1 drop-shadow-md tracking-wider">
                  {item.category}
                </p>
                <h3 className="text-[11px] font-bold text-white line-clamp-2 leading-tight group-hover:text-primary/90 transition-colors">
                  {item.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Dot Indicators */}
      <div className="flex lg:hidden items-center justify-center gap-2 pb-1">
        {data.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`rounded-full transition-all duration-500 ${
              index === current
                ? "w-7 h-2.5 bg-primary shadow-md shadow-primary/30"
                : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="hidden md:flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
        <span className="text-primary">{String(current + 1).padStart(2, "0")}</span>
        <span>/</span>
        <span>{String(data.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}