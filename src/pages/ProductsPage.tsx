import { useEffect, useState } from "react";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Eye } from "lucide-react";

interface ProductCard {
  id: string;
  title: string;
  slug: string;
  description?: string;
  product_type: string;
  price: number;
  currency: string;
  image_url?: string;
  views?: number;
  sold?: number;
  discount_price?: number;
  is_flash_sale?: boolean;
  flash_sale_start?: string;
  flash_sale_end?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const isFlashSaleActive = (p: ProductCard) => {
    if (!p.is_flash_sale) return false;
    const now = new Date();
    if (p.flash_sale_start && p.flash_sale_end) {
      return now >= new Date(p.flash_sale_start) && now <= new Date(p.flash_sale_end);
    }
    if (p.flash_sale_end) {
      return now <= new Date(p.flash_sale_end);
    }
    return true;
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const query = filterType && filterType !== "all" ? `?product_type=${filterType}` : "";
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
    <div className="min-h-screen bg-background">
      <SEO title={`${settings.products_title || "Daftar Produk"} - ${settings.site_name}`} description={settings.products_subtitle} />
      <Navbar />

      <main className="container mx-auto px-4 py-8 bottom-nav-safe">
        <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{settings.products_title || "Daftar Produk"}</h1>
          <p className="text-muted-foreground">{settings.products_subtitle || "Lihat produk fisik dan digital yang tersedia."}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="min-w-[200px]"><SelectValue placeholder="Filter jenis produk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="physical">Fisika</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilterType("all")}>Reset</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Memuat produk...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const isFlash = isFlashSaleActive(product);
            const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price && (!product.is_flash_sale || isFlash);
            const activePrice = hasDiscount ? product.discount_price! : product.price;

            return (
              <div key={product.id} className="relative rounded-3xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition flex flex-col justify-between">
                {isFlash && (
                  <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow animate-pulse">
                    Flash Sale
                  </div>
                )}
                {!isFlash && product.discount_price && product.discount_price > 0 && product.discount_price < product.price && (
                  <div className="absolute top-4 left-4 z-10 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    Diskon
                  </div>
                )}
                <div>
                  {product.image_url && <img src={product.image_url} alt={product.title} className="h-48 w-full rounded-2xl object-cover mb-4" />}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-primary">{product.product_type === "digital" ? "Digital" : "Fisika"}</p>
                      <h2 className="text-xl font-bold">{product.title}</h2>
                    </div>
                    <div className="text-right">
                      {hasDiscount ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground line-through">
                            {product.currency} {product.price.toLocaleString("id-ID")}
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {product.currency} {activePrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold">{product.currency} {product.price.toLocaleString("id-ID")}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-3">{product.description}</p>
                </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-muted-foreground/70" />
                    <span>{product.views || 0}</span>
                  </div>
                  <div className="h-3 w-px bg-border/60" />
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {product.sold || 0} terjual
                  </div>
                </div>
                <Button onClick={() => navigate(`/produk/${product.slug}`)}>Lihat Detail</Button>
              </div>
            </div>
            );
          })}
          {products.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">Belum ada produk untuk ditampilkan.</div>
          )}
        </div>
      )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
