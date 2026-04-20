import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Save, ImagePlus, X, Layout, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Widget {
  id: string;
  title: string;
  type: string;
  content: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

const WIDGET_TYPES = [
  { id: "html", label: "Custom HTML / Script" },
  { id: "image", label: "Banner Image / Ad" },
  { id: "text", label: "Plain Text / Info" },
];

export function WidgetsManager() {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Widget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", type: "html", content: "", image_url: "", link_url: "", is_active: true, sort_order: 0
  });

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/widgets");
      if (data) setWidgets(data);
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchWidgets(); }, []);

  const openDialog = (widget?: Widget) => {
    if (widget) {
      setEditing(widget);
      setForm({
        title: widget.title,
        type: widget.type,
        content: widget.content,
        image_url: widget.image_url,
        link_url: widget.link_url,
        is_active: widget.is_active,
        sort_order: widget.sort_order,
      });
    } else {
      setEditing(null);
      setForm({ title: "", type: "html", content: "", image_url: "", link_url: "", is_active: true, sort_order: widgets.length });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(f => ({ ...f, image_url: data.url }));
    } catch (err: any) {
      toast({ title: "Upload gagal", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await api.put(`/widgets/${editing.id}`, form);
      } else {
        await api.post("/widgets", form);
      }
      toast({ title: "Berhasil", description: "Widget tersimpan" });
      setDialogOpen(false);
      fetchWidgets();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus widget ini?")) return;
    try {
      await api.delete(`/widgets/${id}`);
      fetchWidgets();
      toast({ title: "Dihapus", description: "Widget berhasil dihapus" });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" /> Pengaturan Sidebar Widget
        </h3>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Widget
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Memuat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => (
            <div key={w.id} className={`group bg-card rounded-xl border p-4 hover:border-primary/50 transition-all ${!w.is_active && "opacity-60"}`}>
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                     <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {w.type}
                     </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(w)}>
                        <Edit className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(w.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                  </div>
               </div>
               
               <h4 className="font-bold text-sm mb-2 line-clamp-1">{w.title}</h4>
               
               {w.type === "image" && w.image_url && (
                  <img src={w.image_url} alt={w.title} className="w-full h-24 object-cover rounded-lg mb-2 border" />
               )}
               {w.type === "html" && (
                  <div className="text-[10px] font-mono text-muted-foreground bg-muted p-2 rounded line-clamp-3 mb-2">
                     {w.content}
                  </div>
               )}

               <div className="flex items-center justify-between mt-auto pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground">Urutan: {w.sort_order}</span>
                  {w.is_active ? (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Eye className="h-3 w-3" /> Aktif</span>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> Nonaktif</span>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader>
              <DialogTitle>{editing ? "Edit Widget" : "Tambah Widget Baru"}</DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="grid gap-2">
                 <Label>Judul Widget</Label>
                 <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Iklan Kajian atau Jadwal Sholat" />
              </div>

              <div className="grid gap-2">
                 <Label>Tipe Widget</Label>
                 <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       {WIDGET_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>

              {form.type === "image" && (
                 <>
                    <div className="grid gap-2">
                       <Label>Gambar Banner</Label>
                       <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       {form.image_url ? (
                          <div className="relative rounded-lg overflow-hidden border">
                             <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover" />
                             <button onClick={() => setForm({...form, image_url: ""})} className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                          </div>
                       ) : (
                          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                             <ImagePlus className="h-4 w-4" /> {uploading ? "Mengupload..." : "Upload Gambar"}
                          </Button>
                       )}
                    </div>
                    <div className="grid gap-2">
                       <Label>Link Tujuan (Opsional)</Label>
                       <Input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} placeholder="https://..." />
                    </div>
                 </>
              )}

              {(form.type === "html" || form.type === "text") && (
                 <div className="grid gap-2">
                    <Label>{form.type === "html" ? "Script / HTML Code" : "Konten Teks"}</Label>
                    <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6} placeholder={form.type === "html" ? "<script>...</script>" : "Tulis info disini..."} />
                 </div>
              )}

              <div className="flex items-center justify-between gap-4 pt-2">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded border-border" />
                    <Label htmlFor="is_active" className="cursor-pointer">Tampilkan Widget</Label>
                 </div>
                 <div className="flex items-center gap-2">
                    <Label>Urutan</Label>
                    <Input type="number" className="w-20" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} />
                 </div>
              </div>
           </div>

           <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan Widget</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
