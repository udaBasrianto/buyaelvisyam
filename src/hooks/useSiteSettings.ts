import { useEffect, useState } from "react";
import api from "@/lib/api";
import { asObject } from "@/lib/api-response";

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  logo_url: string | null;
  default_article_image: string | null;
  footer_text: string;
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
  default_article_image: null,
  footer_text: "",
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
        setSettings(asObject(data, DEFAULTS));
      } catch (err) {
        return;
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { settings, loading };
}
