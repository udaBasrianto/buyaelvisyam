import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Calendar, User, Share2, BookmarkPlus, Bookmark, AArrowDown, AArrowUp, RotateCcw, Clock, MessageCircle, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { PostCard } from "@/components/PostCard";
import { CommentSection } from "@/components/CommentSection";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Sidebar } from "@/components/Sidebar";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { LeafletMap } from "@/components/LeafletMap";
import { ArticleQuiz } from "@/components/ArticleQuiz";
import { latestPosts, type Post } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070&auto=format&fit=crop";

interface DbArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  tags: string[] | null;
  status: string;
  views: number;
  created_at: string;
  author_id: string;
  author: string;
  comment_count: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState<DbArticle | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<(DbArticle | Post)[]>([]);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("article-font-size") : null;
    return saved ? Number(saved) : 18;
  });

  const MIN_FONT = 14;
  const MAX_FONT = 26;
  const DEFAULT_FONT = 18;

  useEffect(() => {
    if (user && article) checkBookmarkStatus();
  }, [article, user]);

  const checkBookmarkStatus = async () => {
    if (!article) return;
    try {
      const { data } = await api.get(`/koleksi/check/${article.id}`);
      setIsBookmarked(data.is_bookmarked);
    } catch (err) {}
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({ title: "Login diperlukan", description: "Silakan login untuk menyimpan kajian." });
      return;
    }
    try {
      const { data } = await api.post(`/koleksi/toggle/${article?.id}`);
      setIsBookmarked(data.status === "added");
      toast({ title: data.message });
    } catch (err) {
      toast({ title: "Gagal memproses bookmark", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.title || "BlogUstad";
    const text = article?.excerpt || `Baca artikel "${title}" di BlogUstad.`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        toast({ title: "Berhasil dibagikan!" });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
           navigator.clipboard.writeText(url);
           toast({ title: "Tautan disalin ke clipboard!" });
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Tautan disalin ke clipboard!" });
    }
  };

  useEffect(() => {
    localStorage.setItem("article-font-size", String(fontSize));
  }, [fontSize]);

  const decreaseFont = () => setFontSize((s) => Math.max(MIN_FONT, s - 2));
  const increaseFont = () => setFontSize((s) => Math.min(MAX_FONT, s + 2));
  const resetFont = () => setFontSize(DEFAULT_FONT);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/articles/${id}`);
        if (data) {
          setArticle(data as DbArticle);
          
          // Related articles
          const { data: relData } = await api.get("/articles", { params: { limit: 3 } });
          setRelated((relData || []).filter((a: any) => a.id !== data.id));
        }
      } catch (err) {
        console.error("Fetch article failed", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Memuat artikel...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Artikel tidak ditemukan</p>
          <Link to="/" className="text-primary underline">Kembali ke beranda</Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const coverImage = article.cover_image || DEFAULT_POST_IMAGE;
  const tags = article.tags || [];

  const plainText = (article.content || "").replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
      <SEO 
        title={article.title} 
        description={article.excerpt || plainText.substring(0, 160)} 
        image={article.cover_image || undefined} 
        article 
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": article.title,
          "image": [coverImage],
          "datePublished": article.created_at,
          "author": [{
            "@type": "Person",
            "name": article.author || "Ustadz",
            "url": window.location.origin
          }]
        })}
      </script>
      <ReadingProgress />
      <Navbar />
      <main className="bottom-nav-safe pb-20">
        <div className="container mx-auto px-4 mt-6">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
            <img 
              src={coverImage} 
              alt={article.title} 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
              }}
            />
            <div className="absolute inset-0 hero-overlay" />
            <div className="absolute top-4 left-4">
              <Link to="/" className="inline-flex items-center gap-1.5 bg-card/30 backdrop-blur-sm hover:bg-card/50 text-primary-foreground rounded-full px-3 py-1.5 text-sm transition">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
              <div className="flex flex-wrap gap-2 mb-4">
                <Link 
                  to={`/kategori/${article.category.toLowerCase().replace(/\s+/g, "-")}`}
                  className="tag-badge islamic-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                >
                  #{article.category}
                </Link>
                {tags.map((tag) => (
                  <span key={tag} className="tag-badge gold-gradient text-primary-foreground text-[10px] font-bold uppercase tracking-wider">#{tag}</span>
                ))}
              </div>
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight max-w-3xl drop-shadow-sm">
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary" />{article.author || "Ustadz"}</span>
              <Link 
                to={`/kategori/${article.category.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
                title="Lihat kategori ini"
              >
                <div className="h-4 w-4 flex items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold">#</span>
                </div>
                {article.category}
              </Link>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" />{formattedDate}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-primary" />{article.views} views</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />{readingMinutes} menit baca</span>
              {article.location_name && (
                <a
                  href="#lokasi-kajian"
                  className="flex items-center gap-1.5 text-primary hover:underline transition-colors font-medium"
                  title="Lihat lokasi kajian"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  {article.location_name}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-1 rounded-full border border-border bg-card px-1 py-0.5">
                <button
                  onClick={decreaseFont}
                  disabled={fontSize <= MIN_FONT}
                  className="p-1.5 rounded-full hover:bg-accent transition text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AArrowDown className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-foreground/70 w-7 text-center tabular-nums">{fontSize}</span>
                <button
                  onClick={increaseFont}
                  disabled={fontSize >= MAX_FONT}
                  className="p-1.5 rounded-full hover:bg-accent transition text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AArrowUp className="h-4 w-4" />
                </button>
                <button onClick={resetFont} className="p-1.5 rounded-full hover:bg-accent transition text-muted-foreground hover:text-primary">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-accent transition text-muted-foreground hover:text-primary" title="Bagikan Artikel">
                <Share2 className="h-4 w-4" />
              </button>
              <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBookmark}
              className={`rounded-xl px-4 font-bold uppercase text-[10px] tracking-widest gap-2 shadow-sm transition-all ${isBookmarked ? 'bg-primary text-white border-primary shadow-primary/20' : 'hover:bg-primary/5 hover:text-primary border-border/50'}`}
            >
                <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-current' : ''}`} /> 
                {isBookmarked ? 'Tersimpan' : 'Simpan'}
             </Button>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8 mx-auto mt-6">
            <div className="min-w-0">
              <article
                style={{ fontSize: `${fontSize}px` }}
                className="prose prose-lg max-w-none mx-auto lg:mx-0 py-8 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Location Map Section */}
              {article.location_name && (article.latitude !== 0 || article.longitude !== 0) && (
                <div id="lokasi-kajian" className="max-w-3xl mx-auto lg:mx-0 my-10 p-6 rounded-[2rem] bg-card border border-border/50 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                         <h3 className="font-bold text-foreground">Lokasi Kajian</h3>
                         <p className="text-sm text-muted-foreground">{article.location_name}</p>
                      </div>
                   </div>
                   <LeafletMap 
                      lat={article.latitude} 
                      lng={article.longitude} 
                      locationName={article.location_name} 
                   />
                   <div className="mt-4 flex justify-end">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${article.latitude},${article.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                      >
                        Buka di Google Maps <ArrowUpRight className="h-3 w-3" />
                      </a>
                   </div>
                </div>
              )}

              {/* Quiz Section */}
              <div className="max-w-3xl mx-auto lg:mx-0">
                <ArticleQuiz articleId={article.id} />
              </div>

              <div className="max-w-3xl mx-auto lg:mx-0 border-t border-border pt-8 pb-4">
                <CommentSection articleId={article.id} />
              </div>
            </div>

            <div className="hidden lg:block">
              <Sidebar articleContent={article.content} />
            </div>
          </div>

          <div className="border-t border-border py-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Artikel Terkait</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((p: any) => (
                <Link key={p.id} to={`/artikel/${p.slug || p.id}`}>
                  <PostCard post={toPostCard(p)} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function toPostCard(p: any): Post {
  return {
    id: p.id,
    slug: p.slug || "",
    title: p.title,
    excerpt: p.excerpt || "",
    image: p.cover_image || DEFAULT_POST_IMAGE,
    category: p.category || "Umum",
    tags: p.tags || [],
    author: p.author || "Ustadz",
    date: new Date(p.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric'}),
    views: p.views || 0,
    commentCount: p.comment_count || 0,
  };
}
