import { useEffect, useState } from "react";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface ProductCard {
  id: string;
  title: string;
  slug: string;
  description?: string;
  product_type: string;
  price: number;
  currency: string;
  image_url?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const query = filterType ? `?product_type=${filterType}` : "";
      const { data } = await api.get(`/products${query}`);
      setProducts(asArray<ProductCard>(data));
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [filterType]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daftar Produk</h1>
          <p className="text-muted-foreground">Lihat produk fisik dan digital yang tersedia.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="min-w-[200px]"><SelectValue placeholder="Filter jenis produk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Jenis</SelectItem>
              <SelectItem value="physical">Fisika</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilterType("")}>Reset</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Memuat produk...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition">
              {product.image_url && <img src={product.image_url} alt={product.title} className="h-48 w-full rounded-2xl object-cover mb-4" />}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">{product.product_type === "digital" ? "Digital" : "Fisika"}</p>
                  <h2 className="text-xl font-bold">{product.title}</h2>
                </div>
                <span className="text-sm font-semibold">{product.currency} {product.price.toLocaleString("id-ID")}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5 line-clamp-3">{product.description}</p>
              <Button onClick={() => navigate(`/produk/${product.slug}`)}>Lihat Detail</Button>
            </div>
          ))}
          {products.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">Belum ada produk untuk ditampilkan.</div>
          )}
        </div>
      )}
    </div>
  );
}
