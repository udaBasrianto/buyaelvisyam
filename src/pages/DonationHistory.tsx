import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Download, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DonationStatus = "pending" | "approved" | "rejected";

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder?: string;
}

interface DonationHistory {
  id: string;
  amount: number;
  currency: string;
  donor_name: string;
  is_anonymous: boolean;
  message: string;
  status: DonationStatus;
  admin_note: string;
  proof_url: string;
  transfer_date?: string;
  bank_name?: string;
  account_number?: string;
  campaign_title?: string;
  sender_name: string;
  sender_bank: string;
  sender_account_number: string;
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  data: DonationHistory[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<DonationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow/10", text: "text-yellow-700", label: "Menunggu Verifikasi" },
  approved: { bg: "bg-green/10", text: "text-green-700", label: "Diterima" },
  rejected: { bg: "bg-red/10", text: "text-red-700", label: "Ditolak" },
};

export default function DonationHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<"all" | DonationStatus>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDonation, setSelectedDonation] = useState<DonationHistory | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchDonations = async (pageNum: number = 1, status: "all" | DonationStatus = "all") => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (status !== "all") {
        query.append("status", status);
      }

      const { data } = await api.get<PaginatedResponse>(`/user/donations?${query}`);
      setDonations(data.data || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (err: any) {
      toast({
        title: "Gagal memuat riwayat donasi",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth?next=/donasi-history");
      return;
    }
    fetchDonations(1, activeStatus);
  }, [user, navigate, activeStatus]);

  const handleStatusChange = (status: "all" | DonationStatus) => {
    setActiveStatus(status);
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    };
  };

  const getStatusColor = (status: DonationStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  const downloadProof = (proofUrl: string, donationId: string) => {
    if (!proofUrl) {
      toast({ title: "Tidak ada bukti transfer", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = proofUrl;
    link.download = `bukti-donasi-${donationId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <h1 className="text-3xl font-black tracking-tight">Riwayat Donasi Saya</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua donasi Anda di sini</p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <Tabs value={activeStatus} onValueChange={(v) => handleStatusChange(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="pending">Menunggu</TabsTrigger>
              <TabsTrigger value="approved">Diterima</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {loading ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">Memuat riwayat donasi...</div>
          </Card>
        ) : donations.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-3 text-muted-foreground" size={32} />
            <div className="font-semibold">Belum ada donasi</div>
            <p className="text-sm text-muted-foreground mt-1">Mulai berdonasi untuk membantu kami menyebarkan ilmu yang bermanfaat</p>
            <Button asChild className="mt-4">
              <a href="/donasi">Donasi Sekarang</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {donations.map((donation) => {
              const statusColor = getStatusColor(donation.status as DonationStatus);
              return (
                <Card
                  key={donation.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDonation(donation);
                    setShowDetail(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{formatCurrency(donation.amount)}</span>
                        <Badge variant="outline" className={`${statusColor.bg} ${statusColor.text}`}>
                          {statusColor.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(donation.created_at)}
                        </div>
                        {donation.campaign_title && (
                          <div className="text-xs">Program: {donation.campaign_title}</div>
                        )}
                        {donation.message && (
                          <div className="text-xs">Pesan: {donation.message.substring(0, 50)}...</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDonation(donation);
                          setShowDetail(true);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      {donation.proof_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadProof(donation.proof_url, donation.id);
                          }}
                        >
                          <Download size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchDonations(page - 1, activeStatus)}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center px-4 text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => fetchDonations(page + 1, activeStatus)}
                  disabled={page === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Donasi</DialogTitle>
          </DialogHeader>

          {selectedDonation && (
            <div className="space-y-6">
              {/* Status & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Status</div>
                  <Badge className={`mt-2 ${getStatusColor(selectedDonation.status as DonationStatus).bg} ${getStatusColor(selectedDonation.status as DonationStatus).text}`}>
                    {getStatusColor(selectedDonation.status as DonationStatus).label}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Nominal</div>
                  <div className="mt-2 font-bold text-lg">{formatCurrency(selectedDonation.amount)}</div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Timeline</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dibuat:</span>
                    <span>{formatDate(selectedDonation.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diperbarui:</span>
                    <span>{formatDate(selectedDonation.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Donor Info */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Informasi Pendonasi</div>
                <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span>{selectedDonation.is_anonymous ? "Anonim" : selectedDonation.donor_name}</span>
                  </div>
                  {selectedDonation.whatsapp_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <span className="font-mono">{selectedDonation.whatsapp_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Info */}
              {selectedDonation.bank_name && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Detail Transfer</div>
                  <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                    {selectedDonation.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Tujuan:</span>
                        <span>{selectedDonation.bank_name}</span>
                      </div>
                    )}
                    {selectedDonation.account_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. Rekening:</span>
                        <span className="font-mono">{selectedDonation.account_number}</span>
                      </div>
                    )}
                    {selectedDonation.sender_bank && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Pengirim:</span>
                        <span>{selectedDonation.sender_bank}</span>
                      </div>
                    )}
                    {selectedDonation.sender_account_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. Rekening Pengirim:</span>
                        <span className="font-mono">{selectedDonation.sender_account_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedDonation.message && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Pesan</div>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedDonation.message}</p>
                </div>
              )}

              {/* Campaign */}
              {selectedDonation.campaign_title && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Program Donasi</div>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedDonation.campaign_title}</p>
                </div>
              )}

              {/* Admin Note */}
              {selectedDonation.admin_note && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Catatan Admin</div>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedDonation.admin_note}</p>
                </div>
              )}

              {/* Proof */}
              {selectedDonation.proof_url && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Bukti Transfer</div>
                  <img src={selectedDonation.proof_url} alt="Bukti transfer" className="w-full rounded-lg border max-h-96 object-cover" />
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => downloadProof(selectedDonation.proof_url, selectedDonation.id)}
                  >
                    <Download size={16} className="mr-2" />
                    Unduh Bukti
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
