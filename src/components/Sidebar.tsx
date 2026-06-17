import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Tag, ChevronRight, MessageSquare, Info } from "lucide-react";
import api from "@/lib/api";

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

type Widget = {
  id: string;
  title: string;
  type: string; // html, image, text
  content: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  placement: string; // all, beranda, detail
  sort_order: number;
};

type SiteSettings = {
  show_chatbot?: boolean;
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_button_text?: string;
  newsletter_link?: string;
  about_contact_phone?: string;
};

interface SidebarProps {
  placement?: "beranda" | "detail";
  articleContent?: string; // Optional context from article view
}

const ensureLinkProtocol = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return `https://${trimmed}`;
};

const normalizeWhatsAppLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
};

export function Sidebar({ placement = "detail", articleContent }: SidebarProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [dynamicWidgets, setDynamicWidgets] = useState<Widget[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const articleHeadings = useMemo(() => {
    if (placement !== "detail" || !articleContent) return [];

    const matches = [...articleContent.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)];
    const seen = new Map<string, number>();

    return matches
      .map((match) => {
        const level = Number(match[1]);
        const text = match[2]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) return null;

        const base = text
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "bagian";
        const nextCount = (seen.get(base) || 0) + 1;
        seen.set(base, nextCount);

        return {
          id: nextCount > 1 ? `${base}-${nextCount}` : base,
          text,
          level,
        };
      })
      .filter((item): item is { id: string; text: string; level: number } => Boolean(item))
      .slice(0, 10);
  }, [articleContent, placement]);

  useEffect(() => {
    if (placement !== "detail" || articleHeadings.length === 0) {
      setActiveHeadingId("");
      return;
    }

    const headings = articleHeadings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) return;

    const updateActiveHeading = () => {
      const current = headings.findLast((heading) => heading.getBoundingClientRect().top <= 140) || headings[0];
      if (current?.id) setActiveHeadingId(current.id);
    };

    updateActiveHeading();

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries[0]?.target instanceof HTMLElement) {
          setActiveHeadingId(visibleEntries[0].target.id);
          return;
        }

        updateActiveHeading();
      },
      {
        rootMargin: "-110px 0px -55% 0px",
        threshold: [0, 0.2, 0.6, 1],
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    window.addEventListener("scroll", updateActiveHeading, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveHeading);
    };
  }, [articleHeadings, placement]);

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [articlesRes, categoriesRes, widgetsRes, settingsRes] = await Promise.all([
          api.get("/articles", { params: { limit: 5, status: "published" } }),
          api.get("/categories"),
          api.get("/widgets?is_active=true"),
          api.get("/settings")
        ]);

        if (Array.isArray(articlesRes.data)) {
          setArticles(articlesRes.data);
        } else {
          setArticles([]);
        }
        if (Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data.filter((c: any) => c.article_count > 0).slice(0, 8));
        }
        if (Array.isArray(widgetsRes.data)) {
          const showChatbot = settingsRes?.data?.show_chatbot !== false;
          const chatbotWidgetRegex = /(chatbot|livechat|tawk\.to|tawkto|crisp|intercom)/i;

          // Filter widgets that match the placement
          const filtered = widgetsRes.data.filter((w: Widget) => {
            if (!(w.placement === "all" || w.placement === placement)) return false;
            if (showChatbot) return true;

            const haystack = `${w.title || ""}\n${w.content || ""}\n${w.link_url || ""}`;
            return !chatbotWidgetRegex.test(haystack);
          });
          setDynamicWidgets(filtered);
        }
        setSiteSettings(settingsRes?.data || {});
      } catch (err) {
        console.error("Failed to load sidebar content", err);
      } finally {
        setLoading(false);
      }
    };

    loadSidebarData();
  }, [placement]);

  const ctaTitle = siteSettings.newsletter_title?.trim() || "Dapatkan Update Via WhatsApp";
  const ctaDescription =
    siteSettings.newsletter_description?.trim() ||
    "Jangan lewatkan materi kajian terbaru langsung di ponsel Anda.";
  const ctaButtonText = siteSettings.newsletter_button_text?.trim() || "Gabung Sekarang";
  const ctaHref =
    ensureLinkProtocol(siteSettings.newsletter_link || "") ||
    normalizeWhatsAppLink(siteSettings.about_contact_phone || "");
  const isExternalCta = !!ctaHref && !ctaHref.startsWith("/") && !ctaHref.startsWith("#");

  return (
    <aside className="space-y-8 w-full select-none">
      {placement === "detail" && articleHeadings.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Navigasi Artikel</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Poin Penting</p>
            </div>
          </div>
          <div className="space-y-2">
            {articleHeadings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`group flex items-start gap-3 rounded-2xl px-3 py-2 transition ${heading.level === 3 ? "ml-4" : ""} ${activeHeadingId === heading.id ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"}`}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition ${activeHeadingId === heading.id ? "bg-primary scale-125" : "bg-primary/50 group-hover:bg-primary"}`} />
                <span className={`text-[13px] font-semibold leading-snug transition ${activeHeadingId === heading.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                  {heading.text}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Latest Articles Widget */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Artikel Terbaru</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Update Terkini</p>
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada artikel terbaru.
            </div>
          ) : articles.map((a, i) => (
            <Link
              key={a.id}
              to={`/${a.slug}`}
              className="group flex gap-4 items-start p-2 -mx-2 rounded-2xl hover:bg-muted/50 transition-all duration-300"
            >
              <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="text-[11px] font-black">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {a.title}
                </p>
                {a.category && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{a.category}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link to="/arsip" className="mt-6 flex items-center justify-center gap-2 py-3 w-full rounded-xl bg-muted/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Categories Widget */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Kategori</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Topik Kajian</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/kategori/${c.slug}`}
              className="text-[11px] font-bold px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white border border-transparent transition-all shadow-sm active:scale-95"
            >
              {c.name} <span className="opacity-40 ml-1 text-[9px]">({c.article_count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Dynamic Database Widgets */}
      {dynamicWidgets.map(w => {
        if (w.type === "image" && w.image_url) {
          return (
            <div key={w.id} className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/[0.02]">
              <a 
                href={w.link_url || "#"} 
                target={w.link_url?.startsWith("http") ? "_blank" : "_self"} 
                rel="noopener noreferrer" 
                className="block relative overflow-hidden"
              >
                <img 
                  src={w.image_url} 
                  alt={w.title} 
                  className="w-full h-auto max-h-[300px] object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-primary px-3 py-1 rounded-lg">Kunjungi Tautan</span>
                </div>
              </a>
              {w.title && (
                <div className="p-4 border-t border-border/40">
                  <h4 className="font-bold text-[13px] text-foreground leading-snug line-clamp-2">{w.title}</h4>
                </div>
              )}
            </div>
          );
        }

        if (w.type === "text") {
          return (
            <div key={w.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{w.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Informasi Kajian</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">{w.content}</p>
            </div>
          );
        }

        if (w.type === "html") {
          return (
            <div key={w.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-[24px] p-6 shadow-sm ring-1 ring-black/[0.02] hover:shadow-md transition-shadow">
              {w.title && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{w.title}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Kanal Informasi</p>
                  </div>
                </div>
              )}
              <div 
                className="prose prose-sm max-w-none text-muted-foreground prose-a:text-primary prose-a:font-semibold prose-img:rounded-xl prose-img:max-w-full prose-img:h-auto [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-border/50 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto break-words"
                dangerouslySetInnerHTML={{ __html: w.content }}
              />
            </div>
          );
        }

        return null;
      })}

      {/* Default Newsletter / CTA Widget */}
      <div className="relative overflow-hidden bg-primary rounded-[24px] p-6 text-primary-foreground shadow-lg shadow-primary/20">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
         <div className="relative z-10">
            <h4 className="font-black text-lg leading-tight mb-2">{ctaTitle}</h4>
            <p className="text-white/70 text-[11px] leading-relaxed mb-4">{ctaDescription}</p>
            {ctaHref ? (
              <a
                href={ctaHref}
                target={isExternalCta ? "_blank" : undefined}
                rel={isExternalCta ? "noreferrer" : undefined}
                className="flex w-full items-center justify-center py-2.5 bg-white text-primary rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                {ctaButtonText}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-xl bg-white/75 text-primary/70 text-[11px] font-black uppercase tracking-widest cursor-not-allowed"
                title="Tambahkan Link Tujuan pada pengaturan situs agar tombol bisa diklik"
              >
                {ctaButtonText}
              </button>
            )}
         </div>
      </div>
    </aside>
  );
}
