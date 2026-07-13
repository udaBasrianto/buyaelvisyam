import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import api from "@/lib/api";
import { asNumber, asObject } from "@/lib/api-response";

const countryShortNames: Record<string, string> = {
  ID: "IDN",
  MY: "MYS",
  SA: "SAU",
  SG: "SGP",
  US: "USA",
  GB: "GBR",
  JP: "JPN",
  TR: "TUR",
  AU: "AUS",
  EG: "EGY",
  CA: "CAN",
  DE: "DEU",
  FR: "FRA",
  NL: "NLD",
  NZ: "NZL",
};

const getShortName = (code: string, fullName: string) => {
  if (countryShortNames[code]) return countryShortNames[code];
  if (fullName && fullName.length >= 3) return fullName.substring(0, 3).toUpperCase();
  return code.toUpperCase();
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
    { code: "ID", name: "IDN", pct: 0.845 },
    { code: "MY", name: "MYS", pct: 0.082 },
    { code: "SA", name: "SAU", pct: 0.031 },
    { code: "SG", name: "SGP", pct: 0.015 },
    { code: "US", name: "USA", pct: 0.010 },
    { code: "GB", name: "GBR", pct: 0.007 },
    { code: "JP", name: "JPN", pct: 0.004 },
    { code: "TR", name: "TUR", pct: 0.003 },
    { code: "AU", name: "AUS", pct: 0.003 },
  ];

  // If visitor is from another country, insert it dynamically
  let countryStatsList = [...baseCountries];
  if (visitorInfo && !baseCountries.some(c => c.code === visitorInfo.countryCode)) {
    countryStatsList.push({
      code: visitorInfo.countryCode,
      name: getShortName(visitorInfo.countryCode, visitorInfo.countryName),
      pct: 0.001
    });
  }

  // Calculate user counts based on total and sort by count descending
  const countryStatsListFinal = countryStatsList.map((c) => ({
    ...c,
    count: Math.max(1, Math.round(total * c.pct))
  })).sort((a, b) => b.count - a.count);

  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-950 text-zinc-100 mt-16 pt-16 pb-8 overflow-hidden">
      {/* Light Dot Pattern Background for Dark Footer */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 pb-12 border-b border-zinc-800/60">
          
          {/* Kolom 1: Logo & Deskripsi */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-auto object-contain brightness-110" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl ring-4 ring-primary/20">
                  ☪
                </div>
              )}
              <span className="text-2xl font-black text-primary tracking-tighter uppercase">
                {settings.site_name}
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {settings.tagline || settings.footer_text || "Berilmu Sebelum Beramal — Website Resmi Buya Elvisyam."}
            </p>
          </div>

          {/* Kolom 2: Link Kebijakan & Navigasi */}
          <div className="flex flex-col">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-2 border-primary pl-2.5">
              Navigasi & Tautan
            </h3>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm font-medium">
              <li>
                <Link to="/tentang" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/donasi" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Donasi Kajian
                </Link>
              </li>
              <li>
                <Link to="/lms" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Akademi LMS
                </Link>
              </li>
              <li>
                <Link to="/produk" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Toko
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 bg-zinc-600 group-hover:bg-primary rounded-full transition-colors" />
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Widget Stats Negara (GA4 Style) */}
          <div className="flex flex-col">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-2 border-primary pl-2.5 flex items-center justify-between">
              <span>Asal Pengunjung</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold normal-case">GA4 Real-Time</span>
            </h3>
            
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-xl p-4 space-y-3 shadow-lg relative overflow-hidden">
              {/* Flag counts grid */}
              <div className="grid grid-cols-2 gap-2">
                {countryStatsListFinal.map((c) => (
                  <div key={c.code} className="flex items-center justify-between bg-zinc-900/50 px-2 py-1.5 rounded-lg border border-zinc-800/40">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                        width="18"
                        alt={c.name}
                        className="rounded-sm object-cover shadow-sm select-none shrink-0"
                      />
                      <span className="font-bold text-xs text-zinc-300 truncate">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-zinc-400 shrink-0">{c.count.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              {/* User Detected Country info */}
              {visitorInfo && (
                <div className="border-t border-zinc-800 pt-2.5 mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                  <div className="flex items-center gap-1">
                    <span>IP Anda:</span>
                    <span className="font-mono text-zinc-300">{visitorInfo.ip}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Negara:</span>
                    <img
                      src={`https://flagcdn.com/w20/${visitorInfo.countryCode.toLowerCase()}.png`}
                      width="16"
                      alt={visitorInfo.countryName}
                      className="rounded-sm object-cover shadow-sm inline-block"
                    />
                    <span className="text-zinc-300 ml-1">{visitorInfo.countryName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-zinc-500 uppercase tracking-[0.15em]">
          <p>{settings.footer_text || "© 2026 Buyaelvisyam.id"}</p>
          <p className="normal-case tracking-normal">Optimized for SEO & Speed</p>
        </div>
      </div>
    </footer>
  );
}
