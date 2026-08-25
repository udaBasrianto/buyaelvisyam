import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Send, ImagePlus, X, CheckCircle2, Image, Youtube, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizManager } from "@/components/admin/QuizManager";
import { Switch } from "@/components/ui/switch";

// --- Shared types (mirror ArticlesManager) ---
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  status: string;
  template_type?: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  views: number;
  is_featured: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: string;
  youtube_url?: string;
  categories?: string[];
}

interface UploadAsset {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_id: string;
  created_at: string;
}

interface ArticleRevision {
  id: string;
  article_id: string;
  title: string;
  excerpt: string;
  status: string;
  template_type?: string;
  scheduled_publish_at?: string | null;
  created_at: string;
}

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  is_active: string;
}

const statusLabel: Record<string, string> = {
  published: "Dipublikasi",
  draft: "Draf",
  review: "Ditinjau",
};

const normalizeStringList = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return normalized.length > 0 ? normalized : fallback;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith("[")) {
      try { return normalizeStringList(JSON.parse(trimmed), fallback); } catch { return fallback; }
    }
    const normalized = trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : fallback;
  }
  return fallback;
};

const normalizeArticle = (article: any): Article => {
  const category = typeof article?.category === "string" && article.category.trim() ? article.category.trim() : "Umum";
  const categories = normalizeStringList(article?.categories, [category]);
  return { ...article, category, categories };
};

