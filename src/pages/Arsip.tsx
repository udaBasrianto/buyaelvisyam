import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import api from "@/lib/api";
import type { Post } from "@/data/mockData";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function Arsip() {
  const [posts, setPosts] = useState<Post[]>([]);
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
            <p className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full inline-block font-semibold mt-2">{posts.length} Artikel</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic">Belum ada artikel yang diterbitkan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => (
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
