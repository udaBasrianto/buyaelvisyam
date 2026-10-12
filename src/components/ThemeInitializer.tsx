import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { findThemePalette, applyThemePalette } from "@/constants/themes";
import { findFontOption, applyGlobalFont } from "@/constants/fonts";

export function ThemeInitializer() {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    // 1. Terapkan Warna Tema dari Admin Settings (Database)
    const targetThemeId = settings.theme_color || "emerald";
    const palette = findThemePalette(targetThemeId);
    applyThemePalette(palette);

    // 2. Terapkan Font Tipografi dari Admin Settings (Database)
    const targetFontId = settings.font_family || "poppins";
    const fontOpt = findFontOption(targetFontId);
    applyGlobalFont(fontOpt);

    // 3. Mode Gelap Pengunjung
    const savedDark = typeof window !== "undefined" ? localStorage.getItem("buya_theme_dark") : null;
    if (savedDark === "true") {
      document.documentElement.classList.add("dark");
    } else if (savedDark === "false") {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme_color, settings.font_family, loading]);

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
