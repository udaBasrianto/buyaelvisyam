import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { AirQualityBadge } from "@/components/AirQualityBadge";

interface SimplePost {
  title: string;
  slug: string;
}

export function NewsTicker() {
  const [headlines, setHeadlines] = useState<SimplePost[]>([]);

  useEffect(() => {
    api.get("/articles", { params: { limit: 5, status: "published" } })
      .then(({ data }) => {
        setHeadlines(asArray<SimplePost>(data));
      })
      .catch(() => {});
  }, []);

  if (headlines.length === 0) return null;

  return (
    <div className="bg-primary/5 border-y border-primary/10 overflow-hidden h-10 flex items-center">
      <div className="container mx-auto px-4 flex items-center justify-between h-full gap-2 sm:gap-4">
        {/* Left Side: Breaking News Ticker */}
        <div className="flex items-center flex-1 min-w-0 h-full overflow-hidden">
          <div className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 sm:px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest z-10 shadow-sm">
            <Zap className="h-3 w-3 fill-current" /> Breaking
          </div>
          
          <div className="flex-1 relative overflow-hidden h-full flex items-center ml-2.5 sm:ml-4">
            <div className="absolute whitespace-nowrap animate-ticker flex items-center gap-12 h-full top-0">
              {[...headlines, ...headlines].map((h, i) => (
                <Link 
                  key={`${h.slug}-${i}`} 
                  to={`/${h.slug}`}
                  className="text-xs font-bold hover:text-primary transition-colors flex items-center gap-2"
                >
                  <span className="h-1 w-1 rounded-full bg-primary/40" />
                  {h.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Air Quality & Weather Mini Pill (Option 3) */}
        <AirQualityBadge />
      </div>
    </div>
  );
}
