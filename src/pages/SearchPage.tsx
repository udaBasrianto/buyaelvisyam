import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { Search, ArrowRight, CornerDownRight, Eye } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/blog/search?q=${query}`);
        setResults(data || []);
      } catch (err) {}
      setLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="bottom-nav-safe py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="relative mb-10 group">
             <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
             <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Cari kata kunci kajian..." 
                  className="h-16 pl-14 pr-6 rounded-[2rem] text-lg font-bold border-2 focus:border-primary/50 transition-all shadow-xl shadow-black/5"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
             </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mx-4">Hasil Pencarian ({results.length})</p>
              {results.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/${article.slug || article.id}`}
                  className="bg-card border border-border/50 p-4 rounded-[2rem] flex items-center gap-4 hover:border-primary/50 transition-all group"
                >
                  <div className="h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
                    <img src={article.cover_image || "/placeholder.svg"} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">{article.category}</span>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-bold italic">
                       <Eye className="h-3 w-3" /> {article.views} Views
                    </div>
                  </div>
                  <div className="pr-2"><CornerDownRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="text-center py-20 opacity-50 italic text-sm">
              Tidak ada hasil ditemukan untuk "{query}".
            </div>
          ) : (
            <div className="text-center py-20">
               <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-20">
                  <Search className="h-10 w-10" />
               </div>
               <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Mulai mengetik untuk mencari...</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
