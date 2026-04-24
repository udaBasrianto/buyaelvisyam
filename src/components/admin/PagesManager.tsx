import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Layout, Image as ImageIcon, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  show_in_nav: boolean;
  nav_order: number;
  template_type: string;
  hero_image: string;
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const empty = {
  id: "", title: "", slug: "", content: "", excerpt: "",
  status: "published", show_in_nav: true, nav_order: 0,
  template_type: "standard", hero_image: "",
  about_hero_image: "", about_vision_image_1: "", about_vision_image_2: "",
  about_value_1_title: "", about_value_1_desc: "",
  about_value_2_title: "", about_value_2_desc: "",
  about_value_3_title: "", about_value_3_desc: "",
  about_contact_email: "", about_contact_phone: "",
  about_footer_quote: "", about_footer_author: "",
};

const TEMPLATE_OPTIONS = [
  {
    value: "standard",
    label: "Standard",
    desc: "Satu kolom bersih — ideal untuk kebijakan, artikel panjang",
    icon: "📄",
  },
  {
    value: "landing",
    label: "Landing Page",
    desc: "Full-width, hero besar, seksi modern ala Elementor",
    icon: "🚀",
  },
  {
    value: "sidebar",
    label: "With Sidebar",
    desc: "Konten utama + sidebar widget (artikel terbaru, kategori)",
    icon: "📰",
  },
];

