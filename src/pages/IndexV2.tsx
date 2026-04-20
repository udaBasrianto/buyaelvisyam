import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSliderV2 } from "@/components/HeroSliderV2";
import { HeroSliderV3 } from "@/components/HeroSliderV3";
import { FeatureBar } from "@/components/FeatureBar";
import { PostCardV2 } from "@/components/PostCardV2";
import { CategorySectionV2 } from "@/components/CategorySectionV2";
import { SEO } from "@/components/SEO";
import { BottomNav } from "@/components/BottomNav";
import { PrayerTimesBar } from "@/components/PrayerTimesBar";
import api from "@/lib/api";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { Post } from "@/data/mockData";
import { heroSlides, latestPosts as mockLatestPosts } from "@/data/mockData";
import { Sparkles, TrendingUp, Zap, Eye } from "lucide-react";

export function IndexV2() {
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSiteSettings();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const [latestRes, featuredRes] = await Promise.all([
          api.get("/articles", { params: { limit: 20, status: "published" } }),
          api.get("/articles", { params: { limit: 6, status: "published", featured: "true" } })
        ]);

        const mapToPost = (a: any): Post => {
          const words = (a.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
          return {
            id: a.id,
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt || "",
            image: a.cover_image || "",
            category: a.category,
            tags: a.tags || [],
            author: a.author || "Ustadz",
            date: new Date(a.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            views: a.views,
            readingMinutes: Math.max(1, Math.ceil(words / 200)),
          };
        };

        if (latestRes.data) {
          setDbPosts(latestRes.data.map(mapToPost));
        }
        if (featuredRes.data) {
          setFeaturedPosts(featuredRes.data.map(mapToPost));
        }
      } catch (err) {
        console.error("Fetch articles failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading || settingsLoading) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Memuat Beranda Modern...</p>
    </div>;
  }

  const hasDbPosts = dbPosts.length > 0;
  // Slider gets up to 10 articles so it has enough to rotate through
  const heroData = hasDbPosts ? dbPosts.slice(0, 10) : heroSlides;
  // Recent posts start after the slider articles
  const latestData = hasDbPosts ? dbPosts.slice(0, 8) : mockLatestPosts;
  const editorsChoice = featuredPosts.length > 0 ? featuredPosts : (hasDbPosts ? dbPosts.slice(0, 6) : heroSlides);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <SEO title={settings.site_name} description={settings.tagline} />
      <Navbar />

      <main className="bottom-nav-safe pb-16">
        {/* Modern Hero */}
        <div className="container mx-auto px-4 py-6">
          {settings.slider_style === "v3" ? (
            <HeroSliderV3 slides={heroData} />
          ) : (
            <HeroSliderV2 slides={heroData} />
          )}
        </div>

        <PrayerTimesBar />

        {/* Categories Sektor */}
        <div className="container mx-auto px-4">
           <CategorySectionV2 />
        </div>

        {/* Editors Choice Section */}
        <div className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
               <div className="h-2 w-8 bg-primary rounded-full" />
               <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-primary" /> {settings.hero_title || "Editors Choice"}
               </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {editorsChoice.map((post, index) => (
                  <Link 
                    key={post.id} 
                    to={`/artikel/${post.slug || post.id}`}
                    className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                  >
                     <div className="shrink-0 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">
                        {index + 1}
                     </div>
                     <div className="min-w-0">
                        <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                           <p className="text-[10px] text-muted-foreground font-bold">By {post.author}</p>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                              <Eye className="h-3 w-3" />
                              {post.views || 0}
                           </div>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
          </div>
        </div>

        {/* Feature bar (Condensed) */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/10">
             <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                   <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Kajian Cepat</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                   <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Trending Topik</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                   <Zap className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Modern UI/UX</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                   <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Premium Content</span>
             </div>
          </div>
        </div>

        {/* Recent Posts & Sidebar */}
        <div className="container mx-auto px-4 py-16">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* Main Feed */}
             <div className="lg:col-span-8">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-8 bg-blue-500 rounded-full" />
                   <h2 className="text-xl font-black uppercase tracking-widest">{settings.recent_title || "Recent Stories"}</h2>
                 </div>
               </div>
               
               {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {latestData.map((post) => (
                     <Link key={post.id} to={`/artikel/${post.slug || post.id}`}>
                       <PostCardV2 post={post} />
                     </Link>
                   ))}
                 </div>
               )}
             </div>

             {/* Magazine Sidebar */}
             <aside className="lg:col-span-4 space-y-12">
               {/* Trending Section */}
               <div className="bg-card rounded-3xl p-6 border border-border/50">
                 <div className="flex items-center gap-2 mb-6">
                   <TrendingUp className="h-4 w-4 text-primary" />
                   <h3 className="text-sm font-black uppercase tracking-widest">Trending Now</h3>
                 </div>
                 
                 <div className="space-y-6">
                   {dbPosts.slice(0, 5).map((post, i) => (
                     <Link key={post.id} to={`/artikel/${post.slug || post.id}`} className="flex gap-4 group">
                       <span className="text-2xl font-black text-primary/20 group-hover:text-primary transition-colors italic">0{i+1}</span>
                       <div className="space-y-1">
                          <h4 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{post.category}</p>
                       </div>
                     </Link>
                   ))}
                 </div>
               </div>

               {/* Newsletter Widget */}
               <div className="bg-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                 <h3 className="text-xl font-black mb-2 uppercase italic">{settings.newsletter_title || "Join Our Newsletter"}</h3>
                 <p className="text-xs opacity-70 mb-6">{settings.newsletter_description || "Dapatkan notifikasi kajian terbaru langsung ke email Anda setiap minggu."}</p>
                  {settings.newsletter_link ? (
                    <a 
                      href={settings.newsletter_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-white text-primary font-black py-3 rounded-xl text-center text-xs uppercase hover:bg-opacity-90 transition-all shadow-lg"
                    >
                      {settings.newsletter_button_text || "GABUNG SEKARANG"}
                    </a>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="your@email.com" 
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"
                      />
                      <button className="w-full bg-white text-primary font-black py-2 rounded-xl text-xs uppercase hover:bg-opacity-90 transition-all">
                        {settings.newsletter_button_text || "Subscribe"}
                      </button>
                    </div>
                  )}
                </div>
              </aside>
           </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-card mt-16 pt-16 pb-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl ring-4 ring-primary/20">☪</div>
              )}
              <span className="text-2xl font-black text-primary tracking-tighter uppercase">{settings.site_name}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 line-relaxed">
              {settings.tagline || settings.footer_text}
            </p>
            <div className="border-t border-border pt-8">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                {settings.footer_text} — Optimized for SEO & Speed
              </p>
            </div>
          </div>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
