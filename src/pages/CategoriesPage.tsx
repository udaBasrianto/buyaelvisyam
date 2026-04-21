import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import api from "@/lib/api";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => setCategories(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="bottom-nav-safe py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-10 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
               <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">EKSPLORASI KATEGORI</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Temukan Kajian Sesuai Minat Anda</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {categories.filter(cat => (cat.article_count || 0) > 0).map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/kategori/${cat.slug}`}
                  className="bg-card border border-border/50 p-5 rounded-[2rem] flex items-center justify-between group hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Sparkles className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{cat.name}</h3>
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest mt-1">{cat.article_count || 0} Artikel Tersedia</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
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
