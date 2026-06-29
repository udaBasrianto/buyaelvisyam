import React from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { toast } = useToast();

  const handleCheckout = async () => {
    // Placeholder: integrate with backend order/payment API here
    clearCart();
    toast({ title: 'Checkout berhasil', description: 'Terima kasih, pesanan tersimpan (simulasi).' });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-12">
        <h3 className="text-xl font-bold mb-4">Keranjang Anda kosong</h3>
        <p className="text-muted-foreground">Tambah produk ke keranjang untuk melanjutkan ke checkout.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-12">
      <h3 className="text-xl font-bold mb-6">Checkout</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted"><img src={it.image || '/uploads/placeholder.png'} alt={it.title} className="w-full h-full object-cover" /></div>
              <div className="flex-1">
                <h4 className="font-bold">{it.title}</h4>
                <p className="text-sm text-muted-foreground">{it.currency} {it.price.toLocaleString('id-ID')}</p>
                <div className="mt-2 flex items-center gap-2">
                  <input type="number" value={it.quantity} min={1} onChange={(e) => updateQuantity(it.id, Number(e.target.value))} className="w-20 input" />
                  <Button variant="ghost" onClick={() => removeFromCart(it.id)}>Hapus</Button>
                </div>
              </div>
              <div className="text-right font-bold">{it.currency} {(it.price * it.quantity).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        <div className="bg-card p-6 rounded-xl border border-border/50">
          <h4 className="font-bold mb-4">Ringkasan Pesanan</h4>
          <div className="flex justify-between mb-2"><span>Subtotal</span><span className="font-bold">IDR {totalAmount.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between mb-4"><span>Ongkos Kirim</span><span className="font-bold">IDR 0</span></div>
          <div className="flex justify-between mb-6"><span>Total</span><span className="font-bold">IDR {totalAmount.toLocaleString('id-ID')}</span></div>
          <Button className="w-full" onClick={handleCheckout}>Checkout</Button>
        </div>
      </div>
    </div>
  );
}
