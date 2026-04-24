import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";
import { BookOpen, PlayCircle, Clock, Star, Filter, Search, ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import api from "@/lib/api";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructor: string;
  level: string;
  category: string;
  price: number;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();

  const lmsLabel = (settings as any).lms_menu_label || "Akademi";
  const lmsTitle = (settings as any).lms_title || "Belajar Islam Lebih Terstruktur.";
  const lmsSubtitle = (settings as any).lms_subtitle || "Akses materi kajian eksklusif, video tutorial, dan kuis interaktif dari Ustadz-Ustadz terpercaya.";

  useEffect(() => {
    api.get("/courses").then(({ data }) => {
      if (data) setCourses(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${lmsLabel} - ${settings.site_name}`} description={lmsSubtitle} />
      <Navbar />

      <main className="container mx-auto px-4 py-8 bottom-nav-safe">
        {/* LMS Hero */}
        <div className="bg-primary rounded-[40px] p-8 md:p-16 mb-12 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest mb-6 border border-white/20">
              {lmsLabel}
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {lmsTitle.includes(" ") ? (
                <>
                  {lmsTitle.split(" ").slice(0, -1).join(" ")} <br/>
                  <span className="italic text-secondary">{lmsTitle.split(" ").slice(-1)[0]}</span>
                </>
              ) : lmsTitle}
            </h1>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              {lmsSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-2xl font-black text-sm uppercase">
                 <BookOpen className="h-4 w-4" /> 12+ Kursus
               </div>
               <div className="flex items-center gap-2 px-6 py-3 bg-primary-foreground/10 border border-white/20 text-white rounded-2xl font-black text-sm uppercase">
                 <Star className="h-4 w-4" /> 500+ Siswa
               </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
           <div className="flex items-center gap-2 w-full md:w-auto">
              {["Semua", "Aqidah", "Fiqih", "Adab", "Sejarah"].map(cat => (
                 <button key={cat} className="px-5 py-2.5 rounded-full text-xs font-bold border border-border hover:border-primary hover:text-primary transition-all whitespace-nowrap">
                   {cat}
                 </button>
              ))}
           </div>
           <div className="relative w-full md:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Cari kursus..." 
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {loading ? (
             [1,2,3].map(i => <div key={i} className="aspect-[4/3] rounded-3xl bg-muted animate-pulse" />)
           ) : (
             courses.map(c => (
               <Link key={c.id} to={`/lms/course/${c.slug}`} className="group bg-card border border-border/50 rounded-[32px] overflow-hidden flex flex-col hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5">
                 <div className="aspect-video relative overflow-hidden">
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-primary">
                      {c.category}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <PlayCircle className="h-12 w-12 text-white scale-90 group-hover:scale-100 transition-transform duration-300" />
                    </div>
                 </div>
                 <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /> 4.9</span>
                       <span>•</span>
                       <span>{c.level}</span>
                    </div>
                    <h3 className="text-xl font-black mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs italic">U</div>
                          <span className="text-xs font-bold text-muted-foreground">{c.instructor}</span>
                       </div>
                       <div className="text-lg font-black text-primary">
                          {c.price === 0 ? "GRATIS" : `Rp ${c.price.toLocaleString("id-ID")}`}
                       </div>
                    </div>
                 </div>
               </Link>
             ))
           )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
