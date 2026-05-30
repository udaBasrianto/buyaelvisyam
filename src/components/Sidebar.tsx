import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Tag, ChevronRight, MessageSquare, Info } from "lucide-react";
import api from "@/lib/api";

type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  cover_image: string;
  created_at: string;
  category: string;
};

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  article_count: number;
};

type Widget = {
  id: string;
  title: string;
  type: string; // html, image, text
  content: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  placement: string; // all, beranda, detail
  sort_order: number;
};

interface SidebarProps {
  placement?: "beranda" | "detail";
  articleContent?: string; // Optional context from article view
}

export function Sidebar({ placement = "detail", articleContent }: SidebarProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [dynamicWidgets, setDynamicWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [articlesRes, categoriesRes, widgetsRes] = await Promise.all([
          api.get("/blog/latest?limit=5"),
          api.get("/categories"),
          api.get("/widgets?is_active=true")
        ]);

        if (Array.isArray(articlesRes.data)) {
          setArticles(articlesRes.data);
        }
        if (Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data.filter((c: any) => c.article_count > 0).slice(0, 8));
        }
        if (Array.isArray(widgetsRes.data)) {
          // Filter widgets that match the placement
          const filtered = widgetsRes.data.filter(
            (w: Widget) => w.placement === "all" || w.placement === placement
          );
          setDynamicWidgets(filtered);
        }
      } catch (err) {
        console.error("Failed to load sidebar content", err);
      } finally {
        setLoading(false);
      }
    };

    loadSidebarData();
  }, [placement]);

  return (
    <aside className="space-y-8 w-full select-none">
      {/* Latest Articles Widget */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Artikel Terbaru</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Update Terkini</p>
          </div>
        </div>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : articles.map((a, i) => (
            <Link
              key={a.id}
              to={`/${a.slug}`}
              className="group flex gap-4 items-start p-2 -mx-2 rounded-2xl hover:bg-muted/50 transition-all duration-300"
            >
              <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="text-[11px] font-black">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {a.title}
                </p>
                {a.category && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{a.category}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link to="/arsip" className="mt-6 flex items-center justify-center gap-2 py-3 w-full rounded-xl bg-muted/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Categories Widget */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Kategori</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Topik Kajian</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/kategori/${c.slug}`}
              className="text-[11px] font-bold px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white border border-transparent transition-all shadow-sm active:scale-95"
            >
              {c.name} <span className="opacity-40 ml-1 text-[9px]">({c.article_count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Dynamic Database Widgets */}
      {dynamicWidgets.map(w => {
        if (w.type === "image" && w.image_url) {
          return (
            <div key={w.id} className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/[0.02]">
              <a 
                href={w.link_url || "#"} 
                target={w.link_url?.startsWith("http") ? "_blank" : "_self"} 
                rel="noopener noreferrer" 
                className="block relative overflow-hidden"
              >
                <img 
                  src={w.image_url} 
                  alt={w.title} 
                  className="w-full h-auto max-h-[300px] object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-primary px-3 py-1 rounded-lg">Kunjungi Tautan</span>
                </div>
              </a>
              {w.title && (
                <div className="p-4 border-t border-border/40">
                  <h4 className="font-bold text-[13px] text-foreground leading-snug line-clamp-2">{w.title}</h4>
                </div>
              )}
            </div>
          );
        }

        if (w.type === "text") {
          return (
            <div key={w.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{w.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Informasi Kajian</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">{w.content}</p>
            </div>
          );
        }

        if (w.type === "html") {
          return (
            <div key={w.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02] hover:shadow-md transition-shadow">
              {w.title && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{w.title}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Kanal Informasi</p>
                  </div>
                </div>
              )}
              <div 
                className="text-[12px] overflow-hidden leading-normal text-muted-foreground whitespace-normal"
                dangerouslySetInnerHTML={{ __html: w.content }}
              />
            </div>
          );
        }

        return null;
      })}

      {/* Default Newsletter / CTA Widget */}
      <div className="relative overflow-hidden bg-primary rounded-[24px] p-6 text-primary-foreground shadow-lg shadow-primary/20">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
         <div className="relative z-10">
            <h4 className="font-black text-lg leading-tight mb-2">Dapatkan Update <br/>Via WhatsApp</h4>
            <p className="text-white/70 text-[11px] leading-relaxed mb-4">Jangan lewatkan materi kajian terbaru langsung di ponsel Anda.</p>
            <button className="w-full py-2.5 bg-white text-primary rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary transition-colors">
               Gabung Sekarang
            </button>
         </div>
      </div>
    </aside>
  );
}
