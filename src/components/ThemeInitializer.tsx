import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { findThemePalette, applyThemePalette } from "@/constants/themes";

export function ThemeInitializer() {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    const previewId = typeof window !== "undefined" ? localStorage.getItem("buya_theme_preview") : null;
    const targetThemeId = previewId || settings.theme_color || "emerald";
    const palette = findThemePalette(targetThemeId);
    
    applyThemePalette(palette);

    const savedDark = typeof window !== "undefined" ? localStorage.getItem("buya_theme_dark") : null;
    if (savedDark === "true") {
      document.documentElement.classList.add("dark");
    } else if (savedDark === "false") {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme_color, loading]);

  useEffect(() => {
    if (loading || !settings?.favicon_url) return;
    
    const updateFavicon = (rel: string) => {
      let icon = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!icon) {
        icon = document.createElement("link");
        icon.setAttribute("rel", rel);
        document.head.appendChild(icon);
      }
      icon.setAttribute("href", settings.favicon_url!);
    };
    
    updateFavicon("icon");
    updateFavicon("shortcut icon");
    updateFavicon("apple-touch-icon");
  }, [settings?.favicon_url, loading]);

  return null;
}
