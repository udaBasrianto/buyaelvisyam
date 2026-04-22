import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  updated_at: string;
};

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
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
    if (page) document.title = `${page.title} — BlogUstad`;
  }, [page]);

  if (notFound) return <Navigate to="/404" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {loading || !page ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <article>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{page.title}</h1>
            {page.excerpt && (
              <p className="text-lg text-muted-foreground mb-6">{page.excerpt}</p>
            )}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
