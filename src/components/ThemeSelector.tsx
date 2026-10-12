import { useState, useEffect } from "react";
import { Palette, Sun, Moon, Check, X, RotateCcw, CheckCircle2 } from "lucide-react";
import { THEME_PALETTES, findThemePalette, applyThemePalette, ThemePalette } from "@/constants/themes";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export function ThemeSelector() {
  const { settings } = useSiteSettings();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>("emerald");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Initialize theme state on mount
  useEffect(() => {
    const savedPreview = localStorage.getItem("buya_theme_preview");
    const currentId = savedPreview || settings.theme_color || "emerald";
    setActiveThemeId(currentId);

    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, [settings.theme_color]);

  // Handle changing color preset
  const handleSelectPalette = (palette: ThemePalette) => {
    setActiveThemeId(palette.id);
    localStorage.setItem("buya_theme_preview", palette.id);
    applyThemePalette(palette);
    toast({
      title: `Tema ${palette.name}`,
      description: `Warna aktif diubah ke ${palette.name} (${palette.description}).`,
    });
  };

  // Toggle dark/light mode
  const handleToggleDark = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("buya_theme_dark", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("buya_theme_dark", "false");
    }
    // Re-apply to ensure dynamic dark CSS variables take effect
    const palette = findThemePalette(activeThemeId);
    applyThemePalette(palette);
  };

  // Reset to original site theme
  const handleReset = () => {
    localStorage.removeItem("buya_theme_preview");
    const originalId = settings.theme_color || "emerald";
    setActiveThemeId(originalId);
    const palette = findThemePalette(originalId);
    applyThemePalette(palette);
    toast({
      title: "Tema Direset",
      description: `Kembali ke tema default situs (${palette.name}).`,
    });
  };

  // Admin save as default
  const handleSaveAsDefault = async () => {
    if (!user || role !== "admin") return;
    setSavingAdmin(true);
    try {
      await api.put("/settings", { theme_color: activeThemeId });
      toast({
        title: "Tersimpan Permanen",
        description: `Warna ${findThemePalette(activeThemeId).name} ditetapkan sebagai tema web resmi.`,
      });
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingAdmin(false);
    }
  };

  const currentPalette = findThemePalette(activeThemeId);

  return (
    <>
      {/* Floating Button Toggle */}
      <aside 
        aria-label="Pemilih Tema" 
        className="fixed bottom-20 left-4 z-40 sm:bottom-6 sm:left-6 print:hidden"
      >
        <button
          onClick={() => setOpen(!open)}
          type="button"
          aria-expanded={open}
          aria-label="Buka Pemilih Tema dan Mode Gelap"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-card/90 hover:bg-card text-foreground backdrop-blur-md border border-border/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div
            className="w-4 h-4 rounded-full shadow-inner ring-2 ring-primary/40 group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `hsl(${isDark ? currentPalette.primaryDark : currentPalette.primary})` }}
          />
          <Palette className="w-4 h-4 text-primary group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-xs font-bold tracking-tight hidden sm:inline">
            Tema ({currentPalette.name})
          </span>
        </button>
      </aside>

      {/* Floating Theme Selector Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Pengaturan Tema Warna"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">
                    Palet Warna Tema (10 Preset)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Pilih skema warna & uji kontras Light/Dark mode secara real-time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tutup panel tema"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Toggle & Quick Controls */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/60 border border-border/60">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-xs font-semibold text-foreground">
                  Mode Tampilan: <span className="text-primary font-bold">{isDark ? "Dark Mode" : "Light Mode"}</span>
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleToggleDark}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-primary" />
                    <span>Mode Gelap</span>
                  </>
                )}
              </Button>
            </div>

            {/* 10 Theme Palette Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {THEME_PALETTES.map((palette) => {
                const isSelected = activeThemeId === palette.id;
                const previewColor = isDark ? palette.primaryDark : palette.primary;

                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handleSelectPalette(palette)}
                    className={`relative flex flex-col p-3 rounded-2xl border-2 text-left transition-all duration-200 group ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/70 hover:border-primary/40 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-5 h-5 rounded-full shadow-md border border-white/20 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `hsl(${previewColor})` }}
                      />
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <div className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-40 bg-primary" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {palette.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {palette.description}
                    </span>

                    {/* Gradient preview bar */}
                    <div
                      className="w-full h-1.5 rounded-full mt-2.5 shadow-xs"
                      style={{ background: isDark ? palette.gradientDark : palette.gradient }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Default</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {user && role === "admin" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingAdmin}
                    onClick={handleSaveAsDefault}
                    className="w-full sm:w-auto text-xs font-bold rounded-xl islamic-gradient text-primary-foreground gap-1.5 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingAdmin ? "Menyimpan..." : "Simpan Permanen Web"}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto text-xs rounded-xl"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
