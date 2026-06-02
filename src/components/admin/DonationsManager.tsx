import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type DonationRow = {
  id: string;
  user_id: string | null;
  bank_account_id: string | null;
  campaign_id?: string | null;
  amount: number;
  currency: string;
  donor_name: string;
  is_anonymous: boolean;
  whatsapp_number?: string | null;
  message: string;
  proof_url: string;
  sender_name: string;
  sender_bank: string;
  sender_account_number: string;
  transfer_date: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_display_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  campaign_title?: string | null;
};

type DonationCampaignRow = {
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
  created_at: string;
  updated_at: string;
};

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  note: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type DonationSettings = {
  donation_title: string;
  donation_description: string;
  donation_instructions: string;
  show_donors: boolean;
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusVariant = (status: string) => {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
};

export function DonationsManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("donations");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaignRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [settings, setSettings] = useState<DonationSettings>({
    donation_title: "Donasi",
    donation_description: "",
    donation_instructions: "",
    show_donors: true,
  });

  const [savingSettings, setSavingSettings] = useState(false);

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
    note: "",
    is_active: true,
    sort_order: 0,
  });

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    target_amount: 0,
    is_active: true,
    sort_order: 0,
  });

  const fetchDonations = async () => {
    const status = statusFilter === "all" ? "" : statusFilter;
    const { data } = await api.get("/admin/donations", { params: { status, page: 1, limit: 200 } });
    setDonations(data?.data || []);
  };

  const fetchCampaigns = async () => {
    const { data } = await api.get("/admin/donation-campaigns");
    setCampaigns(Array.isArray(data) ? data : []);
  };

  const fetchBankAccounts = async () => {
    const { data } = await api.get("/admin/bank-accounts");
    setBankAccounts(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await api.get("/donations/settings");
    setSettings({
      donation_title: data?.donation_title || "Donasi",
      donation_description: data?.donation_description || "",
      donation_instructions: data?.donation_instructions || "",
      show_donors: !!data?.show_donors,
    });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDonations(), fetchCampaigns(), fetchBankAccounts(), fetchSettings()]);
    } catch (err: any) {
      toast({
        title: "Gagal memuat donasi",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchDonations().catch(() => {});
  }, [statusFilter]);

  const updateDonationStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    try {
      await api.put(`/admin/donations/${id}/status`, { status });
      toast({ title: "Berhasil", description: `Status donasi diubah ke ${statusLabel[status] || status}` });
      fetchDonations();
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  const deleteDonation = async (id: string) => {
    if (!confirm("Hapus donasi ini?")) return;
    try {
      await api.delete(`/admin/donations/${id}`);
      toast({ title: "Donasi dihapus" });
      fetchDonations();
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  const openCreateAccount = () => {
    setEditingAccountId(null);
    setAccountForm({
      bank_name: "",
      account_number: "",
      account_holder: "",
      note: "",
      is_active: true,
      sort_order: 0,
    });
    setAccountDialogOpen(true);
  };

  const openEditAccount = (acc: BankAccount) => {
    setEditingAccountId(acc.id);
    setAccountForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_holder: acc.account_holder,
      note: acc.note || "",
      is_active: !!acc.is_active,
      sort_order: acc.sort_order || 0,
    });
    setAccountDialogOpen(true);
  };

  const saveAccount = async () => {
    const bank_name = accountForm.bank_name.trim();
    const account_number = accountForm.account_number.trim();
    const account_holder = accountForm.account_holder.trim();
    const note = accountForm.note.trim();

    if (!bank_name || !account_number || !account_holder) {
      toast({ title: "Wajib diisi", description: "Bank, nomor rekening, dan nama pemilik wajib diisi", variant: "destructive" });
      return;
    }

    setAccountSaving(true);
    try {
      const payload = {
        bank_name,
        account_number,
        account_holder,
        note,
        is_active: accountForm.is_active,
        sort_order: Number(accountForm.sort_order) || 0,
      };

      if (editingAccountId) {
        await api.put(`/admin/bank-accounts/${editingAccountId}`, payload);
        toast({ title: "Rekening diperbarui" });
      } else {
        await api.post("/admin/bank-accounts", payload);
        toast({ title: "Rekening ditambahkan" });
      }

      setAccountDialogOpen(false);
      setEditingAccountId(null);
      fetchBankAccounts();
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan rekening",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await api.delete(`/admin/bank-accounts/${id}`);
      toast({ title: "Rekening dihapus" });
      fetchBankAccounts();
    } catch (err: any) {
      toast({
        title: "Gagal menghapus rekening",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  const openCreateCampaign = () => {
    setEditingCampaignId(null);
    setCampaignForm({
      title: "",
      description: "",
      target_amount: 0,
      is_active: true,
      sort_order: 0,
    });
    setCampaignDialogOpen(true);
  };

  const openEditCampaign = (c: DonationCampaignRow) => {
    setEditingCampaignId(c.id);
    setCampaignForm({
      title: c.title || "",
      description: c.description || "",
      target_amount: Number(c.target_amount) || 0,
      is_active: !!c.is_active,
      sort_order: Number(c.sort_order) || 0,
    });
    setCampaignDialogOpen(true);
  };

  const saveCampaign = async () => {
    const title = campaignForm.title.trim();
    const description = campaignForm.description.trim();
    const target_amount = Number(campaignForm.target_amount) || 0;
    const sort_order = Number(campaignForm.sort_order) || 0;

    if (!title) {
      toast({ title: "Wajib diisi", description: "Judul program wajib diisi", variant: "destructive" });
      return;
    }
    if (target_amount < 0) {
      toast({ title: "Tidak valid", description: "Target tidak boleh negatif", variant: "destructive" });
      return;
    }

    setCampaignSaving(true);
    try {
      const payload = {
        title,
        description,
        target_amount,
        is_active: !!campaignForm.is_active,
        sort_order,
      };
      if (editingCampaignId) {
        await api.put(`/admin/donation-campaigns/${editingCampaignId}`, payload);
        toast({ title: "Program diperbarui" });
      } else {
        await api.post("/admin/donation-campaigns", payload);
        toast({ title: "Program ditambahkan" });
      }
      setCampaignDialogOpen(false);
      setEditingCampaignId(null);
      fetchCampaigns();
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan program",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setCampaignSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Hapus program donasi ini?")) return;
    try {
      await api.delete(`/admin/donation-campaigns/${id}`);
      toast({ title: "Program dihapus" });
      fetchCampaigns();
    } catch (err: any) {
      toast({
        title: "Gagal menghapus program",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/admin/donations/settings", {
        donation_title: settings.donation_title,
        donation_description: settings.donation_description,
        donation_instructions: settings.donation_instructions,
        show_donors: settings.show_donors,
      });
      toast({ title: "Pengaturan tersimpan" });
      fetchSettings();
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan pengaturan",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const sortedAccounts = useMemo(() => {
    return [...bankAccounts].sort((a, b) => {
      const so = (a.sort_order || 0) - (b.sort_order || 0);
      if (so !== 0) return so;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [bankAccounts]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="donations">Donasi</TabsTrigger>
          <TabsTrigger value="campaigns">Program</TabsTrigger>
          <TabsTrigger value="accounts">Rekening</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">Filter Status</div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Donatur</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Nominal</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Rekening Tujuan</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Waktu</th>
                    <th className="text-right py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground">
                        Memuat...
                      </td>
                    </tr>
                  ) : donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => {
                      const donorName = d.is_anonymous ? "Anonim" : (d.donor_name || d.user_display_name || d.user_email || "—");
                      const target = d.bank_name ? `${d.bank_name} ${d.account_number || ""}`.trim() : "—";
                      return (
                        <tr key={d.id} className="hover:bg-accent/10 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold">{donorName}</div>
                            {d.campaign_title ? (
                              <div className="text-[10px] text-muted-foreground">Program: {d.campaign_title}</div>
                            ) : null}
                            <div className="text-[10px] text-muted-foreground">{d.sender_bank || d.sender_name ? `${d.sender_bank || ""} ${d.sender_name || ""}`.trim() : ""}</div>
                            {d.whatsapp_number ? (
                              <div className="text-[10px] text-muted-foreground">WA: {d.whatsapp_number}</div>
                            ) : null}
                          </td>
                          <td className="py-4 px-6 font-black text-primary">
                            Rp {Number(d.amount).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold">{target}</div>
                            {d.account_holder ? <div className="text-[10px] text-muted-foreground">a.n. {d.account_holder}</div> : null}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={statusVariant(d.status)}>{statusLabel[d.status] || d.status}</Badge>
                          </td>
                          <td className="py-4 px-6 text-xs text-muted-foreground">
                            {new Date(d.created_at).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {d.proof_url ? (
                                <Button variant="outline" size="sm" onClick={() => window.open(d.proof_url, "_blank")}>
                                  Bukti
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                onClick={() => updateDonationStatus(d.id, "approved")}
                                disabled={d.status === "approved"}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateDonationStatus(d.id, "rejected")}
                                disabled={d.status === "rejected"}
                              >
                                Reject
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteDonation(d.id)}>
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold">Program Donasi</div>
            <Button onClick={openCreateCampaign}>Tambah Program</Button>
          </div>

          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Program</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Target</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Terkumpul</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aktif</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Urutan</th>
                    <th className="text-right py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground">
                        Memuat...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground">
                        Belum ada program
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => {
                      const pct = Math.max(0, Math.min(100, Number(c.progress_percent) || 0));
                      return (
                        <tr key={c.id} className="hover:bg-accent/10 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold">{c.title}</div>
                            {c.description ? <div className="text-[10px] text-muted-foreground line-clamp-2">{c.description}</div> : null}
                            <div className="mt-2 h-2 w-56 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(0)}%</div>
                          </td>
                          <td className="py-4 px-6 font-semibold">
                            Rp {Number(c.target_amount || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 px-6 font-black text-primary">
                            Rp {Number(c.raised_amount || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 px-6">
                            <Switch
                              checked={!!c.is_active}
                              onCheckedChange={async (v) => {
                                try {
                                  await api.put(`/admin/donation-campaigns/${c.id}`, { is_active: v });
                                  fetchCampaigns();
                                } catch (err: any) {
                                  toast({
                                    title: "Gagal",
                                    description: err.response?.data?.error || err.message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            />
                          </td>
                          <td className="py-4 px-6">{c.sort_order || 0}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditCampaign(c)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteCampaign(c.id)}>
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold">Rekening Bank</div>
            <Button onClick={openCreateAccount}>Tambah Rekening</Button>
          </div>

          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Bank</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Rekening</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aktif</th>
                    <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Urutan</th>
                    <th className="text-right py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-6 text-center text-muted-foreground">
                        Memuat...
                      </td>
                    </tr>
                  ) : sortedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-6 text-center text-muted-foreground">
                        Belum ada rekening
                      </td>
                    </tr>
                  ) : (
                    sortedAccounts.map((a) => (
                      <tr key={a.id} className="hover:bg-accent/10 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold">{a.bank_name}</div>
                          {a.note ? <div className="text-[10px] text-muted-foreground">{a.note}</div> : null}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold">{a.account_number}</div>
                          <div className="text-[10px] text-muted-foreground">a.n. {a.account_holder}</div>
                        </td>
                        <td className="py-4 px-6">
                          <Switch
                            checked={a.is_active}
                            onCheckedChange={async (v) => {
                              try {
                                await api.put(`/admin/bank-accounts/${a.id}`, { is_active: v });
                                fetchBankAccounts();
                              } catch (err: any) {
                                toast({
                                  title: "Gagal",
                                  description: err.response?.data?.error || err.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                        </td>
                        <td className="py-4 px-6">{a.sort_order}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditAccount(a)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteAccount(a.id)}>
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Judul Halaman Donasi</Label>
              <Input
                value={settings.donation_title}
                onChange={(e) => setSettings((p) => ({ ...p, donation_title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={settings.donation_description}
                onChange={(e) => setSettings((p) => ({ ...p, donation_description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Instruksi Transfer</Label>
              <Textarea
                value={settings.donation_instructions}
                onChange={(e) => setSettings((p) => ({ ...p, donation_instructions: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Tampilkan Daftar Donatur</div>
                <div className="text-xs text-muted-foreground">Jika dimatikan, daftar donatur tidak muncul di halaman donasi.</div>
              </div>
              <Switch checked={settings.show_donors} onCheckedChange={(v) => setSettings((p) => ({ ...p, show_donors: v }))} />
            </div>
            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccountId ? "Edit Rekening" : "Tambah Rekening"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Bank</Label>
              <Input value={accountForm.bank_name} onChange={(e) => setAccountForm((p) => ({ ...p, bank_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nomor Rekening</Label>
              <Input value={accountForm.account_number} onChange={(e) => setAccountForm((p) => ({ ...p, account_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nama Pemilik</Label>
              <Input value={accountForm.account_holder} onChange={(e) => setAccountForm((p) => ({ ...p, account_holder: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea value={accountForm.note} onChange={(e) => setAccountForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aktif</Label>
                <div className="flex items-center h-10">
                  <Switch checked={accountForm.is_active} onCheckedChange={(v) => setAccountForm((p) => ({ ...p, is_active: v }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  inputMode="numeric"
                  value={String(accountForm.sort_order)}
                  onChange={(e) => setAccountForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)} disabled={accountSaving}>
              Batal
            </Button>
            <Button onClick={saveAccount} disabled={accountSaving}>
              {accountSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCampaignId ? "Edit Program" : "Tambah Program"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={campaignForm.title} onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Textarea value={campaignForm.description} onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target (Rp)</Label>
                <Input
                  inputMode="numeric"
                  value={String(campaignForm.target_amount)}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, target_amount: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  inputMode="numeric"
                  value={String(campaignForm.sort_order)}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="space-y-0.5">
                <div className="font-bold">Aktif</div>
                <div className="text-xs text-muted-foreground">Jika dimatikan, tidak muncul di halaman donasi.</div>
              </div>
              <Switch checked={campaignForm.is_active} onCheckedChange={(v) => setCampaignForm((p) => ({ ...p, is_active: v }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)} disabled={campaignSaving}>
              Batal
            </Button>
            <Button onClick={saveCampaign} disabled={campaignSaving}>
              {campaignSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
