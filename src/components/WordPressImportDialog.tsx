import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Globe } from "lucide-react";
import api from "@/lib/api";

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

export function WordPressImportDialog({ open, onOpenChange, onImportSuccess }: Props) {
  const { toast } = useToast();
  const [wpUrl, setWpUrl] = useState("");
  const [categories, setCategories] = useState<WPCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const [loadingCats, setLoadingCats] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);

  const fetchCategories = async () => {
    if (!wpUrl) return;
    setLoadingCats(true);
    setCategories([]);
    setResult(null);

    try {
      const { data } = await api.post("/import-wordpress", {
        action: "categories",
        wpUrl,
      });

      setCategories(data.categories || []);
      toast({ title: "Berhasil", description: `${data.categories?.length || 0} kategori ditemukan` });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.response?.data?.error || err.message || "Tidak bisa mengambil", variant: "destructive" });
    } finally {
      setLoadingCats(false);
    }
  };

  const handleImport = async () => {
    if (!wpUrl) return;
    setImporting(true);
    setResult(null);

    try {
      const { data } = await api.post("/import-wordpress", {
        action: "import",
        wpUrl,
        categoryId: selectedCategory,
        after: afterDate ? `${afterDate}T00:00:00` : undefined,
        before: beforeDate ? `${beforeDate}T23:59:59` : undefined,
      });

      setResult(data);
      if (onImportSuccess) onImportSuccess();
      toast({
        title: "Import selesai!",
        description: `${data.imported} artikel diimport, ${data.skipped} dilewati dari total ${data.total}`,
      });
    } catch (err: any) {
      toast({ title: "Gagal import", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Import dari WordPress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>URL Website WordPress</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="https://yoursite.com"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
                disabled={!wpUrl || loadingCats}
                className="shrink-0"
              >
                {loadingCats ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pastikan WordPress REST API aktif (wp-json/wp/v2)
            </p>
          </div>

          {categories.length > 0 && (
            <div className="space-y-4 pt-2 border-t">
              <div>
                <Label>Filter Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori ({categories.reduce((s, c) => s + c.count, 0)} post)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name} ({cat.count} post)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Sesudah Tanggal</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={afterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Sebelum Tanggal</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={beforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-accent p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">Hasil Import:</p>
              <p className="text-muted-foreground">✅ {result.imported} artikel berhasil diimport</p>
              <p className="text-muted-foreground">⏭️ {result.skipped} dilewati (sudah ada / error)</p>
              <p className="text-muted-foreground">📊 Total: {result.total} post ditemukan</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          <Button
            onClick={handleImport}
            disabled={!wpUrl || importing}
            className="gap-1.5"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {importing ? "Mengimport..." : "Import Artikel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
