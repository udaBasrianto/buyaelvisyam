export interface ThemePalette {
  id: string;
  name: string;
  primary: string; // HSL values without hsl() wrapper
  accent: string;
  secondary: string;
  gradient: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: "emerald",
    name: "Emerald Islamic",
    primary: "158 64% 32%",
    accent: "158 40% 90%",
    secondary: "45 80% 55%",
    gradient: "linear-gradient(135deg, hsl(158 64% 32%), hsl(170 60% 28%))"
  },
  {
    id: "royal",
    name: "Royal Blue",
    primary: "221 83% 53%",
    accent: "221 40% 90%",
    secondary: "35 90% 60%",
    gradient: "linear-gradient(135deg, hsl(221 83% 53%), hsl(230 60% 45%))"
  },
  {
    id: "ruby",
    name: "Ruby Maroon",
    primary: "349 77% 35%",
    accent: "349 40% 90%",
    secondary: "45 80% 55%",
    gradient: "linear-gradient(135deg, hsl(349 77% 35%), hsl(340 60% 25%))"
  },
  {
    id: "golden",
    name: "Golden Sand",
    primary: "38 92% 40%",
    accent: "38 40% 90%",
    secondary: "158 64% 32%",
    gradient: "linear-gradient(135deg, hsl(38 92% 40%), hsl(30 70% 35%))"
  },
  {
    id: "teal",
    name: "Modern Teal",
    primary: "181 100% 30%",
    accent: "181 40% 90%",
    secondary: "25 90% 60%",
    gradient: "linear-gradient(135deg, hsl(181 100% 30%), hsl(190 70% 25%))"
  },
  {
    id: "violet",
    name: "Spiritual Violet",
    primary: "262 83% 45%",
    accent: "262 40% 90%",
    secondary: "45 80% 55%",
    gradient: "linear-gradient(135deg, hsl(262 83% 45%), hsl(270 70% 35%))"
  }
];
