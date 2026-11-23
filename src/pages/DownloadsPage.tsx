import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Search, Lock, FileText, FileArchive, FileSpreadsheet,
  FileImage, FileAudio, FileVideo, File, Loader2, DownloadCloud,
} from "lucide-react";

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  file_type: string;
  download_count: number;
  created_at: string;
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function typeVisual(type?: string) {
  const ext = (type || "").toLowerCase();
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { Icon: FileArchive, color: "bg-amber-500/10 text-amber-600" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, color: "bg-emerald-500/10 text-emerald-600" };
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return { Icon: FileImage, color: "bg-blue-500/10 text-blue-600" };
  if (["mp3", "m4a", "wav"].includes(ext)) return { Icon: FileAudio, color: "bg-purple-500/10 text-purple-600" };
  if (["mp4", "mkv", "webm"].includes(ext)) return { Icon: FileVideo, color: "bg-rose-500/10 text-rose-600" };
  if (["pdf", "doc", "docx", "txt", "rtf", "epub", "ppt", "pptx"].includes(ext)) return { Icon: FileText, color: "bg-primary/10 text-primary" };
  return { Icon: File, color: "bg-muted text-muted-foreground" };
}

export default function DownloadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/downloads")
      .then(({ data }) => setItems(asArray<DownloadItem>(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      (item.title || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.file_type || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const totalDownloads = items.reduce((acc, it) => acc + (it.download_count || 0), 0);

  const triggerDownload = async (item: DownloadItem) => {
    if (!user) {
      toast({ title: "Login diperlukan", description: "Silakan login untuk mengunduh file kajian." });
      navigate("/auth");
      return;
    }
    setDownloadingId(item.id);
    try {
      const res = await api.get(`/downloads/${item.id}/file`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.file_name || `unduhan-${(item.title || "file").replace(/[^a-z0-9]+/gi, "-")}.${item.file_type || "file"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Unduhan dimulai" });
      // Update local count optimistically
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, download_count: (i.download_count || 0) + 1 } : i));
    } catch (err: any) {
      const isUnauthorized = err?.response?.status === 401;
      toast({
        title: "Gagal mengunduh",
        description: isUnauthorized ? "Sesi login Anda sudah berakhir. Silakan login ulang." : "Terjadi kesalahan saat mengunduh file.",
        variant: "destructive",
      });
      if (isUnauthorized) navigate("/auth");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className="bottom-nav-safe pb-16">
        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="h-14 w-14 rounded-2xl islamic-gradient text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10">
              <DownloadCloud className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">PUSAT UNDUHAN</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
              {items.length} File • {totalDownloads} Kali Diunduh
            </p>
          </div>

          {/* Login notice */}
          {!user && (
            <div className="max-w-xl mx-auto mb-8 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                Login untuk dapat mengunduh file-file berikut.
              </div>
              <Link to="/auth" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors">
                Masuk
              </Link>
            </div>
          )}

          {/* Search */}
          <div className="sticky top-16 z-30 -mx-4 mb-6 px-4 py-2 bg-background/90 backdrop-blur-md">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari file unduhan..."
                className="w-full h-10 pl-10 pr-4 rounded-full border border-border/60 bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="max-w-3xl mx-auto space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground italic">
              {items.length === 0 ? "Belum ada file unduhan yang tersedia." : `Tidak ada file yang cocok dengan "${query}"`}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {filtered.map(item => {
                const { Icon, color: iconColor } = typeVisual(item.file_type);
                const isDownloading = downloadingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
                  >
                    <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${iconColor}`}>
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {item.file_type || "file"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                        <span className="truncate max-w-[200px]">{item.file_name}</span>
                        <span>•</span>
                        <span>{formatBytes(item.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" /> {item.download_count || 0}x
                        </span>
                        <span>•</span>
                        <span>Dirilis {formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {user ? (
                        <button
                          onClick={() => triggerDownload(item)}
                          disabled={isDownloading}
                          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[12px] font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20 disabled:opacity-60"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {isDownloading ? "Mengunduh..." : "Unduh"}
                        </button>
                      ) : (
                        <Link
                          to="/auth"
                          className="flex items-center justify-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-[12px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Lock className="h-4 w-4" />
                          Login
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
}
