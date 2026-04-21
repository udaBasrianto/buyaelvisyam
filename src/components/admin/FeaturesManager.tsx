import { useEffect, useState } from "react";
import { Save, Plus, Trash2, ExternalLink, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import * as LucideIcons from "lucide-react";

interface FeatureItem {
  id: string;
  icon: string;
  label: string;
  link: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const COLOR_OPTIONS = [
  { name: "Emerald (Green)", value: "emerald" },
  { name: "Blue (Sky)", value: "blue" },
  { name: "Amber (Orange)", value: "amber" },
  { name: "Rose (Pink)", value: "rose" },
  { name: "Indigo (Purple)", value: "indigo" },
  { name: "Slate (Gray)", value: "slate" },
];

export function FeaturesManager() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data } = await api.get("/features");
      setFeatures(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (features.length >= 4) {
      toast({ title: "Maksimal 4 fitur", variant: "destructive" });
      return;
    }
    const newFeature: Partial<FeatureItem> = {
      icon: "Zap",
      label: "Fitur Baru",
      link: "#",
      color: "emerald",
      sort_order: features.length,
      is_active: true
    };
    setFeatures([...features, newFeature as FeatureItem]);
  };

  const removeFeature = async (index: number, id?: string) => {
    if (id) {
      try {
        await api.delete(`/features/${id}`);
      } catch (err) {
         toast({ title: "Gagal hapus dari database", variant: "destructive" });
      }
    }
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const f of features) {
        if (f.id) {
          await api.put(`/features/${f.id}`, f);
        } else {
          await api.post("/features", f);
        }
      }
      toast({ title: "Berhasil disimpan", description: "Fitur beranda telah diperbarui" });
      fetchFeatures(); // Refresh to get IDs
    } catch (err) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Helper to render icon preview
  const IconPreview = ({ name }: { name: string }) => {
    const IconName = name as keyof typeof LucideIcons;
    const IconComponent = (LucideIcons[IconName] as any) || Box;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) return <div className="text-center py-8">Memuat Fitur...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Fitur Beranda (Feature Bar)</h3>
          <p className="text-xs text-muted-foreground">Kelola 4 icon fitur cepat di bawah Jendela Beranda.</p>
        </div>
        <Button onClick={addFeature} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div key={feature.id || index} className="p-4 border rounded-2xl bg-card/50 space-y-4 relative group">
            <button 
              onClick={() => removeFeature(index, feature.id)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <Trash2 className="h-3 w-3" />
            </button>

            <div className="flex gap-4">
               <div className={`h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 bg-primary/10 text-primary`}>
                  <IconPreview name={feature.icon} />
               </div>
               <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Label Fitur</Label>
                    <Input 
                      value={feature.label} 
                      onChange={(e) => updateFeature(index, 'label', e.target.value)}
                      placeholder="Contoh: Kajian Cepat"
                      className="h-8 text-sm font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nama Icon (Lucide)</Label>
                      <Input 
                        value={feature.icon} 
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        placeholder="Contoh: Zap, Heart, Book"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Pilih Warna</Label>
                      <select 
                        value={feature.color} 
                        onChange={(e) => updateFeature(index, 'color', e.target.value)}
                        className="w-full h-8 flex items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs"
                      >
                        {COLOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Link / URL (Kosongi jika tidak perlu)
                    </Label>
                    <Input 
                      value={feature.link} 
                      onChange={(e) => updateFeature(index, 'link', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {features.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-3xl text-muted-foreground italic">
          Belum ada fitur. Klik tambah untuk membuat fitur pertama.
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2 mt-4">
        <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Semua Fitur"}
      </Button>
    </div>
  );
}
