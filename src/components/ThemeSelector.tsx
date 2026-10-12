import { useState, useEffect } from "react";
import { Palette, Sun, Moon, Check, X, RotateCcw, CheckCircle2, Type } from "lucide-react";
import { THEME_PALETTES, findThemePalette, applyThemePalette, ThemePalette } from "@/constants/themes";
import { FontSelector } from "@/components/FontSelector";
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
  const [activeTab, setActiveTab] = useState<"colors" | "fonts">("colors");
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
  };

  // Reset to default
  const handleReset = () => {
    const defaultPalette = findThemePalette("emerald");
    setActiveThemeId("emerald");
    localStorage.removeItem("buya_theme_preview");
    applyThemePalette(defaultPalette);
    toast({
      title: "Tema Direset",
      description: "Warna tema dikembalikan ke Emerald (default).",
    });
  };

  // Save for entire website (Admin only)
  const handleSaveAsDefault = async () => {
    if (!user || role !== "admin") return;
    try {
      setSavingAdmin(true);
      await api.put("/settings", {
        theme_color: activeThemeId,
      });
      localStorage.removeItem("buya_theme_preview");
      toast({
        title: "Berhasil Disimpan",
        description: `Tema ${findThemePalette(activeThemeId).name} berhasil dijadikan tema utama website.`,
      });
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <>
      {/* Floating Theme Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kustomisasi Tema dan Font"
        className="fixed bottom-5 right-5 z-40 p-3.5 rounded-full shadow-xl bg-card border-2 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <Palette className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
      </button>

      {/* Theme & Typography Customization Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background border-2 border-border p-5 sm:p-6 shadow-2xl space-y-4 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Kustomisasi Tampilan & Font</h3>
                  <p className="text-xs text-muted-foreground">Sesuaikan palet warna, mode gelap, & 10 pilihan Google Fonts.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR: Warna Tema vs Pilihan Font */}
            <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab("colors")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "colors"
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="w-4 h-4 text-primary" />
                <span>Warna Tema (10 Pilihan)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fonts")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "fonts"
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="w-4 h-4 text-primary" />
                <span>Pilihan Font (10 Google Fonts)</span>
              </button>
            </div>

            {/* CONTENT: COLOR PALETTES */}
            {activeTab === "colors" && (
              <div className="space-y-4">
                {/* Dark Mode Toggle */}
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
                <div className="grid grid-cols-2 gap-2.5 pt-1 max-h-[360px] overflow-y-auto pr-1">
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
              </div>
            )}

            {/* CONTENT: GOOGLE FONTS */}
            {activeTab === "fonts" && (
              <FontSelector showPreviewBox={true} />
            )}

            {/* Footer actions */}
            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {activeTab === "colors" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Tema ke Default</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeTab === "colors" && user && role === "admin" && (
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
