import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, Calendar, User, ChevronRight, ChevronLeft, Pause, Play } from "lucide-react";
import { heroSlides as defaultSlides } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

// Islamic desert/mosque fallback image
const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1564769625392-651b89c75a23?q=80&w=2070&auto=format&fit=crop";
const SLIDE_DURATION = 7000;

interface HeroSliderV2Props {
  slides?: Post[];
}

export function HeroSliderV2({ slides }: HeroSliderV2Props) {
  const data = slides && slides.length > 0 ? (slides.length > 5 ? slides.slice(0, 5) : slides) : defaultSlides.slice(0, 5);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % data.length);
    setProgress(0);
  }, [data.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + data.length) % data.length);
    setProgress(0);
  }, [data.length]);

  useEffect(() => {
    if (isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * SLIDE_DURATION;
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / SLIDE_DURATION) * 100;
      
      if (newProgress >= 100) {
        next();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [next, isPaused, progress]);

  const slide = data[current];

  if (!slide) return null;

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full min-h-[450px] lg:min-h-[550px] relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slide */}
      <div className="lg:col-span-3 relative rounded-[2.5rem] overflow-hidden group shadow-2xl border-4 border-transparent hover:border-primary/20 transition-all duration-500">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 h-full w-full"
          >
            <Link to={`/artikel/${slide.slug || slide.id}`} className="block h-full relative">
              <img
                src={slide.image || DEFAULT_POST_IMAGE}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear"
                style={{ transform: isPaused ? 'scale(1.05)' : 'scale(1.15)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-14">
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.4 }}
                   className="flex gap-2 mb-6"
                 >
                    <span className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-2xl">
                      {slide.category}
                    </span>
                 </motion.div>
                 
                 <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl md:text-5xl font-black text-white leading-tight mb-8 group-hover:text-primary transition-colors drop-shadow-2xl"
                 >
                   {slide.title}
                 </motion.h1>
                 
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-8 text-white/80 text-xs md:text-sm font-bold uppercase tracking-wider"
                 >
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                          <User className="h-5 w-5" />
                       </div>
                       <span>{slide.author}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Calendar className="h-5 w-5 text-primary" />
                       <span>{slide.date}</span>
                    </div>
                 </motion.div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Global Circular Progress Indicator */}
        <div className="absolute top-8 right-8 z-20 hidden md:block">
           <div className="relative h-16 w-16 flex items-center justify-center bg-black/20 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
              <svg className="h-14 w-14 -rotate-90">
                 <circle
                   cx="28"
                   cy="28"
                   r="24"
                   fill="transparent"
                   stroke="currentColor"
                   strokeWidth="3"
                   className="text-white/10"
                 />
                 <motion.circle
                   cx="28"
                   cy="28"
                   r="24"
                   fill="transparent"
                   stroke="currentColor"
                   strokeWidth="3"
                   strokeDasharray="150.7"
                   strokeDashoffset={150.7 - (150.7 * progress) / 100}
                   className="text-primary"
                   strokeLinecap="round"
                 />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 {isPaused ? <Play className="h-5 w-5 text-white fill-white" /> : <Pause className="h-5 w-5 text-white fill-white" />}
              </div>
           </div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-6 flex justify-between pointer-events-none">
           <button 
             onClick={(e) => { e.preventDefault(); prev(); }} 
             className="h-14 w-14 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all pointer-events-auto shadow-2xl group/nav"
           >
              <ChevronLeft className="h-7 w-7 group-hover/nav:-translate-x-1 transition-transform" />
           </button>
           <button 
             onClick={(e) => { e.preventDefault(); next(); }} 
             className="h-14 w-14 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all pointer-events-auto shadow-2xl group/nav"
           >
              <ChevronRight className="h-7 w-7 group-hover/nav:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="hidden lg:flex flex-col gap-3 h-full">
        {data.map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
               setDirection(index > current ? 1 : -1);
               setCurrent(index);
            }}
            className={`group relative flex-1 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
              index === current ? "border-primary scale-[1.02] shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            <img
              src={item.image || DEFAULT_POST_IMAGE}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
              }}
            />
            <div className={`absolute inset-0 ${index === current ? "bg-black/10" : "bg-black/60"}`} />
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-left">
              <p className="text-[10px] font-black text-primary uppercase mb-1 drop-shadow-md">{item.category}</p>
              <h3 className="text-[11px] font-black text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

