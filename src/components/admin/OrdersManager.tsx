import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type OrderItem = {
  id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  currency: string;
};

type OrderRow = {
  id: string;
  order_code: string;
  method: "web" | "whatsapp";
  status: "pending" | "confirmed" | "processed" | "completed" | "cancelled";
  payment_status: "awaiting_payment" | "payment_review" | "paid" | "cancelled";
  payment_reference: string;
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
  admin_note: string;
  currency: string;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  payment_due_at?: string | null;
  created_at: string;
  items: OrderItem[];
};

const orderStatuses: Array<OrderRow["status"]> = ["pending", "confirmed", "processed", "completed", "cancelled"];
const paymentStatuses: Array<OrderRow["payment_status"]> = ["awaiting_payment", "payment_review", "paid", "cancelled"];

const badgeVariantByStatus = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "completed" || status === "paid") return "default";
  if (status === "cancelled") return "destructive";
  if (status === "confirmed" || status === "processed" || status === "payment_review") return "secondary";
  return "outline";
};

export function OrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [detailStatus, setDetailStatus] = useState<OrderRow["status"]>("pending");
  const [detailPaymentStatus, setDetailPaymentStatus] = useState<OrderRow["payment_status"]>("awaiting_payment");
  const [detailPaymentReference, setDetailPaymentReference] = useState("");
  const [detailAdminNote, setDetailAdminNote] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/orders", {
        params: {
          status: statusFilter,
          method: methodFilter,
          search,
          page,
          limit,
        },
      });
      setOrders(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.total) || 0);
    } catch (err: any) {
      toast({
        title: "Gagal memuat order",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, methodFilter, search, page, limit]);

  const openDetail = (order: OrderRow) => {
    setSelectedOrder(order);
    setDetailStatus(order.status);
    setDetailPaymentStatus(order.payment_status || "awaiting_payment");
    setDetailPaymentReference(order.payment_reference || "");
    setDetailAdminNote(order.admin_note || "");
    setDetailOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: detailStatus,
        payment_status: detailPaymentStatus,
        payment_reference: detailPaymentReference,
        admin_note: detailAdminNote,
      });

      setSelectedOrder(data);
      setOrders((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      toast({ title: "Status order diperbarui" });
    } catch (err: any) {
      toast({
        title: "Gagal memperbarui status",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold">Manajemen Order Produk</h3>
          <p className="text-sm text-muted-foreground">Pantau order, pembayaran, dan pengiriman dari checkout web maupun WhatsApp.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <div className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode order, nama, email, atau WA"
            />
            <Button
              variant="outline"
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              Cari
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={(value) => { setPage(1); setStatusFilter(value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {orderStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(value) => { setPage(1); setMethodFilter(value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter metode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Metode</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat order...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-semibold">{order.order_code}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                      {order.customer_email ? <div className="text-xs text-muted-foreground">{order.customer_email}</div> : null}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{order.method}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariantByStatus(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={badgeVariantByStatus(order.payment_status)}>{order.payment_status}</Badge>
                      {order.payment_reference ? <div className="text-xs text-muted-foreground">{order.payment_reference}</div> : null}
                    </div>
                  </TableCell>
                  <TableCell>{order.currency} {order.total_amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openDetail(order)}>
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    Belum ada order.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Menampilkan halaman {page} dari {totalPages} • total {total} order
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1 || loading}>
            Sebelumnya
          </Button>
          <Button variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages || loading}>
            Berikutnya
          </Button>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail Order</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Informasi Order</div>
                  <div className="font-semibold">{selectedOrder.order_code}</div>
                  <div className="text-sm">Metode: <span className="capitalize">{selectedOrder.method}</span></div>
                  <div className="text-sm">Dibuat: {new Date(selectedOrder.created_at).toLocaleString("id-ID")}</div>
                  {selectedOrder.payment_due_at ? <div className="text-sm">Batas bayar: {new Date(selectedOrder.payment_due_at).toLocaleString("id-ID")}</div> : null}
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Pembeli</div>
                  <div className="font-semibold">{selectedOrder.customer_name}</div>
                  <div className="text-sm">{selectedOrder.customer_phone}</div>
                  <div className="text-sm">{selectedOrder.customer_email || "-"}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes || "Tanpa catatan pembeli"}</div>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="text-sm">Subtotal: {selectedOrder.currency} {selectedOrder.subtotal_amount.toLocaleString("id-ID")}</div>
                  <div className="text-sm">Ongkir: {selectedOrder.currency} {selectedOrder.shipping_amount.toLocaleString("id-ID")}</div>
                  <div className="font-semibold">Grand Total: {selectedOrder.currency} {selectedOrder.total_amount.toLocaleString("id-ID")}</div>
                </div>
              </div>

              {(selectedOrder.address_line_1 || selectedOrder.city || selectedOrder.province) && (
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Pengiriman</div>
                  <div className="font-semibold">{selectedOrder.recipient_name || selectedOrder.customer_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {[selectedOrder.address_line_1, selectedOrder.address_line_2, selectedOrder.city, selectedOrder.province, selectedOrder.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.courier || "-"} {selectedOrder.shipping_service ? `• ${selectedOrder.shipping_service}` : ""}
                  </div>
                </div>
              )}

              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Item Order</div>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 p-3">
                      <div>
                        <div className="font-medium">{item.product_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} x {item.currency} {item.unit_price.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {item.currency} {item.line_total.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status Order</div>
                  <Select value={detailStatus} onValueChange={(value) => setDetailStatus(value as OrderRow["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status Pembayaran</div>
                  <Select value={detailPaymentStatus} onValueChange={(value) => setDetailPaymentStatus(value as OrderRow["payment_status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Referensi Pembayaran</div>
                  <Input
                    value={detailPaymentReference}
                    onChange={(e) => setDetailPaymentReference(e.target.value)}
                    placeholder="Misal nomor mutasi / kode bayar"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Catatan Admin</div>
                  <Textarea
                    value={detailAdminNote}
                    onChange={(e) => setDetailAdminNote(e.target.value)}
                    placeholder="Catatan internal untuk order ini"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDetailOpen(false)} disabled={updating}>Tutup</Button>
                <Button onClick={handleUpdateStatus} disabled={updating}>
                  {updating ? "Menyimpan..." : "Simpan Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
