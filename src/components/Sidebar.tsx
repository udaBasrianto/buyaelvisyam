import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Tag, ChevronRight } from "lucide-react";
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

export function Sidebar() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    api.get("/blog/latest?limit=5").then(({ data }) => {
      if (Array.isArray(data)) setArticles(data);
    }).catch(() => {});
    api.get("/categories").then(({ data }) => {
      if (Array.isArray(data)) setCategories(data.filter((c: any) => c.article_count > 0).slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <aside className="space-y-8 w-full">
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

      {/* Newsletter / CTA Placeholder */}
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
