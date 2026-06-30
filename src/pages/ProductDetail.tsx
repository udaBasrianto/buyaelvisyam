import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { asObject } from "@/lib/api-response";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => setProduct(asObject<ProductDetailItem>(data)))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Memuat produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Produk tidak ditemukan.</p>
            <Button onClick={() => navigate("/produk")}>Kembali ke Toko</Button>
          </div>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${product.title} - ${settings.site_name}`} description={product.description} />
      <Navbar />

      <main className="container mx-auto px-4 py-10 bottom-nav-safe">
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
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
