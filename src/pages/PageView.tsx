import { useEffect, useState, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ChevronRight, Home, Clock, ArrowUp, BookOpen, Tag, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  template_type: string;
  hero_image: string;
  updated_at: string;
};

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

/* ───────────────────────────────────────────── */
/*  Animated Section Wrapper                     */
/* ───────────────────────────────────────────── */
function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────── */
/*  Sidebar Widgets                              */
/* ───────────────────────────────────────────── */
function SidebarWidgets() {
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
    <aside className="space-y-6">
      {/* Latest Articles */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Artikel Terbaru</h3>
        </div>
        <div className="space-y-3">
          {articles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Memuat...</p>
          ) : articles.map((a, i) => (
            <Link
              key={a.id}
              to={`/${a.slug}`}
              className="group flex gap-3 items-start p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {a.title}
                </p>
                {a.category && (
                  <span className="text-[10px] text-muted-foreground mt-1 block">{a.category}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Tag className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Kategori</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/kategori/${c.slug}`}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
            >
              {c.name} <span className="opacity-50">({c.article_count})</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ───────────────────────────────────────────── */
/*  Loading Skeleton                             */
/* ───────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-[35vh] bg-muted animate-pulse" />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full mt-6" />
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TEMPLATE: Standard                            */
/* ═══════════════════════════════════════════════ */
function StandardTemplate({ page }: { page: PageRow }) {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <>
      {/* Subtle decorative header */}
      <div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/3 border-b border-border/30">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='currentColor' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-3xl relative">
          <AnimatedSection>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-3 w-3" /> Beranda
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{page.title}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-[1.1]">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {page.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Diperbarui {formatDate(page.updated_at)}</span>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-10 md:py-16 max-w-3xl">
        <AnimatedSection delay={0.15}>
          <article
            className="prose prose-lg prose-neutral dark:prose-invert max-w-none 
              text-foreground/90 leading-relaxed
              prose-headings:font-black prose-headings:tracking-tight
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl prose-img:shadow-lg
              prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </AnimatedSection>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TEMPLATE: Landing Page                        */
/* ═══════════════════════════════════════════════ */
function LandingTemplate({ page }: { page: PageRow }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Full-width Hero */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {page.hero_image ? (
            <img
              src={page.hero_image}
              alt={page.title}
              className="w-full h-full object-cover"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-blue-600" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <BookOpen className="h-3 w-3" />
              Halaman
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] max-w-4xl mx-auto">
              {page.title}
            </h1>

            {page.excerpt && (
              <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
                {page.excerpt}
              </p>
            )}
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0,40 C360,80 720,0 1440,40 L1440,80 L0,80 Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Floating content card */}
      <main className="container mx-auto px-4 -mt-6 pb-16 md:pb-24 max-w-4xl relative z-10">
        <AnimatedSection>
          <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-black/5 p-6 md:p-10 lg:p-14">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 pb-6 border-b border-border/50">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-3 w-3" /> Beranda
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{page.title}</span>
            </nav>

            <article
              className="prose prose-lg prose-neutral dark:prose-invert max-w-none
                text-foreground/90 leading-relaxed
                prose-headings:font-black prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-lg
                prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
                prose-hr:border-border/50"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </AnimatedSection>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TEMPLATE: With Sidebar                        */
/* ═══════════════════════════════════════════════ */
function SidebarTemplate({ page }: { page: PageRow }) {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <>
      {/* Mini Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {page.hero_image ? (
            <>
              <img src={page.hero_image} alt={page.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/8 via-background to-blue-500/5" />
          )}
        </div>
        <div className="container mx-auto px-4 py-14 md:py-20 relative">
          <AnimatedSection>
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-3 w-3" /> Beranda
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{page.title}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-[1.1]">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {page.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Diperbarui {formatDate(page.updated_at)}</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Content + Sidebar */}
      <main className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Main Content */}
          <AnimatedSection>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-10 shadow-sm">
              <article
                className="prose prose-lg prose-neutral dark:prose-invert max-w-none
                  text-foreground/90 leading-relaxed
                  prose-headings:font-black prose-headings:tracking-tight
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:shadow-lg
                  prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </AnimatedSection>

          {/* Sidebar */}
          <AnimatedSection delay={0.2}>
            <div className="lg:sticky lg:top-24">
              <SidebarWidgets />
            </div>
          </AnimatedSection>
        </div>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*  MAIN COMPONENT                                */
/* ═══════════════════════════════════════════════ */
export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSiteSettings();
  const [page, setPage] = useState<PageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/pages/${slug}`);
        if (!data || data.status !== "published") {
          setNotFound(true);
        } else {
          setPage(data as PageRow);
        }
      } catch (error) {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (page) document.title = `${page.title} — ${settings.site_name || "BlogUstad"}`;
  }, [page, settings.site_name]);

  if (notFound) return <Navigate to="/404" replace />;
  if (loading || !page) return <PageSkeleton />;

  const template = page.template_type || "standard";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${page.title} — ${settings.site_name || "BlogUstad"}`} description={page.excerpt || ""} />
      <Navbar />

      <div className="bottom-nav-safe">
        {template === "landing" && <LandingTemplate page={page} />}
        {template === "sidebar" && <SidebarTemplate page={page} />}
        {template === "standard" && <StandardTemplate page={page} />}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
