import { useState, useEffect } from "react";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff,
  ChevronUp, ChevronDown, Save, LayoutGrid, List, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";

interface Section {
  id: string;
  category_name: string;
  category_slug: string;
  custom_title: string;
  article_count: number;
  sort_order: number;
  is_active: boolean;
  layout: "grid" | "list" | "featured";
}

interface Category {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

const LAYOUT_OPTIONS = [
  { value: "grid",     label: "Grid",     icon: LayoutGrid,  desc: "Artikel pertama besar, sisanya kartu" },
  { value: "list",     label: "List",     icon: List,        desc: "Artikel besar + daftar samping" },
  { value: "featured", label: "Featured", icon: Sparkles,    desc: "Hero penuh + baris bawah" },
];

export function HomepageCategorySectionsManager() {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // id of section being saved
  const [showAddForm, setShowAddForm] = useState(false);

  // New section form state
  const [newSection, setNewSection] = useState<Omit<Section, "id" | "sort_order">>({
    category_name: "",
    category_slug: "",
    custom_title: "",
    article_count: 4,
    is_active: true,
    layout: "grid",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, catRes] = await Promise.all([
        api.get("/homepage-sections"),
        api.get("/categories"),
      ]);
      setSections(asArray<Section>(secRes.data).sort((a, b) => a.sort_order - b.sort_order));
      setCategories(asArray<Category>(catRes.data).filter(c => c.article_count > 0));
    } catch (err) {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSection.category_name) {
      toast({ title: "Pilih kategori terlebih dahulu", variant: "destructive" });
      return;
    }
    try {
      const { data } = await api.post("/homepage-sections", newSection);
      setSections(prev => [...prev, data]);
      setNewSection({ category_name: "", category_slug: "", custom_title: "", article_count: 4, is_active: true, layout: "grid" });
      setShowAddForm(false);
      toast({ title: "Section ditambahkan" });
    } catch (err: any) {
      toast({ title: "Gagal menambahkan section", description: err.response?.data?.error, variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string, patch: Partial<Section>) => {
    setSaving(id);
    try {
      const { data } = await api.put(`/homepage-sections/${id}`, patch);
      setSections(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      toast({ title: "Tersimpan" });
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus section ini dari beranda?")) return;
    try {
      await api.delete(`/homepage-sections/${id}`);
      setSections(prev => prev.filter(s => s.id !== id));
      toast({ title: "Section dihapus" });
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(reordered);
    try {
      await api.put("/homepage-sections/reorder", reordered.map(s => ({ id: s.id, sort_order: s.sort_order })));
    } catch {
      toast({ title: "Gagal menyimpan urutan", variant: "destructive" });
    }
  };

  const onCategoryChange = (name: string) => {
    const cat = categories.find(c => c.name === name);
    setNewSection(prev => ({
      ...prev,
      category_name: name,
      category_slug: cat?.slug || name.toLowerCase().replace(/\s+/g, "-"),
    }));
  };

  if (loading) return (
    <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Memuat section beranda...</div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base">Section Kategori Beranda</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Tampilkan artikel per kategori di beranda seperti web magazine.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(v => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tambah Section
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl border bg-background/60 p-4 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Section Baru</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category picker */}
            <div>
              <Label className="text-[11px]">Kategori</Label>
              <Select value={newSection.category_name} onValueChange={onCategoryChange}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">({cat.article_count})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom title */}
            <div>
              <Label className="text-[11px]">Judul Custom (opsional)</Label>
              <Input
                className="h-9 mt-1"
                placeholder={`Contoh: Kajian ${newSection.category_name || "Pilihan"}`}
                value={newSection.custom_title}
                onChange={e => setNewSection(p => ({ ...p, custom_title: e.target.value }))}
              />
            </div>

            {/* Article count */}
            <div>
              <Label className="text-[11px]">Jumlah Artikel (2–12)</Label>
              <Input
                type="number"
                min={2}
                max={12}
                className="h-9 mt-1"
                value={newSection.article_count}
                onChange={e => setNewSection(p => ({ ...p, article_count: Math.min(12, Math.max(2, Number(e.target.value))) }))}
              />
            </div>

            {/* Layout picker */}
            <div>
              <Label className="text-[11px]">Layout</Label>
              <Select value={newSection.layout} onValueChange={v => setNewSection(p => ({ ...p, layout: v as any }))}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — <span className="text-muted-foreground text-[11px]">{opt.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={newSection.is_active}
              onCheckedChange={v => setNewSection(p => ({ ...p, is_active: v }))}
            />
            <span className="text-[12px] text-muted-foreground">Aktifkan langsung</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Batal</Button>
              <Button size="sm" onClick={handleAdd} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sections.length === 0 && !showAddForm && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <LayoutGrid className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada section kategori</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Tambahkan section untuk menampilkan artikel per kategori di beranda.
          </p>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <SectionRow
            key={sec.id}
            section={sec}
            categories={categories}
            index={idx}
            total={sections.length}
            saving={saving === sec.id}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onMoveUp={() => move(idx, -1)}
            onMoveDown={() => move(idx, 1)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Individual section row ───────────────────────────────────────────────────
interface RowProps {
  section: Section;
  categories: Category[];
  index: number;
  total: number;
  saving: boolean;
  onUpdate: (id: string, patch: Partial<Section>) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionRow({ section, categories, index, total, saving, onUpdate, onDelete, onMoveUp, onMoveDown }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Section>({ ...section });

  const save = () => {
    onUpdate(section.id, {
      custom_title: draft.custom_title,
      article_count: draft.article_count,
      layout: draft.layout,
      is_active: draft.is_active,
      category_name: draft.category_name,
      category_slug: draft.category_slug,
    });
    setEditing(false);
  };

  const onCatChange = (name: string) => {
    const cat = categories.find(c => c.name === name);
    setDraft(p => ({
      ...p,
      category_name: name,
      category_slug: cat?.slug || name.toLowerCase().replace(/\s+/g, "-"),
    }));
  };

  return (
    <div className={`rounded-2xl border transition-all ${section.is_active ? "bg-card" : "bg-muted/30 opacity-60"}`}>
      {/* Collapsed header */}
      <div className="flex items-center gap-3 p-3.5">
        {/* Drag handle / order indicator */}
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[14px] truncate">
              {section.custom_title || section.category_name}
            </span>
            {section.custom_title && (
              <span className="text-[10px] text-muted-foreground">({section.category_name})</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
              {section.layout}
            </span>
            <span className="text-[10px] text-muted-foreground">{section.article_count} artikel</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active toggle */}
          <button
            onClick={() => onUpdate(section.id, { is_active: !section.is_active })}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
            title={section.is_active ? "Sembunyikan" : "Tampilkan"}
          >
            {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[11px]"
            onClick={() => setEditing(v => !v)}
          >
            {editing ? "Tutup" : "Edit"}
          </Button>

          <button
            onClick={() => onDelete(section.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            title="Hapus section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {editing && (
        <div className="border-t border-border/50 p-4 space-y-3 bg-background/50 rounded-b-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Kategori</Label>
              <Select value={draft.category_name} onValueChange={onCatChange}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">({cat.article_count})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px]">Judul Custom</Label>
              <Input
                className="h-9 mt-1"
                placeholder="Kosongkan untuk gunakan nama kategori"
                value={draft.custom_title}
                onChange={e => setDraft(p => ({ ...p, custom_title: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-[11px]">Jumlah Artikel (2–12)</Label>
              <Input
                type="number"
                min={2}
                max={12}
                className="h-9 mt-1"
                value={draft.article_count}
                onChange={e => setDraft(p => ({ ...p, article_count: Math.min(12, Math.max(2, Number(e.target.value))) }))}
              />
            </div>

            <div>
              <Label className="text-[11px]">Layout</Label>
              <Select value={draft.layout} onValueChange={v => setDraft(p => ({ ...p, layout: v as any }))}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.is_active}
                onCheckedChange={v => setDraft(p => ({ ...p, is_active: v }))}
              />
              <span className="text-[12px] text-muted-foreground">
                {draft.is_active ? "Ditampilkan di beranda" : "Disembunyikan"}
              </span>
            </div>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
              {saving ? (
                <span className="animate-pulse">Menyimpan...</span>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Simpan</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
