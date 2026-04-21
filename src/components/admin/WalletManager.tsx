import { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, Clock, CheckCircle, XCircle, 
  ArrowUpCircle, DollarSign, Search, Filter, Eye 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

type WalletStats = {
  total_revenue: number;
  pending_topups: Array<{
    id: string;
    amount: number;
    display_name: string;
    email: string;
    proof_url: string;
    created_at: string;
  }>;
};

export function WalletManager() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/wallet/stats");
      setStats(data);
    } catch (err) {
      toast({ title: "Gagal memuat data keuangan", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const approveTopUp = async (id: string) => {
    try {
      await api.put(`/admin/wallet/approve/${id}`);
      toast({ title: "Top up berhasil disetujui" });
      fetchStats();
    } catch (err) {
      toast({ title: "Gagal menyetujui top up", variant: "destructive" });
    }
  };

  const rejectTopUp = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menolak top up ini?")) return;
    try {
      await api.put(`/admin/wallet/reject/${id}`);
      toast({ title: "Top up berhasil ditolak", variant: "warning" });
      fetchStats();
    } catch (err) {
      toast({ title: "Gagal menolak top up", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-6">
               <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
               </div>
               <span className="text-sm font-black uppercase tracking-widest text-white/80">Total Omzet LMS</span>
            </div>
            <h2 className="text-4xl font-black mb-2">Rp {stats?.total_revenue?.toLocaleString("id-ID") || 0}</h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-tighter">Penjualan Kursus Terbayar</p>
         </div>

         <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="h-6 w-6" />
               </div>
               <div>
                  <span className="text-sm font-black uppercase tracking-tight">Antrian Top Up</span>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Menunggu Konfirmasi</p>
               </div>
            </div>
            <h2 className="text-4xl font-black text-amber-600">{stats?.pending_topups?.length || 0}</h2>
         </div>
      </div>

      {/* Pending Transactions Table */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
               <Clock className="h-5 w-5 text-amber-500" />
               Permintaan Top Up User
            </h3>
         </div>

         <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-muted/50 border-b border-border/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nominal</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Waktu</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                     {loading ? (
                       <tr><td colSpan={4} className="px-8 py-12 text-center text-sm text-muted-foreground italic">Memuat antrian top up...</td></tr>
                     ) : stats?.pending_topups?.length === 0 ? (
                       <tr><td colSpan={4} className="px-8 py-20 text-center">
                          <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tidak ada antrian top up saat ini.</p>
                       </td></tr>
                     ) : (
                       stats?.pending_topups.map((tx) => (
                         <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-8 py-4">
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">{tx.display_name}</span>
                                  <span className="text-[10px] text-muted-foreground">{tx.email}</span>
                               </div>
                            </td>
                            <td className="px-8 py-4 font-black text-amber-600">
                               Rp {tx.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="px-8 py-4 text-xs text-muted-foreground">
                               {new Date(tx.created_at).toLocaleString("id-ID")}
                            </td>
                            <td className="px-8 py-4 text-right flex items-center justify-end gap-2">
                               {tx.proof_url && (
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => window.open(tx.proof_url, "_blank")}
                                   className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
                                 >
                                    <Eye className="h-3 w-3" /> Bukti
                                 </Button>
                               )}
                               <Button 
                                 size="sm" 
                                 onClick={() => approveTopUp(tx.id)}
                                 className="h-9 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                               >
                                  <CheckCircle className="h-3 w-3 mr-2" /> Setujui
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="ghost"
                                 onClick={() => rejectTopUp(tx.id)}
                                 className="h-9 px-4 rounded-xl text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] tracking-widest"
                               >
                                  <XCircle className="h-3 w-3 mr-2" /> Tolak
                               </Button>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
