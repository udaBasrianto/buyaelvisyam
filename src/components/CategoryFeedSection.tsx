import { Link } from "react-router-dom";
import { Eye, Clock, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23e5e7eb'/%3E%3C/svg%3E";

export interface HomepageCategorySection {
  id: string;
  category_name: string;
  category_slug: string;
  custom_title: string;
  article_count: number;
  sort_order: number;
  is_active: boolean;
  layout: "grid" | "list" | "featured";
}

export interface SectionArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  category: string;
  categories: string[];
  author: string;
  published_at: string;
  created_at: string;
  views: number;
  reading_minutes?: number;
}

interface CategoryFeedSectionProps {
  section: HomepageCategorySection;
  articles: SectionArticle[];
}

function readingMins(content = "") {
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Layout: Grid (2–4 col cards) ────────────────────────────────────────────
function GridLayout({ articles, defaultImage }: { articles: SectionArticle[]; defaultImage: string }) {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Featured first article — takes 2 columns on lg */}
      <Link
        to={`/artikel/${featured.slug || featured.id}`}
        className="group relative rounded-2xl overflow-hidden sm:col-span-2 lg:col-span-2"
      >
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={featured.cover_image || defaultImage}
            alt={featured.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest mb-2">
            {featured.category}
          </span>
          <h3 className="text-white text-[17px] font-bold leading-snug line-clamp-2 group-hover:text-primary/90 transition-colors">
            {featured.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-white/60 text-[11px]">
            <span>{featured.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {featured.views}</span>
            <span>•</span>
            <span>{formatDate(featured.published_at || featured.created_at)}</span>
          </div>
        </div>
      </Link>

      {/* Remaining articles */}
      {rest.map((article) => (
        <Link
          key={article.id}
          to={`/artikel/${article.slug || article.id}`}
          className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all hover:shadow-md flex flex-col"
        >
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={article.cover_image || defaultImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
            />
          </div>
          <div className="p-4 flex flex-col flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">
              {article.category}
            </span>
            <h3 className="text-[14px] font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors flex-1">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
              <span>{article.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingMins()} mnt</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Layout: List (horizontal cards, magazine sidebar style) ─────────────────
function ListLayout({ articles, defaultImage }: { articles: SectionArticle[]; defaultImage: string }) {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[2fr_1fr]">
      {/* Big featured card */}
      <Link
        to={`/artikel/${featured.slug || featured.id}`}
        className="group relative rounded-2xl overflow-hidden"
      >
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={featured.cover_image || defaultImage}
            alt={featured.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest mb-2">
            {featured.category}
          </span>
          <h3 className="text-white text-[17px] font-bold leading-snug line-clamp-2">
            {featured.title}
          </h3>
          <p className="text-white/60 text-[12px] mt-1.5 line-clamp-2">{featured.excerpt}</p>
          <div className="flex items-center gap-3 mt-2 text-white/50 text-[11px]">
            <span>{featured.author}</span>
            <span>•</span>
            <span>{formatDate(featured.published_at || featured.created_at)}</span>
          </div>
        </div>
      </Link>

      {/* Sidebar list */}
      <div className="flex flex-col gap-3">
        {rest.map((article, i) => (
          <Link
            key={article.id}
            to={`/artikel/${article.slug || article.id}`}
            className="group flex gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
              <img
                src={article.cover_image || defaultImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-0.5">
                {article.category}
              </span>
              <h4 className="text-[13px] font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              <span className="text-[10px] text-muted-foreground mt-1">
                {formatDate(article.published_at || article.created_at)}
              </span>
            </div>
            <span className="shrink-0 self-center text-[11px] font-bold text-muted-foreground/40 tabular-nums w-5 text-right">
              {String(i + 2).padStart(2, "0")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Layout: Featured (1 big + row of small) ─────────────────────────────────
function FeaturedLayout({ articles, defaultImage }: { articles: SectionArticle[]; defaultImage: string }) {
  if (articles.length === 0) return null;

  const [main, ...others] = articles;

  return (
    <div className="space-y-4">
      {/* Main hero */}
      <Link
        to={`/artikel/${main.slug || main.id}`}
        className="group relative block rounded-2xl overflow-hidden"
      >
        <div className="aspect-[21/9] overflow-hidden bg-muted">
          <img
            src={main.cover_image || defaultImage}
            alt={main.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest mb-3">
            {main.category}
          </span>
          <h3 className="text-white text-[20px] md:text-[24px] font-bold leading-snug line-clamp-2 max-w-3xl group-hover:text-primary/90 transition-colors">
            {main.title}
          </h3>
          <p className="text-white/60 text-[13px] mt-2 line-clamp-2 max-w-2xl hidden md:block">
            {main.excerpt}
          </p>
          <div className="flex items-center gap-3 mt-3 text-white/50 text-[12px]">
            <span>By {main.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {main.views}</span>
            <span>•</span>
            <span>{formatDate(main.published_at || main.created_at)}</span>
          </div>
        </div>
      </Link>

      {/* Secondary row */}
      {others.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {others.map((article) => (
            <Link
              key={article.id}
              to={`/artikel/${article.slug || article.id}`}
              className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={article.cover_image || defaultImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
                />
              </div>
              <div className="p-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-1">
                  {article.category}
                </span>
                <h4 className="text-[12px] font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function CategoryFeedSection({ section, articles }: CategoryFeedSectionProps) {
  const { settings } = useSiteSettings();
  const defaultImage = settings?.default_article_image || DEFAULT_IMAGE;
  const displayTitle = section.custom_title || section.category_name;

  if (!articles || articles.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 bg-primary rounded-full" />
          <h2 className="text-[18px] font-black uppercase tracking-widest text-foreground">
            {displayTitle}
          </h2>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            {articles.length} artikel
          </span>
        </div>
        <Link
          to={`/kategori/${section.category_slug}`}
          className="flex items-center gap-1.5 text-[12px] font-bold text-primary hover:text-primary/80 transition-colors group"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Layout */}
      {section.layout === "list" ? (
        <ListLayout articles={articles} defaultImage={defaultImage} />
      ) : section.layout === "featured" ? (
        <FeaturedLayout articles={articles} defaultImage={defaultImage} />
      ) : (
        <GridLayout articles={articles} defaultImage={defaultImage} />
      )}
    </section>
  );
}
