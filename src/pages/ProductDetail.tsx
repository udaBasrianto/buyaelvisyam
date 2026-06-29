import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { asObject } from "@/lib/api-response";

interface ProductDetailItem {
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
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => setProduct(asObject<ProductDetailItem>(data)))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat produk...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Produk tidak ditemukan.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {product.image_url && <img src={product.image_url} alt={product.title} className="w-full rounded-[2rem] object-cover shadow-lg" />}
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">{product.product_type === "digital" ? "Produk Digital" : "Produk Fisik"}</p>
            <h1 className="text-4xl font-bold">{product.title}</h1>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Harga</p>
              <p className="text-3xl font-bold">{product.currency} {product.price.toLocaleString("id-ID")}</p>
            </div>
            {product.product_type === "physical" ? (
              <div>
                <p className="text-sm text-muted-foreground">Stok</p>
                <p className="text-lg font-semibold">{product.stock}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">File digital</p>
                <p className="text-lg font-semibold">{product.digital_file_url ? "Tersedia" : "Tidak tersedia"}</p>
              </div>
            )}
            {product.sku && (
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="text-lg font-semibold">{product.sku}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                {product.is_active ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>
            <Button onClick={() => navigate(-1)}>Kembali</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
