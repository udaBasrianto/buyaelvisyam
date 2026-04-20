import { useEffect, useState } from "react";
import api from "@/lib/api";

export type NavPage = {
  id: string;
  title: string;
  slug: string;
  nav_order: number;
};

export function useNavPages() {
  const [pages, setPages] = useState<NavPage[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // We'll need to implement this endpoint in Fiber if needed, 
        // for now let's assume /pages exists or return empty
        const { data } = await api.get("/pages", { params: { show_in_nav: true, status: 'published' } });
        if (data) setPages(data);
      } catch (err) {
        console.error("Fetch nav pages failed", err);
      }
    };

    load();
  }, []);

  return pages;
}
