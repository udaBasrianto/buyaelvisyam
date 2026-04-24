import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { 
  ArrowRight, Box, Hash, ShieldCheck, Book, History, 
  Scroll, Library, Users, Moon, Heart, Sparkles 
} from "lucide-react";

const CATEGORY_STYLES: Record<string, { icon: any, color: string }> = {
  akidah: { icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600" },
  iman: { icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600" },
  fiqih: { icon: Book, color: "bg-emerald-500/10 text-emerald-600" },
  hukum: { icon: Book, color: "bg-emerald-500/10 text-emerald-600" },
  sirah: { icon: History, color: "bg-amber-500/10 text-amber-600" },
  sejarah: { icon: History, color: "bg-amber-500/10 text-amber-600" },
  hadits: { icon: Scroll, color: "bg-rose-500/10 text-rose-600" },
  tafsir: { icon: Library, color: "bg-indigo-500/10 text-indigo-600" },
  quran: { icon: Library, color: "bg-indigo-500/10 text-indigo-600" },
  keluarga: { icon: Users, color: "bg-teal-500/10 text-teal-600" },
  anak: { icon: Users, color: "bg-teal-500/10 text-teal-600" },
  ramadhan: { icon: Moon, color: "bg-orange-500/10 text-orange-600" },
  puasa: { icon: Moon, color: "bg-orange-500/10 text-orange-600" },
  doa: { icon: Heart, color: "bg-pink-500/10 text-pink-600" },
  dzikir: { icon: Heart, color: "bg-pink-500/10 text-pink-600" },
  akhlak: { icon: Sparkles, color: "bg-purple-500/10 text-purple-600" },
  adab: { icon: Sparkles, color: "bg-purple-500/10 text-purple-600" },
};

const PALETTE = [
  "bg-blue-500/10 text-blue-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-rose-500/10 text-rose-600",
  "bg-indigo-500/10 text-indigo-600",
  "bg-teal-500/10 text-teal-600",
  "bg-purple-500/10 text-purple-600",
];

function getCategoryStyle(name: string, index: number) {
  const safeName = (name || "").toLowerCase();
  for (const key in CATEGORY_STYLES) {
    if (safeName.includes(key)) return CATEGORY_STYLES[key];
  }
  return { 
    icon: Box, 
    color: PALETTE[index % PALETTE.length] 
  };
}

  interface Category {
  name: string;
  slug: string;
  postCount: number;
  commentCount: number;
  color: string;
}

export function CategorySectionV2() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Standard left click
    setIsDragging(true);
    if (scrollRef.current) {
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeftState(scrollRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [{ data: cats }, { data: articles }] = await Promise.all([
          api.get("/categories"),
          api.get("/articles", { params: { limit: 1000, status: "published" } }),
        ]);

        if (cats && cats.length > 0) {
          const counts: Record<string, number> = {};
          const commentCounts: Record<string, number> = {};
          
          (articles || []).forEach((a: any) => {
            counts[a.category] = (counts[a.category] || 0) + 1;
            commentCounts[a.category] = (commentCounts[a.category] || 0) + (a.comment_count || 0);
          });
          
          setCategories(
            cats.filter((c: any) => c.is_active).map((c: any) => ({
              name: c.name,
              slug: c.slug,
              color: c.color,
              postCount: counts[c.name] || 0,
              commentCount: commentCounts[c.name] || 0,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch category section", err)
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const { settings } = useSiteSettings();

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
            {settings.categories_title || "Kategori Terpopuler"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 text-center md:text-left">
            {settings.categories_subtitle || "Temukan topik kajian favorit Anda dengan mudah"}
          </p>
        </div>
        <Link to="/categories" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
          LIHAT SEMUA <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-4 px-4 scroll-smooth transition-all duration-300 ${isDragging ? 'cursor-grabbing scale-[0.995]' : 'cursor-grab'}`}
      >
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 w-44 md:w-56 shrink-0 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : (
          categories
            .filter((cat) => cat.postCount > 0) // Only show categories with articles
            .map((cat, i) => {
              const style = getCategoryStyle(cat.name, i);
            const Icon = style.icon;
            // Use style color if DB color is default/missing/primary
            const isDefaultColor = !cat.color || cat.color.includes("primary");
            const cardColor = isDefaultColor ? style.color : cat.color;

            return (
              <Link
                key={cat.slug}
                to={`/kategori/${cat.slug}`}
                className="group relative h-32 w-44 md:w-56 shrink-0 rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                {/* Pattern background - same as main icon */}
                <div className="absolute top-2 right-2 opacity-5 scale-150 rotate-12 group-hover:scale-[2] transition-transform duration-500">
                  <Icon className="h-12 w-12" />
                </div>

                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${cardColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">
                      {cat.postCount} Post • {cat.commentCount} Komentar
                    </p>
                  </div>
                </div>
                
                <div className={`absolute right-0 bottom-0 w-16 h-16 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${cardColor}`} />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
