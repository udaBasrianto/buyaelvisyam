import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSliderV2 } from "@/components/HeroSliderV2";
import { HeroSliderV3 } from "@/components/HeroSliderV3";
import { FeatureBar } from "@/components/FeatureBar";
import { PostCardV2 } from "@/components/PostCardV2";
import { CategorySectionV2 } from "@/components/CategorySectionV2";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BottomNav } from "@/components/BottomNav";
import { PrayerTimesBar } from "@/components/PrayerTimesBar";
import api from "@/lib/api";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { Post } from "@/data/mockData";
import { heroSlides, latestPosts as mockLatestPosts } from "@/data/mockData";
import { Sparkles, TrendingUp, Zap, Eye, LayoutList, Grid2X2, LayoutGrid } from "lucide-react";
import * as LucideIcons from "lucide-react";

export function IndexV2() {
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [latestData, setLatestData] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorsChoiceLayout, setEditorsChoiceLayout] = useState<'list' | 'grid2'>('list');
  const [recentLayout, setRecentLayout] = useState<'card' | 'grid2' | 'list'>('card');
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
            commentCount: a.comment_count || 0,
          };
        };

        if (latestRes.data) {
          setDbPosts(latestRes.data.map(mapToPost));
          setLatestData(latestRes.data);
        }
        if (featuredRes.data) {
          setFeaturedPosts(featuredRes.data.map(mapToPost));
        }

        const featRes = await api.get("/features");
        if (featRes.data) {
          setFeatures(featRes.data);
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
  const heroData = hasDbPosts ? dbPosts.slice(0, 10) : heroSlides;
  const editorsChoice = featuredPosts.length > 0 ? featuredPosts : (hasDbPosts ? dbPosts.slice(0, 6) : heroSlides);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground max-w-full overflow-x-hidden">
      <SEO title={settings.site_name} description={settings.tagline} />
      <Navbar />

      <main className="bottom-nav-safe pb-16">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {settings.slider_style === "v3" ? (
            <HeroSliderV3 slides={heroData} />
          ) : (
            <HeroSliderV2 slides={heroData} />
          )}
        </div>

        <div className="mt-2 md:mt-0">
          <PrayerTimesBar />
        </div>

        <div className="container mx-auto px-4">
           <CategorySectionV2 />
        </div>

        <div className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                 <div className="h-2 w-8 bg-primary rounded-full" />
                 <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                   <Sparkles className="h-5 w-5 text-primary" /> {settings.hero_title || "Editors Choice"}
                 </h2>
               </div>
               
               <div className="flex md:hidden bg-background/50 p-1 rounded-xl border border-border/50">
                  <button 
                    onClick={() => setEditorsChoiceLayout('list')}
                    className={`p-1.5 rounded-lg transition-all ${editorsChoiceLayout === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setEditorsChoiceLayout('grid2')}
                    className={`p-1.5 rounded-lg transition-all ${editorsChoiceLayout === 'grid2' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>
               </div>
             </div>
            
             <div className={`grid gap-4 ${editorsChoiceLayout === 'grid2' ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {editorsChoice.map((post, index) => (
                  <Link 
                    key={post.id} 
                    to={`/${post.slug || post.id}`}
                    className={`flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group ${editorsChoiceLayout === 'grid2' ? 'flex-col p-3' : 'flex-row'}`}
                  >
                      <div className={`shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black transition-all ${editorsChoiceLayout === 'grid2' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'}`}>
                         {index + 1}
                      </div>
                      <div className="min-w-0">
                         <h3 className={`font-bold group-hover:text-primary transition-colors leading-snug ${editorsChoiceLayout === 'grid2' ? 'text-[11px] line-clamp-3' : 'text-sm line-clamp-2'}`}>
                           {post.title}
                         </h3>
                         <div className={`flex items-center justify-between mt-2 ${editorsChoiceLayout === 'grid2' ? 'flex-col items-start gap-1' : ''}`}>
                            <p className="text-[10px] text-muted-foreground font-bold truncate max-w-full">By {post.author}</p>
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

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/10">
             {features.filter(f => f.is_active).map((item) => {
                const IconComponent = (LucideIcons[item.icon as keyof typeof LucideIcons] as any) || LucideIcons.Zap;
                
                const colorMap: Record<string, string> = {
                   emerald: "text-emerald-600 bg-emerald-500/20",
                   blue: "text-blue-600 bg-blue-500/20",
                   amber: "text-amber-600 bg-amber-500/20",
                   rose: "text-rose-600 bg-rose-500/20",
                   indigo: "text-indigo-600 bg-indigo-500/20",
                   slate: "text-slate-600 bg-slate-500/20"
                };
                
                const colorClass = colorMap[item.color] || "text-primary bg-primary/20";
                const textColor = colorClass.split(' ')[0];

                return (
                  <a 
                    href={item.link || "#"} 
                    key={item.id} 
                    target={item.link?.startsWith('http') ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 text-center group cursor-pointer"
                  >
                     <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{item.label}</span>
                  </a>
                );
             })}

             {features.length === 0 && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <LucideIcons.Zap className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Kajian Cepat</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <LucideIcons.TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Trending Topik</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <LucideIcons.Zap className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Modern UI/UX</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <LucideIcons.Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Premium Content</span>
                  </div>
                </>
             )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-8 bg-blue-500 rounded-full" />
                    <h2 className="text-xl font-black uppercase tracking-widest">{settings.recent_title || "Recent Stories"}</h2>
                  </div>

                   <div className="flex md:hidden bg-background/50 p-1 rounded-xl border border-border/50">
                      <button 
                        onClick={() => setRecentLayout('card')}
                        className={`p-1.5 rounded-lg transition-all ${recentLayout === 'card' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setRecentLayout('grid2')}
                        className={`p-1.5 rounded-lg transition-all ${recentLayout === 'grid2' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        <Grid2X2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setRecentLayout('list')}
                        className={`p-1.5 rounded-lg transition-all ${recentLayout === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                   </div>
                </div>
               
               {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
                 </div>
               ) : (
                  <div className={`grid gap-6 ${recentLayout === 'grid2' ? 'grid-cols-2' : recentLayout === 'card' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {latestData.map((post) => (
                      <Link key={post.id} to={`/artikel/${post.slug || post.id}`} className={recentLayout === 'list' ? 'block' : ''}>
                        {recentLayout === 'card' ? (
                          <PostCardV2 post={{
                            id: post.id,
                            slug: post.slug,
                            title: post.title,
                            excerpt: post.excerpt || "",
                            image: post.cover_image || "",
                            category: post.category,
                            tags: post.tags || [],
                            author: post.author || "Ustadz",
                            date: new Date(post.created_at).toLocaleDateString("id-ID"),
                            views: post.views,
                            readingMinutes: 5,
                            commentCount: 0
                          }} />
                        ) : recentLayout === 'grid2' ? (
                          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden group h-full">
                             <div className="aspect-[4/3] overflow-hidden">
                                <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             </div>
                             <div className="p-3">
                                <span className="text-[8px] font-black uppercase text-primary mb-1 block">{post.category}</span>
                                <h3 className="text-[11px] font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                             </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
                             <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted">
                                <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             </div>
                             <div className="min-w-0 flex flex-col justify-center">
                                <span className="text-[8px] font-black uppercase text-primary mb-1 block">{post.category}</span>
                                <h3 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                                <p className="text-[9px] text-muted-foreground mt-1 font-medium">{new Date(post.created_at).toLocaleDateString("id-ID")}</p>
                             </div>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
               )}
             </div>

             <aside className="lg:col-span-4 space-y-12">
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

        <Footer />
      </main>

      <BottomNav />
    </div>
  );
}
