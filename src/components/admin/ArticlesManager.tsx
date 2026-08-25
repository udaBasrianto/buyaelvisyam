import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, X, CheckCircle2, Download, Image, ImagePlus, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
      try {
        return normalizeStringList(JSON.parse(trimmed), fallback);
      } catch {
        return fallback;
      }
    }

    const normalized = trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return normalized.length > 0 ? normalized : fallback;
  }

  return fallback;
};

const normalizeArticle = (article: any): Article => {
  const category =
    typeof article?.category === "string" && article.category.trim()
      ? article.category.trim()
      : "Umum";
  const categories = normalizeStringList(article?.categories, [category]);

  return {
    ...article,
    category,
    categories,
  };
};

const normalizeCategoryList = (value: unknown): DynamicCategory[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is DynamicCategory =>
      !!item &&
      typeof item === "object" &&
      typeof (item as DynamicCategory).id === "string" &&
      typeof (item as DynamicCategory).name === "string",
  );
};

export function ArticlesManager({ onWpImportClick }: ArticlesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [dbCategories, setDbCategories] = useState<DynamicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Selection & Pagination States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Automatically reset page and selection when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, filterCategory, filterStartDate, filterEndDate]);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteFilters, setBulkDeleteFilters] = useState({
    category: "all",
    startDate: "",
    endDate: "",
  });

  // --- Bulk Image Update State ---
  const [bulkImageDialogOpen, setBulkImageDialogOpen] = useState(false);
  const [bulkImageCategory, setBulkImageCategory] = useState("all");
  const [bulkImageUrl, setBulkImageUrl] = useState("");
  const [bulkImagePreview, setBulkImagePreview] = useState<string | null>(null);
  const [bulkImageUploading, setBulkImageUploading] = useState(false);
  const [bulkImageLoading, setBulkImageLoading] = useState(false);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importBaseURL, setImportBaseURL] = useState("https://buyaelvisyam.id");
  const [importSince, setImportSince] = useState("");
  const [importMode, setImportMode] = useState<"skip" | "upsert">("skip");
  const [importLimit, setImportLimit] = useState(50);
  const [importMaxPages, setImportMaxPages] = useState(20);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const handleImportFromAPI = async () => {
    let base = importBaseURL.trim();
    if (!base) {
      toast({ title: "Error", description: "URL sumber wajib diisi", variant: "destructive" });
      return;
    }
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      base = `https://${base}`;
      setImportBaseURL(base);
    }
    setImportLoading(true);
    try {
      const payload: any = {
        base_url: base,
        mode: importMode,
        limit: importLimit,
        max_pages: importMaxPages,
      };
      if (importSince.trim()) payload.since = importSince.trim();

      const { data } = await api.post("/import-export", payload);
      setImportResult(data);
      toast({
        title: "Import selesai",
        description: `Imported: ${data.imported || 0}, Updated: ${data.updated || 0}, Skipped: ${data.skipped || 0}, Failed: ${data.failed || 0}`,
      });
      fetchArticles();
    } catch (error: any) {
      toast({
        title: "Gagal import",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'draft') => {
    if (selectedIds.length === 0) return;
    
    let confirmMsg = "";
    if (action === 'delete') confirmMsg = `Hapus ${selectedIds.length} artikel terpilih secara permanen?`;
    else if (action === 'publish') confirmMsg = `Publikasikan ${selectedIds.length} artikel terpilih?`;
    else confirmMsg = `Ubah ${selectedIds.length} artikel terpilih menjadi draf?`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    try {
      if (action === 'delete') {
        // Run parallel deletes for selected IDs
        await Promise.all(selectedIds.map(id => api.delete(`/articles/${id}`)));
        toast({ title: "Berhasil", description: `${selectedIds.length} artikel berhasil dihapus.` });
      } else {
        const newStatus = action === 'publish' ? 'published' : 'draft';
        await Promise.all(selectedIds.map(id => api.put(`/articles/${id}`, { status: newStatus })));
        toast({ title: "Berhasil", description: `${selectedIds.length} artikel berhasil diubah statusnya.` });
      }
      setSelectedIds([]);
      fetchArticles();
    } catch (err: any) {
      toast({ title: "Gagal memproses tindakan massal", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get("/articles", { params: { limit: 1000, status: "all" } }),
        api.get("/categories")
      ]);
      
      setArticles(Array.isArray(articlesRes.data) ? articlesRes.data.map(normalizeArticle) : []);
      setDbCategories(normalizeCategoryList(categoriesRes.data));
    } catch (error: any) {
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

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
    let matchesDate = true;
    if (filterStartDate) {
      const articleDate = new Date(a.created_at);
      const startDate = new Date(filterStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (articleDate < startDate) matchesDate = false;
    }
    if (filterEndDate) {
      const articleDate = new Date(a.created_at);
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (articleDate > endDate) matchesDate = false;
    }
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filtered.slice(startIndex, startIndex + itemsPerPage);
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
           {filterStartDate || filterEndDate ? (
             <div className="flex items-center gap-1.5">
               <Input
                 type="date"
                 value={filterStartDate}
                 onChange={(e) => setFilterStartDate(e.target.value)}
                 className="w-[140px] h-9 text-xs"
               />
               <span className="text-xs text-muted-foreground">–</span>
               <Input
                 type="date"
                 value={filterEndDate}
                 onChange={(e) => setFilterEndDate(e.target.value)}
                 className="w-[140px] h-9 text-xs"
               />
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-7 w-7"
                 onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }}
                 title="Hapus filter tanggal"
               >
                 <X className="h-3.5 w-3.5" />
               </Button>
             </div>
           ) : (
             <Button
               variant="outline"
               size="sm"
               className="gap-1.5 text-xs h-9 shrink-0"
               onClick={() => { setFilterStartDate(new Date().toISOString().slice(0, 10)); }}
             >
               <Calendar className="h-3.5 w-3.5" /> Filter Tanggal
             </Button>
           )}
        </div>
        <div className="flex gap-2">
          {onWpImportClick && (
            <Button variant="outline" className="gap-1.5" onClick={onWpImportClick}>
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Import WP</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setImportResult(null);
              setImportDialogOpen(true);
            }}
          >
            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Import API</span>
          </Button>
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
          <Button className="gap-1.5" onClick={() => navigate("/admin/articles/new")}>
            <Plus className="h-4 w-4" /> Tambah Artikel
          </Button>
        </div>
      </div>

      {/* Tindakan Massal (Bulk Row Selection Action Bar) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {selectedIds.length} Artikel Terpilih
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs font-bold gap-1"
              onClick={() => handleBulkAction('publish')}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Publikasikan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground border-border hover:bg-accent text-xs font-bold gap-1"
              onClick={() => handleBulkAction('draft')}
            >
              <FileText className="h-3.5 w-3.5" /> Jadikan Draf
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/5 text-xs font-bold gap-1"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Belum ada artikel.</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-xl card-shadow overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-accent/30">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={paginatedArticles.length > 0 && paginatedArticles.every(a => selectedIds.includes(a.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelections = [...selectedIds];
                            paginatedArticles.forEach(a => {
                              if (!newSelections.includes(a.id)) newSelections.push(a.id);
                            });
                            setSelectedIds(newSelections);
                          } else {
                            const paginatedIds = paginatedArticles.map(a => a.id);
                            setSelectedIds(selectedIds.filter(id => !paginatedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold w-12 text-muted-foreground">No.</th>
                    <th className="text-left py-3 px-4 font-semibold">Judul</th>
                    <th className="text-left py-3 px-4 font-semibold">Penulis</th>
                    <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                    <th className="text-center py-3 px-4 font-semibold">Choice</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Views</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Tanggal Terbit</th>
                    <th className="text-right py-3 px-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedArticles.map((a, index) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-accent/20 transition">
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          checked={selectedIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, a.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== a.id));
                            }
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-muted-foreground">{startIndex + index + 1}</td>
                      <td className="py-3 px-4 font-medium max-w-[500px] truncate">{a.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{a.author || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {a.categories && a.categories.length > 0 ? (
                            a.categories.map((cat, idx) => (
                              <Badge 
                                key={idx} 
                                variant={idx === 0 ? "default" : "secondary"} 
                                className="text-[10px] py-0 px-1.5 font-medium whitespace-nowrap"
                              >
                                {cat}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium whitespace-nowrap">
                              {a.category || "Umum"}
                            </Badge>
                          )}
                        </div>
                      </td>
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
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">{new Date(a.published_at || a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuickPublish(a)} title={a.status === "published" ? "Unpublish" : "Publish"}>
                            <CheckCircle2 className={`h-4 w-4 ${a.status === "published" ? "text-primary" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/articles/edit/${a.id}`)} title="Edit">
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
              {paginatedArticles.map((a, index) => (
                <div key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer mt-0.5"
                        checked={selectedIds.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, a.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== a.id));
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        <span className="text-muted-foreground mr-1.5">{startIndex + index + 1}.</span>
                        {a.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${statusColor[a.status]}`}>{statusLabel[a.status] || a.status}</Badge>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.categories && a.categories.length > 0 ? (
                            a.categories.map((cat, idx) => (
                              <span 
                                key={idx} 
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  idx === 0 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-primary/10 text-primary">
                              {a.category || "Umum"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" />{a.views}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(a.published_at || a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuickPublish(a)}>
                        <CheckCircle2 className={`h-4 w-4 ${a.status === "published" ? "text-primary" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/articles/edit/${a.id}`)}>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground font-medium">
                Menampilkan <span className="font-bold text-foreground">{startIndex + 1}</span> - <span className="font-bold text-foreground">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> dari <span className="font-bold text-foreground">{filtered.length}</span> Artikel
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="h-9 px-3 rounded-lg font-bold text-xs"
                >
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 rounded-lg font-bold text-xs p-0`}
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="text-muted-foreground text-xs px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="h-9 px-3 rounded-lg font-bold text-xs"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Artikel dari Export API</DialogTitle>
            <DialogDescription className="sr-only">
              Import artikel dari endpoint export API eksternal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Base URL Sumber</Label>
              <Input
                value={importBaseURL}
                onChange={(e) => setImportBaseURL(e.target.value)}
                placeholder="https://domain-sumber.com"
              />
              <p className="text-[10px] text-muted-foreground">
                Sistem akan mengambil dari: {`<base_url>/api/export/v1/articles`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip jika ada</SelectItem>
                    <SelectItem value="upsert">Update jika ada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Since (RFC3339)</Label>
                <Input
                  value={importSince}
                  onChange={(e) => setImportSince(e.target.value)}
                  placeholder="2026-06-01T00:00:00Z"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Limit (1-100)</Label>
                <Input
                  type="number"
                  value={importLimit}
                  onChange={(e) => setImportLimit(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Pages</Label>
                <Input
                  type="number"
                  value={importMaxPages}
                  onChange={(e) => setImportMaxPages(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            {importResult && (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Imported: <span className="font-bold">{importResult.imported || 0}</span></div>
                  <div>Updated: <span className="font-bold">{importResult.updated || 0}</span></div>
                  <div>Skipped: <span className="font-bold">{importResult.skipped || 0}</span></div>
                  <div>Failed: <span className="font-bold">{importResult.failed || 0}</span></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importLoading}>
              Tutup
            </Button>
            <Button onClick={handleImportFromAPI} disabled={importLoading}>
              {importLoading ? "Mengimport..." : "Mulai Import"}
            </Button>
          </DialogFooter>
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
            <DialogDescription className="sr-only">
              Hapus artikel secara massal berdasarkan filter kategori dan tanggal.
            </DialogDescription>
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
            <DialogDescription className="sr-only">
              Terapkan satu gambar cover ke banyak artikel berdasarkan kategori.
            </DialogDescription>
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
