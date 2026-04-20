import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import api from "@/lib/api";

interface Category {
  name: string;
  slug: string;
  postCount: number;
  color: string;
}

export function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [{ data: cats }, { data: articles }] = await Promise.all([
          api.get("/categories"),
          api.get("/articles", { params: { limit: 1000, status: "published" } }),
        ]);

        if (cats && cats.length > 0) {
          const counts: Record<string, number> = {};
          (articles || []).forEach((a: any) => {
            counts[a.category] = (counts[a.category] || 0) + 1;
          });
          setCategories(
            cats.filter((c: any) => c.is_active).map((c: any) => ({
              name: c.name,
              slug: c.slug,
              color: c.color,
              postCount: counts[c.name] || 0,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch category section", err);
      }
    };
    fetch();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-10">
      <div className="flex items-start gap-6 flex-col md:flex-row">
        <div className="md:w-1/4 shrink-0">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Jelajahi</p>
          <h2 className="text-2xl font-bold text-foreground mt-1">Kategori</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Temukan artikel islami sesuai topik yang Anda minati
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/kategori/${cat.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border hover:border-primary/30 hover:card-shadow-hover transition-all duration-300 group"
            >
              <div className={`p-2 rounded-lg ${cat.color}`}>
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  #{cat.name}
                </p>
                <p className="text-xs text-muted-foreground">{cat.postCount} Artikel</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
