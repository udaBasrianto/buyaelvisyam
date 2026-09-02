import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { heroSlides as defaultSlides } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_POST_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230F766E'/%3E%3Cstop offset='100%25' style='stop-color:%230D9488'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='600' fill='url(%23g)'/%3E%3Ctext x='600' y='310' font-size='52' fill='white' opacity='0.25' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3E📖 Kajian Islam%3C/text%3E%3C/svg%3E";

interface HeroSliderV3Props {
  slides?: Post[];
}

export function HeroSliderV3({ slides }: HeroSliderV3Props) {
  const { settings } = useSiteSettings();
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
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  if (!data || data.length === 0) return null;

  const currentSlide = data[current];
  const prevSlide = data[(current - 1 + data.length) % data.length];
  const nextSlide = data[(current + 1) % data.length];

  // Upcoming 3 slides for the right card stack
  const cardStack = [
    data[(current + 1) % data.length],
    data[(current + 2) % data.length],
    data[(current + 3) % data.length],
  ];

  const opacityVal = settings?.slider_overlay_opacity ?? 55;
  // Cap overlay at 70 so the background image always stays visible
  const overlayOpacity = Math.min(opacityVal, 70) / 100;
  const imgBrightness = Math.max(0.05, 1 - overlayOpacity);

  return (
    <section className="relative w-full h-[260px] md:h-[580px] lg:h-[620px] overflow-hidden rounded-[2rem] bg-black text-white shadow-2xl group select-none">
      
      {/* Background Image Layer (Blurred, high contrast, matching active slide) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={currentSlide.image || DEFAULT_POST_IMAGE}
            alt=""
            className="w-full h-full object-cover scale-105 filter transition-all duration-[1000ms]"
            style={{ filter: `blur(6px) brightness(${imgBrightness})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
            }}
          />
        </AnimatePresence>
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black transition-opacity duration-300" 
          style={{ opacity: overlayOpacity }}
        />
      </div>

      {/* Main Grid Content Container */}
      <div className="absolute inset-0 z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-center px-6 md:px-12 lg:px-16 py-6 md:py-12">
        
        {/* Left Section: Active Slide Details */}
        <div className="lg:col-span-5 flex flex-row items-center gap-6 md:gap-8 h-full relative">
          
          {/* Vertical Index Indicator */}
          <div className="flex flex-col items-center justify-between h-full max-h-[320px] text-[10px] tracking-widest font-black uppercase text-white/30 hidden md:flex border-r border-white/10 pr-6 select-none">
            <span className="[writing-mode:vertical-lr] rotate-180">
              {String(current + 1).padStart(2, "0")} / {String(data.length).padStart(2, "0")}
            </span>
            <div className="flex-1 w-[1px] bg-white/10 my-4 relative flex items-center justify-center">
              <div className="absolute h-6 w-6 rounded-full border border-white/20 bg-black/60 flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-lg">
                {current + 1}
              </div>
            </div>
            <span className="[writing-mode:vertical-lr] rotate-180">INDEX</span>
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Top Label (Previous Category/Tag) */}
            <div className="overflow-hidden h-5 md:h-6 mb-1 md:mb-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current}
                  className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-white/50 block"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {prevSlide.category || "KAJIAN"}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Giant Title */}
            <div className="overflow-hidden min-h-[50px] md:min-h-[120px] mb-2 md:mb-4">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={current}
                  className="text-lg md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-2xl"
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -80, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentSlide.title}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Excerpt/Description */}
            <div className="overflow-hidden hidden md:block min-h-[50px] mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  className="text-xs md:text-sm text-white/70 line-clamp-3 leading-relaxed max-w-md"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {currentSlide.excerpt || "Baca penjelasan lengkap tentang kajian bermanfaat ini dan temukan wawasan Islami yang mendalam."}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Explore Button */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to={`/artikel/${currentSlide.slug || currentSlide.id}`}
                className="inline-flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-3.5 bg-primary text-primary-foreground font-black text-[10px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0 group-hover:scale-[1.02]"
              >
                <span>BACA DETAIL</span>
                <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Bottom Label (Next Category/Tag) */}
            <div className="overflow-hidden hidden md:block h-6 mt-8">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current}
                  className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/20 block"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {nextSlide.category || "POSTINGAN"}
                </motion.span>
              </AnimatePresence>
            </div>

          </div>

        </div>

        {/* Right Section: Card Stack (Upcoming Cards) */}
        <div className="lg:col-span-7 hidden md:flex items-center h-full relative overflow-x-visible pl-4 select-none">
          <div className="flex gap-4 md:gap-6 w-full overflow-x-auto lg:overflow-x-visible no-scrollbar py-4">
            
            {cardStack.map((slideItem, index) => (
              <motion.div
                key={slideItem.id + "-" + index}
                onClick={() => {
                  setDirection(1);
                  setCurrent(data.indexOf(slideItem));
                }}
                className={`relative shrink-0 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer border border-white/10 group/card shadow-xl transition-all duration-300 ${
                  index === 0 
                    ? "w-[200px] h-[300px] md:w-[240px] md:h-[360px]" 
                    : index === 1 
                      ? "w-[170px] h-[260px] md:w-[200px] md:h-[310px] opacity-70 hover:opacity-100" 
                      : "w-[140px] h-[220px] md:w-[170px] md:h-[260px] opacity-40 hover:opacity-100 hidden sm:block"
                }`}
                whileHover={{ y: -6, scale: 1.02 }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Thumbnail Image */}
                <img
                  src={slideItem.image || DEFAULT_POST_IMAGE}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
                  }}
                />
                
                {/* Card Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                
                {/* Card Title Label (Bangkok, Thailand style) */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <p className="text-[10px] md:text-xs font-black text-white/90 drop-shadow-md truncate uppercase tracking-widest">
                    {slideItem.title}
                  </p>
                </div>

                {/* Bookmark Overlay Button */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-colors">
                    <Bookmark className="h-3 w-3 fill-current" />
                  </div>
                </div>

                {/* Bottom Card Tag Info */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-2 py-0.5 text-[8px] font-bold bg-white/20 text-white rounded backdrop-blur-sm uppercase">
                    {slideItem.category}
                  </span>
                </div>
              </motion.div>
            ))}

          </div>
        </div>

      </div>

      {/* Bottom Slider Progress & Navigation Controls */}
      <div className="absolute bottom-4 left-6 right-6 md:bottom-8 md:left-16 md:right-16 z-20 flex items-center justify-between">
        
        {/* Empty left gap or progress block */}
        <div className="flex items-center gap-3 hidden md:flex">
          <div className="w-[120px] h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              key={current}
              className="absolute left-0 top-0 bottom-0 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </div>
        </div>

        {/* Circular Arrows (<- and ->) */}
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-lg">
          <button
            onClick={prev}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-all transform active:scale-95"
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <button
            onClick={next}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-all transform active:scale-95"
            title="Slide Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Large Page Index Number (e.g. 01 style) */}
        <div className="text-xl font-bold tracking-tight text-white/40 select-none">
          {String(current + 1).padStart(2, "0")}
        </div>

      </div>

    </section>
  );
}
