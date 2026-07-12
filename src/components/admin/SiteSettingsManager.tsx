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
  default_article_image?: string | null;
  footer_text: string;
  google_client_id?: string;
  whatsapp_notifications_enabled?: boolean;
  whatsapp_notify_new_article?: boolean;
  whatsapp_notify_new_course?: boolean;
  whatsapp_notify_max_recipients?: number;
  whatsapp_template_new_article?: string;
  whatsapp_template_new_course?: string;
  homepage_version: string;
  slider_style: string;
  scroll_to_top_version: string;
  admin_token?: string;
  admin_slug?: string;
  hero_title?: string;
  recent_title?: string;
  recent_limit?: number;
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
  products_menu_label?: string;
  products_title?: string;
  products_subtitle?: string;
  checkout_web_enabled?: boolean;
  checkout_whatsapp_enabled?: boolean;
  checkout_whatsapp_number?: string;
  checkout_instructions?: string;
  checkout_flat_shipping_enabled?: boolean;
  checkout_flat_shipping_amount?: number;
  checkout_flat_shipping_label?: string;
  checkout_payment_due_hours?: number;
  show_feature_bar?: boolean;
  show_chatbot?: boolean;
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
        default_article_image: settings.default_article_image,
        footer_text: settings.footer_text.trim(),
        google_client_id: settings.google_client_id?.trim() || "",
        whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled ?? false,
        whatsapp_notify_new_article: settings.whatsapp_notify_new_article ?? true,
        whatsapp_notify_new_course: settings.whatsapp_notify_new_course ?? true,
        whatsapp_notify_max_recipients: Number(settings.whatsapp_notify_max_recipients) || 200,
        whatsapp_template_new_article: settings.whatsapp_template_new_article || "",
        whatsapp_template_new_course: settings.whatsapp_template_new_course || "",
        homepage_version: settings.homepage_version,
        slider_style: settings.slider_style,
        scroll_to_top_version: settings.scroll_to_top_version,
        admin_token: settings.admin_token?.trim() || "090124",
        admin_slug: settings.admin_slug?.trim() || "yaakhi",
        hero_title: settings.hero_title?.trim() || "Editors Choice",
        recent_title: settings.recent_title?.trim() || "Recent Stories",
        recent_limit: Number(settings.recent_limit) || 20,
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
        products_menu_label: settings.products_menu_label?.trim() || "Produk",
        products_title: settings.products_title?.trim() || "Daftar Produk",
        products_subtitle: settings.products_subtitle?.trim() || "Lihat produk fisik dan digital yang tersedia.",
        checkout_web_enabled: settings.checkout_web_enabled ?? true,
        checkout_whatsapp_enabled: settings.checkout_whatsapp_enabled ?? true,
        checkout_whatsapp_number: settings.checkout_whatsapp_number?.trim() || "",
        checkout_instructions: settings.checkout_instructions?.trim() || "",
        checkout_flat_shipping_enabled: settings.checkout_flat_shipping_enabled ?? false,
        checkout_flat_shipping_amount: Number(settings.checkout_flat_shipping_amount) || 0,
        checkout_flat_shipping_label: settings.checkout_flat_shipping_label?.trim() || "Ongkos Kirim",
        checkout_payment_due_hours: Number(settings.checkout_payment_due_hours) || 24,
        show_feature_bar: settings.show_feature_bar ?? true,
        show_chatbot: settings.show_chatbot ?? true,
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

              <div className="flex items-center justify-between p-4 border rounded-2xl bg-card/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Aktifkan Widget AI Chatbot</Label>
                  <p className="text-xs text-muted-foreground">Tampilkan atau sembunyikan tombol chat asisten AI yang mengambang di seluruh halaman website.</p>
                </div>
                <Switch 
                  checked={settings.show_chatbot ?? true} 
                  onCheckedChange={(v) => setSettings({ ...settings, show_chatbot: v })} 
                />
              </div>

              <FeaturesManager />
        </div>
      ) : (
        <div className="bg-card rounded-xl card-shadow p-6 w-full space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-2xl bg-card/50">
        <div className="space-y-0.5">
          <Label className="text-base font-bold">Aktifkan Widget Chatbot</Label>
          <p className="text-xs text-muted-foreground">Tampilkan atau sembunyikan chatbot di website.</p>
        </div>
        <Switch 
          checked={settings.show_chatbot ?? true} 
          onCheckedChange={(v) => setSettings({ ...settings, show_chatbot: v })} 
        />
      </div>
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
        <Label>Cover Artikel Default</Label>
        {settings.default_article_image ? (
          <div className="relative mt-2 inline-block rounded-lg border bg-accent/30 p-3">
            <img src={settings.default_article_image} alt="Default Article Cover" className="h-16 w-auto object-contain" />
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              onClick={() => setSettings({ ...settings, default_article_image: null })}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              className="mt-2 gap-2"
              onClick={() => handleGeneralUpload('default_article_image')}
            >
              <ImagePlus className="h-4 w-4" />
              Upload Cover Default
            </Button>
          </div>
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
            <Label className="text-[10px]">Jumlah Tampilan Artikel Terbaru</Label>
            <Input 
              type="number"
              min={1}
              max={100}
              value={settings.recent_limit ?? 20} 
              onChange={(e) => setSettings({ ...settings, recent_limit: parseInt(e.target.value) || 20 })} 
              placeholder="Contoh: 20"
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

        <div>
          <Label className="text-sm font-bold mb-1 block">Google Client ID</Label>
          <div className="text-[10px] text-muted-foreground mb-3">Masukkan Client ID dari Google OAuth / Google Identity Services untuk tombol Login Google.</div>
          <Input 
            type="text" 
            value={settings.google_client_id || ""} 
            onChange={(e) => setSettings({ ...settings, google_client_id: e.target.value })} 
            placeholder="xxxxx.apps.googleusercontent.com"
          />
        </div>

        <div className="pt-6 border-t space-y-4">
          <Label className="text-sm font-bold block">Notifikasi WhatsApp</Label>
          <div className="text-[10px] text-muted-foreground">
            Mengirim broadcast saat artikel/kursus dipublikasikan. Syarat: WhatsApp service harus enabled & connected, dan user sudah verifikasi nomor.
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div className="space-y-0.5">
              <div className="font-bold">Aktifkan Notifikasi</div>
              <div className="text-xs text-muted-foreground">Jika dimatikan, tidak akan mengirim broadcast.</div>
            </div>
            <Switch
              checked={settings.whatsapp_notifications_enabled ?? false}
              onCheckedChange={(v) => setSettings({ ...settings, whatsapp_notifications_enabled: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Artikel Baru</div>
                <div className="text-xs text-muted-foreground">Broadcast saat artikel publish.</div>
              </div>
              <Switch
                checked={settings.whatsapp_notify_new_article ?? true}
                onCheckedChange={(v) => setSettings({ ...settings, whatsapp_notify_new_article: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Kursus Baru</div>
                <div className="text-xs text-muted-foreground">Broadcast saat kursus publish.</div>
              </div>
              <Switch
                checked={settings.whatsapp_notify_new_course ?? true}
                onCheckedChange={(v) => setSettings({ ...settings, whatsapp_notify_new_course: v })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Maks Penerima</Label>
              <Input
                type="number"
                value={String(settings.whatsapp_notify_max_recipients ?? 200)}
                onChange={(e) => setSettings({ ...settings, whatsapp_notify_max_recipients: Number(e.target.value) || 0 })}
                placeholder="200"
              />
              <div className="text-[10px] text-muted-foreground">Batasi broadcast agar tidak membebani server.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Template Artikel</Label>
              <Textarea
                value={settings.whatsapp_template_new_article || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_template_new_article: e.target.value })}
                placeholder="Assalamu'alaikum, ada artikel baru di {site}: {title}\n\nBaca: {url}"
                rows={4}
              />
              <div className="text-[10px] text-muted-foreground">Placeholder: {`{site} {title} {url}`}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Template Kursus</Label>
              <Textarea
                value={settings.whatsapp_template_new_course || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_template_new_course: e.target.value })}
                placeholder="Assalamu'alaikum, ada kursus baru di {site}: {title}\n\nLihat: {url}"
                rows={4}
              />
              <div className="text-[10px] text-muted-foreground">Placeholder: {`{site} {title} {url}`}</div>
            </div>
          </div>
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
          <Label className="text-sm font-bold block">Konfigurasi Halaman Produk</Label>
          <div className="text-[10px] text-muted-foreground mb-4">Ubah nama menu, judul, dan sub-judul halaman produk secara dinamis.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-[10px]">Label Menu Navigasi</Label>
              <Input 
                value={settings.products_menu_label || ""} 
                onChange={(e) => setSettings({ ...settings, products_menu_label: e.target.value })} 
                placeholder="Produk"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Nama yang tampil di navbar & breadcrumb</p>
            </div>
            <div>
              <Label className="text-[10px]">Judul Halaman Produk</Label>
              <Input 
                value={settings.products_title || ""} 
                onChange={(e) => setSettings({ ...settings, products_title: e.target.value })} 
                placeholder="Daftar Produk"
              />
            </div>
            <div>
              <Label className="text-[10px]">Subtitle Halaman Produk</Label>
              <Input 
                value={settings.products_subtitle || ""} 
                onChange={(e) => setSettings({ ...settings, products_subtitle: e.target.value })} 
                placeholder="Lihat produk fisik dan digital yang tersedia."
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t space-y-4">
          <Label className="text-sm font-bold block">Konfigurasi Checkout Produk</Label>
          <div className="text-[10px] text-muted-foreground mb-4">Atur metode order yang tersedia untuk pembeli dan kontak WhatsApp tujuan checkout.</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Aktifkan Order via Web</div>
                <div className="text-xs text-muted-foreground">Pembeli bisa membuat order langsung ke sistem admin.</div>
              </div>
              <Switch
                checked={settings.checkout_web_enabled ?? true}
                onCheckedChange={(v) => setSettings({ ...settings, checkout_web_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Aktifkan Order via WhatsApp</div>
                <div className="text-xs text-muted-foreground">Pembeli membuat order lalu diarahkan ke WhatsApp admin.</div>
              </div>
              <Switch
                checked={settings.checkout_whatsapp_enabled ?? true}
                onCheckedChange={(v) => setSettings({ ...settings, checkout_whatsapp_enabled: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px]">Nomor WhatsApp Checkout</Label>
              <Input
                value={settings.checkout_whatsapp_number || ""}
                onChange={(e) => setSettings({ ...settings, checkout_whatsapp_number: e.target.value })}
                placeholder="628xxxxxxxxxx"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Dipakai saat pembeli memilih order via WhatsApp.</p>
            </div>
            <div>
              <Label className="text-[10px]">Instruksi Checkout</Label>
              <Textarea
                value={settings.checkout_instructions || ""}
                onChange={(e) => setSettings({ ...settings, checkout_instructions: e.target.value })}
                placeholder="Contoh: Setelah order dibuat, tunggu admin menghubungi Anda atau lanjutkan konfirmasi via WhatsApp."
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4 md:col-span-1">
              <div className="space-y-0.5">
                <div className="font-bold">Aktifkan Ongkir Flat</div>
                <div className="text-xs text-muted-foreground">Pakai ongkir tetap untuk checkout produk fisik.</div>
              </div>
              <Switch
                checked={settings.checkout_flat_shipping_enabled ?? false}
                onCheckedChange={(v) => setSettings({ ...settings, checkout_flat_shipping_enabled: v })}
              />
            </div>
            <div>
              <Label className="text-[10px]">Label Ongkir</Label>
              <Input
                value={settings.checkout_flat_shipping_label || ""}
                onChange={(e) => setSettings({ ...settings, checkout_flat_shipping_label: e.target.value })}
                placeholder="Ongkos Kirim"
              />
            </div>
            <div>
              <Label className="text-[10px]">Nominal Ongkir Flat</Label>
              <Input
                type="number"
                value={String(settings.checkout_flat_shipping_amount ?? 0)}
                onChange={(e) => setSettings({ ...settings, checkout_flat_shipping_amount: Number(e.target.value) || 0 })}
                placeholder="15000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px]">Batas Waktu Pembayaran (jam)</Label>
              <Input
                type="number"
                value={String(settings.checkout_payment_due_hours ?? 24)}
                onChange={(e) => setSettings({ ...settings, checkout_payment_due_hours: Number(e.target.value) || 24 })}
                placeholder="24"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Dipakai untuk order via web dengan transfer manual.</p>
            </div>
            <div className="rounded-xl border p-4 text-xs text-muted-foreground bg-muted/30">
              Order via web sekarang diarahkan ke alur transfer manual. Pastikan rekening bank aktif tersedia di menu donasi
              agar instruksi pembayaran dapat tampil pada halaman konfirmasi order.
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
