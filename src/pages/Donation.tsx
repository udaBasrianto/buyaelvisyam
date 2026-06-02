import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  note?: string;
};

type DonationSettings = {
  site_name: string;
  donation_title: string;
  donation_description: string;
  donation_instructions: string;
  show_donors: boolean;
  bank_accounts: BankAccount[];
};

type PublicDonation = {
  id: string;
  donor_name: string;
  message: string;
  amount: number;
  currency: string;
  created_at: string;
};

type DonationCampaign = {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  progress_percent: number;
  is_active: boolean;
  sort_order: number;
  start_at?: string | null;
  end_at?: string | null;
};

const FALLBACK_SETTINGS: DonationSettings = {
  site_name: "",
  donation_title: "Donasi",
  donation_description: "",
  donation_instructions: "",
  show_donors: false,
  bank_accounts: [],
};

export default function Donation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [donors, setDonors] = useState<PublicDonation[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  const [form, setForm] = useState({
    amount: "",
    donor_name: "",
    is_anonymous: false,
    whatsapp_number: "",
    message: "",
    transfer_date: "",
    bank_account_id: "",
    campaign_id: "",
    sender_name: "",
    sender_bank: "",
    sender_account_number: "",
  });

  const amountNumber = useMemo(() => {
    const cleaned = form.amount.replace(/[^\d]/g, "");
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [form.amount]);

  const formattedAmount = useMemo(() => {
    if (!amountNumber) return "";
    return amountNumber.toLocaleString("id-ID");
  }, [amountNumber]);

  const fetchAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: s }, { data: d }, { data: c }] = await Promise.all([
        api.get("/donations/settings"),
        api.get("/donations?limit=20"),
        api.get("/donations/campaigns"),
      ]);
      setSettings(s);
      setDonors(d || []);
      setCampaigns(Array.isArray(c) ? c : []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Gagal memuat data donasi";
      setLoadError(msg);
      setSettings((prev) => prev || FALLBACK_SETTINGS);
      setDonors([]);
      setCampaigns([]);
      toast({
        title: "Gagal memuat halaman donasi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleUploadProof = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProofUrl(data.url);
      toast({ title: "Bukti transfer terunggah", description: "Klik kirim donasi untuk menyimpan." });
    } catch (err: any) {
      toast({
        title: "Gagal upload bukti",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNumber) {
      toast({ title: "Nominal wajib diisi", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/donations", {
        amount: amountNumber,
        donor_name: form.donor_name,
        is_anonymous: form.is_anonymous,
        whatsapp_number: form.whatsapp_number,
        message: form.message,
        transfer_date: form.transfer_date || "",
        bank_account_id: form.bank_account_id,
        campaign_id: form.campaign_id || "",
        sender_name: form.sender_name,
        sender_bank: form.sender_bank,
        sender_account_number: form.sender_account_number,
        proof_url: proofUrl || "",
      });

      toast({ title: "Donasi terkirim", description: "Terima kasih. Donasi menunggu verifikasi admin." });
      setForm({
        amount: "",
        donor_name: "",
        is_anonymous: false,
        whatsapp_number: "",
        message: "",
        transfer_date: "",
        bank_account_id: "",
        campaign_id: "",
        sender_name: "",
        sender_bank: "",
        sender_account_number: "",
      });
      setProofUrl("");
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Gagal mengirim donasi",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Memuat...</div>
        ) : !settings ? (
          <Card className="p-6">
            <div className="space-y-3">
              <div className="text-lg font-black">Halaman Donasi Gagal Dimuat</div>
              <div className="text-sm text-muted-foreground">
                {loadError || "Tidak bisa mengambil data dari server."}
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchAll}>Coba Lagi</Button>
                <Button variant="outline" onClick={() => setSettings(FALLBACK_SETTINGS)}>
                  Lanjut Tanpa Data
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {loadError ? (
              <Card className="p-4 border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-destructive">
                    Data donasi tidak dapat diambil dari server: {loadError}
                  </div>
                  <Button variant="outline" onClick={fetchAll} className="shrink-0">
                    Coba Lagi
                  </Button>
                </div>
              </Card>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">{settings.donation_title || "Donasi"}</h1>
              {settings.donation_description ? (
                <p className="text-muted-foreground">{settings.donation_description}</p>
              ) : null}
            </div>

            {campaigns.length > 0 ? (
              <Card className="p-6">
                <div className="space-y-1 mb-4">
                  <div className="text-lg font-black">Program Donasi</div>
                  <div className="text-sm text-muted-foreground">Pilih salah satu target donasi (opsional).</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map((c) => {
                    const pct = Math.max(0, Math.min(100, Number(c.progress_percent) || 0));
                    const selected = form.campaign_id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, campaign_id: selected ? "" : c.id }))}
                        className={`text-left border rounded-2xl p-4 transition-colors ${
                          selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-black truncate">{c.title}</div>
                            {c.description ? (
                              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</div>
                            ) : null}
                          </div>
                          {selected ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary">Dipilih</div>
                          ) : null}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              Terkumpul: <span className="font-bold text-foreground">Rp {Number(c.raised_amount || 0).toLocaleString("id-ID")}</span>
                            </div>
                            <div>
                              Target: <span className="font-bold text-foreground">Rp {Number(c.target_amount || 0).toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 space-y-5">
                <div className="space-y-2">
                  <h2 className="text-lg font-black">Rekening Donasi</h2>
                  <p className="text-sm text-muted-foreground">
                    Transfer ke salah satu rekening berikut, lalu unggah bukti transfer.
                  </p>
                </div>

                <div className="space-y-3">
                  {settings.bank_accounts?.length ? (
                    settings.bank_accounts.map((a) => (
                      <div key={a.id} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-black">{a.bank_name}</div>
                          <div className="text-sm">
                            <span className="font-semibold">{a.account_number}</span> a.n.{" "}
                            <span className="font-semibold">{a.account_holder}</span>
                          </div>
                          {a.note ? <div className="text-xs text-muted-foreground">{a.note}</div> : null}
                        </div>
                        <Button
                          variant="outline"
                          className="shrink-0"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(a.account_number);
                              toast({ title: "Tersalin", description: "Nomor rekening tersalin." });
                            } catch {
                              toast({ title: "Gagal", description: "Tidak bisa menyalin.", variant: "destructive" });
                            }
                          }}
                        >
                          Salin
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada rekening yang aktif.</div>
                  )}
                </div>

                {settings.donation_instructions ? (
                  <div className="rounded-xl bg-muted/40 p-4 text-sm whitespace-pre-wrap">
                    {settings.donation_instructions}
                  </div>
                ) : null}
              </Card>

              <Card className="p-6">
                <form className="space-y-4" onSubmit={submitDonation}>
                  <div className="space-y-2">
                    <Label>Nominal Donasi (Rp)</Label>
                    <Input
                      inputMode="numeric"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="contoh: 100000"
                    />
                    {formattedAmount ? (
                      <div className="text-xs text-muted-foreground">Rp {formattedAmount}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Program Donasi (opsional)</Label>
                    <Select value={form.campaign_id} onValueChange={(v) => setForm((p) => ({ ...p, campaign_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih program (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rekening Tujuan</Label>
                    <Select value={form.bank_account_id} onValueChange={(v) => setForm((p) => ({ ...p, bank_account_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih rekening tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {(settings.bank_accounts || []).map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.bank_name} - {a.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                    <div className="space-y-0.5">
                      <div className="font-bold">Donasi Anonim</div>
                      <div className="text-xs text-muted-foreground">Nama Anda tidak ditampilkan di daftar donatur.</div>
                    </div>
                    <Switch
                      checked={form.is_anonymous}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, is_anonymous: v }))}
                    />
                  </div>

                  {!form.is_anonymous ? (
                    <div className="space-y-2">
                      <Label>Nama Donatur (opsional)</Label>
                      <Input
                        value={form.donor_name}
                        onChange={(e) => setForm((p) => ({ ...p, donor_name: e.target.value }))}
                        placeholder="Nama Anda (opsional)"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Nomor WhatsApp (opsional)</Label>
                    <Input
                      inputMode="tel"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm((p) => ({ ...p, whatsapp_number: e.target.value }))}
                      placeholder="62xxxxxxxxxx atau 08xxxxxxxxxx"
                    />
                    <div className="text-xs text-muted-foreground">
                      Jika diisi dan donasi di-approve admin, sistem akan mengirim ucapan terima kasih via WhatsApp.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pesan (opsional)</Label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Tulis pesan singkat"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Transfer (opsional)</Label>
                      <Input
                        type="date"
                        value={form.transfer_date}
                        onChange={(e) => setForm((p) => ({ ...p, transfer_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Pengirim (opsional)</Label>
                      <Input
                        value={form.sender_name}
                        onChange={(e) => setForm((p) => ({ ...p, sender_name: e.target.value }))}
                        placeholder="Nama di rekening pengirim (opsional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Pengirim (opsional)</Label>
                      <Input
                        value={form.sender_bank}
                        onChange={(e) => setForm((p) => ({ ...p, sender_bank: e.target.value }))}
                        placeholder="Bank pengirim (opsional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. Rekening Pengirim (opsional)</Label>
                      <Input
                        value={form.sender_account_number}
                        onChange={(e) => setForm((p) => ({ ...p, sender_account_number: e.target.value }))}
                        placeholder="Nomor rekening pengirim (opsional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bukti Transfer (opsional)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleUploadProof(file);
                      }}
                      disabled={uploading}
                    />
                    {proofUrl ? (
                      <div className="text-xs text-muted-foreground break-all">Uploaded: {proofUrl}</div>
                    ) : null}
                  </div>

                  <Button className="w-full" type="submit" disabled={submitting || uploading}>
                    {submitting ? "Mengirim..." : "Kirim Donasi"}
                  </Button>
                </form>
              </Card>
            </div>

            {settings.show_donors ? (
              <Card className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-black">Daftar Donatur Terbaru</h2>
                  <Button variant="outline" onClick={fetchAll} disabled={loading}>
                    Refresh
                  </Button>
                </div>

                {donors.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada donasi yang ditampilkan.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {donors.map((d) => (
                      <div key={d.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black">{d.donor_name}</div>
                          <div className="text-sm font-bold text-primary">
                            Rp {Number(d.amount).toLocaleString("id-ID")}
                          </div>
                        </div>
                        {d.message ? <div className="text-sm text-muted-foreground mt-2">{d.message}</div> : null}
                        <div className="text-[10px] text-muted-foreground mt-3">
                          {new Date(d.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