const normalizeCategoryList = (value: unknown): DynamicCategory[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DynamicCategory =>
      !!item && typeof item === "object" &&
      typeof (item as DynamicCategory).id === "string" &&
      typeof (item as DynamicCategory).name === "string",
  );
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const isNew = !id || id === "new";

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [dbCategories, setDbCategories] = useState<DynamicCategory[]>([]);

  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", category: "Umum", categories: ["Umum"] as string[],
    cover_image: "", status: "draft", is_featured: false,
    template_type: "kajian", youtube_url: "", scheduled_publish_at: "", published_at: "",
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<UploadAsset[]>([]);
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load article + categories
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: cats } = await api.get("/categories");
        setDbCategories(normalizeCategoryList(cats));

        if (!isNew && id) {
          const { data } = await api.get(`/articles/${id}`);
          const a = normalizeArticle(data);
          setArticle(a);
          setForm({
            title: a.title || "",
            excerpt: a.excerpt || "",
            content: a.content || "",
            category: a.category || "Umum",
            categories: normalizeStringList(a.categories, [a.category || "Umum"]),
            cover_image: a.cover_image || "",
            status: a.status || "draft",
            is_featured: a.is_featured || false,
            template_type: a.template_type || "kajian",
            youtube_url: a.youtube_url || "",
            scheduled_publish_at: a.scheduled_publish_at ? new Date(a.scheduled_publish_at).toISOString().slice(0, 16) : "",
            published_at: a.published_at ? new Date(a.published_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          });
          setPreviewUrl(a.cover_image || null);
          fetchRevisions(a.id).catch(() => {});
        }
      } catch (err: any) {
        toast({ title: "Gagal memuat", description: err.message, variant: "destructive" });
        navigate("/admin/articles", { replace: true });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const fetchMedia = async (q?: string) => {
    setMediaLoading(true);
    try {
      const { data } = await api.get("/admin/assets", { params: { q: (q ?? mediaSearch).trim(), limit: 100 } });
      setMediaItems(Array.isArray(data?.items) ? (data.items as UploadAsset[]) : []);
    } catch (error: any) {
      toast({ title: "Gagal memuat media", description: error.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setMediaLoading(false);
    }
  };

  const fetchRevisions = async (articleId: string) => {
    setRevisionsLoading(true);
    try {
      const { data } = await api.get(`/articles/${articleId}/revisions`, { params: { limit: 50 } });
      setRevisions(Array.isArray(data) ? (data as ArticleRevision[]) : []);
    } catch (error: any) {
      toast({ title: "Gagal memuat revisi", description: error.response?.data?.error || error.message, variant: "destructive" });
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Hanya file gambar", variant: "destructive" });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, cover_image: data.url }));
      setPreviewUrl(data.url);
    } catch (error: any) {
      toast({ title: "Gagal upload", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async (status: string) => {
    if (!user || !form.title.trim() || !form.content.trim()) {
      toast({ title: "Error", description: "Judul dan konten wajib diisi", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: article?.slug || generateSlug(form.title),
      excerpt: form.excerpt.trim() || "",
      content: form.content.trim(),
      category: form.categories.length > 0 ? form.categories[0] : "Umum",
      categories: form.categories.length > 0 ? form.categories : ["Umum"],
      cover_image: form.cover_image.trim() || "",
      status,
      template_type: form.template_type,
      is_featured: form.is_featured,
      youtube_url: form.youtube_url.trim(),
      scheduled_publish_at: form.scheduled_publish_at ? new Date(form.scheduled_publish_at).toISOString() : undefined,
      published_at: form.published_at || undefined,
    };

    try {
      if (!isNew && article) {
        await api.put(`/articles/${article.id}`, payload);
      } else {
        await api.post("/articles", payload);
      }
      toast({ title: "Berhasil", description: !isNew ? "Artikel diperbarui" : "Artikel ditambahkan" });
      navigate("/admin/articles");
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || "Gagal menyimpan artikel", variant: "destructive" });
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!article) return;
    if (!confirm("Restore revisi ini? Perubahan terbaru akan disimpan sebagai revisi baru.")) return;
    try {
      const { data } = await api.post(`/articles/${article.id}/revisions/${revId}/restore`);
      const restoredArticle = normalizeArticle(data);
      setArticle(restoredArticle);
      setForm({
        title: restoredArticle.title || "",
        excerpt: restoredArticle.excerpt || "",
        content: restoredArticle.content || "",
        category: restoredArticle.category || "Umum",
        categories: normalizeStringList(restoredArticle.categories, [restoredArticle.category || "Umum"]),
        cover_image: restoredArticle.cover_image || "",
        status: restoredArticle.status || "draft",
        is_featured: !!restoredArticle.is_featured,
        template_type: restoredArticle.template_type || "kajian",
        youtube_url: restoredArticle.youtube_url || "",
        scheduled_publish_at: restoredArticle.scheduled_publish_at ? new Date(restoredArticle.scheduled_publish_at).toISOString().slice(0, 16) : "",
        published_at: restoredArticle.published_at ? new Date(restoredArticle.published_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
      setPreviewUrl(restoredArticle.cover_image || null);
      toast({ title: "Berhasil", description: "Revisi berhasil direstore" });
      fetchRevisions(article.id).catch(() => {});
    } catch (error: any) {
      toast({ title: "Gagal restore revisi", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const editorActionButtons = (
    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
      <Button variant="outline" onClick={() => handleSave("draft")} className="gap-1.5">
        <Save className="h-4 w-4" /> Simpan Draf
      </Button>
      <Button variant="secondary" onClick={() => handleSave("review")} className="gap-1.5">
        <Send className="h-4 w-4" /> Review
      </Button>
      <Button onClick={() => handleSave("published")} className="gap-1.5">
        <CheckCircle2 className="h-4 w-4" /> Publikasikan
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/articles" className="text-muted-foreground hover:text-primary transition flex items-center gap-1.5">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-bold text-foreground">{isNew ? "Tambah Artikel Baru" : "Edit Artikel"}</h1>
            {article && (
              <span className="text-xs text-muted-foreground truncate max-w-[300px]">{article.title}</span>
            )}
          </div>
          <Link to="/admin/articles">
            <Button variant="outline" size="sm" className="gap-1.5">
              <X className="h-4 w-4" /> Kembali ke Daftar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 xl:w-auto">
            <TabsTrigger value="content">Konten Artikel</TabsTrigger>
            <TabsTrigger value="quiz" disabled={isNew}>Kuis Artikel</TabsTrigger>
            <TabsTrigger value="revisions" disabled={isNew}>Revisi</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
              {/* Left: Editor */}
              <div className="min-w-0 space-y-4 rounded-2xl border bg-background/40 p-4 md:p-5">
                <div>
                  <Label>Judul</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul artikel..." />
                </div>
                <div>
                  <Label>Ringkasan</Label>
                  <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat..." />
                </div>
                <div>
                  <Label>Konten</Label>
                  <RichTextEditor
                    value={form.content}
                    onChange={(html) => setForm({ ...form, content: html })}
                    placeholder="Tulis konten artikel..."
                    minHeight="640px"
                  />
                </div>
              </div>

              {/* Right: Settings sidebar */}
              <div className="space-y-4 xl:sticky xl:top-24">
                {/* Actions */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <div>
                    <div className="text-sm font-bold">Aksi Artikel</div>
                    <p className="text-xs text-muted-foreground">Simpan perubahan tanpa perlu scroll ke bawah.</p>
                  </div>
                  {editorActionButtons}
                </div>

                {/* Published Date */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Tanggal Terbit
                  </Label>
                  <Input
                    type="date"
                    value={form.published_at}
                    onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Tanggal yang ditampilkan di daftar artikel sebagai tanggal publikasi.</p>
                </div>

                {/* Schedule */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Jadwalkan Publish (Opsional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_publish_at}
                    onChange={(e) => setForm({ ...form, scheduled_publish_at: e.target.value })}
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Jika diisi dan status artikel "Review", sistem akan publish otomatis sesuai jadwal.</p>
                </div>

                {/* Template */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <Label>Template Artikel</Label>
                  <Select value={form.template_type} onValueChange={(v) => setForm({ ...form, template_type: v })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kajian">Kajian</SelectItem>
                      <SelectItem value="berita">Berita</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="tanya_jawab">Tanya Jawab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categories */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <Label className="block mb-2 text-sm font-semibold">Kategori (Bisa pilih lebih dari satu)</Label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-accent/5">
                    {dbCategories.length > 0 ? (
                      dbCategories.map((c) => {
                        const isSelected = form.categories.includes(c.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              let nextCategories = [...form.categories];
                              if (isSelected) {
                                if (nextCategories.length > 1) nextCategories = nextCategories.filter((name) => name !== c.name);
                                else {
                                  toast({ title: "Info", description: "Minimal harus memilih satu kategori." });
                                  return;
                                }
                              } else {
                                nextCategories.push(c.name);
                              }
                              setForm({ ...form, categories: nextCategories, category: nextCategories[0] || "Umum" });
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 hover:scale-105 flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25"
                                : "bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                            {c.name}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">Tidak ada kategori.</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Kategori pertama yang Anda pilih akan digunakan sebagai kategori utama.</p>
                </div>

                {/* Editor's Choice */}
                <div className="flex items-center justify-between rounded-2xl border bg-accent/10 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Editor's Choice</Label>
                    <p className="text-xs text-muted-foreground">Tampilkan artikel ini di bagian Editor's Choice beranda</p>
                  </div>
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                </div>

                {/* YouTube */}
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <Label className="text-sm font-bold uppercase tracking-wider">Video YouTube (Optional)</Label>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase">Link YouTube</Label>
                    <Input
                      value={form.youtube_url}
                      onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                      className="h-9"
                    />
                    <p className="text-[10px] text-muted-foreground italic mt-1">Video akan tampil otomatis di akhir artikel.</p>
                  </div>
                  {form.youtube_url && (
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Link YouTube terdeteksi
                    </div>
                  )}
                </div>

                {/* Cover Image */}
                <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                  <Label>Gambar Cover</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {previewUrl || form.cover_image ? (
                    <div className="relative mt-2 rounded-lg overflow-hidden border">
                      <img src={previewUrl || form.cover_image} alt="Cover" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        onClick={() => { setPreviewUrl(null); setForm((f) => ({ ...f, cover_image: "" })); }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full mt-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <ImagePlus className="h-4 w-4" />
                      {uploading ? "Mengupload..." : "Upload Gambar Cover"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2 gap-2"
                    onClick={() => { setMediaDialogOpen(true); fetchMedia("").catch(() => {}); }}
                  >
                    <Image className="h-4 w-4" />
                    Pilih dari Media Library
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile action buttons */}
            <div className="flex gap-2 flex-wrap pt-4 xl:hidden">
              {editorActionButtons}
            </div>
          </TabsContent>

          {/* Quiz tab */}
          <TabsContent value="quiz">
            {!isNew && article ? (
              <QuizManager articleId={article.id} articleContent={form.content} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">Simpan artikel terlebih dahulu untuk mengelola kuis.</div>
            )}
          </TabsContent>

          {/* Revisions tab */}
          <TabsContent value="revisions" className="space-y-4">
            {isNew ? (
              <div className="py-8 text-center text-muted-foreground">Simpan artikel terlebih dahulu untuk melihat revisi.</div>
            ) : revisionsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Memuat revisi...</div>
            ) : revisions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Belum ada revisi.</div>
            ) : (
              <div className="space-y-3">
                {revisions.map((r) => (
                  <div key={r.id} className="rounded-2xl border bg-background/50 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{r.title || "Tanpa Judul"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · {statusLabel[r.status] || r.status}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleRestoreRevision(r.id)}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Media Library Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription className="sr-only">Pilih gambar dari media library untuk cover artikel.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Cari URL / nama file..." />
            <Button variant="outline" onClick={() => fetchMedia().catch(() => {})} disabled={mediaLoading}>Cari</Button>
          </div>
          {mediaLoading ? (
            <div className="py-10 text-center text-muted-foreground">Memuat media...</div>
          ) : mediaItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Belum ada media.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-2">
              {mediaItems.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="rounded-2xl border overflow-hidden text-left hover:bg-muted/30 transition-colors"
                  onClick={() => {
                    setForm((f) => ({ ...f, cover_image: m.url }));
                    setPreviewUrl(m.url);
                    setMediaDialogOpen(false);
                  }}
                >
                  <div className="w-full h-28 bg-muted/20">
                    <img src={m.url} alt={m.filename || "media"} className="w-full h-28 object-cover" />
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold truncate">{m.filename || m.url}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.url}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}