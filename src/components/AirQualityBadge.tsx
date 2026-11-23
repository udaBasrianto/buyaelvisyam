import { useState, useEffect } from "react";
import {
  Wind,
  MapPin,
  ChevronDown,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Thermometer,
  Droplets,
  Navigation,
  RefreshCw,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

export function AirQualityBadge() {
  const [selectedCity, setSelectedCity] = useState<CityPreset>(() => {
    const saved = localStorage.getItem("selected_aqi_city");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return CITIES[0]; // Default Padang
  });

  const [aqi, setAqi] = useState<number | null>(null);
  const [pm25, setPm25] = useState<number | null>(null);
  const [pm10, setPm10] = useState<number | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    fetchData(selectedCity);
  }, [selectedCity]);

  const fetchData = async (city: CityPreset) => {
    const cacheKey = `aqi_cache_${city.lat}_${city.lon}`;
    try {
      // Check session cache first (valid for 20 minutes)
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 20 * 60 * 1000) {
            setAqi(parsed.aqi);
            setPm25(parsed.pm25);
            setPm10(parsed.pm10);
            setTemp(parsed.temp);
            setHumidity(parsed.humidity);
            setLoading(false);
            return;
          }
        } catch {
          // ignore cache parse errors
        }
      }

      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // 1. Fetch Air Quality (Open-Meteo Air Quality API - US AQI standard as IQAir)
      const aqiPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5,pm10`,
        { signal: controller.signal }
      ).then((res) => res.json()).catch(() => null);

      // 2. Fetch Weather (Temperature & Humidity)
      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m`,
        { signal: controller.signal }
      ).then((res) => res.json()).catch(() => null);

      const [aqiData, weatherData] = await Promise.all([aqiPromise, weatherPromise]);
      clearTimeout(timeoutId);

      let newAqi: number | null = null;
      let newPm25: number | null = null;
      let newPm10: number | null = null;
      let newTemp: number | null = null;
      let newHum: number | null = null;

      if (aqiData?.current?.us_aqi !== undefined) {
        newAqi = Math.round(aqiData.current.us_aqi);
        newPm25 = aqiData.current.pm2_5;
        newPm10 = aqiData.current.pm10;
        setAqi(newAqi);
        setPm25(newPm25);
        setPm10(newPm10);
      }

      if (weatherData?.current) {
        newTemp = Math.round(weatherData.current.temperature_2m);
        newHum = Math.round(weatherData.current.relative_humidity_2m);
        setTemp(newTemp);
        setHumidity(newHum);
      }

      if (newAqi !== null || newTemp !== null) {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            aqi: newAqi,
            pm25: newPm25,
            pm10: newPm10,
            temp: newTemp,
            humidity: newHum,
          })
        );
      }
    } catch (e) {
      console.warn("AQI fetch failed:", e);
    } finally {
      setLoading(false);
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
      (pos) => {
        const customCity: CityPreset = {
          name: "Lokasi Anda",
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        };
        handleCityChange(customCity);
        setDetectingGps(false);
      },
      () => {
        setDetectingGps(false);
        alert("Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif.");
      },
      { timeout: 10000 }
    );
  };

  // AQI Level Helpers
  const getAqiDetails = (val: number | null) => {
    if (val === null) {
      return {
        label: "Memuat...",
        pillBg: "bg-muted/80 text-muted-foreground border-border/50",
        badgeBg: "bg-muted text-foreground",
        level: "N/A",
        advice: "Sedang mengambil data kualitas udara...",
        icon: Wind,
      };
    }
    if (val <= 50) {
      return {
        label: "Baik",
        pillBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20",
        badgeBg: "bg-emerald-500 text-white",
        level: "Bersih & Segar",
        advice: "Kualitas udara sangat baik. Udara bersih dan aman untuk shalat berjamaah, berolahraga, dan aktivitas kajian luar ruangan.",
        icon: Sparkles,
      };
    }
    if (val <= 100) {
      return {
        label: "Sedang",
        pillBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20",
        badgeBg: "bg-amber-500 text-white",
        level: "Dapat Diterima",
        advice: "Kualitas udara dapat diterima untuk mayoritas orang. Kelompok yang sangat sensitif disarankan membatasi aktivitas fisik berat di luar.",
        icon: Wind,
      };
    }
    if (val <= 150) {
      return {
        label: "Sensitif",
        pillBg: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25 hover:bg-orange-500/20",
        badgeBg: "bg-orange-500 text-white",
        level: "Kurang Sehat bagi Sensitif",
        advice: "Kelompok sensitif (lansia, anak-anak, dan penderita asma) dianjurkan memakai masker saat menuju masjid atau beraktivitas luar ruangan.",
        icon: AlertTriangle,
      };
    }
    if (val <= 200) {
      return {
        label: "Tidak Sehat",
        pillBg: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25 hover:bg-red-500/20",
        badgeBg: "bg-red-500 text-white",
        level: "Tidak Sehat",
        advice: "Kadar polusi cukup tinggi. Seluruh jamaah disarankan memakai masker pelindung saat bepergian ke masjid.",
        icon: AlertCircle,
      };
    }
    return {
      label: "Berbahaya",
      pillBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/25",
      badgeBg: "bg-purple-600 text-white",
      level: "Sangat Tidak Sehat",
      advice: "Peringatan kesehatan. Hindari aktivitas luar ruangan yang tidak mendesak dan tutup jendela rumah.",
      icon: AlertCircle,
    };
  };

  const aqiInfo = getAqiDetails(aqi);
  const StatusIcon = aqiInfo.icon;

  return (
    <>
      {/* Clickable Header Mini Pill */}
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold select-none transition-all duration-200 active:scale-95 shadow-sm ml-auto z-10 ${aqiInfo.pillBg}`}
        title="Klik untuk melihat detail kualitas udara & cuaca"
      >
        <StatusIcon className="h-3 w-3 shrink-0" />
        <span className="hidden sm:inline text-muted-foreground/80 font-medium">Udara {selectedCity.name}:</span>
        <span className="sm:hidden font-medium">{selectedCity.name}:</span>
        <span className="font-black">
          {loading ? (
            <span className="inline-block animate-pulse">...</span>
          ) : (
            `AQI ${aqi ?? "—"}`
          )}
        </span>
        <span className="hidden md:inline font-bold">({aqiInfo.label})</span>
        {temp !== null && (
          <span className="hidden lg:inline text-muted-foreground/75 font-normal pl-0.5 border-l border-border/50">
            {temp}°C
          </span>
        )}
      </button>

      {/* Comprehensive Air Quality & Weather Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-primary" /> Pantauan Kualitas Udara Real-Time
              </span>
              <button
                type="button"
                onClick={() => fetchData(selectedCity)}
                disabled={loading}
                className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                title="Perbarui Data"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              {selectedCity.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Standar indeks AQI global (US EPA / IQAir) untuk panduan kesehatan jamaah.
            </DialogDescription>
          </DialogHeader>

          {/* AQI Big Score Banner */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between gap-4 mt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${aqiInfo.badgeBg}`}>
                  {aqiInfo.label}
                </span>
                <span className="text-xs font-bold text-muted-foreground">{aqiInfo.level}</span>
              </div>
              <p className="text-4xl font-black tracking-tight text-foreground">
                {aqi !== null ? aqi : "—"}
                <span className="text-sm font-semibold text-muted-foreground ml-1.5">AQI</span>
              </p>
            </div>

            {/* Weather mini info */}
            <div className="flex flex-col gap-1.5 text-right border-l border-border/60 pl-4 text-xs font-bold text-foreground shrink-0">
              {temp !== null && (
                <div className="flex items-center gap-1.5 justify-end text-muted-foreground">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-foreground font-black">{temp}°C</span>
                </div>
              )}
              {humidity !== null && (
                <div className="flex items-center gap-1.5 justify-end text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-foreground font-black">{humidity}%</span>
                </div>
              )}
              {pm25 !== null && (
                <div className="text-[10px] text-muted-foreground font-medium">
                  PM2.5: <strong className="text-foreground">{pm25} µg/m³</strong>
                </div>
              )}
            </div>
          </div>

          {/* Health & Islamic Activity Advice Card */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Anjuran Jamaah & Kesehatan
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11.5px]">
              {aqiInfo.advice}
            </p>
          </div>

          {/* City Selection Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Pilih Kota / Lokasi
              </label>
              <button
                type="button"
                onClick={handleGpsDetect}
                disabled={detectingGps}
                className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
              >
                <Navigation className={`h-3 w-3 ${detectingGps ? "animate-spin" : ""}`} />
                {detectingGps ? "Mencari GPS..." : "Gunakan GPS Saya"}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {CITIES.map((c) => {
                const isSelected = selectedCity.name === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleCityChange(c)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border truncate ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/60"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* IQAir External Reference Link */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Data satelit: Open-Meteo & IQAir AQI</span>
            <a
              href="https://www.iqair.com/id/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Lihat di IQAir.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
