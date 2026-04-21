import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { heroSlides as defaultSlides } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

// Islamic / desert themed images
const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1565085364553-f0cd10c3a9f2?q=80&w=2070&auto=format&fit=crop", // Masjid Nabawi
  "https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=2074&auto=format&fit=crop", // Padang pasir unta
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2070&auto=format&fit=crop", // Masjid kubah biru
  "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070&auto=format&fit=crop", // Gurun pasir matahari terbenam
  "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=2070&auto=format&fit=crop", // Kaligrafi Islam
];

interface HeroSliderV3Props {
  slides?: Post[];
}

export function HeroSliderV3({ slides }: HeroSliderV3Props) {
  const allData = slides && slides.length > 0 ? slides : defaultSlides;
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const CYCLE_TIME = 10000;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setOffset((o) => (o + 1) % allData.length);
          return 0;
        }
        return p + (100 / (CYCLE_TIME / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, allData.length]);

  const data = Array.from({ length: 5 }, (_, i) => allData[(offset + i) % allData.length]);

  const main = data[0];
  const side = data[1];
  const bottom = data.slice(2, 5);

  if (!main) return null;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={offset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-2 gap-4 h-[500px] md:h-[600px] lg:h-[550px]"
        >
          {/* Main Big Feature */}
          <div className="lg:col-span-8 lg:row-span-2 relative rounded-[2.5rem] overflow-hidden group shadow-2xl h-full">
            <Link to={`/artikel/${main.slug || main.id}`} className="block h-full relative">
              <img
                src={main.image || STOCK_IMAGES[0]}
                alt={main.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10000ms]"
                onError={(e) => { (e.target as HTMLImageElement).src = STOCK_IMAGES[0]; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

              {/* Circular Progress */}
              <div className="absolute top-8 left-8 z-30">
                <div className="relative h-14 w-14 flex items-center justify-center bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <motion.circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="125.6"
                      strokeDashoffset={125.6 - (125.6 * progress) / 100}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest mb-6 inline-block shadow-xl"
                >
                  {main.category}
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl md:text-5xl font-black text-white leading-tight mb-6 line-clamp-2 drop-shadow-2xl group-hover:text-primary transition-colors"
                >
                  {main.title}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-6 text-white/70 text-sm font-bold uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                      <User className="h-4 w-4" />
                    </div>
                    {main.author}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> {main.date}
                  </span>
                </motion.div>
              </div>
            </Link>
          </div>

          {/* Side Featured */}
          {side && (
            <div className="hidden lg:block lg:col-span-4 lg:row-span-1 relative rounded-3xl overflow-hidden group shadow-lg">
              <Link to={`/artikel/${side.slug || side.id}`} className="block h-full relative">
                <img
                  src={side.image || STOCK_IMAGES[1]}
                  alt={side.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = STOCK_IMAGES[1]; }}
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-all" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-md">{side.category}</span>
                  <h2 className="text-lg font-black text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors drop-shadow-md">
                    {side.title}
                  </h2>
                </div>
              </Link>
            </div>
          )}

          {/* Bottom Small Feature */}
          <div className="hidden lg:grid lg:col-span-4 lg:row-span-1 grid-cols-2 gap-4">
            {bottom.slice(0, 2).map((item, idx) => (
              <div key={item.id} className="relative rounded-2xl overflow-hidden group shadow-md">
                <Link to={`/artikel/${item.slug || item.id}`} className="block h-full relative">
                  <img
                    src={item.image || STOCK_IMAGES[(idx + 2) % STOCK_IMAGES.length]}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = STOCK_IMAGES[(idx + 2) % STOCK_IMAGES.length]; }}
                  />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="text-xs font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