export function PagesManager() {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/pages");
      if (data) setPages(data as Page[]);
    } catch (error: any) {
      toast({ title: "Gagal memuat halaman", description: error.message, variant: "destructive" });
      setPages([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (p: Page) => {
    setForm({
      ...empty,
      id: p.id, title: p.title, slug: p.slug, content: p.content,
      excerpt: p.excerpt ?? "", status: p.status,
      show_in_nav: p.show_in_nav, nav_order: p.nav_order,
      template_type: p.template_type || "standard",
      hero_image: p.hero_image || "",
    });
    // If it's about page, fetch current images from settings
    if (p.slug === "tentang" || p.slug === "tentang-kami") {
       api.get("/settings").then(({ data }) => {
          setForm(f => ({ 
            ...f, 
            about_hero_image: data.about_hero_image,
            about_vision_image_1: data.about_vision_image_1,
            about_vision_image_2: data.about_vision_image_2,
            about_value_1_title: data.about_value_1_title,
            about_value_1_desc: data.about_value_1_desc,
            about_value_2_title: data.about_value_2_title,
            about_value_2_desc: data.about_value_2_desc,
            about_value_3_title: data.about_value_3_title,
            about_value_3_desc: data.about_value_3_desc,
            about_contact_email: data.about_contact_email,
            about_contact_phone: data.about_contact_phone,
            about_footer_quote: data.about_footer_quote,
            about_footer_author: data.about_footer_author,
          }));
       });
    }
    setOpen(true);
  };

  const handleHeroUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("image", file);
        const { data } = await api.post("/upload", fd);
        setForm(f => ({ ...f, hero_image: data.url }));
        toast({ title: "Gambar hero berhasil diupload" });
      } catch {
        toast({ title: "Upload gagal", variant: "destructive" });
      }
      setUploading(false);
    };
    input.click();
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);
    const slug = (form.slug || slugify(form.title)).trim();
    const payload = {
      title: form.title.trim(),
      slug,
      content: form.content,
      excerpt: form.excerpt || null,
      status: form.status,
      show_in_nav: form.show_in_nav,
      nav_order: Number(form.nav_order) || 0,
      template_type: form.template_type,
      hero_image: form.hero_image,
    };

    try {
      if (form.id) {
        await api.put(`/pages/${form.id}`, payload);
      } else {
        await api.post("/pages", payload);
      }
      if (form.slug === "tentang" || form.slug === "tentang-kami") {
        await api.put("/settings", {
          about_hero_image: form.about_hero_image,
          about_vision_image_1: form.about_vision_image_1,
          about_vision_image_2: form.about_vision_image_2,
          about_value_1_title: form.about_value_1_title,
          about_value_1_desc: form.about_value_1_desc,
          about_value_2_title: form.about_value_2_title,
          about_value_2_desc: form.about_value_2_desc,
          about_value_3_title: form.about_value_3_title,
          about_value_3_desc: form.about_value_3_desc,
          about_contact_email: form.about_contact_email,
          about_contact_phone: form.about_contact_phone,
          about_footer_quote: form.about_footer_quote,
          about_footer_author: form.about_footer_author,
        });
      }
      toast({ title: form.id ? "Halaman diperbarui" : "Halaman dibuat" });
      setOpen(false);
      load();
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleStatus = async (p: Page) => {
    const next = p.status === "published" ? "hidden" : "published";
    try {
      await api.put(`/pages/${p.id}`, { status: next });
      load();
    } catch {
      toast({ title: "Gagal mengubah status", variant: "destructive" });
    }
  };

  const toggleNav = async (p: Page) => {
    try {
      await api.put(`/pages/${p.id}`, { show_in_nav: !p.show_in_nav });
      load();
    } catch {
       toast({ title: "Gagal mengubah menu", variant: "destructive" });
    }
  };

  const remove = async (p: Page) => {
    if (!confirm(`Hapus halaman "${p.title}"?`)) return;
    try {
      await api.delete(`/pages/${p.id}`);
      toast({ title: "Halaman dihapus" });
      load();
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const templateLabel = (t: string) => TEMPLATE_OPTIONS.find(o => o.value === t)?.label || "Standard";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Kelola Halaman</h3>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah Halaman
        </Button>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Memuat...</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Belum ada halaman. Klik "Tambah Halaman" untuk mulai.
          </div>
        ) : (
          <div className="divide-y">
            {pages.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{p.title}</p>
                    <Badge variant="outline" className={p.status === "published"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground"}>
                      {p.status === "published" ? "Publish" : "Hidden"}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                      <Layout className="h-3 w-3 mr-1" />
                      {templateLabel(p.template_type)}
                    </Badge>
                    {p.show_in_nav && (
                      <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground border-secondary/30">
                        Di Menu
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">/p/{p.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title={p.status === "published" ? "Sembunyikan" : "Publish"} onClick={() => toggleStatus(p)}>
                    {p.status === "published" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" title="Toggle menu" onClick={() => toggleNav(p)}>
                    <span className="text-xs font-medium">{p.show_in_nav ? "Menu✓" : "Menu"}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Halaman" : "Tambah Halaman Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Template Selector */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 border border-primary/20">
              <Label className="text-primary font-bold uppercase tracking-widest text-[10px] mb-3 block">
                Pilih Template Layout
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TEMPLATE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, template_type: opt.value })}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.template_type === opt.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <p className={`font-bold text-sm mb-1 ${form.template_type === opt.value ? "text-primary" : "text-foreground"}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                    {form.template_type === opt.value && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Image Uploader (for landing & sidebar templates) */}
            {(form.template_type === "landing" || form.template_type === "sidebar") && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <Label className="text-foreground font-bold uppercase tracking-widest text-[10px] mb-3 block">
                  <ImageIcon className="h-3.5 w-3.5 inline mr-1.5" />
                  Gambar Hero (Header)
                </Label>
                <div className="relative aspect-[3/1] rounded-xl border-2 border-dashed border-border bg-background overflow-hidden group">
                  {form.hero_image ? (
                    <>
                      <img src={form.hero_image} className="w-full h-full object-cover" alt="Hero" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button size="sm" variant="secondary" onClick={handleHeroUpload} disabled={uploading}>
                          <Upload className="h-4 w-4 mr-1.5" />
                          Ganti
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setForm({ ...form, hero_image: "" })}>
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Hapus
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleHeroUpload}
                      disabled={uploading}
                      className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <Upload className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">{uploading ? "Mengupload..." : "Klik untuk upload gambar hero"}</span>
                      <span className="text-[10px] mt-1 opacity-60">Rasio 3:1 disarankan (1200×400)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Judul</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })}
                  placeholder="Tentang Kami"
                />
              </div>
              <div>
                <Label>Slug URL</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="tentang-kami"
                />
                <p className="text-xs text-muted-foreground mt-1">URL: /p/{form.slug || "slug-halaman"}</p>
              </div>
            </div>
            <div>
              <Label>Ringkasan (opsional)</Label>
              <Input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Deskripsi singkat halaman — tampil di hero & SEO meta"
              />
            </div>
            <div>
              <Label>Konten</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="Tulis konten halaman di sini..."
                minHeight="260px"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="cursor-pointer">Publish</Label>
                  <p className="text-xs text-muted-foreground">Tampil ke pengunjung</p>
                </div>
                <Switch
                  checked={form.status === "published"}
                  onCheckedChange={(v) => setForm({ ...form, status: v ? "published" : "hidden" })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="cursor-pointer">Tampil di Menu</Label>
                  <p className="text-xs text-muted-foreground">Muncul di navbar</p>
                </div>
                <Switch
                  checked={form.show_in_nav}
                  onCheckedChange={(v) => setForm({ ...form, show_in_nav: v })}
                />
              </div>
            </div>

            { (form.slug === "tentang" || form.slug === "tentang-kami") && (
              <>
                 <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                    <Label className="text-primary font-bold uppercase tracking-widest text-[10px]">Aset Visual Halaman Tentang</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-1.5">
                          <Label className="text-[10px]">Gambar Hero</Label>
                          <div className="relative aspect-video rounded-lg border overflow-hidden bg-background">
                             {form.about_hero_image ? <img src={form.about_hero_image} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">Kosong</div>}
                             <button onClick={() => {
                                const input = document.createElement('input'); input.type='file'; input.accept='image/*';
                                input.onchange = async (e:any) => {
                                   const fd = new FormData(); fd.append("image", e.target.files[0]);
                                   const {data} = await api.post("/upload", fd);
                                   setForm({...form, about_hero_image: data.url});
                                }; input.click();
                             }} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">UBAH</button>
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-[10px]">Visi (Kiri)</Label>
                          <div className="relative aspect-square rounded-lg border overflow-hidden bg-background">
                             {form.about_vision_image_1 ? <img src={form.about_vision_image_1} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">Kosong</div>}
                             <button onClick={() => {
                                const input = document.createElement('input'); input.type='file'; input.accept='image/*';
                                input.onchange = async (e:any) => {
                                   const fd = new FormData(); fd.append("image", e.target.files[0]);
                                   const {data} = await api.post("/upload", fd);
                                   setForm({...form, about_vision_image_1: data.url});
                                }; input.click();
                             }} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">UBAH</button>
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-[10px]">Misi (Kanan)</Label>
                          <div className="relative aspect-square rounded-lg border overflow-hidden bg-background">
                             {form.about_vision_image_2 ? <img src={form.about_vision_image_2} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">Kosong</div>}
                             <button onClick={() => {
                                const input = document.createElement('input'); input.type='file'; input.accept='image/*';
                                input.onchange = async (e:any) => {
                                   const fd = new FormData(); fd.append("image", e.target.files[0]);
                                   const {data} = await api.post("/upload", fd);
                                   setForm({...form, about_vision_image_2: data.url});
                                }; input.click();
                             }} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">UBAH</button>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-4">
                    <Label className="text-foreground font-bold uppercase tracking-widest text-[10px]">Konten: Nilai-Nilai Utama</Label>
                    <div className="space-y-4">
                       {[1, 2, 3].map(i => (
                          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-background rounded-xl border border-border/50">
                             <div className="space-y-1.5">
                                <Label className="text-[10px]">Judul Nilai {i}</Label>
                                <Input 
                                  value={(form as any)[`about_value_${i}_title`]} 
                                  onChange={e => setForm({...form, [`about_value_${i}_title`]: e.target.value})} 
                                  placeholder="Contoh: Integritas Ilmu"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <Label className="text-[10px]">Deskripsi Nilai {i}</Label>
                                <Input 
                                  value={(form as any)[`about_value_${i}_desc`]} 
                                  onChange={e => setForm({...form, [`about_value_${i}_desc`]: e.target.value})} 
                                  placeholder="Deskripsi singkat..."
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-4">
                    <Label className="text-foreground font-bold uppercase tracking-widest text-[10px]">Konten: Info Kontak & Footer</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <Label className="text-[10px]">Email Kontak</Label>
                          <Input value={form.about_contact_email} onChange={e => setForm({...form, about_contact_email: e.target.value})} placeholder="kontak@web.com" />
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-[10px]">Nomor HP/WA</Label>
                          <Input value={form.about_contact_phone} onChange={e => setForm({...form, about_contact_phone: e.target.value})} placeholder="+62..." />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px]">Quote Footer (Kutipan)</Label>
                       <Input value={form.about_footer_quote} onChange={e => setForm({...form, about_footer_quote: e.target.value})} placeholder="Sampaikanlah dariku walau satu ayat..." />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px]">Penulis Quote</Label>
                       <Input value={form.about_footer_author} onChange={e => setForm({...form, about_footer_author: e.target.value})} placeholder="HR. Bukhari" />
                    </div>
                 </div>
              </>
            )}

            <div>
              <Label>Urutan Menu</Label>
              <Input
                type="number"
                value={form.nav_order}
                onChange={(e) => setForm({ ...form, nav_order: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
