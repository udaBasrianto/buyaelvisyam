import { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  ImagePlus,
  X,
  Check,
  AlertCircle,
  Smartphone,
  Globe,
  MonitorSmartphone,
  Calendar,
  Clock,
  Repeat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export interface PopupBanner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  button_text?: string;
  is_active: boolean;
  target_platform: string;
  display_frequency: string;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function PopupManager() {
  const { toast } = useToast();
  const [popups, setPopups] = useState<PopupBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected or Editing Popup
  const [editingPopup, setEditingPopup] = useState<Partial<PopupBanner> | null>(null);
  const [popupToDelete, setPopupToDelete] = useState<PopupBanner | null>(null);
  const [popupToPreview, setPopupToPreview] = useState<Partial<PopupBanner> | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Load Popups from Backend
  const loadPopups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/popups");
      const list = res.data?.data || [];
      setPopups(list);
    } catch (err: any) {
      toast({
        title: "Gagal memuat popup",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPopups();
  }, []);

  // Quick Toggle Active
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/popups/${id}/toggle`);
      setPopups((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
      toast({
        title: !currentStatus ? "Popup Diaktifkan" : "Popup Dinonaktifkan",
        description: !currentStatus
          ? "Popup sekarang akan tayang ke pengunjung sesuai jadwal & target platform."
          : "Popup dinonaktifkan dan tidak akan muncul ke pengunjung.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal mengubah status",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingPopup({
      title: "",
      description: "",
      image_url: "",
      action_url: "",
      button_text: "Buka",
      is_active: true,
      target_platform: "all",
      display_frequency: "always",
      start_at: null,
      end_at: null,
    });
    setEditDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (popup: PopupBanner) => {
    setEditingPopup({ ...popup });
    setEditDialogOpen(true);
  };

  // Handle Image Upload
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = data?.url || data?.data?.url || "";
      if (uploadedUrl && editingPopup) {
        setEditingPopup((prev) => ({ ...prev, image_url: uploadedUrl }));
        toast({ title: "Gambar berhasil diupload" });
      }
    } catch (err: any) {
      toast({
        title: "Gagal upload gambar",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save (Create or Update)
  const handleSavePopup = async () => {
    if (!editingPopup || !editingPopup.title?.trim()) {
      toast({ title: "Judul popup wajib diisi", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      if (editingPopup.id) {
        // Update
        await api.put(`/popups/${editingPopup.id}`, editingPopup);
        toast({ title: "Popup berhasil diperbarui" });
      } else {
        // Create
        await api.post("/popups", editingPopup);
        toast({ title: "Popup baru berhasil ditambahkan" });
      }
      setEditDialogOpen(false);
      loadPopups();
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan popup",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeletePopup = async () => {
    if (!popupToDelete) return;
    try {
      await api.delete(`/popups/${popupToDelete.id}`);
      toast({ title: "Popup berhasil dihapus" });
      setPopups((prev) => prev.filter((p) => p.id !== popupToDelete.id));
      setDeleteDialogOpen(false);
      setPopupToDelete(null);
    } catch (err: any) {
      toast({
        title: "Gagal menghapus popup",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "web":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Globe className="w-3 h-3" /> Web Browser
          </span>
        );
      case "app":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Smartphone className="w-3 h-3" /> Aplikasi Android
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <MonitorSmartphone className="w-3 h-3" /> Semua Platform
          </span>
        );
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "once_per_day":
        return "1x Per Hari";
      case "once_forever":
        return "1x Selamanya";
      default:
        return "Selalu Muncul";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Manajemen Popup & Pengumuman</h2>
            <p className="text-xs text-muted-foreground">
              Atur banner promosi, link download Play Store, kajian akbar, dan pengumuman interaktif untuk web & aplikasi.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-2xl islamic-gradient text-primary-foreground font-semibold gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Popup Baru</span>
        </Button>
      </div>

      {/* Popups List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Memuat data popup...</span>
        </div>
      ) : popups.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20 space-y-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto">
            <Megaphone className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Belum ada popup banner</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Klik tombol &ldquo;Tambah Popup Baru&rdquo; untuk membuat pengumuman promo aplikasi atau info kajian.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreate}
            className="rounded-xl islamic-gradient text-primary-foreground text-xs"
          >
            Buat Popup Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popups.map((popup) => (
            <div
              key={popup.id}
              className={`flex flex-col justify-between rounded-3xl border-2 transition-all overflow-hidden bg-card ${
                popup.is_active ? "border-primary/40 shadow-sm" : "border-border opacity-80"
              }`}
            >
              {/* Image Preview Header */}
              {popup.image_url ? (
                <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden group">
                  <img
                    src={popup.image_url}
                    alt={popup.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {getPlatformBadge(popup.target_platform)}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                  {getPlatformBadge(popup.target_platform)}
                  <span className="text-[11px] text-muted-foreground font-mono">Tanpa Gambar</span>
                </div>
              )}

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      {popup.title}
                    </h3>
                  </div>

                  {popup.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {popup.description}
                    </p>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="space-y-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-primary" />
                      Frekuensi:
                    </span>
                    <span className="font-semibold text-foreground">
                      {getFrequencyLabel(popup.display_frequency)}
                    </span>
                  </div>

                  {popup.action_url && (
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        Aksi:
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {popup.button_text || "Buka"} ({popup.action_url})
                      </span>
                    </div>
                  )}

                  {/* Switch Active */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-foreground">Status Tayang:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${popup.is_active ? "text-primary" : "text-muted-foreground"}`}>
                        {popup.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      <Switch
                        checked={popup.is_active}
                        onCheckedChange={() => handleToggleActive(popup.id, popup.is_active)}
                        aria-label="Toggle aktif popup"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="p-3 bg-muted/30 border-t border-border/60 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPopupToPreview(popup);
                    setPreviewDialogOpen(true);
                  }}
                  className="rounded-xl h-8 text-xs gap-1.5 flex-1"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Preview</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(popup)}
                  className="rounded-xl h-8 text-xs gap-1.5 flex-1"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Edit</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPopupToDelete(popup);
                    setDeleteDialogOpen(true);
                  }}
                  className="rounded-xl h-8 px-2.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPopup?.id ? "Edit Popup Pengumuman" : "Tambah Popup Pengumuman Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi informasi popup yang ingin ditampilkan ke pengunjung saat membuka website atau aplikasi.
            </DialogDescription>
          </DialogHeader>

          {editingPopup && (
            <div className="space-y-4 py-2">
              {/* Judul */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Judul Popup *</Label>
                <Input
                  value={editingPopup.title || ""}
                  onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })}
                  placeholder="Contoh: Download Aplikasi Buyaelvisyam.id di Play Store"
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Deskripsi / Pesan Pengumuman</Label>
                <Textarea
                  value={editingPopup.description || ""}
                  onChange={(e) => setEditingPopup({ ...editingPopup, description: e.target.value })}
                  placeholder="Penjelasan detail atau ajakan..."
                  rows={3}
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Upload Gambar */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Gambar Banner Popup</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Input
                    value={editingPopup.image_url || ""}
                    onChange={(e) => setEditingPopup({ ...editingPopup, image_url: e.target.value })}
                    placeholder="/uploads/... atau https://..."
                    className="rounded-xl text-sm flex-1 font-mono text-xs"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadImage}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl text-xs gap-1.5 shrink-0"
                  >
                    <ImagePlus className="w-4 h-4 text-primary" />
                    <span>{uploading ? "Mengupload..." : "Upload File"}</span>
                  </Button>
                </div>

                {editingPopup.image_url && (
                  <div className="relative w-full aspect-[2/1] max-w-sm rounded-2xl overflow-hidden border border-border mt-2 bg-muted">
                    <img
                      src={editingPopup.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPopup({ ...editingPopup, image_url: "" })}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tombol Aksi & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Teks Tombol Aksi</Label>
                  <Input
                    value={editingPopup.button_text || ""}
                    onChange={(e) => setEditingPopup({ ...editingPopup, button_text: e.target.value })}
                    placeholder="Buka / Download Sekarang / Daftar"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Link Tujuan (Action URL)</Label>
                  <Input
                    value={editingPopup.action_url || ""}
                    onChange={(e) => setEditingPopup({ ...editingPopup, action_url: e.target.value })}
                    placeholder="https://play.google.com/... atau /kajian"
                    className="rounded-xl text-sm font-mono text-xs"
                  />
                </div>
              </div>

              {/* Target Platform & Frekuensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Target Platform</Label>
                  <select
                    value={editingPopup.target_platform || "all"}
                    onChange={(e) => setEditingPopup({ ...editingPopup, target_platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="all">Semua Platform (Web & Aplikasi)</option>
                    <option value="web">Hanya Web Browser</option>
                    <option value="app">Hanya Aplikasi Android</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Frekuensi Penayangan</Label>
                  <select
                    value={editingPopup.display_frequency || "always"}
                    onChange={(e) => setEditingPopup({ ...editingPopup, display_frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="always">Selalu Ditampilkan (Setiap Kunjungan)</option>
                    <option value="once_per_day">Maksimal 1 Kali Per Hari</option>
                    <option value="once_forever">Hanya 1 Kali (Sekali Selamanya)</option>
                  </select>
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                <div>
                  <span className="text-xs font-bold text-foreground block">Status Popup Aktif</span>
                  <span className="text-[11px] text-muted-foreground">
                    Jika aktif, popup langsung tayang ke pengunjung sesuai jadwal & target platform.
                  </span>
                </div>
                <Switch
                  checked={editingPopup.is_active ?? true}
                  onCheckedChange={(checked) => setEditingPopup({ ...editingPopup, is_active: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSavePopup}
              disabled={saving}
              className="rounded-xl text-xs islamic-gradient text-primary-foreground font-semibold"
            >
              {saving ? "Menyimpan..." : "Simpan Popup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW SIMULATOR DIALOG */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-lg p-0 overflow-hidden rounded-3xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl">
          <button
            onClick={() => setPreviewDialogOpen(false)}
            type="button"
            className="absolute right-3 top-3 z-20 rounded-full bg-background/80 p-2 text-foreground/80 hover:bg-background hover:text-foreground backdrop-blur-sm shadow-md transition-all focus:outline-none"
            aria-label="Tutup Preview"
          >
            <X className="h-4 w-4" />
          </button>

          {popupToPreview?.image_url && (
            <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-muted overflow-hidden">
              <img
                src={popupToPreview.image_url}
                alt={popupToPreview.title || "Preview"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
                {popupToPreview?.title || "Judul Popup"}
              </h3>
              {popupToPreview?.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-1">
                  {popupToPreview.description}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewDialogOpen(false)}
                className="w-full sm:w-auto rounded-xl px-5 text-sm"
              >
                Tutup
              </Button>
              {popupToPreview?.action_url && (
                <Button
                  type="button"
                  onClick={() => {
                    setPreviewDialogOpen(false);
                    if (popupToPreview.action_url?.startsWith("http")) {
                      window.open(popupToPreview.action_url, "_blank");
                    }
                  }}
                  className="w-full sm:w-auto rounded-xl px-5 text-sm islamic-gradient text-primary-foreground font-semibold shadow-md gap-1.5"
                >
                  <span>{popupToPreview.button_text || "Lihat Selengkapnya"}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Hapus Popup?</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Apakah Anda yakin ingin menghapus popup &ldquo;<strong>{popupToDelete?.title}</strong>&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeletePopup}
              className="rounded-xl text-xs"
            >
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
