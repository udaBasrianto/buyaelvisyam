import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  product_type: string;
  price: number;
  currency: string;
  sku?: string;
  stock: number;
  digital_file_url?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

const PRODUCT_TYPES = [
  { id: "physical", label: "Fisika" },
  { id: "digital", label: "Digital" },
];

export function ProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    product_type: "physical",
    price: 0,
    currency: "IDR",
    sku: "",
    stock: 0,
    digital_file_url: "",
    image_url: "",
    is_active: true,
    sort_order: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/products?active=all");
      setProducts(asArray<ProductItem>(data));
    } catch (err: any) {
      toast({ title: "Gagal memuat produk", description: err.message, variant: "destructive" });
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openDialog = (product?: ProductItem) => {
    if (product) {
      setEditing(product);
      setForm({
        title: product.title,
        slug: product.slug,
        description: product.description || "",
        product_type: product.product_type,
        price: product.price,
        currency: product.currency,
        sku: product.sku || "",
        stock: product.stock,
        digital_file_url: product.digital_file_url || "",
        image_url: product.image_url || "",
        is_active: product.is_active,
        sort_order: product.sort_order,
      });
    } else {
      setEditing(null);
      setForm({
        title: "",
        slug: "",
        description: "",
        product_type: "physical",
        price: 0,
        currency: "IDR",
        sku: "",
        stock: 0,
        digital_file_url: "",
        image_url: "",
        is_active: true,
        sort_order: products.length,
      });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, image_url: data.url }));
      toast({ title: "Gambar berhasil diunggah" });
    } catch (err: any) {
      toast({ title: "Upload gagal", description: err.message, variant: "destructive" });
    }

    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/products/${editing.id}`, form);
        toast({ title: "Produk diperbarui" });
      } else {
        await api.post("/admin/products", form);
        toast({ title: "Produk ditambahkan" });
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan produk", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast({ title: "Produk dihapus" });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Gagal menghapus produk", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Manajemen Produk</h3>
          <p className="text-sm text-muted-foreground">Kelola produk fisik dan digital di toko Anda.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Memuat produk...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.title}</TableCell>
                  <TableCell className="capitalize">{product.product_type}</TableCell>
                  <TableCell>{product.currency} {product.price.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{product.product_type === "digital" ? "N/A" : product.stock}</TableCell>
                  <TableCell>{product.is_active ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(product)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            <DialogDescription>{editing ? "Perbarui informasi produk." : "Tambahkan produk fisik atau digital baru."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug (opsional)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="otomatis dibuat dari judul" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis Produk</Label>
                <Select value={form.product_type} onValueChange={(value) => setForm({ ...form, product_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Harga</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mata Uang</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Stok</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} disabled={form.product_type === "digital"} />
              </div>
              <div className="space-y-2">
                <Label>URL File Digital</Label>
                <Input value={form.digital_file_url} onChange={(e) => setForm({ ...form, digital_file_url: e.target.value })} disabled={form.product_type === "physical"} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                <div className="flex flex-col gap-2">
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL gambar atau upload" />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      <ImagePlus className="h-4 w-4" /> {uploadingImage ? "Mengunggah..." : "Upload Gambar"}
                    </Button>
                    {form.image_url && <span className="text-sm text-muted-foreground break-all">{form.image_url}</span>}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </div>
              </div>
              <div className="space-y-2 flex items-end">
                <Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
                <span className="text-sm text-muted-foreground">Aktifkan produk</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Urutan Tampilan</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
