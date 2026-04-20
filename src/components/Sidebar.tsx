import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TableOfContents } from "./TableOfContents";

interface Widget {
  id: string;
  title: string;
  type: string;
  content: string;
  image_url: string;
  link_url: string;
}

interface SidebarProps {
  articleContent?: string;
}

export function Sidebar({ articleContent }: SidebarProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    api.get("/widgets", { params: { is_active: "true" } })
      .then(({ data }) => {
        if (data) setWidgets(data);
      })
      .catch(err => console.error("Fetch widgets failed", err));
  }, []);

  return (
    <aside className="space-y-8 sticky top-24 py-8">
      {/* Table of Contents is always first or fixed if content exists */}
      {articleContent && (
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <TableOfContents content={articleContent} />
        </div>
      )}

      {/* Dynamic Widgets */}
      {widgets.map((w) => (
        <div key={w.id} className="bg-card rounded-2xl overflow-hidden border border-border/50 transition-all hover:border-primary/30">
          {w.title && (
            <div className="px-5 py-3 border-b border-border/50 bg-muted/30">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">{w.title}</h3>
            </div>
          )}
          
          <div className="p-1">
            {w.type === "html" && (
               <div 
                 className="p-4 overflow-hidden" 
                 dangerouslySetInnerHTML={{ __html: w.content }} 
               />
            )}
            
            {w.type === "image" && (
              <a href={w.link_url} target="_blank" rel="noopener noreferrer" className="block group">
                <img 
                  src={w.image_url} 
                  alt={w.title} 
                  className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.02]" 
                />
              </a>
            )}
            
            {w.type === "text" && (
               <div className="p-5 text-sm leading-relaxed text-muted-foreground">
                 {w.content}
               </div>
            )}
          </div>
        </div>
      ))}
    </aside>
  );
}
