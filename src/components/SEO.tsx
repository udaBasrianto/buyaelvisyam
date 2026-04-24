import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

export function SEO({ title, description, image, article }: SEOProps) {
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || "BlogUstad";
  const defaultDescription = settings?.site_description || "Berbagi ilmu agama Islam untuk umat. Kajian hadits, fiqih, dan tazkiyatun nufus.";
  const defaultImage = settings?.logo_url || "/og-image.jpg"; 
  const baseURL = window.location.origin;

  useEffect(() => {
    const seoTitle = title ? `${title} | ${siteName}` : `${siteName} - Berbagi Ilmu Agama Islam`;
    const seoDescription = description || defaultDescription;
    const seoImage = image || `${baseURL}${defaultImage}`;
    const seoURL = `${baseURL}${pathname}`;

    // Update Title
    document.title = seoTitle;

    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string, property: boolean = false) => {
      let el = document.querySelector(property ? `meta[property="${name}"]` : `meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (property) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    updateMeta("description", seoDescription);

    // Open Graph / Facebook
    updateMeta("og:type", article ? "article" : "website", true);
    updateMeta("og:url", seoURL, true);
    updateMeta("og:title", seoTitle, true);
    updateMeta("og:description", seoDescription, true);
    updateMeta("og:image", seoImage, true);
    updateMeta("og:site_name", siteName, true);

    // Twitter
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:url", seoURL);
    updateMeta("twitter:title", seoTitle);
    updateMeta("twitter:description", seoDescription);
    updateMeta("twitter:image", seoImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", seoURL);

  }, [title, description, image, article, pathname, baseURL, settings]);

  return null;
}
