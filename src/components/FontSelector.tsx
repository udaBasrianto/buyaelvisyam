import React, { useState, useEffect } from "react";
import { Type, Check, RotateCcw, Sparkles, Sliders, ChevronDown, CheckCircle2 } from "lucide-react";
import { GOOGLE_FONTS, findFontOption, applyGlobalFont, GoogleFontOption } from "@/constants/fonts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FontSelectorProps {
  className?: string;
  showPreviewBox?: boolean;
}

export function FontSelector({ className = "", showPreviewBox = true }: FontSelectorProps) {
  const { toast } = useToast();
  const [selectedFontId, setSelectedFontId] = useState<string>("poppins");
  const [selectorMode, setSelectorMode] = useState<"radio" | "dropdown">("radio");
  const [previewSize, setPreviewSize] = useState<number>(15);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("buya_font_choice") : null;
    if (saved) {
      setSelectedFontId(saved);
      const font = findFontOption(saved);
      applyGlobalFont(font);
    }
  }, []);

  const handleSelectFont = (fontId: string) => {
    setSelectedFontId(fontId);
    const font = findFontOption(fontId);
    applyGlobalFont(font);
    localStorage.setItem("buya_font_choice", fontId);
    toast({
      title: `Font Diubah: ${font.name}`,
      description: `Tipografi ${font.name} (${font.description}) langsung aktif di seluruh website.`,
    });
  };

  const handleReset = () => {
    handleSelectFont("poppins");
    toast({
      title: "Font Direset",
      description: "Tipografi dikembalikan ke default Poppins.",
    });
  };

  const currentFont = findFontOption(selectedFontId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Switcher: Radio Cards vs Dropdown */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/60 border border-border/60">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Model Pemilih:
          </span>
        </div>
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/80">
          <button
            type="button"
            onClick={() => setSelectorMode("radio")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectorMode === "radio"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Radio / Kartu
          </button>
          <button
            type="button"
            onClick={() => setSelectorMode("dropdown")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectorMode === "dropdown"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dropdown Menu
          </button>
        </div>
      </div>

      {/* DROPDOWN SELECTOR MODE */}
      {selectorMode === "dropdown" && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Pilih Font dari Dropdown:</span>
            <span className="text-[11px] text-primary font-mono font-bold">
              Aktif: {currentFont.name}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedFontId}
              onChange={(e) => handleSelectFont(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-2xl bg-card border-2 border-border text-foreground text-sm font-medium focus:border-primary focus:outline-none transition-all shadow-xs pr-10 cursor-pointer"
              style={{ fontFamily: currentFont.fontFamily }}
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font.id} value={font.id} style={{ fontFamily: font.fontFamily }}>
                  {font.name} — {font.description} ({font.category})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {currentFont.name}: {currentFont.popularFor}
          </p>
        </div>
      )}

      {/* RADIO / CARD SELECTOR MODE */}
      {selectorMode === "radio" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 select-none">
          {GOOGLE_FONTS.map((font) => {
            const isSelected = selectedFontId === font.id;
            return (
              <div
                key={font.id}
                onClick={() => handleSelectFont(font.id)}
                className={`relative flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/70 hover:border-primary/40 bg-card hover:bg-muted/40"
                }`}
              >
                {/* Radio Button Circle */}
                <div className="pt-0.5 shrink-0">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/60 group-hover:border-primary"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-sm font-bold text-foreground truncate"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      {font.name}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono shrink-0">
                      {font.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {font.description}
                  </p>

                  {/* Sample preview line rendered in exact font */}
                  <p
                    className="text-xs text-foreground/80 mt-1.5 pt-1.5 border-t border-border/40 truncate"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.sampleQuote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIVE INTERACTIVE PREVIEW BOX */}
      {showPreviewBox && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Preview Teks ({currentFont.name})</span>
            </div>

            {/* Font size slider */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sliders className="w-3 h-3" />
              <span>Ukuran: {previewSize}px</span>
              <input
                type="range"
                min="13"
                max="20"
                value={previewSize}
                onChange={(e) => setPreviewSize(Number(e.target.value))}
                className="w-20 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                aria-label="Ukuran font preview"
              />
            </div>
          </div>

          <div
            className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs space-y-2.5 transition-all"
            style={{ fontFamily: currentFont.fontFamily }}
          >
            {/* Heading sample */}
            <h4
              className="font-bold tracking-tight text-foreground transition-all leading-tight"
              style={{ fontSize: `${previewSize + 4}px` }}
            >
              Buya Muhammad Elvisyam — Berilmu Sebelum Beramal
            </h4>

            {/* Arabic / Quote */}
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-right text-base text-primary font-medium font-serif leading-relaxed" dir="rtl">
                مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ
              </p>
              <p
                className="text-[11px] text-muted-foreground italic"
                style={{ fontSize: `${Math.max(11, previewSize - 3)}px` }}
              >
                &ldquo;Barangsiapa menempuh jalan untuk menuntut ilmu, Allah mudahkan jalannya menuju surga.&rdquo; (HR. Muslim)
              </p>
            </div>

            {/* Body paragraph */}
            <p
              className="text-muted-foreground leading-relaxed transition-all"
              style={{ fontSize: `${previewSize}px` }}
            >
              Portal resmi Buya Muhammad Elvisyam menyajikan artikel dakwah sunnah, kajian tematik fikih, panduan ibadah harian, serta modul pembelajaran interaktif berlandaskan Al-Qur&apos;an dan As-Sunnah.
            </p>

            {/* UI Component Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <Button size="sm" className="h-7 rounded-xl text-[11px] font-semibold gap-1.5 islamic-gradient text-primary-foreground">
                <span>Baca Artikel</span>
              </Button>
              <Button size="sm" variant="outline" className="h-7 rounded-xl text-[11px]">
                <span>Daftar Kajian</span>
              </Button>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                Kategori: Fiqih Ibadah
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex items-center justify-between pt-2 border-t border-border/80 text-xs">
        <button
          type="button"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Poppins (Default)</span>
        </button>

        <span className="text-muted-foreground text-[11px]">
          Font Family: <code className="font-mono text-primary font-bold">{currentFont.name}</code>
        </span>
      </div>
    </div>
  );
}
