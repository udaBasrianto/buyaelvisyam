import { useState, useEffect } from "react";
import { Clock, MapPin, Loader2, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import axios from "axios";

interface Timings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export function PrayerTimesBar() {
  const [timings, setTimings] = useState<Timings | null>(null);
  const [locationName, setLocationName] = useState<string>("Padang");
  const [hijriDate, setHijriDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 1. Fetch Prayer Times from Aladhan (Method 20 = Kemenag RI)
          const res = await axios.get(
            `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=20`
          );
          setTimings(res.data.data.timings);
          const hj = res.data.data.date.hijri;
          setHijriDate(`${hj.day} ${hj.month.en} ${hj.year}H`);

          // 2. Fetch City Name using Nominatim (OpenStreetMap)
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const city = geoRes.data.address.city || 
                       geoRes.data.address.town || 
                       geoRes.data.address.village || 
                       geoRes.data.address.county || 
                       "Padang";
          setLocationName(city);
        } catch (err) {
          console.error("Gagal mengambil jadwal sholat", err);
          fetchFallback();
        } finally {
          setLoading(false);
        }
      },
      () => {
        // Jika akses lokasi ditolak / timeout, gunakan fallback Padang
        fetchFallback();
      },
      { timeout: 7000 }
    );
  }, []);

  // Update current time every minute to refresh highlights & countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchFallback = async () => {
    try {
      // Default ke Padang (Kota Domisili Buya Elvisyam)
      const res = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?city=Padang&country=Indonesia&method=20`
      );
      setTimings(res.data.data.timings);
      const hj = res.data.data.date.hijri;
      setHijriDate(`${hj.day} ${hj.month.en} ${hj.year}H`);
      setLocationName("Padang");
    } catch (err) {
      setError("Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getPrayerStatus = () => {
    if (!timings) return { current: -1, next: -1, countdown: "", nextLabel: "" };
    
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const prayerTimes = [
      { id: 0, label: "Subuh", time: timings.Fajr },
      { id: 1, label: "Dzuhur", time: timings.Dhuhr },
      { id: 2, label: "Ashar", time: timings.Asr },
      { id: 3, label: "Maghrib", time: timings.Maghrib },
      { id: 4, label: "Isya", time: timings.Isha },
    ].map(p => ({
      ...p,
      minutes: p.time.split(':').reduce((h, m) => h * 60 + Number(m), 0)
    }));

    let next = -1;
    for (let i = 0; i < prayerTimes.length; i++) {
      if (nowMinutes < prayerTimes[i].minutes) {
        next = i;
        break;
      }
    }

    let current = -1;
    if (next === -1) {
      current = 4;
      next = 0; // Setelah Isya, waktu sholat berikutnya adalah Subuh besok
    } else if (next === 0) {
      current = 4; // Sebelum Subuh, waktu saat ini masih Isya
    } else {
      current = next - 1;
    }

    const nextPrayerMinutes = prayerTimes[next].minutes;
    let diff = nextPrayerMinutes - nowMinutes;
    if (diff < 0) diff += 1440; // Tambah 24 jam untuk Subuh keesokan harinya

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const countdown = hours > 0 ? `${hours}j ${mins}m` : `${mins} mnt`;

    return { 
      current, 
      next, 
      countdown, 
      nextLabel: prayerTimes[next].label 
    };
  };

  const { current: currentIndex, next: nextIndex, countdown, nextLabel } = getPrayerStatus();

  if (loading) {
    return (
      <div className="bg-background/80 py-3 border-b border-border/40 backdrop-blur-md">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Memuat Jadwal Sholat...</span>
        </div>
      </div>
    );
  }

  if (error && !timings) return null;

  const prayerItems = [
    { label: "Subuh", time: timings?.Fajr, icon: Sunrise },
    { label: "Dzuhur", time: timings?.Dhuhr, icon: Sun },
    { label: "Ashar", time: timings?.Asr, icon: Sun },
    { label: "Maghrib", time: timings?.Maghrib, icon: Sunset },
    { label: "Isya", time: timings?.Isha, icon: Moon },
  ];

  return (
    <div className="bg-white/95 dark:bg-card/95 py-2.5 md:py-3.5 border-b border-border/60 sticky top-16 z-40 shadow-xs backdrop-blur-md transition-colors">
      <div className="container mx-auto px-3 sm:px-4">
        {/* HEADER BAR: Lokasi, Tanggal Hijriah, Countdown Waktu Berikutnya */}
        <div className="flex items-center justify-between gap-2">
          {/* Lokasi & Tanggal Hijriah */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 text-primary font-bold shrink-0">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wider font-extrabold truncate max-w-[120px] sm:max-w-none">
                {locationName}
              </span>
            </div>
            {hijriDate && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-tight truncate">
                {hijriDate}
              </span>
            )}
          </div>

          {/* Countdown & Kemenag RI */}
          <div className="flex items-center gap-2 shrink-0">
            {countdown && nextLabel && (
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                <span>{nextLabel} • {countdown} lagi</span>
              </div>
            )}
            <span className="hidden lg:inline-block text-[9px] text-muted-foreground/60 border-l border-border/60 pl-2">
              Kemenag RI
            </span>
          </div>
        </div>

        {/* =========================================================================
            MOBILE VIEW (< md): 5-COLUMN COMPACT GRID
            Semua 5 waktu sholat tampil 100% simetris tanpa terpotong / overflow!
           ========================================================================= */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 md:hidden mt-2">
          {prayerItems.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isNext = index === nextIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 border text-center ${
                  isNext
                    ? "bg-primary/15 border-primary/40 ring-1 ring-primary/30 shadow-xs scale-[1.02]"
                    : isCurrent
                      ? "bg-primary/5 border-primary/20 text-foreground"
                      : "bg-muted/30 dark:bg-card/40 border-border/40 text-muted-foreground"
                }`}
              >
                {/* Ikon & Label */}
                <div className="flex items-center gap-1 mb-1">
                  <Icon className={`h-3 w-3 shrink-0 ${isNext ? "text-primary" : "text-muted-foreground/60"}`} />
                  <span className={`text-[9.5px] font-black uppercase tracking-wider ${isNext ? "text-primary" : "text-muted-foreground/80"}`}>
                    {item.label}
                  </span>
                </div>

                {/* Jam */}
                <span className={`text-xs sm:text-sm font-black font-mono tracking-tight ${isNext ? "text-primary" : isCurrent ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>
                  {item.time}
                </span>

                {/* Badge Status */}
                {isNext ? (
                  <span className="mt-1 text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground tracking-tighter leading-none shadow-2xs">
                    NEXT
                  </span>
                ) : isCurrent ? (
                  <span className="mt-1 flex items-center gap-0.5 text-[7.5px] font-bold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    KINI
                  </span>
                ) : (
                  <span className="mt-1 h-[14px]" /> // Spacer agar tinggi tetap konsisten
                )}
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            DESKTOP VIEW (>= md): ELEGANT HORIZONTAL FLEX LIST
           ========================================================================= */}
        <div className="hidden md:flex items-center justify-end gap-3 lg:gap-5 mt-2 pt-2 border-t border-border/30">
          {prayerItems.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isNext = index === nextIndex;
            const Icon = item.icon;

            return (
              <div 
                key={item.label} 
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-300 border ${
                  isNext 
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 scale-105 shadow-xs" 
                    : isCurrent 
                      ? "bg-primary/5 border-primary/20" 
                      : "border-transparent hover:bg-muted/40"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isNext ? "text-primary" : "text-muted-foreground/60"}`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isNext ? "text-primary" : "text-muted-foreground/70"}`}>
                      {item.label}
                    </span>
                    {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black font-mono ${isNext ? "text-primary" : isCurrent ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                      {item.time}
                    </span>
                    {isNext && (
                      <span className="text-[8px] font-black text-primary bg-primary/15 px-1.5 py-0.5 rounded tracking-tighter">
                        NEXT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

