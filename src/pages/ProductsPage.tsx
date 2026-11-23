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
import { Eye, Download } from "lucide-react";

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
  download_count?: number;
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
        <div className="text-center py-12 text-sm text-muted-foreground font-medium">Memuat produk...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const isFlash = isFlashSaleActive(product);
            const hasDiscount =
              product.discount_price &&
              product.discount_price > 0 &&
              product.discount_price < product.price &&
              (!product.is_flash_sale || isFlash);
            const activePrice = hasDiscount ? product.discount_price! : product.price;

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/produk/${product.slug}`)}
                className="group relative rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-2.5 sm:p-4 shadow-xs hover:shadow-md hover:border-primary/50 transition flex flex-col justify-between cursor-pointer"
              >
                {/* Product Image Container */}
                <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-muted/40 mb-2 sm:mb-3">
                  {/* Badges */}
                  {isFlash && (
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      Flash Sale
                    </div>
                  )}
                  {!isFlash && hasDiscount && (
                    <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Diskon
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {product.product_type === "digital" ? "Digital" : "Fisik"}
                  </div>

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 text-xs font-bold">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2
                      className="text-xs sm:text-sm md:text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1.5"
                      title={product.title}
                    >
                      {product.title}
                    </h2>

                    {/* Price Block */}
                    <div className="flex flex-col mb-2">
                      {hasDiscount && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                          {product.currency} {product.price.toLocaleString("id-ID")}
                        </span>
                      )}
                      <span className={`text-xs sm:text-sm md:text-base font-black ${hasDiscount ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
                        {product.currency} {activePrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Button */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground/70" />
                        <span>{product.views || 0}</span>
                      </div>
                      {product.product_type === "digital" ? (
                        <div className="font-semibold text-primary flex items-center gap-0.5">
                          <Download className="h-2.5 w-2.5" /> {product.download_count || 0}
                        </div>
                      ) : (
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {product.sold || 0} terjual
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full h-7 sm:h-8 text-[11px] sm:text-xs font-bold rounded-xl shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/produk/${product.slug}`);
                      }}
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
              Belum ada produk untuk ditampilkan.
            </div>
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
