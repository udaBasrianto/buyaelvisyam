import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Eye, Users, TrendingUp } from "lucide-react";
import api from "@/lib/api";

export function Footer() {
  const { settings } = useSiteSettings();
  const [stats, setStats] = useState<{ total_views: number; today_views: number; total_visitors: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch footer stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <footer className="border-t bg-card mt-16 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl ring-4 ring-primary/20">
                ☪
              </div>
            )}
            <span className="text-2xl font-black text-primary tracking-tighter uppercase">
              {settings.site_name}
            </span>
          </div>

          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            {settings.tagline || settings.footer_text}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 mb-12 w-full max-w-2xl mx-auto border-y border-border/30 py-8">
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                   <Eye className="h-3 w-3" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Total Tayangan</span>
                </div>
                <span className="text-lg font-black text-foreground">
                   {stats ? stats.total_views.toLocaleString("id-ID") : "..."}
                </span>
                <span className="text-[9px] text-muted-foreground">kali dibaca</span>
             </div>
             <div className="flex flex-col items-center border-l border-r border-border/30 px-6">
                <div className="flex items-center gap-1.5 text-primary mb-1">
                   <TrendingUp className="h-3 w-3" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Total Artikel</span>
                </div>
                <span className="text-lg font-black text-primary">
                   {stats ? ((stats as any).total_articles ?? 0).toLocaleString("id-ID") : "..."}
                </span>
                <span className="text-[9px] text-muted-foreground">artikel publik</span>
             </div>
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                   <Users className="h-3 w-3" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Total Kategori</span>
                </div>
                <span className="text-lg font-black text-foreground">
                   {stats ? ((stats as any).total_categories ?? 0).toLocaleString("id-ID") : "..."}
                </span>
                <span className="text-[9px] text-muted-foreground">topik kajian</span>
             </div>
          </div>

          <div className="pt-8 w-full">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
              {settings.footer_text || "© 2026 Buyaelvisyam.id"} — Optimized for SEO & Speed
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
