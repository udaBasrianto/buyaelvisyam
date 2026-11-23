import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Clock, MapPin, Loader2, Sunrise, Sun, Sunset, Moon, 
  Wind, Thermometer, Droplets, Navigation, RefreshCw, 
  ShieldCheck, AlertTriangle, AlertCircle, Sparkles, CheckCircle2, ChevronRight
} from "lucide-react";
import axios from "axios";

interface Timings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface CityPreset {
  name: string;
  lat: number;
  lon: number;
}

const CITIES: CityPreset[] = [
  { name: "Padang", lat: -0.9471, lon: 100.4172 },
  { name: "Bukittinggi", lat: -0.3055, lon: 100.3692 },
  { name: "Payakumbuh", lat: -0.2246, lon: 100.6329 },
  { name: "Pariaman", lat: -0.6264, lon: 100.1205 },
  { name: "Solok", lat: -0.7925, lon: 100.6586 },
  { name: "Pekanbaru", lat: 0.5071, lon: 101.4478 },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
  { name: "Medan", lat: 3.5952, lon: 98.6722 },
];

export default function PrayerAirQualityPage() {
  // ── PRAYER TIMES STATE ──────────────────────────────────────────────────────
  const [timings, setTimings] = useState<Timings | null>(null);
  const [locationName, setLocationName] = useState<string>("Padang");
  const [hijriDate, setHijriDate] = useState<string>("");
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── AIR QUALITY & WEATHER STATE ───────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState<CityPreset>(() => {
    const saved = localStorage.getItem("selected_aqi_city");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return CITIES[0];
  });
  const [aqi, setAqi] = useState<number | null>(null);
  const [pm25, setPm25] = useState<number | null>(null);
  const [pm10, setPm10] = useState<number | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);

  // Clock ticker every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Prayer Times
  useEffect(() => {
    fetchPrayerTimes(selectedCity.lat, selectedCity.lon, selectedCity.name);
  }, [selectedCity]);

  const fetchPrayerTimes = async (lat: number, lon: number, cityName?: string) => {
    try {
      setPrayerLoading(true);
      const res = await axios.get(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=20`
      );
      setTimings(res.data.data.timings);
      const hj = res.data.data.date.hijri;
      setHijriDate(`${hj.day} ${hj.month.en} ${hj.year}H`);
      if (cityName) {
        setLocationName(cityName);
      }
    } catch (err) {
      console.warn("Gagal memuat jadwal sholat:", err);
    } finally {
      setPrayerLoading(false);
    }
  };

  // Fetch AQI & Weather
  useEffect(() => {
    fetchAqiData(selectedCity);
  }, [selectedCity]);

  const fetchAqiData = async (city: CityPreset) => {
    try {
      setAqiLoading(true);
      const aqiPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5,pm10`
      ).then((res) => res.json());

      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m`
      ).then((res) => res.json());

      const [aqiData, weatherData] = await Promise.all([aqiPromise, weatherPromise]);

      if (aqiData?.current?.us_aqi !== undefined) {
        setAqi(Math.round(aqiData.current.us_aqi));
        setPm25(aqiData.current.pm2_5);
        setPm10(aqiData.current.pm10);
      }
      if (weatherData?.current) {
        setTemp(Math.round(weatherData.current.temperature_2m));
        setHumidity(Math.round(weatherData.current.relative_humidity_2m));
      }
    } catch (e) {
      console.warn("AQI fetch failed:", e);
    } finally {
      setAqiLoading(false);
    }
  };

  const handleCityChange = (city: CityPreset) => {
    setSelectedCity(city);
    localStorage.setItem("selected_aqi_city", JSON.stringify(city));
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        let detectedCity = "Lokasi Anda";
        try {
          const geo = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          detectedCity = geo.data.address.city || 
                         geo.data.address.town || 
                         geo.data.address.village || 
                         geo.data.address.county || 
                         "Lokasi Anda";
        } catch (e) {}

        const customCity: CityPreset = { name: detectedCity, lat, lon };
        handleCityChange(customCity);
        setDetectingGps(false);
      },
      () => {
        alert("Tidak dapat mengakses GPS. Pastikan izin lokasi aktif.");
        setDetectingGps(false);
      }
    );
  };

  // Helper for current and next prayer
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
      next = 0;
    } else if (next === 0) {
      current = 4;
    } else {
      current = next - 1;
    }

    const nextPrayerMinutes = prayerTimes[next].minutes;
    let diff = nextPrayerMinutes - nowMinutes;
    if (diff < 0) diff += 1440;

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const countdown = hours > 0 ? `${hours}j ${mins}m` : `${mins} mnt`;

    return { current, next, countdown, nextLabel: prayerTimes[next].label };
  };

  const { current: currentIndex, next: nextIndex, countdown, nextLabel } = getPrayerStatus();

  // AQI Info configuration
  const getAqiInfo = (val: number | null) => {
    if (val === null) return { text: "Memuat...", color: "bg-muted text-muted-foreground", status: "gray", desc: "Mengambil data stasiun cuaca...", icon: Sparkles };
    if (val <= 50) return { text: "Baik", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", status: "good", desc: "Kualitas udara sangat baik. Udara bersih dan aman untuk semua aktivitas luar ruangan.", icon: ShieldCheck };
    if (val <= 100) return { text: "Sedang", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", status: "moderate", desc: "Kualitas udara dapat diterima. Kelompok sensitif sebaiknya batasi aktivitas luar yang berat.", icon: AlertTriangle };
    if (val <= 150) return { text: "Tidak Sehat (Sensitif)", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", status: "sensitive", desc: "Penderita asma & pernapasan disarankan mengenakan masker saat keluar.", icon: AlertCircle };
    if (val <= 200) return { text: "Tidak Sehat", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30", status: "unhealthy", desc: "Semua orang berisiko mengalami efek kesehatan. Kenakan masker di luar.", icon: AlertCircle };
    return { text: "Sangat Tidak Sehat", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30", status: "hazardous", desc: "Kondisi darurat udara. Hindari aktivitas di luar ruangan.", icon: AlertCircle };
  };

  const aqiInfo = getAqiInfo(aqi);

  const prayerItems = [
    { label: "Subuh", time: timings?.Fajr || "--:--", icon: Sunrise },
    { label: "Dzuhur", time: timings?.Dhuhr || "--:--", icon: Sun },
    { label: "Ashar", time: timings?.Asr || "--:--", icon: Sun },
    { label: "Maghrib", time: timings?.Maghrib || "--:--", icon: Sunset },
    { label: "Isya", time: timings?.Isha || "--:--", icon: Moon },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground max-w-full overflow-x-hidden">
      <SEO 
        title="Jadwal Sholat & Kualitas Udara Real-Time" 
        description="Jadwal sholat 5 waktu akurat Kemenag RI dan pantauan kualitas udara (AQI) real-time untuk wilayah Anda." 
      />
      <Navbar />

      <main className="container mx-auto px-4 py-6 md:py-10 bottom-nav-safe pb-24 max-w-4xl">
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Jadwal Sholat & Udara
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Kemenag RI Method • Pantauan Real-Time Open-Meteo & IQAir Standard
              </p>
            </div>

            {/* City Selector Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGpsDetect}
                disabled={detectingGps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-all active:scale-95 shrink-0"
              >
                <Navigation className={`h-3.5 w-3.5 ${detectingGps ? "animate-spin" : ""}`} />
                <span>{detectingGps ? "Mencari GPS..." : "GPS Saya"}</span>
              </button>

              <div className="relative">
                <select
                  value={selectedCity.name}
                  onChange={(e) => {
                    const found = CITIES.find(c => c.name === e.target.value);
                    if (found) handleCityChange(found);
                  }}
                  className="appearance-none bg-muted/60 border border-border/60 text-foreground text-xs font-bold rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {CITIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  {!CITIES.some(c => c.name === selectedCity.name) && (
                    <option value={selectedCity.name}>{selectedCity.name}</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Next Prayer Countdown Banner */}
          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {locationName}
              </span>
              {hijriDate && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {hijriDate}
                </span>
              )}
            </div>

            {countdown && nextLabel && (
              <div className="flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 border border-primary/25 px-3 py-1 rounded-full shadow-2xs">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span>{nextLabel} • {countdown} lagi</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: 5 WAKTU SHOLAT */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <span>Waktu Sholat Hari Ini</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </h2>
            <span className="text-[11px] font-bold text-muted-foreground font-mono">
              {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
            </span>
          </div>

          {prayerLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {prayerItems.map((item, index) => {
                const isCurrent = index === currentIndex;
                const isNext = index === nextIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 text-center relative ${
                      isNext
                        ? "bg-primary/10 border-primary shadow-md shadow-primary/10 scale-[1.02] ring-2 ring-primary/20"
                        : isCurrent
                          ? "bg-primary/5 border-primary/30 text-foreground"
                          : "bg-card border-border/50 text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${isNext ? "text-primary" : "text-foreground"}`}>
                        {item.label}
                      </span>
                    </div>

                    <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${isNext ? "text-primary" : isCurrent ? "text-foreground font-extrabold" : "text-foreground"}`}>
                      {item.time}
                    </span>

                    {/* Status Pill */}
                    <div className="mt-2 min-h-[18px]">
                      {isNext ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground tracking-wider leading-none shadow-sm">
                          SELANJUTNYA
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          SEDANG BERJALAN
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BANNER PROMOSI DZIKIR PAGI & PETANG */}
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-lg relative overflow-hidden group border border-emerald-500/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-amber-400/30">
                  Amalan Sunnah Harian
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Dzikir Pagi & Petang
                </h3>
                <p className="text-xs text-white/80 max-w-md line-clamp-2">
                  Benteng perlindungan harian sesuai hadits shahih dengan tasbih digital interaktif.
                </p>
              </div>
            </div>

            <Link
              to="/dzikir"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <span>Buka Dzikir</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* SECTION 2: WIDGET KUALITAS UDARA & CUACA */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Kualitas Udara & Cuaca
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">Wilayah {selectedCity.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchAqiData(selectedCity)}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${aqiLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* AQI Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-muted/20 border border-border/50 mb-4">
            <div className="md:col-span-5 flex items-center gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/60 shadow-sm min-w-[90px]">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">US AQI</span>
                <span className="text-3xl font-black font-mono text-foreground leading-tight">
                  {aqi !== null ? aqi : "--"}
                </span>
              </div>
              <div className="min-w-0">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase border mb-1.5 ${aqiInfo.color}`}>
                  <aqiInfo.icon className="h-3.5 w-3.5" />
                  <span>{aqiInfo.text}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {aqiInfo.desc}
                </p>
              </div>
            </div>

            {/* Weather Metrics */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 md:pl-4 text-xs">
              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 mb-0.5">
                  <Thermometer className="h-3 w-3 text-amber-500" /> Suhu
                </span>
                <span className="font-black text-sm text-foreground">{temp !== null ? `${temp}°C` : "--"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 mb-0.5">
                  <Droplets className="h-3 w-3 text-blue-500" /> Lembap
                </span>
                <span className="font-black text-sm text-foreground">{humidity !== null ? `${humidity}%` : "--"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 mb-0.5">
                  <Wind className="h-3 w-3 text-emerald-500" /> PM2.5
                </span>
                <span className="font-black text-sm text-foreground">{pm25 !== null ? `${pm25.toFixed(1)} µg` : "--"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 mb-0.5">
                  <Wind className="h-3 w-3 text-purple-500" /> PM10
                </span>
                <span className="font-black text-sm text-foreground">{pm10 !== null ? `${pm10.toFixed(1)} µg` : "--"}</span>
              </div>
            </div>
          </div>

          {/* Panduan Rekomendasi */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-foreground">Tips Aktivitas: </span>
              {aqi && aqi <= 100 ? (
                <span>Waktu yang sangat baik untuk ibadah berjamaah ke masjid dan beraktivitas di ruang terbuka.</span>
              ) : (
                <span>Disarankan mengenakan masker saat perjalanan menuju masjid atau bepergian di luar ruangan.</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
