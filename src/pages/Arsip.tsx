import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import api from "@/lib/api";
import type { Post } from "@/data/mockData";
import { ArrowLeft, BookOpen, Search, Filter, LayoutGrid, ChevronDown, ArrowUpDown } from "lucide-react";

const COL_OPTIONS = [3, 4, 5, 6] as const;
type ColCount = (typeof COL_OPTIONS)[number];

function colGrid(cols: ColCount): string {
  const map: Record<ColCount, string> = {
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };
  return map[cols];
}

export default function Arsip() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [cols, setCols] = useState<ColCount>(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/articles", { params: { limit: 1000, status: "published" } });
        if (data) {
          const mapped: Post[] = data.map((a: any) => {
            const words = (a.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
            return {
              id: a.id,
              slug: a.slug,
              title: a.title,
              excerpt: a.excerpt || "",
              image: a.cover_image || "/placeholder.svg",
              category: a.category,
              categories: Array.isArray(a.categories) && a.categories.length > 0 ? a.categories : (a.category ? [a.category] : []),
              tags: a.tags || [],
              author: a.author || "Anonim",
              date: new Date(a.published_at || a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
              publishedAt: a.published_at || a.created_at,
              views: a.views,
              readingMinutes: Math.max(1, Math.ceil(words / 200)),
            } as Post & { publishedAt?: string };
          });
          setPosts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch articles for archive", err);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  // Fetch categories
  useEffect(() => {
    api.get("/categories").then(({ data }) => {
      if (Array.isArray(data)) {
        setCategories(data.map((c: any) => c.name || c.category || "").filter(Boolean));
      }
    }).catch(() => {});
  }, []);

  // Also derive unique categories from posts as fallback
  const uniqueCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    const set = new Set<string>();
    posts.forEach((p: any) => {
      const cats: string[] = p.categories || (p.category ? [p.category] : []);
      cats.forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [posts, categories]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p: any) => {
        const cats: string[] = p.categories || (p.category ? [p.category] : []);
        return cats.some((c: string) => c.toLowerCase() === selectedCategory.toLowerCase());
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Date sort
    result.sort((a: any, b: any) => {
      const da = new Date(a.publishedAt || 0).getTime();
      const db = new Date(b.publishedAt || 0).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return result;
  }, [posts, selectedCategory, searchQuery, sortOrder]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="bottom-nav-safe">
        <div className="container mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>

          <div className="mb-10 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight italic">ARSIP ARTIKEL</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Semua Artikel Dan Kajian Yang Telah Diterbitkan</p>
            <p className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full inline-block font-semibold mt-2">
              {searchQuery || selectedCategory !== "all" ? `${filteredPosts.length} dari ${posts.length}` : posts.length} Artikel
            </p>
          </div>

          {/* Filters Row */}
          <div className="max-w-5xl mx-auto mb-8 space-y-3">
            {/* Search Box */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Cari judul atau topik kajian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border bg-background text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm outline-none font-medium"
                />
              </div>
            </div>

            {/* Filter + Layout Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="relative flex-1 min-w-[160px] max-w-[260px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-border/70 bg-background text-xs font-medium text-foreground/80 appearance-none cursor-pointer focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/70 bg-background text-xs font-medium text-foreground/70 hover:border-primary/30 hover:text-primary transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortOrder === "newest" ? "Terbaru" : "Terlama"}
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Column Layout Selector */}
              <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background p-0.5">
                <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground ml-2 mr-0.5" />
                {COL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCols(n)}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-colors ${
                      cols === n
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className={`grid ${colGrid(cols)} gap-4 md:gap-5 py-4`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="italic text-sm">Tidak ada artikel ditemukan.</p>
            </div>
          ) : (
            <div className={`grid ${colGrid(cols)} gap-4 md:gap-5`}>
              {filteredPosts.map((post) => (
                <Link key={post.id} to={`/${post.slug || post.id}`} className="transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <PostCard post={post} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}