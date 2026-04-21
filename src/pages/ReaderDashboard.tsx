import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, User, MessageCircle, Edit, Trash2, LayoutDashboard,
  CornerDownRight, CheckCircle2, Wallet, Plus, ArrowUpRight, History, Trophy, Award, Bookmark
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PostCardV2 } from "@/components/PostCardV2";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  article_title?: string;
  articles?: { title: string; slug: string } | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string;
  total_score: number;
  total_quizzes: number;
}

export default function ReaderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profile, setProfile] = useState<Profile>({ display_name: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [profileForm, setProfileForm] = useState({ display_name: "", avatar_url: "" });
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: profileData } = await api.get("/auth/me");
      setProfile(profileData);
      setProfileForm({ display_name: profileData.display_name || "", avatar_url: profileData.avatar_url || "" });
      
      const { data: commentsData } = await api.get("/comments"); 
      if (commentsData) setComments(commentsData as Comment[]);

      const { data: walletData } = await api.get("/wallet");
      setBalance(walletData.balance);
      setTransactions(walletData.transactions);

      const { data: lbData } = await api.get("/leaderboard");
      setLeaderboard(lbData.data || []);

      const { data: bookmarkData } = await api.get("/koleksi");
      setBookmarks(bookmarkData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fullUrl = `http://localhost:4000${data.url}`;
      setProofUrl(fullUrl);
      toast({ title: "Bukti terunggah!", description: "Silakan lanjut kirim permintaan." });
    } catch (err) {
      toast({ title: "Gagal mengunggah gambar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount))) return;
    try {
      await api.post("/wallet/topup", { amount: Number(topUpAmount), proof_url: proofUrl });
      toast({ title: "Permintaan Top Up dikirim", description: "Silakan hubungi admin untuk konfirmasi." });
      setShowTopUp(false);
      setTopUpAmount("");
      setProofUrl("");
      fetchData();
    } catch (err) {
      toast({ title: "Gagal membuat permintaan top up", variant: "destructive" });
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    try {
      await api.put("/auth/profile", profileForm);
      toast({ title: "Profil diperbarui" });
      fetchData();
    } catch (err) {
      toast({ title: "Gagal memperbarui profil", variant: "destructive" });
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await api.delete(`/comments/${id}`);
      toast({ title: "Dihapus", description: "Komentar dihapus" });
      setComments((c) => c.filter((x) => x.id !== id));
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    }
  };

  const saveEditComment = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await api.put(`/comments/${id}`, { content: editText.trim() });
      toast({ title: "Berhasil", description: "Komentar diperbarui" });
      setEditingComment(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const myComments = comments.filter(c => c.user_id === user?.id && !c.parent_id);
  const initials = (profile.display_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl bottom-nav-safe">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-muted/30 p-1 rounded-2xl border border-border/50">
            <TabsTrigger value="overview" className="rounded-xl font-bold gap-2 text-[10px] sm:text-xs"><LayoutDashboard className="h-3 w-3" /> Overview</TabsTrigger>
            <TabsTrigger value="bookmarks" className="rounded-xl font-bold gap-2 text-[10px] sm:text-xs"><Bookmark className="h-3 w-3" /> Koleksi</TabsTrigger>
            <TabsTrigger value="komentar" className="rounded-xl font-bold gap-2 text-[10px] sm:text-xs"><MessageCircle className="h-3 w-3" /> Komentar</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-xl font-bold gap-2 text-[10px] sm:text-xs"><Wallet className="h-3 w-3" /> Dompet</TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-xl font-bold gap-2 text-[10px] sm:text-xs"><Trophy className="h-3 w-3" /> Peringkat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-black text-foreground mb-1">{profile.display_name || "Pembaca"}</h2>
                  <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => (document.querySelector('[value="profil"]') as HTMLElement)?.click()}>
                   Edit Profil
                </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                   <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                         <Wallet className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Saldo Aktif</span>
                   </div>
                   <h2 className="text-3xl font-black mb-1">Rp {balance.toLocaleString("id-ID")}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-card border border-border/50 rounded-[2rem] p-6 flex flex-col justify-between">
                      <p className="text-2xl font-black text-foreground">{myComments.length}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Komentar</p>
                   </div>
                   <div className="bg-card border border-border/50 rounded-[2rem] p-6 flex flex-col justify-between" onClick={() => (document.querySelector('[value="bookmarks"]') as HTMLElement)?.click()} style={{ cursor: 'pointer' }}>
                      <p className="text-2xl font-black text-primary">{bookmarks.length}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bookmark</p>
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-black flex items-center gap-2">
                   <Bookmark className="h-6 w-6 text-primary" /> Kajian Disimpan
                </h2>
                <Badge variant="outline" className="rounded-full font-bold">{bookmarks.length} Artikel</Badge>
             </div>
             {bookmarks.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-border/50 rounded-[2.5rem]">
                   <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                   <p className="text-sm text-muted-foreground italic tracking-wide">Belum ada kajian yang disimpan.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-4">
                   {bookmarks.map((article: any) => (
                      <Link key={article.id} to={`/artikel/${article.slug || article.id}`} className="bg-card border border-border/50 p-4 rounded-3xl flex items-center gap-4 hover:border-primary/50 transition-all group">
                         <div className="h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
                            <img src={article.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-black text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-2 italic">Klik untuk membaca kembali</p>
                         </div>
                         <div className="pr-2"><CornerDownRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                      </Link>
                   ))}
                </div>
             )}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full -top-32" />
                <div className="relative z-10">
                   <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
                      <Wallet className="h-10 w-10" />
                   </div>
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Saldo Saya</p>
                   <h2 className="text-5xl font-black text-foreground tracking-tighter">Rp {balance.toLocaleString("id-ID")}</h2>
                   <div className="flex justify-center gap-4 mt-8">
                      <Button onClick={() => setShowTopUp(true)} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-2"><Plus className="h-4 w-4" /> Top Up Saldo</Button>
                      <Button variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest border-2" onClick={() => window.open(`https://wa.me/628123456789?text=Assalamu'alaikum Admin, saya ingin konfirmasi pendaftaran kursus`, "_blank")}>Bantuan</Button>
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Histori Transaksi</h3>
                <div className="space-y-3">
                   {transactions.length === 0 ? <div className="p-12 text-center border-2 border-dashed border-border/50 rounded-[2rem] text-sm text-muted-foreground italic">Belum ada aktivitas transaksi.</div> : transactions.map(tx => (
                      <div key={tx.id} className="bg-card border border-border/50 p-5 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === 'topup' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{tx.type === 'topup' ? <ArrowUpRight className="h-5 w-5" /> : <Plus className="h-5 w-5 rotate-45" />}</div>
                            <div><p className="text-sm font-bold">{tx.reference}</p><p className="text-[10px] text-muted-foreground font-medium">{new Date(tx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                         </div>
                         <div className="text-right"><p className={`text-sm font-black ${tx.type === 'topup' ? 'text-emerald-600' : 'text-primary'}`}>{tx.type === 'topup' ? '+' : '-'} Rp {tx.amount.toLocaleString("id-ID")}</p><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{tx.status}</span></div>
                      </div>
                   ))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div><h2 className="text-3xl font-black mb-2 flex items-center gap-3 italic"><Trophy className="h-10 w-10 text-amber-400" /> TOP LEARNERS</h2><p className="text-white/70 text-sm font-bold uppercase tracking-widest pl-13">Papan Skor Kuis Artikel</p></div>
                   <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center"><p className="text-[10px] font-black uppercase text-white/60 mb-1">Peringkat Saya</p><p className="text-2xl font-black"># {leaderboard.findIndex(l => l.user_id === user?.id) + 1 || "-"}</p></div>
                </div>
             </div>
             <div className="space-y-3">
                {leaderboard.length === 0 ? <div className="p-20 text-center border-2 border-dashed border-border/50 rounded-[2.5rem] text-sm text-muted-foreground italic"><Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /> Belum ada skor yang masuk.</div> : leaderboard.map((entry, index) => (
                   <div key={entry.user_id} className={`bg-card border p-5 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.02] ${entry.user_id === user?.id ? 'border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20' : 'border-border/50'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-100 text-slate-500' : index === 2 ? 'bg-orange-50 text-orange-600' : 'bg-muted text-muted-foreground'}`}>{index + 1}</div>
                         <Avatar className="h-12 w-12 border-2 border-background shadow-sm"><AvatarImage src={entry.avatar_url} /><AvatarFallback className="font-bold text-xs">{entry.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                         <div><p className="text-sm font-black flex items-center gap-2">{entry.display_name}{entry.user_id === user?.id && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">SAYA</span>}</p><p className="text-[10px] text-muted-foreground font-bold italic">{entry.total_quizzes} Kuis Diselesaikan</p></div>
                      </div>
                      <div className="text-right"><p className="text-xl font-black text-primary tracking-tighter">{entry.total_score.toLocaleString()} <span className="text-[10px] uppercase font-black opacity-50 pl-0.5">PTS</span></p></div>
                   </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="komentar" className="space-y-6">
            {loading ? <div className="text-center py-12 text-muted-foreground">Memuat...</div> : myComments.length === 0 ? <div className="text-center py-12"><MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Belum ada komentar.</p><Link to="/" className="text-primary text-sm hover:underline mt-1 inline-block">Jelajahi artikel →</Link></div> : (
              <div className="space-y-6">
                {myComments.map((c) => (
                  <div key={c.id} className="bg-card rounded-[2.5rem] border border-border/50 p-6 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
                     <div className="flex items-start justify-between gap-4 relative z-10">
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                               <Link to={`/artikel/${c.article_slug || c.article_id}`}>
                                  <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-lg hover:bg-primary/20 transition-colors">
                                     {c.article_title || "Artikel"}
                                  </span>
                               </Link>
                               <span className="text-[10px] font-bold text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</span>
                            </div>
                           {editingComment === c.id ? <div className="space-y-3"><Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[80px] rounded-2xl bg-background/50" /><div className="flex gap-2"><Button size="sm" onClick={() => saveEditComment(c.id)} className="rounded-xl font-bold px-4">Simpan</Button><Button size="sm" variant="outline" onClick={() => setEditingComment(null)} className="rounded-xl font-bold px-4">Batal</Button></div></div> : <p className="text-sm font-bold text-foreground/80 leading-relaxed italic">"{c.content}"</p>}
                        </div>
                        {!editingComment && <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => { setEditingComment(c.id); setEditText(c.content); }}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteComment(c.id)}><Trash2 className="h-4 w-4" /></Button></div>}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profil">
             <div className="bg-card border border-border/50 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={profile.avatar_url || ""} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div><h3 className="font-bold">Informasi Akun</h3><p className="text-xs text-muted-foreground">{user?.email}</p></div></div>
                <div className="space-y-4">
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-primary">Nama Lengkap</Label><Input value={profileForm.display_name} onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} placeholder="Nama Anda" className="rounded-xl h-11" /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest text-primary">URL Avatar</Label><Input value={profileForm.avatar_url} onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })} placeholder="https://..." className="rounded-xl h-11" /></div>
                  <Button onClick={updateProfile} className="w-full h-11 rounded-xl font-bold">Perbarui Profil</Button>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-sm">
           <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center"><ArrowUpRight className="h-5 w-5 text-primary" /></div>Top Up Saldo</DialogTitle></DialogHeader>
           <div className="py-6 space-y-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Nominal Top Up (Rp)</Label><Input type="number" placeholder="Contoh: 50000" className="h-12 rounded-xl text-lg font-black" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} /></div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Bukti Transfer (Gambar)</Label>
                 <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploading} />
                    <div className={`h-14 flex items-center justify-center border-2 border-dashed rounded-2xl transition-all ${proofUrl ? 'border-emerald-500 bg-emerald-50' : 'border-border/50 group-hover:border-primary/50'}`}>
                       {uploading ? <div className="text-xs font-bold text-muted-foreground animate-pulse">Memproses...</div> : proofUrl ? <div className="flex items-center gap-2 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Bakti Terpilih</div> : <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Plus className="h-4 w-4" /> Unggah Foto Bukti</div>}
                    </div>
                 </div>
                 {proofUrl && <div className="mt-2 text-center"><button onClick={() => window.open(proofUrl, "_blank")} className="text-[10px] font-black uppercase text-primary hover:underline">Lihat File Terpilih</button></div>}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">Permintaan akan dikirim ke Admin. Silakan transfer sesuai nominal ke rekening yang tertera di menu Bantuan.</p>
           </div>
           <DialogFooter><Button onClick={handleTopUp} disabled={uploading || !proofUrl} className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10">{uploading ? "Sedang Mengunggah..." : "Kirim Permintaan"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}
