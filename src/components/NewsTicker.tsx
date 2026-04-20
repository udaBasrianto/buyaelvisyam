import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

interface SimplePost {
  title: string;
  slug: string;
}

export function NewsTicker() {
  const [headlines, setHeadlines] = useState<SimplePost[]>([]);

  useEffect(() => {
    api.get("/articles", { params: { limit: 5, status: "published" } })
      .then(({ data }) => {
        if (data) setHeadlines(data);
      });
  }, []);

  if (headlines.length === 0) return null;

  return (
    <div className="bg-primary/5 border-y border-primary/10 overflow-hidden h-10 flex items-center">
      <div className="container mx-auto px-4 flex items-center h-full">
        <div className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest z-10">
          <Zap className="h-3 w-3 fill-current" /> Breaking
        </div>
        
        <div className="flex-1 relative overflow-hidden h-full flex items-center ml-4">
          <div className="absolute whitespace-nowrap animate-ticker flex items-center gap-12 h-full top-0">
            {[...headlines, ...headlines].map((h, i) => (
              <Link 
                key={`${h.slug}-${i}`} 
                to={`/artikel/${h.slug}`}
                className="text-xs font-bold hover:text-primary transition-colors flex items-center gap-2"
              >
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {h.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
