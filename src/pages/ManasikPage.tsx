import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Compass, Maximize2, RotateCcw, ExternalLink, Sparkles, 
  MapPin, BookOpen, CheckCircle2, ChevronRight, HelpCircle
} from "lucide-react";

export default function ManasikPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <SEO 
        title="Simulasi Manasik Umrah & Haji 3D Interaktif - Buya Dr. Elvis Syam, M.A."
        description="Simulasi manasik umrah dan haji 3D interaktif: visualisasi Ka'bah, tawaf, sa'i Safa-Marwah, wukuf Arafah, mabit Muzdalifah, dan melontar jumrah sesuai sunnah."
      />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 bottom-nav-safe pb-28 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors font-medium">Beranda</Link>
            <span>/</span>
            <span className="text-foreground font-bold">Haji & Umroh (Simulasi 3D)</span>
          </div>

          <a 
            href="/manasik/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-full transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Buka Layar Penuh</span>
          </a>
        </div>

        {/* HERO HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl relative overflow-hidden mb-6 shadow-xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 border border-emerald-500/30 text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/15">
              <Compass className="h-4 w-4 text-amber-300 animate-spin-slow" />
              <span>Simulasi Interaktif 3D Masjidil Haram</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Simulasi Manasik Umrah & Haji 3D
            </h1>

            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Panduan visual tata cara pelaksanaan ibadah Umrah dan Haji sesuai sunnah Rasulullah ﷺ dengan pemodelan 3D Masjidil Haram, Ka'bah, lintasan Sa'i, Arafah, Muzdalifah, dan Mina.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href="/manasik/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-950/40 hover:brightness-110 active:scale-95 transition-all"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Buka Mode Penuh (Fullscreen)</span>
              </a>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Muat Ulang 3D</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3D WEBGL VIEWER CONTAINER */}
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xl mb-8 relative">
          <div className="p-3.5 bg-muted/50 border-b border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Kamera 3D Interaktif (Bisa Diputar & Digeser)</span>
            </div>

            <div className="flex items-center gap-2">
              <a 
                href="/manasik/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold flex items-center gap-1 text-xs"
              >
                <span>Tab Baru</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* IFRAME 3D APP */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:h-[650px] bg-slate-950">
            <iframe
              key={iframeKey}
              src="/manasik/"
              title="Simulasi Manasik Umrah dan Haji 3D"
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              loading="lazy"
            />
          </div>

          <div className="p-3 bg-muted/40 border-t border-border/50 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>💡 <b>Petunjuk:</b> Geser layar / mouse untuk memutar sudut pandang (Orbit), scroll untuk zoom in/out.</span>
            <span>Didukung Three.js & WebGL</span>
          </div>
        </div>

        {/* INFORMATIONAL CARDS: TAHAPAN UMRAH & HAJI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Umrah */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Tahapan Ibadah Umrah (11 Tahap)</h3>
                <p className="text-xs text-muted-foreground">Rukun dan wajib umrah sesuai tuntunan sunnah</p>
              </div>
            </div>

            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">1.</span>
                <span><b>Ihram di Miqat</b>: Mandi sunnah, memakai pakaian ihram, niat umrah, dan mengumandangkan Talbiyah.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">2.</span>
                <span><b>Masuk Masjidil Haram</b>: Mendahulukan kaki kanan dan membaca doa masuk masjid.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">3.</span>
                <span><b>Tawaf 7 Putaran</b>: Dimulai dari Hajar Aswad berlawanan arah jarum jam dengan bahu kanan terbuka (idhthiba').</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">4.</span>
                <span><b>Shalat di Maqam Ibrahim</b>: Shalat sunnah 2 rakaat di belakang Maqam Ibrahim lalu minum air Zamzam.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">5.</span>
                <span><b>Sa'i 7 Kali</b>: Berjalan dari bukit Safa ke Marwah (dihitung 1 kali) hingga berakhir di Marwah pada putaran ke-7.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary shrink-0">6.</span>
                <span><b>Tahallul</b>: Mencukur gundul (afdal bagi laki-laki) atau memendekkan rambut secara merata. Selesailah ibadah umrah.</span>
              </li>
            </ol>
          </div>

          {/* Card Haji Tamattu' */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Tahapan Haji Tamattu' (15 Tahap)</h3>
                <p className="text-xs text-muted-foreground">Melaksanakan umrah di bulan haji, lalu haji</p>
              </div>
            </div>

            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">1.</span>
                <span><b>8 Dzulhijjah (Hari Tarwiyah)</b>: Berniat ihram haji dari penginapan/hotel di Makkah lalu mabit di Mina.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">2.</span>
                <span><b>9 Dzulhijjah (Wukuf di Arafah)</b>: Puncak ibadah haji, mendengarkan khutbah, shalat jamak qashar Zhuhur-Ashar, dan memperbanyak doa.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">3.</span>
                <span><b>Malam 10 Dzulhijjah</b>: Mabit di Muzdalifah setelah matahari terbenam dan mengumpulkan kerikil.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">4.</span>
                <span><b>10 Dzulhijjah (Hari Nahar)</b>: Melempar Jumrah Aqabah 7 butir, menyembelih hadyu, tahallul awal, dan Tawaf Ifadhah.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">5.</span>
                <span><b>Hari Tasyriq (11, 12, 13 Dzulhijjah)</b>: Mabit di Mina dan melontar 3 jumrah (Ula, Wustha, Aqabah) setiap hari setelah tergelincir matahari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">6.</span>
                <span><b>Tawaf Wada'</b>: Tawaf perpisahan sebelum meninggalkan kota suci Makkah Al-Mukarramah.</span>
              </li>
            </ol>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
