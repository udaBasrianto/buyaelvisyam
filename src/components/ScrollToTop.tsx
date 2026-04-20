import { useState, useEffect } from "react";
import { ChevronUp, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function ScrollToTop() {
  const { settings } = useSiteSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        if (window.pageYOffset === 0) {
          setIsLaunching(false);
          setIsFlying(false);
        }
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const slowScrollToTop = () => {
    const duration = 5000; // 5 seconds for slow, cinematic feel
    const start = window.pageYOffset;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      window.scrollTo(0, start * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const scrollToTop = () => {
    if (settings.scroll_to_top_version === "basic") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsLaunching(true);
    // Preparation phase for 1.5 seconds before flying
    setTimeout(() => {
      setIsFlying(true);
      slowScrollToTop();
    }, 1500);
  };

  if (!isVisible && !isLaunching) return null;

  const isBasic = settings.scroll_to_top_version === "basic";

  return (
    <div className="fixed bottom-24 right-5 z-[60] flex flex-col items-center">
      {settings.scroll_to_top_version === "animated" && (
        <style>{`
          @keyframes rocket-shake {
            0% { transform: translate(0, 0) rotate(-45deg); }
            20% { transform: translate(2px, -2px) rotate(-45deg); }
            40% { transform: translate(-2px, 2px) rotate(-45deg); }
            60% { transform: translate(2px, 2px) rotate(-45deg); }
            80% { transform: translate(-2px, -2px) rotate(-45deg); }
            100% { transform: translate(0, 0) rotate(-45deg); }
          }
          @keyframes fire-pulse {
            0%, 100% { transform: scale(1) translateX(-50%); opacity: 0.8; }
            50% { transform: scale(1.8) translateX(-50%); opacity: 1; filter: blur(1px); }
          }
          @keyframes launch-glow {
            0%, 100% { box-shadow: 0 0 10px #f97316; }
            50% { box-shadow: 0 0 30px #ef4444; }
          }
          .rocket-launch {
            animation: rocket-shake 0.1s infinite;
          }
          .fire-container {
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 30px;
            pointer-events: none;
          }
          .fire-effect {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 25px;
            background: linear-gradient(to bottom, #fbbf24, #f97316, #ef4444, transparent);
            border-radius: 50% 50% 20% 20%;
            filter: blur(2px);
            animation: fire-pulse 0.15s infinite;
          }
          .fire-glow {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 25px;
            height: 35px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.6), transparent 70%);
            filter: blur(4px);
            animation: fire-pulse 0.3s infinite;
          }
        `}</style>
      )}
      
      <button
        onClick={scrollToTop}
        className={cn(
          "relative group p-3 rounded-full transition-all card-shadow",
          isLaunching ? "bg-slate-900" : "bg-primary text-primary-foreground translate-y-0",
          !isLaunching && !isBasic && "hover:scale-110 active:scale-95",
          isBasic && "hover:bg-primary/90",
          isFlying && "-translate-y-[120vh] transition-transform duration-[5s] ease-out pointer-events-none"
        )}
        style={isLaunching ? { animation: 'launch-glow 0.5s infinite' } : {}}
        aria-label="Scroll to top"
      >
        {isLaunching ? (
          <div className="relative">
             <Rocket className="h-6 w-6 text-white rocket-launch -rotate-45" />
             <div className="fire-container">
                <div className="fire-glow" />
                <div className="fire-effect" />
             </div>
          </div>
        ) : (
          <ChevronUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
        )}
      </button>
      
      {isLaunching && (
          <span className="text-[10px] font-black italic text-primary mt-2 animate-bounce uppercase tracking-tighter">
            {isFlying ? "Blast Off!" : "Ignition..."}
          </span>
      )}
    </div>
  );
}
