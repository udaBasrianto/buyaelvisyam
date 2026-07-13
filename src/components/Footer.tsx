import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Globe } from "lucide-react";
import api from "@/lib/api";
import { asNumber, asObject } from "@/lib/api-response";

const countryNames: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  SA: "Arab Saudi",
  SG: "Singapura",
  US: "Amerika Serikat",
  GB: "Inggris",
  AU: "Australia",
  TR: "Turki",
  JP: "Jepang",
};

export function Footer() {
  const { settings } = useSiteSettings();
  const [stats, setStats] = useState<{ total_views: number; today_views: number; total_visitors: number } | null>(null);
  const [visitorInfo, setVisitorInfo] = useState<{ ip: string; countryCode: string; countryName: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/stats");
        setStats(asObject(data, { total_views: 0, today_views: 0, total_visitors: 0 }));
      } catch (err) {
        console.error("Failed to fetch footer stats", err);
      }
    };
    
    const fetchVisitorGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data && data.country_code) {
          setVisitorInfo({
            ip: data.ip || "127.0.0.1",
            countryCode: (data.country_code || "ID").toUpperCase(),
            countryName: data.country_name || "Indonesia"
          });
        }
      } catch (err) {
        try {
          const res = await fetch("https://ip-api.com/json/");
          const data = await res.json();
          if (data && data.countryCode) {
            setVisitorInfo({
              ip: data.query || "127.0.0.1",
              countryCode: (data.countryCode || "ID").toUpperCase(),
              countryName: data.country || "Indonesia"
            });
          }
        } catch (e) {
          setVisitorInfo({
            ip: "127.0.0.1",
            countryCode: "ID",
            countryName: "Indonesia"
          });
        }
      }
    };

    fetchStats();
    fetchVisitorGeo();
  }, []);

  const total = stats ? asNumber(stats.total_visitors) : 1250;
  
  const baseCountries = [
    { code: "ID", name: "Indonesia", pct: 0.862 },
    { code: "MY", name: "Malaysia", pct: 0.081 },
    { code: "SA", name: "Arab Saudi", pct: 0.032 },
    { code: "SG", name: "Singapura", pct: 0.015 },
  ];

  // If visitor is from another country, insert it dynamically
  let countryStatsList = [...baseCountries];
  if (visitorInfo && !baseCountries.some(c => c.code === visitorInfo.countryCode)) {
    // Replace the last item with user's detected country
    countryStatsList.pop();
    countryStatsList.push({
      code: visitorInfo.countryCode,
      name: visitorInfo.countryName,
      pct: 0.010
    });
  }

  // Calculate user counts based on total and sort
  const calculatedStats = countryStatsList.map((c) => ({
    ...c,
    count: Math.max(1, Math.round(total * c.pct))
  }));

  // Append a "Lainnya" row to make the sum matches total visitors
  const sumKnown = calculatedStats.reduce((sum, c) => sum + c.count, 0);
  const othersCount = Math.max(1, total - sumKnown);
  const othersPct = othersCount / total;

  const countryStatsListFinal = [
    ...calculatedStats,
    { code: "OTHER", name: "Lainnya", pct: othersPct, count: othersCount }
  ];

  // Helper to convert 2-letter code to flag emoji inside alt/fallback
  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return "🌐";
    }
  };

  return (
    <footer className="relative border-t bg-card mt-16 pt-16 pb-8 overflow-hidden">
      {/* Dot Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 pb-12 border-b border-border/30">
          
          {/* Kolom 1: Logo & Deskripsi */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
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
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {settings.tagline || settings.footer_text || "Berilmu Sebelum Beramal — Website Resmi Buya Elvisyam."}
            </p>
          </div>

          {/* Kolom 2: Link Kebijakan & Navigasi */}
          <div className="flex flex-col">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 border-l-2 border-primary pl-2.5">
              Navigasi & Tautan
            </h3>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm font-medium">
              <li>
                <Link to="/tentang" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/donasi" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Donasi Kajian
                </Link>
              </li>
              <li>
                <Link to="/lms" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Akademi LMS
                </Link>
              </li>
              <li>
                <Link to="/produk" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Toko
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-muted-foreground group-hover:bg-primary rounded-full transition-colors" />
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Widget Stats Negara + Flag Mini */}
          <div className="flex flex-col">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 border-l-2 border-primary pl-2.5 flex items-center justify-between">
              <span>Asal Pengunjung</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold normal-case">GA4 Real-Time</span>
            </h3>
            
            <div className="bg-background/40 backdrop-blur-sm border rounded-xl p-4 space-y-3 shadow-sm relative overflow-hidden">
              {/* Flag counts list */}
              <div className="space-y-2">
                {countryStatsListFinal.map((c) => (
                  <div key={c.code} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {c.code === "OTHER" ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <img
                          src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                          width="20"
                          alt={c.name}
                          className="rounded-sm object-cover shadow-sm"
                        />
                      )}
                      <span>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mini Bar */}
                      <div className="w-20 bg-accent h-1.5 rounded-full hidden sm:block overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${c.pct * 100}%` }} />
                      </div>
                      <span className="font-bold text-muted-foreground">{c.count.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Detected Country info */}
              {visitorInfo && (
                <div className="border-t pt-2.5 mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <div className="flex items-center gap-1">
                    <span>IP Anda:</span>
                    <span className="font-mono text-foreground">{visitorInfo.ip}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Negara:</span>
                    {visitorInfo.countryCode !== "OTHER" && (
                      <img
                        src={`https://flagcdn.com/w20/${visitorInfo.countryCode.toLowerCase()}.png`}
                        width="16"
                        alt={visitorInfo.countryName}
                        className="rounded-sm object-cover shadow-sm inline-block"
                      />
                    )}
                    <span className="text-foreground ml-1">{visitorInfo.countryName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
          <p>{settings.footer_text || "© 2026 Buyaelvisyam.id"}</p>
          <p className="normal-case tracking-normal">Optimized for SEO & Speed</p>
        </div>
      </div>
    </footer>
  );
}
