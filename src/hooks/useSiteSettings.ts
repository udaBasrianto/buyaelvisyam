import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  logo_url: string | null;
  footer_text: string;
  homepage_version: string;
  scroll_to_top_version: string;
  admin_slug?: string;
  hero_title?: string;
  recent_title?: string;
}

const DEFAULTS: SiteSettings = {
  id: "",
  site_name: "BlogUstad",
  tagline: "Berbagi ilmu agama Islam untuk umat",
  logo_url: null,
  footer_text: "Berbagi ilmu agama Islam untuk umat — © 2026",
  homepage_version: "v1",
  scroll_to_top_version: "animated",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/settings");
        if (data) setSettings(data);
      } catch (err) {
        console.error("Fetch settings failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { settings, loading };
}
