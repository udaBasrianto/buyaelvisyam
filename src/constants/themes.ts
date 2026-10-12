export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  primary: string; // HSL values for light mode (e.g. "158 64% 32%")
  primaryDark: string; // HSL values for dark mode (tuned for higher contrast on dark backgrounds)
  accent: string;
  accentDark: string;
  secondary: string;
  secondaryDark: string;
  gradient: string;
  gradientDark: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: "emerald",
    name: "Emerald",
    description: "Hijau alam",
    primary: "158 64% 32%",
    primaryDark: "158 64% 45%",
    accent: "158 40% 92%",
    accentDark: "158 35% 18%",
    secondary: "45 80% 55%",
    secondaryDark: "45 80% 45%",
    gradient: "linear-gradient(135deg, hsl(158 64% 32%), hsl(170 60% 28%))",
    gradientDark: "linear-gradient(135deg, hsl(158 64% 45%), hsl(170 60% 35%))",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Biru laut",
    primary: "215 88% 45%",
    primaryDark: "215 88% 58%",
    accent: "215 60% 92%",
    accentDark: "215 40% 20%",
    secondary: "185 85% 45%",
    secondaryDark: "185 75% 45%",
    gradient: "linear-gradient(135deg, hsl(215 88% 45%), hsl(200 85% 40%))",
    gradientDark: "linear-gradient(135deg, hsl(215 88% 58%), hsl(200 85% 48%))",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Oren hangat",
    primary: "24 95% 46%",
    primaryDark: "24 95% 56%",
    accent: "24 60% 92%",
    accentDark: "24 40% 18%",
    secondary: "42 95% 52%",
    secondaryDark: "42 85% 50%",
    gradient: "linear-gradient(135deg, hsl(24 95% 46%), hsl(12 85% 45%))",
    gradientDark: "linear-gradient(135deg, hsl(24 95% 56%), hsl(12 85% 52%))",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Ungu elegan",
    primary: "268 75% 46%",
    primaryDark: "268 75% 60%",
    accent: "268 50% 93%",
    accentDark: "268 35% 20%",
    secondary: "310 70% 50%",
    secondaryDark: "310 65% 55%",
    gradient: "linear-gradient(135deg, hsl(268 75% 46%), hsl(280 70% 38%))",
    gradientDark: "linear-gradient(135deg, hsl(268 75% 60%), hsl(280 70% 48%))",
  },
  {
    id: "crimson-red",
    name: "Crimson Red",
    description: "Merah berani",
    primary: "350 82% 44%",
    primaryDark: "350 82% 58%",
    accent: "350 50% 93%",
    accentDark: "350 35% 20%",
    secondary: "20 85% 55%",
    secondaryDark: "20 80% 55%",
    gradient: "linear-gradient(135deg, hsl(350 82% 44%), hsl(338 80% 36%))",
    gradientDark: "linear-gradient(135deg, hsl(350 82% 58%), hsl(338 80% 46%))",
  },
  {
    id: "sakura-pink",
    name: "Sakura Pink",
    description: "Merah muda lembut",
    primary: "336 78% 50%",
    primaryDark: "336 80% 62%",
    accent: "336 50% 93%",
    accentDark: "336 35% 20%",
    secondary: "280 60% 58%",
    secondaryDark: "280 55% 60%",
    gradient: "linear-gradient(135deg, hsl(336 78% 50%), hsl(348 75% 44%))",
    gradientDark: "linear-gradient(135deg, hsl(336 80% 62%), hsl(348 75% 52%))",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    description: "Gelap/Hitam pekat",
    primary: "222 47% 20%",
    primaryDark: "217 91% 65%",
    accent: "222 25% 90%",
    accentDark: "222 30% 16%",
    secondary: "210 40% 40%",
    secondaryDark: "210 50% 60%",
    gradient: "linear-gradient(135deg, hsl(222 47% 20%), hsl(220 50% 12%))",
    gradientDark: "linear-gradient(135deg, hsl(217 91% 65%), hsl(210 80% 55%))",
  },
  {
    id: "charcoal-gray",
    name: "Charcoal Gray",
    description: "Abu-abu modern",
    primary: "215 19% 35%",
    primaryDark: "215 20% 65%",
    accent: "215 15% 90%",
    accentDark: "215 15% 20%",
    secondary: "210 25% 55%",
    secondaryDark: "210 25% 65%",
    gradient: "linear-gradient(135deg, hsl(215 19% 35%), hsl(215 25% 24%))",
    gradientDark: "linear-gradient(135deg, hsl(215 20% 65%), hsl(215 25% 50%))",
  },
  {
    id: "amber-gold",
    name: "Amber Gold",
    description: "Kuning keemasan",
    primary: "38 92% 38%",
    primaryDark: "43 96% 52%",
    accent: "38 50% 92%",
    accentDark: "38 40% 18%",
    secondary: "20 85% 50%",
    secondaryDark: "20 80% 45%",
    gradient: "linear-gradient(135deg, hsl(38 92% 38%), hsl(30 85% 32%))",
    gradientDark: "linear-gradient(135deg, hsl(43 96% 52%), hsl(30 85% 45%))",
  },
  {
    id: "forest-teal",
    name: "Forest Teal",
    description: "Toska gelap",
    primary: "178 85% 28%",
    primaryDark: "178 85% 42%",
    accent: "178 40% 90%",
    accentDark: "178 35% 18%",
    secondary: "155 70% 40%",
    secondaryDark: "155 65% 42%",
    gradient: "linear-gradient(135deg, hsl(178 85% 28%), hsl(186 90% 22%))",
    gradientDark: "linear-gradient(135deg, hsl(178 85% 42%), hsl(186 90% 30%))",
  },
];

