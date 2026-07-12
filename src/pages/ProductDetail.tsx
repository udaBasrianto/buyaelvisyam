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
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

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
  discount_price?: number;
  is_flash_sale?: boolean;
  flash_sale_start?: string;
  flash_sale_end?: string;
}

function FlashSaleCountdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(endDate).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 text-sm font-bold w-full">
      <span className="uppercase tracking-wider">Flash Sale berakhir dalam:</span>
      <div className="flex items-center gap-1.5">
        <span className="bg-red-500 text-white rounded-lg px-2 py-1 font-mono">{String(timeLeft.hours).padStart(2, '0')}</span> jam
        <span className="bg-red-500 text-white rounded-lg px-2 py-1 font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span> menit
        <span className="bg-red-500 text-white rounded-lg px-2 py-1 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span> detik
      </div>
    </div>
  );
}

const isFlashSaleActive = (p: ProductDetailItem) => {
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

const getActivePrice = (p: ProductDetailItem) => {
  if (p.discount_price && p.discount_price > 0 && p.discount_price < p.price) {
    if (p.is_flash_sale) {
      return isFlashSaleActive(p) ? p.discount_price : p.price;
    }
    return p.discount_price;
  }
  return p.price;
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: getActivePrice(product),
      currency: product.currency,
      image: product.image_url,
      product_type: product.product_type
    }, 1);
    toast({
      title: "Keranjang Belanja",
      description: `${product.title} ditambahkan ke keranjang.`,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: getActivePrice(product),
      currency: product.currency,
      image: product.image_url,
      product_type: product.product_type
    }, 1);
    navigate("/checkout");
  };

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

  const isFlash = isFlashSaleActive(product);
  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price && (!product.is_flash_sale || isFlash);
  const activePrice = hasDiscount ? product.discount_price! : product.price;

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
            {isFlash && product.flash_sale_end && (
              <FlashSaleCountdown endDate={product.flash_sale_end} />
            )}
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Harga</p>
              {hasDiscount ? (
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {product.currency} {activePrice.toLocaleString("id-ID")}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {product.currency} {product.price.toLocaleString("id-ID")}
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-bold mt-1">{product.currency} {product.price.toLocaleString("id-ID")}</p>
              )}
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
            <div className="space-y-3 pt-4 border-t">
              <Button className="w-full justify-center" onClick={handleAddToCart} variant="outline">
                Tambah ke Keranjang
              </Button>
              <Button className="w-full justify-center" onClick={handleBuyNow}>
                Beli Sekarang
              </Button>
              <Button className="w-full justify-center" variant="ghost" onClick={() => navigate(-1)}>
                Kembali
              </Button>
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
