import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ImagePlus, ArrowLeft, Upload, FileArchive, Download, Loader2 } from "lucide-react";
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
  download_count?: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  discount_price?: number;
  is_flash_sale?: boolean;
  flash_sale_start?: string;
  flash_sale_end?: string;
  images?: string[];
}

const PRODUCT_TYPES = [
  { id: "physical", label: "Fisik" },
  { id: "digital", label: "Digital" },
];

const formatForDateTimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function ProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
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
    download_count: 0,
    image_url: "",
    is_active: true,
    sort_order: 0,
    discount_price: undefined as number | undefined,
    is_flash_sale: false,
    flash_sale_start: "",
    flash_sale_end: "",
    images: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const digitalFileInputRef = useRef<HTMLInputElement | null>(null);

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
      setUploadedFileName(product.digital_file_url ? product.digital_file_url.split("/").pop() || "" : "");
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
        download_count: product.download_count ?? 0,
        image_url: product.image_url || "",
        is_active: product.is_active,
        sort_order: product.sort_order,
        discount_price: product.discount_price || undefined,
        is_flash_sale: product.is_flash_sale || false,
        flash_sale_start: formatForDateTimeLocal(product.flash_sale_start),
        flash_sale_end: formatForDateTimeLocal(product.flash_sale_end),
        images: product.images || [],
      });
    } else {
      setEditing(null);
      setUploadedFileName("");
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
        download_count: 0,
        image_url: "",
        is_active: true,
        sort_order: products.length,
        discount_price: undefined,
        is_flash_sale: false,
        flash_sale_start: "",
        flash_sale_end: "",
        images: [],
      });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    const newUrls: string[] = [];
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("image", files[i]);

      try {
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newUrls.push(data.url);
      } catch (err) {
        failedCount++;
      }
    }

    if (newUrls.length > 0) {
      setForm((prev) => {
        const updatedImages = [...prev.images, ...newUrls];
        const updatedImageUrl = prev.image_url || updatedImages[0] || "";
        return {
          ...prev,
          images: updatedImages,
          image_url: updatedImageUrl,
        };
      });
      toast({ title: `${newUrls.length} gambar berhasil diunggah` });
    }

    if (failedCount > 0) {
      toast({
        title: "Beberapa upload gagal",
        description: `${failedCount} file gagal diunggah`,
        variant: "destructive",
      });
    }

    setUploadingImage(false);
  };

  const handleDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDigital(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/admin/products/upload-digital", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({
        ...prev,
        digital_file_url: data.url,
        product_type: "digital",
      }));
      setUploadedFileName(data.filename || file.name);
      toast({
        title: "File digital berhasil diunggah",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      });
    } catch (err: any) {
      toast({
        title: "Gagal mengunggah file digital",
        description: err?.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingDigital(false);
      if (digitalFileInputRef.current) digitalFileInputRef.current.value = "";
    }
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

  if (dialogOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving} className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Produk
          </Button>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold">{editing ? "Edit Produk" : "Tambah Produk"}</h3>
            <p className="text-sm text-muted-foreground">{editing ? "Perbarui informasi produk." : "Tambahkan produk fisik atau digital baru."}</p>
          </div>
          
          <div className="space-y-4">
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
                <Label>Harga (IDR / 0 jika gratis)</Label>
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

            {form.product_type === "physical" ? (
              <div className="space-y-2">
                <Label>Stok Produk Fisik</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <Label className="text-base font-semibold text-primary flex items-center gap-2">
                      <FileArchive className="h-5 w-5" /> File Produk Digital (.zip, .pdf, dll.)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pengunjung dapat langsung mengunduh file ini dari website.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => digitalFileInputRef.current?.click()}
                      disabled={uploadingDigital}
                      className="bg-background shadow-xs hover:border-primary"
                    >
                      {uploadingDigital ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" /> Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 text-primary" /> Upload File (.zip, .pdf, dll)
                        </>
                      )}
                    </Button>
                    <input
                      ref={digitalFileInputRef}
                      type="file"
                      accept=".zip,.rar,.7z,.tar,.gz,.pdf,.epub,.mobi,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.m4a,.wav,.mp4,.apk,.txt"
                      className="hidden"
                      onChange={handleDigitalFileUpload}
                      disabled={uploadingDigital}
                    />
                  </div>
                </div>

                {form.digital_file_url ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-background rounded-xl border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileArchive className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadedFileName || form.digital_file_url.split("/").pop()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {form.digital_file_url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(form.digital_file_url, "_blank")}
                        className="h-8 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Tes Unduh
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, digital_file_url: "" })}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground bg-background/50">
                    Belum ada file terunggah. Klik <strong>Upload File</strong> di atas atau masukkan URL langsung di bawah. Format didukung: <strong>ZIP, RAR, 7Z, PDF, EPUB, DOCX, MP3, APK, dll. (Maks. 250MB)</strong>.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">URL File Digital (Manual atau Hasil Upload)</Label>
                    <Input
                      value={form.digital_file_url}
                      onChange={(e) => setForm({ ...form, digital_file_url: e.target.value })}
                      placeholder="https://... atau /uploads/digital/..."
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-primary" /> Jumlah Download (Tersinkron Database)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.download_count}
                      onChange={(e) => setForm({ ...form, download_count: Number(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Bertambah otomatis setiap kali pengguna mengunduh dari web.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <Label>Galeri Gambar Produk</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                    <ImagePlus className="h-4 w-4 mr-2" /> {uploadingImage ? "Mengunggah..." : "Upload Gambar"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    multiple
                  />
                  {form.images && form.images.length > 0 && (
                    <span className="text-xs text-muted-foreground">{form.images.length} gambar diunggah</span>
                  )}
                </div>

                {form.images && form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 bg-muted/30 rounded-2xl border border-border">
                    {form.images.map((img, idx) => {
                      const isMain = form.image_url === img;
                      return (
                        <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border group ${isMain ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          
                          <button
                            type="button"
                            onClick={() => {
                              const nextImages = form.images.filter(x => x !== img);
                              let nextMain = form.image_url;
                              if (isMain) {
                                nextMain = nextImages[0] || "";
                              }
                              setForm({ ...form, images: nextImages, image_url: nextMain });
                            }}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 hover:bg-red-600 text-white transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: img })}
                            className={`absolute bottom-1 left-1 right-1 text-[10px] py-0.5 rounded font-semibold text-center transition ${
                              isMain 
                                ? 'bg-primary text-white' 
                                : 'bg-black/60 hover:bg-black/80 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                            }`}
                          >
                            {isMain ? "Utama" : "Set Utama"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">URL Gambar Utama (Featured)</Label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Pilih gambar di atas atau masukkan URL langsung" className="h-8 text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Urutan Tampilan</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
                <span className="text-sm font-medium">Aktifkan produk</span>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-2">
                <Label>Harga Diskon (opsional)</Label>
                <Input type="number" value={form.discount_price || ""} onChange={(e) => setForm({ ...form, discount_price: e.target.value ? Number(e.target.value) : undefined })} placeholder="Kosongkan jika tidak diskon" />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.is_flash_sale} onCheckedChange={(value) => setForm({ ...form, is_flash_sale: value })} />
                <span className="text-sm font-medium">Aktifkan Flash Sale</span>
              </div>
            </div>

            {form.is_flash_sale && (
              <div className="grid gap-4 md:grid-cols-2 border-l-2 border-primary/20 pl-4 py-2 space-y-2 md:space-y-0">
                <div className="space-y-2">
                  <Label>Waktu Mulai Flash Sale (opsional)</Label>
                  <Input type="datetime-local" value={form.flash_sale_start} onChange={(e) => setForm({ ...form, flash_sale_start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Waktu Selesai Flash Sale</Label>
                  <Input type="datetime-local" value={form.flash_sale_end} onChange={(e) => setForm({ ...form, flash_sale_end: e.target.value })} />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : (editing ? "Simpan Perubahan" : "Tambah Produk")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Manajemen Produk</h3>
          <p className="text-sm text-muted-foreground">Kelola produk fisik dan digital di toko Anda.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Produk
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
                <TableHead>Diunduh</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{product.title}</span>
                      {product.digital_file_url && (
                        <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {product.digital_file_url.split("/").pop()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.product_type === 'digital' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {product.product_type === "digital" ? "Digital" : "Fisik"}
                    </span>
                  </TableCell>
                  <TableCell>{product.currency} {product.price.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{product.product_type === "digital" ? "Digital" : product.stock}</TableCell>
                  <TableCell>
                    {product.product_type === "digital" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary text-xs">
                        <Download className="h-3.5 w-3.5" /> {(product.download_count || 0).toLocaleString("id-ID")}x
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {product.digital_file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Unduh file produk digital"
                        className="text-primary hover:bg-primary/10"
                        onClick={() => window.open(`/api/products/${product.id}/download`, "_blank")}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openDialog(product)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}