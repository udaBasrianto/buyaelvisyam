import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import * as Icons from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Item {
  id: string;
  icon: string;
  label: string;
  link: string | null;
  sort_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = ["BookOpen", "Heart", "Calendar", "Users", "Star", "Sparkles", "Compass", "Bookmark", "Bell", "Globe", "Pen", "Search", "Type", "Layout"];

export function FeatureBarManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ icon: "Sparkles", label: "", link: "", sort_order: 0, is_active: true });

  const fetchItems = async () => {
    try {
      const { data } = await api.get("/features");
      if (data) setItems(data as Item[]);
    } catch (error: any) {
      toast({ title: "Gagal memuat feature", description: error.message, variant: "destructive" });
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openEditor = (item?: Item) => {
    if (item) {
      setEditing(item);
      setForm({ icon: item.icon, label: item.label, link: item.link || "", sort_order: item.sort_order, is_active: item.is_active });
    } else {
      setEditing(null);
      setForm({ icon: "Sparkles", label: "", link: "", sort_order: items.length, is_active: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast({ title: "Error", description: "Label wajib diisi", variant: "destructive" });
      return;
    }
    const payload = { ...form, label: form.label.trim(), link: form.link.trim() || null };
    try {
      if (editing) {
        await api.put(`/features/${editing.id}`, payload);
      } else {
        await api.post("/features", payload);
      }
      toast({ title: "Berhasil", description: editing ? "Item diperbarui" : "Item ditambahkan" });
      setOpen(false);
      fetchItems();
    } catch (error: any) {
       toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/features/${deleteId}`);
      toast({ title: "Dihapus" });
      fetchItems();
    } catch (error: any) {
       toast({ title: "Gagal menghapus", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  const toggleActive = async (item: Item) => {
    try {
      await api.put(`/features/${item.id}`, { is_active: !item.is_active });
      fetchItems();
    } catch (error: any) {
      toast({ title: "Gagal toggle", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Feature Bar</h3>
        <Button size="sm" className="gap-1.5" onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> Tambah Item
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Belum ada item.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = (Icons as any)[item.icon] || Sparkles;
            return (
              <div key={item.id} className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.link || "Tanpa link"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Tambah Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Mis. Al-Quran" />
            </div>
            <div>
              <Label>Link (opsional)</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/kategori/..." />
            </div>
            <div>
              <Label>Ikon</Label>
              <div className="grid grid-cols-7 gap-2 mt-1">
                {ICON_OPTIONS.map((name) => {
                  const I = (Icons as any)[name] || Sparkles;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: name })}
                      className={`p-2 rounded-lg border transition ${form.icon === name ? "bg-primary/10 border-primary text-primary" : "border-border hover:border-primary/30"}`}
                      title={name}
                    >
                      <I className="h-4 w-4 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Urutan</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
