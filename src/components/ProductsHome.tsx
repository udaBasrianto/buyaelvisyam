import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";

interface ProductItem {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  product_type: string;
  price: number;
  currency: string;
  image_url?: string;
  stock: number;
}

export const ProductsHome: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", { params: { active: "true" } });
        const items = asArray<any>(data).map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          product_type: p.product_type,
          price: p.price || 0,
          currency: p.currency || 'IDR',
          image_url: p.image_url || '',
          stock: p.stock || 0,
        }));
        setProducts(items);
      } catch (err: any) {
        toast({ title: 'Gagal memuat produk', description: err?.message });
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleAdd = (p: ProductItem) => {
    const qty = Math.max(1, qtyMap[p.id] || 1);
    addToCart({ id: p.id, title: p.title, price: p.price, currency: p.currency, image: p.image_url, product_type: p.product_type }, qty);
    toast({ title: 'Ditambahkan ke keranjang' });
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Produk</h3>
        <a href="/produk" className="text-sm text-primary font-semibold">Lihat Semua</a>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-card p-3 rounded-xl border border-border/50 flex flex-col">
              <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-muted">
                <img src={p.image_url || '/uploads/placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm line-clamp-2">{p.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{p.currency} {p.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input type="number" value={qtyMap[p.id] || 1} min={1} onChange={(e) => setQtyMap(prev => ({ ...prev, [p.id]: Number(e.target.value) }))} className="w-20" disabled={p.product_type === 'digital'} />
                <Button onClick={() => handleAdd(p)}>Tambah</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductsHome;
