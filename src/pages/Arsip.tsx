import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import api from "@/lib/api";
import type { Post } from "@/data/mockData";
import { ArrowLeft, BookOpen, Search } from "lucide-react";

export default function Arsip() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/articles", { params: { limit: 1000, status: "published" } });
        if (data) {
          setPosts(data.map((a: any) => {
            const words = (a.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
            return {
              id: a.id,
              slug: a.slug,
              title: a.title,
              excerpt: a.excerpt || "",
              image: a.cover_image || "/placeholder.svg",
              category: a.category,
              tags: a.tags || [],
              author: a.author || "Anonim",
              date: new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
              views: a.views,
              readingMinutes: Math.max(1, Math.ceil(words / 200)),
            };
          }));
        }
      } catch (err) {
        console.error("Failed to fetch articles for archive", err);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.category && post.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              {searchQuery ? `${filteredPosts.length} dari ${posts.length}` : posts.length} Artikel
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto mb-12 relative group">
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="italic text-sm">Tidak ada artikel ditemukan untuk "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
