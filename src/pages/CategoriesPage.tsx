import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { BookOpen, ArrowRight, Search, LayoutGrid } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => setCategories(asArray<any>(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => categories.filter(cat => (cat.article_count || 0) > 0),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(cat => cat.name.toLowerCase().includes(q));
  }, [visible, query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="bottom-nav-safe py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl islamic-gradient text-primary-foreground flex items-center justify-center mx-auto mb-3 shadow-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">EKSPLORASI KATEGORI</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
              {visible.length} Kategori • Temukan Kajian Sesuai Minat Anda
            </p>
          </div>

          {/* Sticky search — stays visible while scrolling */}
          <div className="sticky top-16 z-30 -mx-4 mb-4 px-4 py-2.5 bg-background/90 backdrop-blur-md">
            <div className="relative max-w-6xl mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full h-10 pl-10 pr-4 rounded-full border border-border/60 bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground italic">
              Tidak ada kategori yang cocok dengan "{query}"
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/kategori/${cat.slug}`}
                  className="group flex flex-col items-center text-center gap-2.5 rounded-2xl border border-border/50 bg-card p-4 pt-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all"
                >
                  <div className="h-11 w-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 w-full">
                    <h3 className="font-bold text-[14px] leading-snug group-hover:text-primary transition-colors line-clamp-2">{cat.name}</h3>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {cat.article_count || 0} Artikel
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}