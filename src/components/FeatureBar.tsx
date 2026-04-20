import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";

interface FeatureItem {
  id: string;
  icon: string;
  label: string;
  link: string | null;
}

export function FeatureBar() {
  const [items, setItems] = useState<FeatureItem[]>([]);

  useEffect(() => {
    api
      .get("/features")
      .then(({ data }) => {
        if (data) {
          // Filter to only active items as API returns all
          setItems((data as FeatureItem[]).filter((f: any) => f.is_active));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch features", err);
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-6 overflow-x-auto">
      <div className="flex items-center gap-8 md:justify-center min-w-max px-4 md:px-0">
        {items.map((f) => {
          const Icon = (Icons as any)[f.icon] || Sparkles;
          const content = (
            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium whitespace-nowrap">{f.label}</span>
            </div>
          );
          return f.link ? (
            <a key={f.id} href={f.link}>{content}</a>
          ) : (
            <div key={f.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
