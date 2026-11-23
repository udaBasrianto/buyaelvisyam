import { useEffect, useState } from "react";
import api from "@/lib/api";
import { asObject } from "@/lib/api-response";

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url?: string | null;
  default_article_image: string | null;
  footer_text: string;
  play_store_url?: string;
  homepage_version: string;
  scroll_to_top_version: string;
  admin_slug?: string;
  hero_title?: string;
  recent_title?: string;
  recent_limit?: number;
  slider_overlay_opacity?: number;
  homepage_section_order?: string;
  google_client_id?: string;
  site_description?: string;
  theme_color?: string;
  font_family?: string;
  products_menu_label?: string;
  products_title?: string;
  products_subtitle?: string;
  about_contact_email?: string;
  about_contact_phone?: string;
  checkout_web_enabled?: boolean;
  checkout_whatsapp_enabled?: boolean;
  checkout_whatsapp_number?: string;
  checkout_instructions?: string;
  checkout_flat_shipping_enabled?: boolean;
  checkout_flat_shipping_amount?: number;
  checkout_flat_shipping_label?: string;
  checkout_payment_due_hours?: number;
}

// Minimal defaults - rest dari database
const DEFAULTS: SiteSettings = {
  id: "",
  site_name: "",
  tagline: "",
  logo_url: null,
  favicon_url: null,
  default_article_image: null,
  footer_text: "",
  homepage_version: "v1",
  scroll_to_top_version: "animated",
  theme_color: "emerald",
  font_family: "poppins",
};

// Global in-memory cache to prevent multiple duplicate network requests across components
let cachedSettings: SiteSettings | null = null;
let inflightPromise: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

export function getCachedSiteSettings(): SiteSettings {
  return cachedSettings || DEFAULTS;
}

export function refreshSiteSettings(): Promise<SiteSettings> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = api
    .get("/settings")
    .then(({ data }) => {
      const parsed = asObject(data, DEFAULTS);
      cachedSettings = parsed;
      listeners.forEach((cb) => cb(parsed));
      return parsed;
    })
    .catch(() => {
      return cachedSettings || DEFAULTS;
    })
    .finally(() => {
      inflightPromise = null;
    });
  return inflightPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    let mounted = true;

    const handleUpdate = (s: SiteSettings) => {
      if (mounted) {
        setSettings(s);
        setLoading(false);
      }
    };
    listeners.add(handleUpdate);

    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
    } else {
      if (!inflightPromise) {
        refreshSiteSettings();
      }
    }

    return () => {
      mounted = false;
      listeners.delete(handleUpdate);
    };
  }, []);

  return { settings, loading, refresh: refreshSiteSettings };
}
