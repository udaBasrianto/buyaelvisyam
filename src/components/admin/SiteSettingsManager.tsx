import { useEffect, useRef, useState } from "react";
import { Save, ImagePlus, X, Palette } from "lucide-react";
import { THEME_PALETTES } from "@/constants/themes";
import { Button } from "@/components/ui/button";
import { FeaturesManager } from "./FeaturesManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";

interface Settings {
  id: string;
  site_name: string;
  tagline: string;
  site_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  footer_text: string;
  homepage_version: string;
  slider_style: string;
  scroll_to_top_version: string;
  admin_token?: string;
  admin_slug?: string;
  hero_title?: string;
  recent_title?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_button_text?: string;
  newsletter_link?: string;
  theme_color?: string;
  about_hero_image?: string;
  about_vision_image_1?: string;
  about_vision_image_2?: string;
  about_value_1_title?: string;
  about_value_1_desc?: string;
  about_value_2_title?: string;
  about_value_2_desc?: string;
  about_value_3_title?: string;
  about_value_3_desc?: string;
  about_contact_email?: string;
  about_contact_phone?: string;
  about_footer_quote?: string;
  about_footer_author?: string;
  google_analytics_id?: string;
  categories_title?: string;
  categories_subtitle?: string;
  lms_menu_label?: string;
  lms_title?: string;
  lms_subtitle?: string;
  show_feature_bar?: boolean;
}

