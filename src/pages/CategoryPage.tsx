import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { PostCard } from "@/components/PostCard";
import api from "@/lib/api";
import type { Post } from "@/data/mockData";
import { ArrowLeft } from "lucide-react";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
   const [posts, setPosts] = useState<Post[]>([]);
   const [loading, setLoading] = useState(true);
   const [displayTitle, setDisplayTitle] = useState(slug?.replace(/-/g, " ") || "");
   const categoryName = slug?.replace(/-/g, " ") || "";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // 1. Fetch categories to find the real name for this slug
        const { data: cats } = await api.get("/categories");
        const currentCat = cats?.find((c: any) => c.slug === slug);
        const realName = currentCat ? currentCat.name : categoryName;
        setDisplayTitle(realName);

        // 2. Fetch articles and filter by real name
        const { data: articles } = await api.get("/articles", { params: { limit: 1000, status: "published" } });
        
        if (articles) {
          const filtered = articles.filter((a: any) => 
            a.category.toLowerCase() === realName.toLowerCase()
          );
          
          setPosts(filtered.map((a: any) => {
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
        console.error("Fetch API error", err);
      }
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug, categoryName]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="bottom-nav-safe">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <h1 className="text-2xl font-bold text-foreground capitalize">#{displayTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{posts.length} artikel ditemukan</p>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Memuat artikel...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Belum ada artikel di kategori ini.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {posts.map((post) => (
                <Link key={post.id} to={`/artikel/${post.slug || post.id}`}>
                  <PostCard post={post} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default CategoryPage;
