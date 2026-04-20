import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  /** HTML content string – TOC will be re-built whenever this changes */
  content: string;
  /** CSS selector for the rendered article container */
  containerSelector?: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

export function TableOfContents({ content, containerSelector = "article.prose" }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Build TOC + inject ids onto headings inside rendered article
  useEffect(() => {
    if (!content) return;
    // Wait for DOM update after content renders
    const raf = requestAnimationFrame(() => {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const headings = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
      const used = new Set<string>();
      const next: TocItem[] = headings.map((h) => {
        const text = h.textContent || "";
        const id = h.id || slugify(text);
        let unique = id;
        let i = 2;
        while (used.has(unique)) {
          unique = `${id}-${i++}`;
        }
        used.add(unique);
        h.id = unique;
        // offset for sticky header when jumping
        h.style.scrollMarginTop = "96px";
        return {
          id: unique,
          text,
          level: h.tagName === "H2" ? 2 : 3,
        };
      });
      setItems(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [content, containerSelector]);

  // Track active heading using IntersectionObserver
  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  if (items.length < 2) return null;

  return (
    <nav aria-label="Daftar isi" className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <List className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Daftar Isi</h3>
      </div>
      <ul className="space-y-1 text-sm max-h-[60vh] overflow-y-auto pr-1">
        {items.map((it) => (
          <li key={it.id} className={cn(it.level === 3 && "ml-4")}>
            <a
              href={`#${it.id}`}
              onClick={(e) => handleClick(e, it.id)}
              className={cn(
                "block py-1.5 px-2 rounded-md leading-snug border-l-2 transition-colors",
                activeId === it.id
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
