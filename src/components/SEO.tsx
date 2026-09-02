import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  /** Pass explicit image dimensions to generate og:image:width / og:image:height */
  imageWidth?: number;
  imageHeight?: number;
  article?: boolean;
  type?: "website" | "article" | "product" | "course";
  canonical?: string;
  keywords?: string[] | string;
  noindex?: boolean;
  jsonLd?: any | any[];
  // Article-specific rich OG props
  publishedAt?: string;   // ISO-8601 string e.g. "2026-08-01T10:00:00Z"
  modifiedAt?: string;    // ISO-8601 string
  author?: string;
  section?: string;       // primary category → article:section
  tags?: string[];        // → article:tag (multiple)
  readingMinutes?: number; // → twitter:data1
}

export function SEO({
  title,
  description,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  article,
  type,
  canonical,
  keywords,
  noindex = false,
  jsonLd,
  publishedAt,
  modifiedAt,
  author,
  section,
  tags,
  readingMinutes,
}: SEOProps) {
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();

  const siteName    = settings?.site_name || "Buya Muhammad Elvisyam";
  const twitterHandle = "@" + (settings?.site_name || "buyaelvisyam")
    .toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  const defaultDescription =
    settings?.site_description ||
    settings?.tagline ||
    "Portal Resmi Kajian Islam, Hadits, Fiqih, dan Artikel Pilihan.";
  const defaultImage = settings?.logo_url || "/og-image.jpg";
  const baseURL = typeof window !== "undefined" ? window.location.origin : "https://e-kajian.web.id";

  useEffect(() => {
    const seoTitle = title
      ? title.includes(siteName)
        ? title
        : `${title} | ${siteName}`
      : `${siteName} - ${settings?.tagline || "Portal Resmi Kajian Islam"}`;
    const seoDescription = description || defaultDescription;
    const ogType = type || (article ? "article" : "website");
    const seoURL = canonical || `${baseURL}${pathname}`;

    let seoImage = image || defaultImage;
    if (seoImage && !seoImage.startsWith("http://") && !seoImage.startsWith("https://")) {
      seoImage = `${baseURL}${seoImage.startsWith("/") ? "" : "/"}${seoImage}`;
    }

    // Update document title
    document.title = seoTitle;

    // Helper — upsert a <meta> tag
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        if (property) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Helper — remove a <meta> tag if it exists
    const removeMeta = (name: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      document.querySelector(selector)?.remove();
    };

    // ── Standard meta ──────────────────────────────────────────────────────
    updateMeta("description", seoDescription);
    updateMeta("robots", noindex
      ? "noindex, follow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
    if (author) updateMeta("author", author);
    if (keywords) {
      updateMeta("keywords", Array.isArray(keywords) ? keywords.join(", ") : keywords);
    }

    // ── Open Graph core ────────────────────────────────────────────────────
    updateMeta("og:type",        ogType,          true);
    updateMeta("og:url",         seoURL,          true);
    updateMeta("og:title",       seoTitle,        true);
    updateMeta("og:description", seoDescription,  true);
    updateMeta("og:site_name",   siteName,        true);
    updateMeta("og:locale",      "id_ID",         true);

    // ── OG Image with dimensions ───────────────────────────────────────────
    updateMeta("og:image",        seoImage,             true);
    updateMeta("og:image:width",  String(imageWidth),   true);
    updateMeta("og:image:height", String(imageHeight),  true);
    updateMeta("og:image:type",   "image/jpeg",         true);
    updateMeta("og:image:alt",    seoTitle,             true);

    // ── Article-specific OG ────────────────────────────────────────────────
    if (ogType === "article") {
      if (publishedAt) updateMeta("article:published_time", publishedAt, true);
      else removeMeta("article:published_time", true);

      if (modifiedAt) updateMeta("article:modified_time", modifiedAt, true);
      else removeMeta("article:modified_time", true);

      if (author) updateMeta("article:author", author, true);
      else removeMeta("article:author", true);

      if (section) updateMeta("article:section", section, true);
      else removeMeta("article:section", true);

      // article:tag — remove all existing first then re-add
      document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
      if (tags && tags.length > 0) {
        tags.forEach(tag => {
          if (!tag) return;
          const el = document.createElement("meta");
          el.setAttribute("property", "article:tag");
          el.setAttribute("content", tag);
          document.head.appendChild(el);
        });
      }
    } else {
      // Clean up article tags if we switched away from article type
      ["article:published_time","article:modified_time","article:author","article:section","article:tag"]
        .forEach(p => removeMeta(p, true));
    }

    // ── Twitter Card ───────────────────────────────────────────────────────
    updateMeta("twitter:card",        "summary_large_image");
    updateMeta("twitter:site",        twitterHandle);
    updateMeta("twitter:creator",     twitterHandle);
    updateMeta("twitter:title",       seoTitle);
    updateMeta("twitter:description", seoDescription);
    updateMeta("twitter:image",       seoImage);
    updateMeta("twitter:image:alt",   seoTitle);

    // Twitter app card labels (reading time + category)
    if (readingMinutes && readingMinutes > 0) {
      updateMeta("twitter:label1", "Estimasi Baca");
      updateMeta("twitter:data1",  `${readingMinutes} menit`);
    } else {
      removeMeta("twitter:label1");
      removeMeta("twitter:data1");
    }
    if (section) {
      updateMeta("twitter:label2", "Kategori");
      updateMeta("twitter:data2",  section);
    } else {
      removeMeta("twitter:label2");
      removeMeta("twitter:data2");
    }

    // ── Canonical link ─────────────────────────────────────────────────────
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", seoURL);

    // ── JSON-LD Structured Data ────────────────────────────────────────────
    // Remove any previously injected client-side JSON-LD blocks
    document.querySelectorAll('script[type="application/ld+json"][data-seo="jsonld"]')
      .forEach(n => n.parentNode?.removeChild(n));

    if (jsonLd) {
      const list = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      list.forEach(item => {
        if (!item) return;
        const el = document.createElement("script");
        el.setAttribute("type", "application/ld+json");
        el.setAttribute("data-seo", "jsonld");
        el.text = JSON.stringify(item);
        document.head.appendChild(el);
      });
    }
  }, [
    title, description, image, imageWidth, imageHeight,
    article, type, canonical, keywords, noindex, jsonLd,
    publishedAt, modifiedAt, author, section, tags, readingMinutes,
    pathname, baseURL, settings, siteName, twitterHandle,
    defaultDescription, defaultImage,
  ]);

  return null;
}
