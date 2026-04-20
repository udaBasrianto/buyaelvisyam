import { useState, useEffect } from "react";
import { Clock, MapPin, Loader2, Play } from "lucide-react";
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
  const [locationName, setLocationName] = useState<string>("Mendeteksi lokasi...");
  const [hijriDate, setHijriDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung");
      setLoading(false);
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
                       "Lokasi Anda";
          setLocationName(city);
        } catch (err) {
          console.error("Gagal mengambil jadwal sholat", err);
          setError("Gagal memuat jadwal");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error", err);
        setError("Akses lokasi ditolak");
        setLoading(false);
        fetchFallback();
      }
    );
  }, []);

  // Update current time every minute to refresh highlights
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchFallback = async () => {
    try {
      const res = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20`
      );
      setTimings(res.data.data.timings);
      const hj = res.data.data.date.hijri;
      setHijriDate(`${hj.day} ${hj.month.en} ${hj.year}H`);
      setLocationName("Jakarta (Default)");
    } catch (err) {
      setError("Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getPrayerStatus = () => {
    if (!timings) return { current: -1, next: -1 };
    
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const prayerTimes = [
      { id: 0, time: timings.Fajr },
      { id: 1, time: timings.Dhuhr },
      { id: 2, time: timings.Asr },
      { id: 3, time: timings.Maghrib },
      { id: 4, time: timings.Isha },
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

    if (next === -1) return { current: 4, next: 0 }; // After Isha, next is Fajr
    if (next === 0) return { current: 4, next: 0 };  // Before Fajr, current is Isha
    return { current: next - 1, next: next };
  };

  const { current: currentIndex, next: nextIndex } = getPrayerStatus();

  if (loading) {
    return (
      <div className="bg-primary/5 py-4 border-b border-primary/10">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Memuat Jadwal...</span>
        </div>
      </div>
    );
  }

  if (error && !timings) return null;

  const prayerItems = [
    { label: "Subuh", time: timings?.Fajr },
    { label: "Dzuhur", time: timings?.Dhuhr },
    { label: "Ashar", time: timings?.Asr },
    { label: "Maghrib", time: timings?.Maghrib },
    { label: "Isya", time: timings?.Isha },
  ];

  return (
    <div className="bg-white dark:bg-card py-5 border-b border-border/50 sticky top-16 z-40 shadow-sm backdrop-blur-md bg-opacity-80">
      <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
        {/* Location Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <MapPin className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">{locationName}</span>
          </div>
          {hijriDate && (
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
              {hijriDate}
            </div>
          )}
        </div>

        {/* Times List */}
        <div className="flex-1 flex items-center justify-center md:justify-end gap-2 md:gap-6 overflow-visible">
          {prayerItems.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isNext = index === nextIndex;

            return (
              <div 
                key={item.label} 
                className={`flex items-center gap-3 shrink-0 px-3 py-1.5 rounded-2xl transition-all duration-500 border ${
                  isCurrent 
                    ? "bg-primary/10 border-primary/30 scale-105 shadow-sm" 
                    : isNext 
                      ? "animate-prayer-pulse border-primary/10" 
                      : "border-transparent"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? "text-primary" : "text-muted-foreground/60"}`}>
                      {item.label}
                    </span>
                    {isCurrent && <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black font-mono ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                      {item.time}
                    </span>
                    {isNext && (
                      <div className="flex items-center gap-1 text-[8px] font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                        <Clock className="h-2 w-2" />
                        NEXT
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="hidden lg:flex items-center gap-1.5 pl-4 ml-2 border-l border-border/50 text-muted-foreground/30 italic text-[9px]">
            <span>Kemenag RI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
