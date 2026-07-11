import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type CheckoutMethod = "web" | "whatsapp";

type OrderResponseItem = {
  id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  currency: string;
};

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  note?: string;
};

type PublicOrder = {
  id: string;
  public_token: string;
  order_code: string;
  method: CheckoutMethod;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  recipient_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  courier: string;
  shipping_service: string;
  notes: string;
  currency: string;
  subtotal_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  requires_shipping: boolean;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  payment_instructions: string;
  payment_due_at?: string | null;
  created_at: string;
  items: OrderResponseItem[];
  bank_accounts: BankAccount[];
};

const createIdempotencyKey = () => {
  const cryptoObject = (globalThis as any).crypto;
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const buildWhatsAppMessage = (siteName: string, order: PublicOrder) => {
  const itemLines = order.items.map(
    (item, index) => `${index + 1}. ${item.product_title} x${item.quantity} - ${item.currency} ${item.line_total.toLocaleString("id-ID")}`
  );

  return [
    `Assalamu'alaikum, saya ingin konfirmasi order ${order.order_code} di ${siteName || "website"}.`,
    "",
    `Nama: ${order.customer_name}`,
    `WhatsApp: ${order.customer_phone}`,
    order.customer_email ? `Email: ${order.customer_email}` : "",
    order.requires_shipping ? `Penerima: ${order.recipient_name}` : "",
    order.requires_shipping ? `Alamat: ${[order.address_line_1, order.address_line_2, order.city, order.province, order.postal_code].filter(Boolean).join(", ")}` : "",
    "",
    "Detail Pesanan:",
    ...itemLines,
    "",
    `Subtotal: ${order.currency} ${order.subtotal_amount.toLocaleString("id-ID")}`,
    order.shipping_amount > 0 ? `Ongkir: ${order.currency} ${order.shipping_amount.toLocaleString("id-ID")}` : "",
    `Total: ${order.currency} ${order.total_amount.toLocaleString("id-ID")}`,
    order.notes ? `Catatan: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

export default function Checkout() {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [courier, setCourier] = useState("");
  const [shippingService, setShippingService] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<CheckoutMethod>("web");
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  const hasPhysicalItems = items.some((item) => item.product_type === "physical");
  const webCheckoutEnabled = settings.checkout_web_enabled !== false;
  const whatsappCheckoutEnabled = settings.checkout_whatsapp_enabled !== false && !!settings.checkout_whatsapp_number?.trim();
  const flatShippingEnabled = settings.checkout_flat_shipping_enabled === true && Number(settings.checkout_flat_shipping_amount) > 0;
  const shippingAmount = hasPhysicalItems && flatShippingEnabled ? Number(settings.checkout_flat_shipping_amount) || 0 : 0;
  const shippingLabel = settings.checkout_flat_shipping_label?.trim() || "Ongkos Kirim";
  const grandTotal = totalAmount + shippingAmount;

  const availableMethods = useMemo(() => {
    const methods: CheckoutMethod[] = [];
    if (webCheckoutEnabled) methods.push("web");
    if (whatsappCheckoutEnabled) methods.push("whatsapp");
    return methods;
  }, [webCheckoutEnabled, whatsappCheckoutEnabled]);

  useEffect(() => {
    setCustomerName((prev) => prev || user?.display_name || "");
    setRecipientName((prev) => prev || user?.display_name || "");
    setCustomerEmail((prev) => prev || user?.email || "");
  }, [user]);

  useEffect(() => {
    if (!availableMethods.includes(method)) {
      setMethod(availableMethods[0] || "web");
    }
  }, [availableMethods, method]);

  const handleSubmitOrder = async () => {
    if (submitting) return;

    const buyerName = customerName.trim();
    const buyerPhone = customerPhone.trim();
    const buyerEmail = customerEmail.trim();
    const orderNotes = notes.trim();

    if (!buyerName || !buyerPhone) {
      toast({
        title: "Data pembeli belum lengkap",
        description: "Nama dan nomor WhatsApp wajib diisi sebelum checkout.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan produk terlebih dahulu sebelum checkout.",
        variant: "destructive",
      });
      return;
    }

    if (!availableMethods.length) {
      toast({
        title: "Checkout belum tersedia",
        description: "Metode order sedang dinonaktifkan oleh admin.",
        variant: "destructive",
      });
      return;
    }

    if (hasPhysicalItems && !flatShippingEnabled) {
      toast({
        title: "Checkout produk fisik belum siap",
        description: "Biaya kirim belum dikonfigurasi admin, jadi total akhir belum bisa dihitung.",
        variant: "destructive",
      });
      return;
    }

    if (hasPhysicalItems) {
      const shippingFields = [recipientName, addressLine1, city, province, postalCode, courier, shippingService].map((value) => value.trim());
      if (shippingFields.some((value) => !value)) {
        toast({
          title: "Data pengiriman belum lengkap",
          description: "Lengkapi penerima, alamat, kota, provinsi, kode pos, kurir, dan layanan kirim.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(
        "/orders",
        {
          method,
          customer_name: buyerName,
          customer_phone: buyerPhone,
          customer_email: buyerEmail,
          recipient_name: recipientName.trim(),
          address_line_1: addressLine1.trim(),
          address_line_2: addressLine2.trim(),
          city: city.trim(),
          province: province.trim(),
          postal_code: postalCode.trim(),
          courier: courier.trim(),
          shipping_service: shippingService.trim(),
          notes: orderNotes,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      const order = data?.order as PublicOrder;

      if (method === "whatsapp") {
        const targetNumber = String(data?.checkout_whatsapp_number || settings.checkout_whatsapp_number || "").trim();
        if (targetNumber) {
          const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(buildWhatsAppMessage(settings.site_name, order))}`;
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }

      clearCart();
      setIdempotencyKey(createIdempotencyKey());
      toast({
        title: "Order berhasil dibuat",
        description:
          method === "web"
            ? "Pesanan dibuat. Lanjutkan pembayaran sesuai instruksi transfer."
            : "Pesanan dibuat. Lanjutkan konfirmasi lewat WhatsApp admin.",
      });
      navigate(`/checkout/success/${order.public_token}`);
    } catch (err: any) {
      toast({
        title: "Gagal membuat order",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={`Keranjang Belanja - ${settings.site_name}`} />
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-20 text-center">
          <h3 className="text-xl font-bold mb-4">Keranjang Anda kosong</h3>
          <p className="text-muted-foreground mb-6">Tambah produk ke keranjang untuk melanjutkan ke checkout.</p>
          <Button onClick={() => navigate("/produk")}>Kembali Belanja</Button>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Checkout - ${settings.site_name}`} />
      <Navbar />

      <main className="container mx-auto px-4 py-12 bottom-nav-safe">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {method === "web"
              ? "Checkout via web di sini adalah order + instruksi pembayaran transfer manual."
              : "Checkout via WhatsApp membuat order di sistem lalu melanjutkan konfirmasi ke admin."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  <img src={item.image || "/uploads/placeholder.png"} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.currency} {item.price.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.product_type === "physical" ? "Produk fisik" : "Produk digital"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      className="w-20 input"
                    />
                    <Button variant="ghost" onClick={() => removeFromCart(item.id)}>Hapus</Button>
                  </div>
                </div>
                <div className="text-right font-bold">
                  {item.currency} {(item.price * item.quantity).toLocaleString("id-ID")}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <h3 className="font-bold">Metode Order</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod("web")}
                  disabled={!webCheckoutEnabled}
                  className={`rounded-2xl border p-4 text-left transition ${
                    method === "web" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  } ${!webCheckoutEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <p className="font-semibold mb-1">Order via Web</p>
                  <p className="text-sm text-muted-foreground">Buat order lalu tampilkan instruksi transfer bank dan kode pembayaran.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("whatsapp")}
                  disabled={!whatsappCheckoutEnabled}
                  className={`rounded-2xl border p-4 text-left transition ${
                    method === "whatsapp" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  } ${!whatsappCheckoutEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <p className="font-semibold mb-1">Order via WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Order tercatat di sistem lalu diteruskan ke WhatsApp admin untuk follow-up.</p>
                </button>
              </div>

              {!availableMethods.length && (
                <div className="rounded-xl bg-destructive/10 text-destructive p-4 text-sm">
                  Checkout sedang dinonaktifkan. Aktifkan metode order dari panel admin.
                </div>
              )}

              {settings.checkout_instructions?.trim() && (
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground whitespace-pre-line">
                  {settings.checkout_instructions.trim()}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h3 className="font-bold mb-4">Data Pembeli</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pembeli" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor WhatsApp</label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@contoh.com" />
                </div>
              </div>
            </div>

            {hasPhysicalItems && (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h3 className="font-bold mb-4">Data Pengiriman</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Penerima</label>
                    <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nama penerima" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kode Pos</label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Kode pos" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Alamat</label>
                    <Textarea value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Alamat lengkap" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Alamat Tambahan</label>
                    <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Blok, patokan, unit, dll. (opsional)" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kota/Kabupaten</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota / Kabupaten" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provinsi</label>
                    <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Provinsi" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kurir</label>
                    <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="JNE / J&T / SiCepat" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Layanan Kirim</label>
                    <Input value={shippingService} onChange={(e) => setShippingService(e.target.value)} placeholder="Reg / Yes / Cargo" />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h3 className="font-bold mb-4">Catatan Order</h3>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: ukuran, warna, atau permintaan khusus." />
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border/50 h-fit space-y-4">
            <h3 className="font-bold">Ringkasan Pesanan</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-bold">IDR {totalAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{shippingLabel}</span>
              <span className="font-bold">
                {hasPhysicalItems ? (flatShippingEnabled ? `IDR ${shippingAmount.toLocaleString("id-ID")}` : "Belum dikonfigurasi") : "IDR 0"}
              </span>
            </div>
            <div className="flex justify-between text-base border-t pt-4">
              <span>Total Final</span>
              <span className="font-bold">{hasPhysicalItems && !flatShippingEnabled ? "Belum tersedia" : `IDR ${grandTotal.toLocaleString("id-ID")}`}</span>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Metode terpilih</p>
              <p>{method === "web" ? "Order via Web + transfer manual" : "Order via WhatsApp"}</p>
              {method === "web" && (
                <p>Status pembayaran awal: menunggu pembayaran transfer.</p>
              )}
            </div>

            <Button className="w-full" onClick={handleSubmitOrder} disabled={submitting || !availableMethods.length || (hasPhysicalItems && !flatShippingEnabled)}>
              {submitting ? "Memproses..." : method === "web" ? "Buat Order & Lihat Instruksi Bayar" : "Buat Order via WhatsApp"}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/produk")} disabled={submitting}>
              Tambah Produk Lain
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

export function CheckoutSuccess() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get(`/orders/public/${token}`)
      .then(({ data }) => setOrder(data?.order || null))
      .catch((err) => {
        setOrder(null);
        toast({
          title: "Order tidak ditemukan",
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [token, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Memuat konfirmasi order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={`Order Tidak Ditemukan - ${settings.site_name}`} />
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-3">Order Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Link konfirmasi ini tidak valid atau sudah tidak tersedia.</p>
          <Button onClick={() => navigate("/produk")}>Kembali ke Produk</Button>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={`Order ${order.order_code} - ${settings.site_name}`} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 bottom-nav-safe">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Order Berhasil Dibuat</h1>
              <p className="text-muted-foreground">
                Simpan kode order <span className="font-semibold text-foreground">{order.order_code}</span> untuk referensi pembayaran dan konfirmasi.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Metode</p>
                <p className="font-semibold">{order.method === "web" ? "Web" : "WhatsApp"}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Status Order</p>
                <p className="font-semibold capitalize">{order.status}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Status Bayar</p>
                <p className="font-semibold capitalize">{order.payment_status.replace(/_/g, " ")}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-semibold">{order.currency} {order.total_amount.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-5 space-y-2">
                <p className="font-semibold">Detail Pembeli</p>
                <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email || "-"}</p>
                {order.requires_shipping && (
                  <>
                    <p className="font-semibold pt-3">Alamat Pengiriman</p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipient_name}<br />
                      {[order.address_line_1, order.address_line_2, order.city, order.province, order.postal_code].filter(Boolean).join(", ")}<br />
                      {order.courier} - {order.shipping_service}
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-2xl border p-5 space-y-2">
                <p className="font-semibold">Ringkasan Pembayaran</p>
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{order.currency} {order.subtotal_amount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between text-sm"><span>Ongkir</span><span>{order.currency} {order.shipping_amount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between text-sm"><span>Diskon</span><span>{order.currency} {order.discount_amount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between font-semibold border-t pt-3"><span>Total</span><span>{order.currency} {order.total_amount.toLocaleString("id-ID")}</span></div>
                <div className="text-sm text-muted-foreground pt-2">
                  Referensi pembayaran: <span className="font-medium text-foreground">{order.payment_reference}</span>
                </div>
                {order.payment_due_at && (
                  <div className="text-sm text-muted-foreground">
                    Batas bayar: {new Date(order.payment_due_at).toLocaleString("id-ID")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-5 text-sm text-muted-foreground space-y-3">
              <p className="font-semibold text-foreground">Langkah berikutnya</p>
              <p className="whitespace-pre-line">{order.payment_instructions || settings.checkout_instructions || "-"}</p>
              {order.bank_accounts.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {order.bank_accounts.map((account) => (
                    <div key={account.id} className="rounded-xl border bg-background p-4">
                      <p className="font-semibold">{account.bank_name}</p>
                      <p className="text-foreground">{account.account_number}</p>
                      <p>a.n. {account.account_holder}</p>
                      {account.note ? <p className="mt-1 text-xs">{account.note}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-5">
              <p className="font-semibold mb-3">Item Order</p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-3">
                    <div>
                      <div className="font-medium">{item.product_title}</div>
                      <div className="text-sm text-muted-foreground">{item.quantity} x {item.currency} {item.unit_price.toLocaleString("id-ID")}</div>
                    </div>
                    <div className="font-semibold">{item.currency} {item.line_total.toLocaleString("id-ID")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/produk")}>Kembali ke Produk</Button>
              <Button variant="outline" onClick={() => navigate("/")}>Kembali ke Beranda</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
