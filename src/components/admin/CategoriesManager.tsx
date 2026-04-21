import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Cat {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  article_count?: number;
}

const COLOR_OPTIONS = [
  { label: "Hijau", value: "bg-primary/10 text-primary" },
  { label: "Emas", value: "bg-secondary/20 text-secondary-foreground" },
  { label: "Aksen", value: "bg-accent text-accent-foreground" },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function CategoriesManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", color: COLOR_OPTIONS[0].value, sort_order: 0, is_active: true });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get("/categories");
      if (data) setItems(data as Cat[]);
    } catch (error: any) {
      toast({ title: "Gagal memuat kategori", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} kategori terpilih? Artikel tidak akan ikut terhapus.`)) return;
    
    setIsBulkDeleting(true);
    try {
      await api.post("/categories/bulk-delete", { ids: selectedIds });
      toast({ title: "Berhasil", description: `${selectedIds.length} kategori dihapus.` });
      setSelectedIds([]);
      fetchItems();
    } catch (error: any) {
      toast({ title: "Gagal hapus masal", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openEditor = (item?: Cat) => {
    if (item) {
      setEditing(item);
      setForm({ name: item.name, slug: item.slug, color: item.color, sort_order: item.sort_order, is_active: item.is_active });
    } else {
      setEditing(null);
      setForm({ name: "", slug: "", color: COLOR_OPTIONS[0].value, sort_order: items.length, is_active: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Nama wajib diisi", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      color: form.color,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      toast({ title: "Berhasil" });
      setOpen(false);
      fetchItems();
    } catch (error: any) {
      toast({ title: "Gagal menyimpan kategori", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      toast({ title: "Dihapus" });
      fetchItems();
    } catch (error: any) {
       toast({ title: "Gagal menghapus kategori", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  const toggleActive = async (item: Cat) => {
    try {
      await api.put(`/categories/${item.id}`, { is_active: !item.is_active });
      fetchItems();
    } catch (error: any) {
      toast({ title: "Gagal status toggle", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-foreground">Kelola Kategori</h3>
          {items.length > 0 && (
             <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs text-primary font-bold">
                {selectedIds.length === items.length ? "Batal Pilih" : "Pilih Semua"}
             </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button 
              size="sm" 
              variant="destructive" 
              className="gap-1.5 h-9" 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button size="sm" className="gap-1.5 h-9" onClick={() => openEditor()}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Belum ada kategori.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((cat) => (
            <div 
              key={cat.id} 
              className={`bg-card rounded-xl p-4 border transition-all flex items-center justify-between gap-2 relative group ${selectedIds.includes(cat.id) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border/50'}`}
              onClick={() => toggleSelect(cat.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border group-hover:border-primary/50'}`}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(cat.id); }}
                >
                  {selectedIds.includes(cat.id) && <Plus className="h-3 w-3 rotate-45 stroke-[4]" />}
                </div>
                <div className={`p-2 rounded-lg ${cat.color}`}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">/{cat.slug} • {cat.article_count || 0} Artikel</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(cat)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cat.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: editing ? form.slug : slugify(name) });
                }}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Warna</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <Button onClick={handleSave} className="gap-1.5"><Save className="h-4 w-4" /> Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>Artikel dengan kategori ini tidak akan terhapus.</AlertDialogDescription>
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