export function SiteSettingsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'features'>('general');
  const fileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const handleGeneralUpload = async (field: keyof Settings) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("image", file);
      try {
        const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setSettings(s => s ? { ...s, [field]: data.url } : s);
        toast({ title: "Berhasil upload" });
      } catch (err) {
        toast({ title: "Gagal upload", variant: "destructive" });
      }
    };
    input.click();
  };

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        if (data) setSettings(data as Settings);
      })
      .catch((err) => {
         console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Hanya gambar", variant: "destructive" });
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      setSettings((s) => (s ? { ...s, logo_url: data.url } : s));
    } catch (error: any) {
       toast({ title: "Gagal upload", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Hanya gambar", variant: "destructive" });
      return;
    }
    setUploadingFavicon(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      setSettings((s) => (s ? { ...s, favicon_url: data.url } : s));
    } catch (error: any) {
       toast({ title: "Gagal upload favicon", description: error.message, variant: "destructive" });
    }
    setUploadingFavicon(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put("/settings", {
        site_name: settings.site_name.trim(),
        tagline: settings.tagline.trim(),
        site_description: settings.site_description ? settings.site_description.trim() : "",
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
        footer_text: settings.footer_text.trim(),
        homepage_version: settings.homepage_version,
        slider_style: settings.slider_style,
        scroll_to_top_version: settings.scroll_to_top_version,
        admin_token: settings.admin_token?.trim() || "090124",
        admin_slug: settings.admin_slug?.trim() || "yaakhi",
        hero_title: settings.hero_title?.trim() || "Editors Choice",
        recent_title: settings.recent_title?.trim() || "Recent Stories",
        newsletter_title: settings.newsletter_title?.trim() || "",
        newsletter_description: settings.newsletter_description?.trim() || "",
        newsletter_button_text: settings.newsletter_button_text?.trim() || "",
        newsletter_link: settings.newsletter_link?.trim() || "",
        theme_color: settings.theme_color || "emerald",
        about_hero_image: settings.about_hero_image || "",
        about_vision_image_1: settings.about_vision_image_1 || "",
        about_vision_image_2: settings.about_vision_image_2 || "",
        // Tetap sertakan field about lainnya agar tidak terhapus di backend
        about_value_1_title: settings.about_value_1_title || "",
        about_value_1_desc: settings.about_value_1_desc || "",
        about_value_2_title: settings.about_value_2_title || "",
        about_value_2_desc: settings.about_value_2_desc || "",
        about_value_3_title: settings.about_value_3_title || "",
        about_value_3_desc: settings.about_value_3_desc || "",
        about_contact_email: settings.about_contact_email || "",
        about_contact_phone: settings.about_contact_phone || "",
        about_footer_quote: settings.about_footer_quote || "",
        about_footer_author: settings.about_footer_author || "",
        google_analytics_id: settings.google_analytics_id?.trim() || "",
        categories_title: settings.categories_title?.trim() || "",
        categories_subtitle: settings.categories_subtitle?.trim() || "",
        lms_menu_label: settings.lms_menu_label?.trim() || "Akademi",
        lms_title: settings.lms_title?.trim() || "",
        lms_subtitle: settings.lms_subtitle?.trim() || "",
      });
      toast({ title: "Tersimpan", description: "Pengaturan situs diperbarui" });
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading || !settings) return <div className="text-center py-8 text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="flex bg-muted p-1 rounded-xl w-full max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-1.5 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'general' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Konfigurasi Umum
        </button>
        <button 
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-1.5 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'features' ? 'bg-background shadow-sm text-primary' : 'text-primary hover:text-foreground'}`}
        >
          Fitur Beranda
        </button>
      </div>

      {activeTab === 'features' ? (
        <div className="bg-card rounded-xl card-shadow p-6">
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-card/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Aktifkan Feature Bar</Label>
                  <p className="text-xs text-muted-foreground">Tampilkan atau sembunyikan bar fitur cepat di bawah Jendela Beranda.</p>
                </div>
                <Switch 
                  checked={settings.show_feature_bar} 
                  onCheckedChange={(v) => setSettings({ ...settings, show_feature_bar: v })} 
                />
              </div>

              <FeaturesManager />
        </div>
      ) : (
        <div className="bg-card rounded-xl card-shadow p-6 w-full space-y-4">
      <div>
        <Label>Nama Situs</Label>
        <Input value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} />
      </div>
      <div>
        <Label>Tagline</Label>
        <Input value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
      </div>
      <div>
        <Label>Logo</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        {settings.logo_url ? (
          <div className="relative mt-2 inline-block rounded-lg border bg-accent/30 p-3">
            <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              onClick={() => setSettings({ ...settings, logo_url: null })}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-2 gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Mengupload..." : "Upload Logo"}
          </Button>
        )}
      </div>
      <div>
        <Label>Favicon</Label>
        <input ref={faviconFileRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
        {settings.favicon_url ? (
          <div className="relative mt-2 inline-block rounded-lg border bg-accent/30 p-2">
            <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              onClick={() => setSettings({ ...settings, favicon_url: null })}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-2 gap-2" onClick={() => faviconFileRef.current?.click()} disabled={uploadingFavicon}>
            <ImagePlus className="h-4 w-4" />
            {uploadingFavicon ? "Mengupload..." : "Upload Favicon"}
          </Button>
        )}
      </div>
      <div>
        <Label>Deskripsi Web</Label>
        <Textarea value={settings.site_description || ""} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} rows={2} placeholder="Deskripsi ini akan dimunculkan di meta tag SEO web" />
      </div>

      <div>
        <Label>Teks Footer</Label>
        <Textarea value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} rows={2} />
      </div>
      <div className="pt-4 border-t space-y-4">
        <Label className="font-bold">Kustomisasi Judul Beranda</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-[10px]">Judul Seksi Hero (Pilihan Editor)</Label>
            <Input 
              value={settings.hero_title || ""} 
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} 
              placeholder="Contoh: Editors Choice"
            />
          </div>
          <div>
            <Label className="text-[10px]">Judul Seksi Artikel Terbaru</Label>
            <Input 
              value={settings.recent_title || ""} 
              onChange={(e) => setSettings({ ...settings, recent_title: e.target.value })} 
              placeholder="Contoh: Recent Stories"
            />
          </div>
          <div>
            <Label className="text-[10px]">Judul Seksi Kategori Terpopuler</Label>
            <Input 
              value={settings.categories_title || ""} 
              onChange={(e) => setSettings({ ...settings, categories_title: e.target.value })} 
              placeholder="Contoh: Kategori Terpopuler"
            />
          </div>
          <div>
            <Label className="text-[10px]">Subjudul Seksi Kategori</Label>
            <Input 
              value={settings.categories_subtitle || ""} 
              onChange={(e) => setSettings({ ...settings, categories_subtitle: e.target.value })} 
              placeholder="Contoh: Temukan topik kajian favorit Anda"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t space-y-6">
        <div>
          <Label className="text-sm font-bold mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Palet Warna Situs
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {THEME_PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSettings({ ...settings, theme_color: p.id })}
                className={`relative p-3 rounded-2xl border-2 text-left transition-all group ${
                  settings.theme_color === p.id || (!settings.theme_color && p.id === "emerald")
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                   <div 
                      className="h-4 w-4 rounded-full border border-black/10 shadow-sm" 
                      style={{ background: `hsl(${p.primary})` }} 
                   />
                   <span className="text-[10px] font-bold uppercase tracking-tight">{p.name}</span>
                </div>
                <div className="flex gap-1">
                   <div className="h-1 flex-1 rounded-full bg-primary/20" style={{ backgroundColor: `hsl(${p.primary})` }} />
                   <div className="h-1 w-4 rounded-full bg-secondary/20" style={{ backgroundColor: `hsl(${p.secondary})` }} />
                </div>
                {(settings.theme_color === p.id || (!settings.theme_color && p.id === "emerald")) && (
                  <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                     <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-bold mb-3 block">Pilih Style Hero Slider</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, slider_style: "v2" })}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                settings.slider_style === "v2" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-xs font-bold mb-1">Mosaic Grid (V2)</div>
              <div className="text-[10px] text-muted-foreground">Main hero di kiri, thumbnail list di kanan.</div>
              {settings.slider_style === "v2" && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, slider_style: "v3" })}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                settings.slider_style === "v3" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-xs font-bold mb-1">Magazine Bento (V3)</div>
              <div className="text-[10px] text-muted-foreground">Layout bento premium ala majalah digital.</div>
              {settings.slider_style === "v3" && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-bold mb-3 block">Efek Tombol "Go to Top"</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, scroll_to_top_version: "basic" })}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                settings.scroll_to_top_version === "basic" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-xs font-bold mb-1">Basic (Serius)</div>
              <div className="text-[10px] text-muted-foreground">Panah ke atas biasa, langsung scroll halus.</div>
              {settings.scroll_to_top_version === "basic" && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, scroll_to_top_version: "animated" })}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                settings.scroll_to_top_version === "animated" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-xs font-bold mb-1">Animated Rocket (Seru)</div>
              <div className="text-[10px] text-muted-foreground">Efek roket meluncur berapi-api.</div>
              {settings.scroll_to_top_version === "animated" && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-bold mb-1 block">Token Keamanan Admin</Label>
          <div className="text-[10px] text-muted-foreground mb-3">Token ini digunakan sebagai lapisan keamanan tambahan saat login menggunakan email administrator.</div>
          <Input 
            type="text" 
            value={settings.admin_token || ""} 
            onChange={(e) => setSettings({ ...settings, admin_token: e.target.value })} 
            placeholder="Contoh: 090124"
          />
        </div>

        <div>
          <Label className="text-sm font-bold mb-1 block">Google Analytics (G-XXXXXXX)</Label>
          <div className="text-[10px] text-muted-foreground mb-3">Masukkan Measurement ID dari Google Analytics 4 (GA4) untuk melacak kunjungan pengunjung secara resmi.</div>
          <Input 
            type="text" 
            value={settings.google_analytics_id || ""} 
            onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })} 
            placeholder="G-XXXXXXXXXX"
          />
        </div>

        <div className="pt-6 border-t space-y-4">
          <Label className="text-sm font-bold block">Konfigurasi Halaman LMS / Akademi</Label>
          <div className="text-[10px] text-muted-foreground mb-4">Ubah nama menu, judul hero, dan subtitle halaman kursus secara dinamis.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-[10px]">Label Menu Navigasi</Label>
              <Input 
                value={settings.lms_menu_label || ""} 
                onChange={(e) => setSettings({ ...settings, lms_menu_label: e.target.value })} 
                placeholder="Akademi"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Nama yang tampil di navbar & breadcrumb</p>
            </div>
            <div>
              <Label className="text-[10px]">Judul Hero LMS</Label>
              <Input 
                value={settings.lms_title || ""} 
                onChange={(e) => setSettings({ ...settings, lms_title: e.target.value })} 
                placeholder="Belajar Islam Lebih Terstruktur."
              />
            </div>
            <div>
              <Label className="text-[10px]">Subtitle Hero LMS</Label>
              <Input 
                value={settings.lms_subtitle || ""} 
                onChange={(e) => setSettings({ ...settings, lms_subtitle: e.target.value })} 
                placeholder="Akses materi kajian eksklusif..."
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t space-y-4">
          <Label className="text-sm font-bold block">Sidebar CTA / Newsletter</Label>
          <div className="text-[10px] text-muted-foreground mb-4">Ubah info di sidebar kanan (Newsletter/Join WhatsApp).</div>
          
          <div className="grid gap-4">
            <div>
              <Label className="text-[10px]">Judul</Label>
              <Input 
                value={settings.newsletter_title || ""} 
                onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value })} 
                placeholder="Misal: Join Our Newsletter"
              />
            </div>
            <div>
              <Label className="text-[10px]">Deskripsi</Label>
              <Textarea 
                value={settings.newsletter_description || ""} 
                onChange={(e) => setSettings({ ...settings, newsletter_description: e.target.value })} 
                placeholder="Info singkat..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px]">Teks Tombol</Label>
                <Input 
                  value={settings.newsletter_button_text || ""} 
                  onChange={(e) => setSettings({ ...settings, newsletter_button_text: e.target.value })} 
                  placeholder="GABUNG"
                />
              </div>
              <div>
                <Label className="text-[10px]">Link Tujuan (Opsional)</Label>
                <Input 
                  value={settings.newsletter_link || ""} 
                  onChange={(e) => setSettings({ ...settings, newsletter_link: e.target.value })} 
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="text-[10px] italic text-muted-foreground bg-primary/5 p-2 rounded">
              * Jika Link diisi, input email akan disembunyikan dan tombol akan langsung mengarah ke link tersebut.
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-1.5 w-full">
        <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
      )}
    </div>
  );
}
