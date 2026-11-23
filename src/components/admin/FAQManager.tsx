import { useState, useEffect } from "react";
import {
  Plus, Trash2, Save, X, Eye, EyeOff, HelpCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: "akun", label: "Akun & Login" },
  { value: "konten", label: "Artikel & Konten" },
  { value: "donasi", label: "Donasi" },
  { value: "aplikasi", label: "Aplikasi & Teknis" },
  { value: "umum", label: "Umum / Lainnya" },
];

const emptyForm = { category: "akun", question: "", answer: "", is_active: true };

function categoryLabel(value: string) {
  return CATEGORIES.find(c => c.value === value)?.label || value || "Umum";
}

export function FAQManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FAQItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/faqs");
      setItems((data?.items || []) as FAQItem[]);
    } catch {
      toast({ title: "Gagal memuat data FAQ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAddForm = () => {
    setForm(emptyForm);
    setShowAdd(false);
  };

  const handleCreate = async () => {
    if (!form.question.trim()) {
      toast({ title: "Pertanyaan wajib diisi", variant: "destructive" });
      return;
    }
    if (!form.answer.trim()) {
      toast({ title: "Jawaban wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/faqs", {
        category: form.category,
        question: form.question.trim(),
        answer: form.answer.trim(),
        is_active: form.is_active,
      });
      toast({ title: "FAQ ditambahkan" });
      resetAddForm();
      load();
    } catch (err: any) {
      toast({ title: "Gagal menambah FAQ", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleUpdate = async (item: FAQItem) => {
    if (!editForm) return;
    if (!editForm.question.trim()) {
      toast({ title: "Pertanyaan wajib diisi", variant: "destructive" });
      return;
    }
    if (!editForm.answer.trim()) {
      toast({ title: "Jawaban wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/faqs/${item.id}`, {
        category: editForm.category,
        question: editForm.question.trim(),
        answer: editForm.answer.trim(),
        is_active: editForm.is_active,
      });
      toast({ title: "Perubahan tersimpan" });
      setEditingId(null);
      setEditForm(null);
      load();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: FAQItem) => {
    if (!confirm(`Hapus pertanyaan "${item.question}"?`)) return;
    try {
      await api.delete(`/admin/faqs/${item.id}`);
      toast({ title: "FAQ dihapus" });
      if (editingId === item.id) { setEditingId(null); setEditForm(null); }
      load();
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const toggleActive = async (item: FAQItem) => {
    try {
      await api.put(`/admin/faqs/${item.id}`, { is_active: !item.is_active });
      load();
    } catch {
      toast({ title: "Gagal mengubah status", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card rounded-xl card-shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base">Manajemen FAQ</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Kelola pertanyaan & jawaban yang tampil di halaman <span className="font-semibold text-primary">/faq</span>. Jika belum ada data, halaman publik memakai konten bawaan.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(v => !v)} className="gap-1.5">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Tutup" : "Tambah Pertanyaan"}
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">{items.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total FAQ</p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">{items.filter(i => i.is_active).length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aktif di Publik</p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-2xl font-black text-primary">
            {new Set(items.map(i => i.category)).size}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Kategori</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl border bg-background/60 p-4 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Tambah Pertanyaan Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[11px]">Kategori</Label>
              <select
                className="w-full bg-background border border-input rounded-lg h-9 mt-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[11px]">Pertanyaan *</Label>
              <Input
                className="h-9 mt-1"
                placeholder="Contoh: Bagaimana cara berdonasi?"
                value={form.question}
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[11px]">Jawaban *</Label>
              <textarea
                rows={3}
                className="w-full bg-background border border-input rounded-lg mt-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jawaban lengkap untuk pertanyaan di atas..."
                value={form.answer}
                onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <span className="text-[12px] text-muted-foreground">Tampilkan langsung di halaman FAQ</span>
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
          <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada pertanyaan</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Klik "Tambah Pertanyaan" untuk membuat FAQ pertama. Sampai saat itu, halaman /faq menampilkan konten bawaan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`rounded-2xl border transition-all ${item.is_active ? "bg-card" : "bg-muted/20 opacity-75"}`}>
                {/* Collapsed row */}
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                    <HelpCircle className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px]">{item.question}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase">
                        {categoryLabel(item.category)}
                      </span>
                      {!item.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-black uppercase">Nonaktif</span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                      {item.answer}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mt-1 flex-wrap">
                      <span>Urutan {item.sort_order}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                {isEditing && editForm && (
                  <div className="border-t border-border/50 p-4 space-y-3 bg-background/50 rounded-b-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Edit Pertanyaan</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px]">Kategori</Label>
                        <select
                          className="w-full bg-background border border-input rounded-lg h-9 mt-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={editForm.category}
                          onChange={e => setEditForm(p => ({ ...p!, category: e.target.value }))}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Pertanyaan</Label>
                        <Input className="h-9 mt-1" value={editForm.question} onChange={e => setEditForm(p => ({ ...p!, question: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px]">Jawaban</Label>
                      <textarea
                        rows={3}
                        className="w-full bg-background border border-input rounded-lg mt-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={editForm.answer}
                        onChange={e => setEditForm(p => ({ ...p!, answer: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm(p => ({ ...p!, is_active: v }))} />
                        <span className="text-[12px] text-muted-foreground">
                          {editForm.is_active ? "Ditampilkan di halaman FAQ" : "Disembunyikan"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}>Batal</Button>
                        <Button size="sm" onClick={() => handleUpdate(item)} disabled={saving} className="gap-1.5">
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Simpan
                        </Button>
                      </div>
                    </div>
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