// Helper to look up a theme palette with legacy fallback
export function findThemePalette(id?: string): ThemePalette {
  if (!id) return THEME_PALETTES[0];
  const direct = THEME_PALETTES.find((p) => p.id === id);
  if (direct) return direct;

  const aliases: Record<string, string> = {
    royal: "ocean-blue",
    ruby: "crimson-red",
    golden: "amber-gold",
    teal: "forest-teal",
    violet: "royal-purple",
  };
  const targetId = aliases[id] || "emerald";
  return THEME_PALETTES.find((p) => p.id === targetId) || THEME_PALETTES[0];
}

// Injects dynamic CSS variables for both :root and .dark
export function applyThemePalette(palette: ThemePalette) {
  if (typeof document === "undefined") return;

  let styleEl = document.getElementById("dynamic-theme-vars") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-theme-vars";
    document.head.appendChild(styleEl);
  }

  const hue = palette.primary.split(" ")[0];

  styleEl.innerHTML = `
    :root {
      --primary: ${palette.primary};
      --ring: ${palette.primary};
      --sidebar-primary: ${palette.primary};
      --sidebar-accent: ${palette.accent};
      --sidebar-accent-foreground: ${palette.primary};
      --sidebar-ring: ${palette.primary};
      --accent: ${palette.accent};
      --secondary: ${palette.secondary};
      --gradient-islamic: ${palette.gradient};
      --shadow-card: 0 4px 20px -4px hsla(${hue}, 64%, 32%, 0.12);
      --shadow-elevated: 0 8px 30px -8px hsla(${hue}, 64%, 32%, 0.18);
    }
    .dark {
      --primary: ${palette.primaryDark || palette.primary};
      --ring: ${palette.primaryDark || palette.primary};
      --sidebar-primary: ${palette.primaryDark || palette.primary};
      --sidebar-accent: ${palette.accentDark || palette.accent};
      --sidebar-accent-foreground: ${palette.primaryDark || palette.primary};
      --sidebar-ring: ${palette.primaryDark || palette.primary};
      --accent: ${palette.accentDark || palette.accent};
      --secondary: ${palette.secondaryDark || palette.secondary};
      --gradient-islamic: ${palette.gradientDark || palette.gradient};
      --shadow-card: 0 4px 20px -4px hsla(${hue}, 64%, 20%, 0.35);
      --shadow-elevated: 0 8px 30px -8px hsla(${hue}, 64%, 20%, 0.45);
    }
  `;
}
