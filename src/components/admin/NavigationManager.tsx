import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, Save, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

type NavItem = {
  id: string;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  is_external: boolean;
};

export function NavigationManager() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [navPages, setNavPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NavItem | null>(null);
  const [form, setForm] = useState({ label: "", url: "", is_active: true, is_external: false, parent_id: "" });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/navigation");
      if (data) setItems(data);
      
      const { data: pagesData } = await api.get("/pages?status=published");
      if (pagesData) setNavPages(pagesData);
    } catch (err) {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSelectPage = (page: any) => {
    setForm({
      ...form,
      label: page.title,
      url: `/p/${page.slug}`,
      is_external: false
    });
  };

  const handleSave = async () => {
    if (!form.label || !form.url) return;
    try {
      if (editing) {
        await api.put(`/navigation/${editing.id}`, form);
      } else {
        await api.post("/navigation", { ...form, sort_order: items.length + 1 });
      }
      toast({ title: "Berhasil menyimpan menu" });
      setOpen(false);
      fetchItems();
    } catch (err) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Hapus menu ini?")) return;
    try {
      await api.delete(`/navigation/${id}`);
      fetchItems();
    } catch (err) {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">Manajemen Navigasi</h3>
          <p className="text-xs text-muted-foreground">Atur link menu yang muncul di navbar utama.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ label: "", url: "", is_active: true, is_external: false, parent_id: "" }); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Menu
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-card border p-4 rounded-2xl shadow-sm group hover:border-primary/30 transition-all">
             <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
             </div>
             <div className="flex-1">
                <div className="flex items-center gap-2">
                   <p className={`font-bold text-sm ${item.parent_id ? "text-muted-foreground ml-6" : ""}`}>
                     {item.parent_id && <span className="text-primary mr-2">↳</span>}
                     {item.label}
                   </p>
                   {item.is_external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                   {!item.is_active && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold">Draft</span>}
                   {item.parent_id && <Badge variant="outline" className="text-[9px] scale-90 py-0 h-4 uppercase tracking-tighter">Sub</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{item.url}</p>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(item); setForm({ ...item }); setOpen(true); }}>
                   <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem(item.id)}>
                   <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background/80 backdrop-blur-xl rounded-[2rem] border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Edit Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
              <div className="space-y-2">
                 <Label className="text-primary font-bold text-[10px] uppercase tracking-widest">Cepat Tambah dari Halaman</Label>
                 <div className="flex flex-wrap gap-2">
                    {navPages.map(page => (
                       <button 
                          key={page.id}
                          type="button"
                          onClick={() => handleSelectPage(page)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all border border-primary/20"
                       >
                          + {page.title}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="space-y-2">
                 <Label>Label Menu</Label>
                 <Input placeholder="Contoh: Beranda" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <Label>URL / Link</Label>
                 <Input placeholder="Contoh: /artikel atau https://..." value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <Label>Menu Induk (Sub-menu dari...)</Label>
                 <select 
                   className="w-full bg-muted/40 border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                   value={form.parent_id || ""}
                   onChange={e => setForm({...form, parent_id: e.target.value})}
                 >
                   <option value="">-- Menu Utama (Tidak Ada Induk) --</option>
                   {items.filter(i => !i.parent_id && i.id !== editing?.id).map(i => (
                     <option key={i.id} value={i.id}>{i.label}</option>
                   ))}
                 </select>
                 <p className="text-[10px] text-muted-foreground italic tracking-tight">Pilih menu induk jika ingin membuat dropdown.</p>
              </div>
             <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div className="space-y-0.5">
                   <Label>Link Eksternal</Label>
                   <p className="text-[10px] text-muted-foreground">Buka di tab baru</p>
                </div>
                <Switch checked={form.is_external} onCheckedChange={v => setForm({...form, is_external: v})} />
             </div>
             <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div className="space-y-0.5">
                   <Label>Aktif</Label>
                   <p className="text-[10px] text-muted-foreground">Tampilkan di website</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="rounded-xl font-bold px-8" onClick={handleSave}>Simpan Menu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
