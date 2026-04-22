import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, User, Calendar } from "lucide-react";
import { heroSlides as defaultSlides } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

// Islamic desert/mosque fallback image
const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1564769625392-651b89c75a23?q=80&w=2070&auto=format&fit=crop";

interface HeroSliderProps {
  slides?: Post[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const data = slides && slides.length > 0 ? slides : defaultSlides;
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % data.length);
  }, [data.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + data.length) % data.length);
  }, [data.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = data[current];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 0;
        return p + 2; 
      });
    }, 100);
    return () => clearInterval(timer);
  }, [current]);

  if (!slide) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-none md:rounded-[2rem] mx-auto shadow-2xl group">
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link to={`/${slide.slug || slide.id}`} className="block h-full relative">
              <img
                src={slide.image || DEFAULT_POST_IMAGE}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-2 mb-4"
                >
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider shadow-lg">
                    #{slide.category}
                  </span>
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-3xl drop-shadow-2xl"
                >
                  {slide.title}
                </motion.h1>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-6 mt-6 text-white/80 text-sm md:text-base font-medium"
                >
                  <span className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <User className="h-4 w-4" />
                    </div>
                    {slide.author}
                  </span>
                  <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {slide.date}</span>
                </motion.div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar (Bottom) */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full overflow-hidden z-20">
           <motion.div 
             className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
             initial={{ width: "0%" }}
             animate={{ width: `${progress}%` }}
             transition={{ duration: 0.1, ease: "linear" }}
           />
        </div>

        {/* Nav arrows */}
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-primary rounded-full p-4 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:block z-20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-primary rounded-full p-4 text-white transition-all opacity-0 group-hover:opacity-100 hidden md:block z-20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { 
                e.preventDefault();
                setDirection(i > current ? 1 : -1);
                setCurrent(i); 
              }}
              className={`h-2 rounded-full transition-all duration-500 shadow-xl ${
                i === current ? "bg-primary w-10" : "bg-white/40 w-2 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
