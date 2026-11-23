import { useState, useEffect, useRef, useMemo } from "react";
import {
  Image as ImageIcon,
  Zap,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  FileText,
  Copy,
  ExternalLink,
  Trash2,
  Layers,
  HardDrive,
  FileCheck,
  Eye,
  X,
  FileQuestion,
  Sparkles,
  ArrowUpDown,
  CheckSquare,
  Square,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface ImageUsage {
  type: string;
  title: string;
  id: string;
  link: string;
}

interface GalleryItem {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  size_human: string;
  width: number;
  height: number;
  created_at: string;
  is_optimized: boolean;
  used_count: number;
  used_in: ImageUsage[];
}

interface GalleryStats {
  total_images: number;
  total_size_bytes: number;
  total_size_human: string;
  uncompressed_count: number;
  used_count: number;
  unused_count: number;
}

export default function GalleryManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "uncompressed" | "used" | "unused">("all");
  const [sortBy, setSortBy] = useState<"newest" | "largest" | "smallest" | "oldest">("newest");

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Compression Loading states
  const [compressingAll, setCompressingAll] = useState(false);
  const [compressingId, setCompressingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, [filter, sortBy]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const params: any = { sort: sortBy };
      if (filter !== "all") params.filter = filter;
      if (search.trim()) params.q = search.trim();

      const { data } = await api.get("/admin/gallery", { params });
      setItems(data.items || []);
      setStats(data.stats || null);
    } catch (err: any) {
      toast({
        title: "Gagal memuat galeri",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGallery();
  };

  const handleCopyURL = (url: string) => {
    const fullURL = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullURL);
    toast({
      title: "URL Berhasil Disalin",
      description: fullURL,
    });
  };

  const handleCompressSingle = async (item: GalleryItem) => {
    try {
      setCompressingId(item.id);
      const { data } = await api.post(`/admin/gallery/compress/${item.id}`);
      toast({
        title: "Gambar Berhasil Dikompres ⚡",
        description: `Ukuran berkurang dari ${data.original_size} menjadi ${data.new_size} (Hemat ${data.saved_percent})`,
      });
      fetchGallery();
      if (selectedItem?.id === item.id) {
        setPreviewOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Gagal Mengompres Gambar",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setCompressingId(null);
    }
  };

  const handleCompressAll = async () => {
    if (!confirm("Jalankan kompresi otomatis untuk semua gambar yang berukuran besar (>180KB)? Gambar akan dioptimasi tanpa merusak kualitas tampilan.")) {
      return;
    }

    try {
      setCompressingAll(true);
      const { data } = await api.post("/admin/gallery/compress-all");
      toast({
        title: "Kompresi Massal Selesai 🚀",
        description: `${data.processed_count} gambar berhasil dikompresi. Berhasil menghemat ${data.total_saved_human} ruang penyimpanan!`,
      });
      fetchGallery();
    } catch (err: any) {
      toast({
        title: "Gagal Kompresi Massal",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setCompressingAll(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await api.post("/upload", formData);
      toast({
        title: "Upload & Auto-Compress Berhasil",
        description: `Gambar ${file.name} berhasil diunggah dan otomatis dikompresi.`,
      });
      fetchGallery();
    } catch (err: any) {
      toast({
        title: "Gagal Mengunggah Gambar",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (item.used_count > 0) {
      if (!confirm(`PERINGATAN: Gambar ini sedang digunakan di ${item.used_count} konten (artikel/produk). Jika dihapus, gambar pada konten tersebut akan menjadi rusak/pecah. Lanjutkan hapus permanen?`)) {
        return;
      }
    } else {
      if (!confirm(`Hapus gambar ${item.filename} secara permanen dari server?`)) {
        return;
      }
    }

    try {
      await api.delete(`/admin/gallery/${item.id}`);
      toast({
        title: "Gambar Dihapus Permanen",
        description: "File dan aset berhasil dibersihkan dari server.",
      });
      setSelectedIds(prev => prev.filter(id => id !== item.id));
      fetchGallery();
      if (selectedItem?.id === item.id) {
        setPreviewOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus Gambar",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  // --- Bulk Selection Handlers ---
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const selectAllUnused = () => {
    const unusedIds = items.filter(it => it.used_count === 0).map(it => it.id);
    setSelectedIds(unusedIds);
    toast({
      title: "Semua Gambar Belum Dipakai Terpilih",
      description: `${unusedIds.length} gambar yang aman dihapus telah dipilih.`,
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Calculation for selected items
  const selectedItemsData = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const selectedList = items.filter(it => selectedSet.has(it.id));
    const totalBytes = selectedList.reduce((acc, it) => acc + (it.size_bytes || 0), 0);
    const usedCount = selectedList.filter(it => it.used_count > 0).length;
    return {
      list: selectedList,
      totalBytes,
      usedCount,
    };
  }, [items, selectedIds]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const { data } = await api.post("/admin/gallery/bulk-delete", {
        ids: selectedIds,
      });
      toast({
        title: "Penghapusan Massal Berhasil",
        description: data.message || `${selectedIds.length} gambar berhasil dihapus secara permanen.`,
      });
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
      fetchGallery();
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus Gambar",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const openPreview = (item: GalleryItem) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Galeri Media Aplikasi</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Pusat manajemen file gambar dengan fitur hapus kelompok permanen dan auto kompresi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFile}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-2xl gap-2 font-bold text-xs h-10 shadow-sm"
          >
            <Upload className={`h-4 w-4 ${uploading ? "animate-bounce" : ""}`} />
            {uploading ? "Mengompres & Upload..." : "Upload Gambar Baru"}
          </Button>

          <Button
            variant="outline"
            onClick={handleCompressAll}
            disabled={compressingAll || loading}
            className="rounded-2xl gap-2 font-bold text-xs h-10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Zap className={`h-4 w-4 ${compressingAll ? "animate-spin" : "fill-amber-500"}`} />
            {compressingAll ? "Mengompres Semua..." : "Auto-Compress Semua"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchGallery}
            disabled={loading}
            className="rounded-2xl h-10 w-10"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="p-4 rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Gambar</p>
              <p className="text-xl font-black text-foreground tracking-tight mt-0.5">{stats.total_images} Berkas</p>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ukuran di Server</p>
              <p className="text-xl font-black text-foreground tracking-tight mt-0.5">{stats.total_size_human}</p>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Aset Aktif Dipakai</p>
              <p className="text-xl font-black text-foreground tracking-tight mt-0.5">{stats.used_count} Berkas</p>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Perlu Kompres</p>
              <p className="text-xl font-black text-foreground tracking-tight mt-0.5">
                {stats.uncompressed_count > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">{stats.uncompressed_count} Berkas</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">Semua Ringan ✓</span>
                )}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter("uncompressed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "uncompressed" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-3 w-3" />
            Perlu Kompres {stats?.uncompressed_count ? `(${stats.uncompressed_count})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setFilter("used")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "used" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3 w-3" />
            Terpakai ({stats?.used_count || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "unused" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertCircle className="h-3 w-3" />
            Nganggur ({stats?.unused_count || 0})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama file..."
              className="pl-9 h-10 rounded-2xl text-xs bg-card"
            />
          </form>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-2xl text-xs font-bold bg-card border border-border/70 text-foreground"
          >
            <option value="newest">Terbaru</option>
            <option value="largest">Ukuran Terbesar</option>
            <option value="smallest">Ukuran Terkecil</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* Bulk Selection Quick Toolbar (Above Grid) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            disabled={items.length === 0}
            className={`h-8 rounded-xl font-bold text-xs gap-1.5 ${
              isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
            }`}
          >
            {isAllSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {isAllSelected ? "Batal Pilih Semua" : `Pilih Semua (${items.length})`}
          </Button>

          {stats && stats.unused_count > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllUnused}
              className="h-8 rounded-xl font-bold text-xs gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              title="Otomatis tandai semua gambar yang nganggur/tidak digunakan untuk dihapus"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Pilih Yang Nganggur ({stats.unused_count})
            </Button>
          )}

          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground"
            >
              Kosongkan Pilihan
            </Button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              {selectedIds.length} gambar dipilih ({formatBytes(selectedItemsData.totalBytes)})
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="h-8 rounded-xl font-bold text-xs gap-1.5 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih
            </Button>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground">Memindai semua aset gambar...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-3xl border border-dashed border-border/60 p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Tidak Ada Gambar Ditemukan</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tidak ada gambar yang cocok dengan filter atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`group relative bg-card rounded-2xl border transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-md ${
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/[0.03]"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                {/* Image Thumbnail Container */}
                <div
                  className="relative aspect-square bg-muted/30 overflow-hidden cursor-pointer flex items-center justify-center select-none"
                  onClick={() => openPreview(item)}
                >
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3C/svg%3E";
                    }}
                  />

                  {/* Bulk Select Checkbox Button (Top Left) */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => toggleSelect(item.id, e)}
                  >
                    <button
                      type="button"
                      aria-label="Pilih gambar ini"
                      className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all shadow-md ${
                        isSelected
                          ? "bg-primary text-primary-foreground ring-2 ring-white/80 scale-105"
                          : "bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-80 group-hover:opacity-100"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <div className="h-3 w-3 rounded-xs border border-white/80" />
                      )}
                    </button>
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 pointer-events-none">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-xl bg-white/90 text-black hover:bg-white pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(item);
                      }}
                      title="Lihat Detail"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-xl bg-white/90 text-black hover:bg-white pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyURL(item.url);
                      }}
                      title="Salin URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Top Badges (Shifted to right of checkbox) */}
                  <div className="absolute top-2 left-10 flex flex-col gap-1 items-start">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider ${
                        item.size_bytes < 250 * 1024
                          ? "bg-emerald-500/90 text-white"
                          : "bg-amber-500/90 text-white"
                      }`}
                    >
                      {item.size_human}
                    </Badge>
                  </div>

                  {/* Usage Status Badge on Thumbnail */}
                  <div className="absolute top-2 right-2">
                    {item.used_count > 0 ? (
                      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-blue-600/95 text-white text-[9px] font-black backdrop-blur-md shadow-sm">
                        <FileText className="h-2.5 w-2.5" />
                        {item.used_count} Dipakai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-amber-500/95 text-white text-[9px] font-black backdrop-blur-md shadow-sm">
                        <AlertCircle className="h-2.5 w-2.5" />
                        Nganggur
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-[11px] font-bold text-foreground truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>{item.width && item.height ? `${item.width}×${item.height}` : item.mime_type.split("/")[1]?.toUpperCase() || "IMG"}</span>
                        <span>{new Date(item.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Prominent Usage Status Bar */}
                    {item.used_count > 0 ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(item);
                        }}
                        className="flex items-center justify-between px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold cursor-pointer hover:bg-blue-500/20 transition-colors"
                        title={`Dipakai di ${item.used_count} konten. Klik untuk melihat daftar artikel`}
                      >
                        <span className="flex items-center gap-1 truncate">
                          <FileText className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>{item.used_count}x di Konten</span>
                        </span>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 shrink-0">Lihat →</span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold"
                        title="Gambar ini tidak digunakan di artikel/produk manapun dan aman untuk dihapus"
                      >
                        <span className="flex items-center gap-1 truncate">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Nganggur</span>
                        </span>
                        <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                          Aman Dihapus
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-1">
                    {!item.is_optimized ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCompressSingle(item)}
                        disabled={compressingId === item.id}
                        className="h-7 px-2 text-[10px] font-bold rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 flex-1 gap-1"
                      >
                        <Zap className={`h-3 w-3 ${compressingId === item.id ? "animate-spin" : "fill-amber-500"}`} />
                        {compressingId === item.id ? "Proses..." : "Kompres"}
                      </Button>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1">
                        <CheckCircle2 className="h-3 w-3" /> Ringan
                      </span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      title="Hapus Permanen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bulk Action Dock (When items selected) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-3xl bg-background/95 dark:bg-card/95 backdrop-blur-2xl border border-primary/30 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {selectedIds.length}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-foreground truncate">
                  {selectedIds.length} Gambar Dipilih
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Total {formatBytes(selectedItemsData.totalBytes)}
                  {selectedItemsData.usedCount > 0 && (
                    <span className="text-amber-500 font-bold ml-1.5">
                      • ⚠️ {selectedItemsData.usedCount} sedang dipakai
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-md hover:shadow-lg"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Permanent Confirmation Modal */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 mb-2">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              Hapus Permanen {selectedIds.length} Gambar?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 my-2 text-xs">
            {selectedItemsData.usedCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Peringatan Konten Aktif ({selectedItemsData.usedCount} Gambar)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sebanyak <strong>{selectedItemsData.usedCount}</strong> gambar yang Anda pilih saat ini sedang aktif digunakan di artikel, produk, atau logo. Jika dihapus permanen, gambar pada konten terkait akan menjadi rusak/hilang.
                </p>
              </div>
            )}

            <p className="text-muted-foreground leading-relaxed">
              Tindakan ini akan <strong>menghapus file asli secara permanen</strong> dari server penyimpanan (<code className="bg-muted px-1 py-0.5 rounded text-[11px]">uploads/</code>) dan database. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </p>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Jumlah gambar terpilih:</span>
                <strong className="text-foreground">{selectedIds.length} berkas</strong>
              </div>
              <div className="flex justify-between">
                <span>Total ruang dibebaskan:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(selectedItemsData.totalBytes)}</strong>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={bulkDeleting}
              className="rounded-xl text-xs h-10 font-bold"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteBulkDelete}
              disabled={bulkDeleting}
              className="rounded-xl text-xs h-10 font-bold gap-2 shadow-sm"
            >
              <Trash2 className={`h-4 w-4 ${bulkDeleting ? "animate-spin" : ""}`} />
              {bulkDeleting ? "Menghapus Permanen..." : "Ya, Hapus Permanen Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Detail & Usage Modal */}
      {selectedItem && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Detail Gambar & Penggunaan
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Image Preview Container */}
              <div className="relative rounded-2xl bg-muted/40 border border-border/60 overflow-hidden max-h-[300px] flex items-center justify-center p-2">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.filename}
                  className="max-h-[280px] w-auto max-w-full object-contain rounded-xl shadow-sm"
                />
              </div>

              {/* URL with Copy */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">URL Publik</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}${selectedItem.url}`}
                    className="text-xs h-9 font-mono rounded-xl bg-muted/40"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyURL(selectedItem.url)}
                    className="h-9 px-3 rounded-xl gap-1.5 shrink-0 font-bold text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin
                  </Button>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Ukuran File</span>
                  <span className="font-black text-foreground">{selectedItem.size_human}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Dimensi</span>
                  <span className="font-black text-foreground">
                    {selectedItem.width && selectedItem.height ? `${selectedItem.width} × ${selectedItem.height}` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Format</span>
                  <span className="font-black text-foreground">{selectedItem.mime_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Tanggal Upload</span>
                  <span className="font-black text-foreground">
                    {new Date(selectedItem.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Usage List */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Lokasi Penggunaan Dalam Aplikasi ({selectedItem.used_count})</span>
                  {selectedItem.used_count === 0 && (
                    <span className="text-amber-500 font-medium lowercase">belum dipakai di artikel/produk apapun</span>
                  )}
                </label>

                {selectedItem.used_in && selectedItem.used_in.length > 0 ? (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedItem.used_in.map((u, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs hover:border-primary/40 transition-colors"
                      >
                        <span className="font-bold text-foreground truncate mr-2">{u.title}</span>
                        {u.link && (
                          <a
                            href={u.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                          >
                            Buka <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                    Gambar ini adalah file mandiri dan aman untuk dihapus jika tidak lagi diperlukan.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                {!selectedItem.is_optimized && (
                  <Button
                    onClick={() => handleCompressSingle(selectedItem)}
                    disabled={compressingId === selectedItem.id}
                    className="rounded-xl gap-2 font-bold text-xs h-9 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Zap className={`h-3.5 w-3.5 ${compressingId === selectedItem.id ? "animate-spin" : ""}`} />
                    {compressingId === selectedItem.id ? "Mengompres..." : "Kompres Gambar Ini"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedItem.url, "_blank")}
                  className="rounded-xl text-xs h-9 font-bold"
                >
                  Download Asli
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedItem)}
                  className="rounded-xl text-xs h-9 font-bold gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus Permanen
                </Button>
                <Button variant="outline" onClick={() => setPreviewOpen(false)} className="rounded-xl text-xs h-9">
                  Tutup
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
