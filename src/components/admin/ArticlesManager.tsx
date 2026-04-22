import { useState, useEffect, useRef } from "react";
import { Plus, Search, Edit, Trash2, Eye, Save, Send, ImagePlus, X, CheckCircle2, Download, Image, MapPin, Youtube, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizManager } from "./QuizManager";
import { Switch } from "@/components/ui/switch";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  status: string;
  views: number;
  is_featured: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  youtube_url?: string;
}

const statusColor: Record<string, string> = {
  published: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-border",
  review: "bg-secondary/20 text-secondary-foreground border-secondary/30",
};

const statusLabel: Record<string, string> = {
  published: "Dipublikasi",
  draft: "Draf",
  review: "Ditinjau",
};

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  is_active: string;
}

interface ArticlesManagerProps {
  onWpImportClick?: () => void;
}

export function ArticlesManager({ onWpImportClick }: ArticlesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [dbCategories, setDbCategories] = useState<DynamicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", category: "Umum", cover_image: "", status: "draft", is_featured: false,
    location_name: "", latitude: 0, longitude: 0, youtube_url: "", published_at: "",
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteFilters, setBulkDeleteFilters] = useState({
    category: "all",
    startDate: "",
    endDate: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Bulk Image Update State ---
  const [bulkImageDialogOpen, setBulkImageDialogOpen] = useState(false);
  const [bulkImageCategory, setBulkImageCategory] = useState("all");
  const [bulkImageUrl, setBulkImageUrl] = useState("");
  const [bulkImagePreview, setBulkImagePreview] = useState<string | null>(null);
  const [bulkImageUploading, setBulkImageUploading] = useState(false);
  const [bulkImageLoading, setBulkImageLoading] = useState(false);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get("/articles", { params: { limit: 1000, status: "all" } }),
        api.get("/categories")
      ]);
      
      if (articlesRes.data) setArticles(articlesRes.data as Article[]);
      if (categoriesRes.data) setDbCategories(categoriesRes.data as DynamicCategory[]);
    } catch (error: any) {
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm((f) => ({ ...f, cover_image: data.url }));
      setPreviewUrl(data.url);
    } catch (error: any) {
      toast({ title: "Gagal upload", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const openEditor = (article?: Article) => {
    if (article) {
      setEditing(article);
      setForm({
        title: article.title,
        excerpt: article.excerpt || "",
        content: article.content,
        category: article.category,
        cover_image: article.cover_image || "",
        status: article.status,
        is_featured: article.is_featured || false,
        location_name: article.location_name || "",
        latitude: article.latitude || 0,
        longitude: article.longitude || 0,
        youtube_url: article.youtube_url || "",
        published_at: article.created_at ? new Date(article.created_at).toISOString().slice(0, 16) : "",
      });
      setPreviewUrl(article.cover_image || null);
    } else {
      setEditing(null);
      setForm({ title: "", excerpt: "", content: "", category: "Umum", cover_image: "", status: "draft", is_featured: false, location_name: "", latitude: -6.2088, longitude: 106.8456, youtube_url: "", published_at: new Date().toISOString().slice(0, 16) });
      setPreviewUrl(null);
    }
    setEditorOpen(true);
  };

  const handleSave = async (status: string) => {
    if (!user || !form.title.trim() || !form.content.trim()) {
      toast({ title: "Error", description: "Judul dan konten wajib diisi", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: editing?.slug || generateSlug(form.title),
      excerpt: form.excerpt.trim() || "",
      content: form.content.trim(),
      category: form.category,
      cover_image: form.cover_image.trim() || "",
      status,
      is_featured: form.is_featured,
      location_name: form.location_name.trim(),
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
      youtube_url: form.youtube_url.trim(),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined,
    };
    
    try {
      if (editing) {
        await api.put(`/articles/${editing.id}`, payload);
      } else {
        await api.post("/articles", payload);
      }
      toast({ title: "Berhasil", description: editing ? "Artikel diperbarui" : "Artikel ditambahkan" });
      setEditorOpen(false);
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || "Gagal menyimpan artikel", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/articles/${deleteId}`);
      toast({ title: "Dihapus", description: "Artikel berhasil dihapus" });
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
    setDeleteId(null);
  };
  const handleQuickPublish = async (a: Article) => {
    const newStatus = a.status === "published" ? "draft" : "published";
    try {
      await api.put(`/articles/${a.id}`, { status: newStatus });
      toast({ title: "Berhasil", description: `Artikel ${newStatus === "published" ? "dipublikasi" : "di-unpublish"}` });
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (a: Article) => {
    try {
      const newStatus = !a.is_featured;
      await api.put(`/articles/${a.id}`, { is_featured: newStatus });
      toast({ 
        title: "Berhasil", 
        description: newStatus ? "Ditambahkan ke Editor's Choice" : "Dihapus dari Editor's Choice" 
      });
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { data } = await api.post("/articles/bulk-delete", null, {
        params: bulkDeleteFilters
      });
      toast({ title: "Berhasil", description: data.message || "Artikel berhasil dihapus massal" });
      setBulkDeleteDialogOpen(false);
      fetchArticles();
    } catch (error: any) {
      toast({ 
        title: "Gagal hapus massal", 
        description: error.response?.data?.error || error.message, 
        variant: "destructive" 
      });
    }
  };

  // Upload gambar untuk bulk image update
  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkImageUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBulkImageUrl(data.url);
      setBulkImagePreview(data.url);
    } catch (error: any) {
      toast({ title: "Gagal upload", description: error.message, variant: "destructive" });
    }
    setBulkImageUploading(false);
  };

  // Terapkan gambar ke semua artikel dalam kategori
  const handleBulkImageUpdate = async () => {
    if (!bulkImageUrl) {
      toast({ title: "Error", description: "Upload gambar terlebih dahulu", variant: "destructive" });
      return;
    }
    setBulkImageLoading(true);
    try {
      const { data } = await api.post("/articles/bulk-image-update", {
        category: bulkImageCategory,
        cover_image: bulkImageUrl,
      });
      toast({ 
        title: "✅ Berhasil!", 
        description: `${data.affected_count} artikel berhasil diupdate gambarnya` 
      });
      setBulkImageDialogOpen(false);
      setBulkImageUrl("");
      setBulkImagePreview(null);
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
    setBulkImageLoading(false);
  };

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-1 gap-3 max-w-xl">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Cari artikel..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
           </div>
           
           <Select value={filterCategory} onValueChange={setFilterCategory}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Semua Kategori" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Semua Kategori</SelectItem>
               {dbCategories.map((cat) => (
                 <SelectItem key={cat.id} value={cat.name}>
                   {cat.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>
        <div className="flex gap-2">
          {onWpImportClick && (
            <Button variant="outline" className="gap-1.5" onClick={onWpImportClick}>
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Import WP</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => {
              setBulkImageCategory(filterCategory);
              setBulkImageDialogOpen(true);
            }}
          >
            <Image className="h-4 w-4" /> <span className="hidden sm:inline">Ganti Gambar Massal</span>
          </Button>
          <Button variant="outline" className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setBulkDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" /> Hapus Massal
          </Button>
          <Button className="gap-1.5" onClick={() => openEditor()}>
            <Plus className="h-4 w-4" /> Tambah Artikel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada artikel.</div>
      ) : (
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-accent/30">
                  <th className="text-left py-3 px-4 font-semibold">Judul</th>
                  <th className="text-left py-3 px-4 font-semibold">Penulis</th>
                  <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                  <th className="text-center py-3 px-4 font-semibold">Choice</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Views</th>
                  <th className="text-right py-3 px-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-accent/20 transition">
                    <td className="py-3 px-4 font-medium max-w-[500px] truncate">{a.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.author || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.category}</td>
                    <td className="py-3 px-4 text-center">
                      <Switch 
                        checked={a.is_featured} 
                        onCheckedChange={() => handleToggleFeatured(a)} 
                        className="scale-75"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={statusColor[a.status]}>{statusLabel[a.status] || a.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{a.views}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuickPublish(a)} title={a.status === "published" ? "Unpublish" : "Publish"}>
                          <CheckCircle2 className={`h-4 w-4 ${a.status === "published" ? "text-primary" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(a)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(a.id)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y">
            {filtered.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${statusColor[a.status]}`}>{statusLabel[a.status] || a.status}</Badge>
                      <span className="text-xs text-muted-foreground">{a.category}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" />{a.views}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuickPublish(a)}>
                      <CheckCircle2 className={`h-4 w-4 ${a.status === "published" ? "text-primary" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(a)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Artikel" : "Tambah Artikel Baru"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="content">Konten Artikel</TabsTrigger>
              <TabsTrigger value="quiz" disabled={!editing}>Kuis Artikel</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul artikel..." />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Tanggal & Waktu Postingan
                </Label>
                <Input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Ubah tanggal & waktu postingan artikel ini.</p>
              </div>
              <div>
                <Label>Ringkasan</Label>
                <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat..." />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dbCategories.length > 0 ? (
                      dbCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                    ) : (
                      <SelectItem value="Umum">Umum</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Editor's Choice</Label>
                  <p className="text-xs text-muted-foreground">Tampilkan artikel ini di bagian Editor's Choice beranda</p>
                </div>
                <Switch 
                  checked={form.is_featured} 
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })} 
                />
              </div>

              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-bold uppercase tracking-wider">Lokasi Kajian (Optional)</Label>
                 </div>
                 <div className="space-y-3">
                    <div>
                       <Label className="text-[10px] font-bold uppercase">Nama Tempat / Masjid</Label>
                       <Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} placeholder="Contoh: Masjid Istiqlal, Jakarta" className="h-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <Label className="text-[10px] font-bold uppercase">Latitude</Label>
                          <Input type="number" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} placeholder="-6.123" className="h-9" />
                       </div>
                       <div>
                          <Label className="text-[10px] font-bold uppercase">Longitude</Label>
                          <Input type="number" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} placeholder="106.123" className="h-9" />
                       </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Tips: Gunakan Google Maps untuk mencari koordinat lat/long.</p>
                 </div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
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

              <div>
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
              </div>
              <div>
                <Label>Konten</Label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm({ ...form, content: html })}
                  placeholder="Tulis konten artikel..."
                  minHeight="280px"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 flex-wrap pt-4">
                <Button variant="outline" onClick={() => handleSave("draft")} className="gap-1.5">
                  <Save className="h-4 w-4" /> Simpan Draf
                </Button>
                <Button variant="secondary" onClick={() => handleSave("review")} className="gap-1.5">
                  <Send className="h-4 w-4" /> Review
                </Button>
                <Button onClick={() => handleSave("published")} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Publikasikan
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="quiz">
              {editing ? (
                <QuizManager articleId={editing.id} articleContent={form.content} />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Simpan artikel terlebih dahulu untuk mengelola kuis.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus artikel?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Artikel Massal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive-foreground font-medium">
                Peringatan: Tindakan ini akan menghapus semua artikel yang sesuai dengan filter di bawah ini secara permanen.
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Filter Kategori</Label>
              <Select 
                value={bulkDeleteFilters.category} 
                onValueChange={(v) => setBulkDeleteFilters({ ...bulkDeleteFilters, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {dbCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mulai Tanggal</Label>
                <Input 
                  type="date" 
                  value={bulkDeleteFilters.startDate} 
                  onChange={(e) => setBulkDeleteFilters({ ...bulkDeleteFilters, startDate: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hingga Tanggal</Label>
                <Input 
                  type="date" 
                  value={bulkDeleteFilters.endDate} 
                  onChange={(e) => setBulkDeleteFilters({ ...bulkDeleteFilters, endDate: e.target.value })} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Hapus Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Image Update Dialog */}
      <Dialog open={bulkImageDialogOpen} onOpenChange={(o) => { setBulkImageDialogOpen(o); if (!o) { setBulkImageUrl(""); setBulkImagePreview(null); }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600" />
              Ganti Gambar Massal per Kategori
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-400">
              Upload satu gambar → semua artikel dalam kategori yang dipilih akan pakai gambar yang sama sebagai cover.
            </div>

            {/* Pilih Kategori */}
            <div className="space-y-2">
              <Label className="font-semibold">Pilih Kategori</Label>
              <Select value={bulkImageCategory} onValueChange={setBulkImageCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 Semua Kategori</SelectItem>
                  {dbCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {bulkImageCategory === "all"
                  ? `✦ Akan mengupdate SEMUA artikel (${articles.length} artikel)`
                  : `✦ Akan mengupdate ${articles.filter(a => a.category === bulkImageCategory).length} artikel dalam kategori "${bulkImageCategory}"`
                }
              </p>
            </div>

            {/* Upload Gambar */}
            <div className="space-y-2">
              <Label className="font-semibold">Upload Gambar Cover</Label>
              <input
                ref={bulkImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBulkImageUpload}
              />
              {bulkImagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-blue-300 shadow-md">
                  <img src={bulkImagePreview} alt="Preview" className="w-full h-52 object-cover" />
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      className="bg-destructive text-white rounded-full p-1.5 shadow-lg"
                      onClick={() => { setBulkImagePreview(null); setBulkImageUrl(""); }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-xs text-white text-center font-bold">
                    ✓ Gambar siap diterapkan
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bulkImageInputRef.current?.click()}
                  disabled={bulkImageUploading}
                  className="w-full h-40 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/40 flex flex-col items-center justify-center gap-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                >
                  <ImagePlus className="h-10 w-10 opacity-60" />
                  <span className="text-sm font-semibold">
                    {bulkImageUploading ? "Mengupload..." : "Klik untuk pilih gambar"}
                  </span>
                  <span className="text-xs opacity-60">PNG, JPG, WEBP</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkImageDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleBulkImageUpdate}
              disabled={!bulkImageUrl || bulkImageLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Image className="h-4 w-4" />
              {bulkImageLoading ? "Menerapkan..." : "Terapkan ke Semua Artikel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
