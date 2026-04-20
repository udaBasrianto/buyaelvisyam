import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { THEME_PALETTES } from "@/constants/themes";

export function ThemeInitializer() {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (loading || !settings.theme_color) return;

    const palette = THEME_PALETTES.find(p => p.id === settings.theme_color) || THEME_PALETTES[0];
    
    // Apply HSL values to root
    const root = document.documentElement;
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--ring", palette.primary);
    root.style.setProperty("--sidebar-primary", palette.primary);
    
    // Derived values for accent/background
    root.style.setProperty("--accent", palette.accent);
    
    // Apply complex variables like gradients if needed
    root.style.setProperty("--gradient-islamic", palette.gradient);
    
    // shadow needs to be adjusted based on the brand color
    // We parse the first HSL value (Hue) from primary "158 64% 32%"
    const hue = palette.primary.split(" ")[0];
    root.style.setProperty("--shadow-card", `0 4px 20px -4px hsla(${hue}, 64%, 32%, 0.1)`);
    root.style.setProperty("--shadow-elevated", `0 8px 30px -8px hsla(${hue}, 64%, 32%, 0.15)`);

  }, [settings.theme_color, loading]);

  return null;
}
