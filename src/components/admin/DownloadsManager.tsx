import { useState, useEffect } from "react";
import {
  Plus, Trash2, Save, X, Download, History, Eye, EyeOff,
  FileText, FileArchive, FileSpreadsheet, FileImage, FileAudio, FileVideo, File,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  file_type: string;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DownloadLogRow {
  id: string;
  user_display_name: string;
  user_email: string;
  ip: string;
  created_at: string;
}

interface LogsPayload {
  file: DownloadItem;
  logs: DownloadLogRow[];
  total: number;
}

const emptyForm = { title: "", description: "", is_active: true };

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
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export function DownloadsManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DownloadItem>({ ...emptyForm, id: "", file_name: "", file_size: 0, file_type: "", download_count: 0, created_at: "", updated_at: "" });
  const [editFile, setEditFile] = useState<File | null>(null);

  // Logs panel
  const [logsFor, setLogsFor] = useState<DownloadItem | null>(null);
  const [logsData, setLogsData] = useState<LogsPayload | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/downloads");
      setItems((data?.items || []) as DownloadItem[]);
    } catch {
      toast({ title: "Gagal memuat data unduhan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAddForm = () => {
    setForm(emptyForm);
    setSelectedFile(null);
    setShowAdd(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "Pilih file terlebih dahulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("is_active", String(form.is_active));
      fd.append("file", selectedFile);
      await api.post("/admin/downloads", fd);
      toast({ title: "File unduhan ditambahkan" });
      resetAddForm();
      load();
    } catch (err: any) {
      toast({ title: "Gagal menambah file", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: DownloadItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setEditFile(null);
  };

  const handleUpdate = async (item: DownloadItem) => {
    if (!editForm.title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", editForm.title.trim());
      fd.append("description", (editForm.description || "").trim());
      fd.append("is_active", String(editForm.is_active));
      if (editFile) fd.append("file", editFile);
      await api.put(`/admin/downloads/${item.id}`, fd);
      toast({ title: "Perubahan tersimpan" });
      setEditingId(null);
      setEditFile(null);
      load();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DownloadItem) => {
    if (!confirm(`Hapus file "${item.title}" beserta riwayat unduhannya?`)) return;
    try {
      await api.delete(`/admin/downloads/${item.id}`);
      toast({ title: "File unduhan dihapus" });
      if (logsFor?.id === item.id) { setLogsFor(null); setLogsData(null); }
      load();
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const toggleActive = async (item: DownloadItem) => {
    const fd = new FormData();
    fd.append("title", item.title);
    fd.append("description", item.description || "");
    fd.append("is_active", String(!item.is_active));
    try {
      await api.put(`/admin/downloads/${item.id}`, fd);
      load();
    } catch {
      toast({ title: "Gagal mengubah status", variant: "destructive" });
    }
  };

  const openLogs = async (item: DownloadItem) => {
    if (logsFor?.id === item.id) {
      setLogsFor(null);
      setLogsData(null);
      return;
    }
    setLogsFor(item);
    setLogsData(null);
    setLogsLoading(true);
    try {
      const { data } = await api.get(`/admin/downloads/${item.id}/logs`);
      setLogsData(data as LogsPayload);
    } catch {
      toast({ title: "Gagal memuat riwayat unduhan", variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  };

  const totalDownloads = items.reduce((acc, it) => acc + (it.download_count || 0), 0);

  return (
    <div className="bg-card rounded-xl card-shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base">Manajemen File Unduhan</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Unggah file PDF, DOCX, ZIP, dan lainnya. Hanya pengguna yang sudah login yang bisa mengunduh.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(v => !v)} className="gap-1.5">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Tutup" : "Tambah File"}
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">{items.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total File</p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">{totalDownloads}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Unduhan</p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">{items.filter(i => i.is_active).length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aktif di Publik</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl border bg-background/60 p-4 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Tambah File Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[11px]">Judul *</Label>
              <Input
                className="h-9 mt-1"
                placeholder="Contoh: Buku Panduan Ibadah (PDF)"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-[11px]">Deskripsi Singkat</Label>
              <Input
                className="h-9 mt-1"
                placeholder="Keterangan isi file (opsional)"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[11px]">File * (PDF, DOC/DOCX, XLS, PPT, ZIP, RAR, dll — maks 100MB)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="file"
                  className="h-9 flex-1"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">
                    {selectedFile.name} • {formatBytes(selectedFile.size)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <span className="text-[12px] text-muted-foreground">Tampilkan langsung di halaman Unduhan</span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={resetAddForm}>Batal</Button>
                <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Download className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada file unduhan</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Klik "Tambah File" untuk mengunggah file pertama.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const { Icon, color: iconColor } = typeVisual(item.file_type);
            const isEditing = editingId === item.id;
            const isShowingLogs = logsFor?.id === item.id;

            return (
              <div key={item.id} className={`rounded-2xl border transition-all ${item.is_active ? "bg-card" : "bg-muted/20 opacity-75"}`}>
                {/* Collapsed row */}
                <div className="flex items-center gap-4 p-4">
                  <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px] truncate">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase">
                        {item.file_type || "file"}
                      </span>
                      {!item.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-black uppercase">Nonaktif</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {item.description || item.file_name}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mt-1 flex-wrap">
                      <span>{item.file_name}</span>
                      <span>•</span>
                      <span>{formatBytes(item.file_size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-primary">
                        <Download className="h-3 w-3" /> {item.download_count || 0}x diunduh
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2.5 text-[11px]" onClick={() => openLogs(item)} title="Riwayat unduhan">
                      <History className="h-3.5 w-3.5" />
                      <span className="hidden md:inline ml-1">Riwayat</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item)} title={item.is_active ? "Sembunyikan" : "Tampilkan"}>
                      {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2.5 text-[11px]" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item)} title="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="border-t border-border/50 p-4 space-y-3 bg-background/50 rounded-b-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Edit File</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px]">Judul</Label>
                        <Input className="h-9 mt-1" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-[11px]">Deskripsi Singkat</Label>
                        <Input className="h-9 mt-1" value={editForm.description || ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px]">Ganti File (opsional — biarkan kosong bila tidak diganti)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input type="file" className="h-9 flex-1" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{editForm.file_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm(p => ({ ...p, is_active: v }))} />
                        <span className="text-[12px] text-muted-foreground">
                          {editForm.is_active ? "Ditampilkan di halaman Unduhan" : "Disembunyikan"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditFile(null); }}>Batal</Button>
                        <Button size="sm" onClick={() => handleUpdate(item)} disabled={saving} className="gap-1.5">
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs */}
                {isShowingLogs && (
                  <div className="border-t border-border/50 bg-muted/20 rounded-b-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                        Riwayat Unduhan — {logsData ? `${logsData.total}x` : "..."}
                      </p>
                      {logsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                    {!logsLoading && logsData && (
                      logsData.logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">Belum ada unduhan untuk file ini.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[12px]">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b">
                                <th className="py-2 pr-4 font-bold">Pengguna</th>
                                <th className="py-2 pr-4 font-bold">Email</th>
                                <th className="py-2 pr-4 font-bold">IP</th>
                                <th className="py-2 font-bold">Waktu Unduh</th>
                              </tr>
                            </thead>
                            <tbody>
                              {logsData.logs.map(log => (
                                <tr key={log.id} className="border-b border-border/40 last:border-0">
                                  <td className="py-2 pr-4 font-semibold">{log.user_display_name || "-"}</td>
                                  <td className="py-2 pr-4 text-muted-foreground">{log.user_email || "-"}</td>
                                  <td className="py-2 pr-4 text-muted-foreground">{log.ip || "-"}</td>
                                  <td className="py-2 text-muted-foreground">{formatDate(log.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
