import { useState, useEffect } from "react";
import { 
  MessageCircle, Trash2, Reply, ExternalLink, 
  User, Calendar, Search, Filter, Loader2,
  CheckCircle2, XCircle, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  display_name: string;
  initials: string;
  article_title: string;
}

export function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [replyIndex, setReplyIndex] = useState<Comment | null>(null);
  const [editTarget, setEditTarget] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/comments");
      setComments(data || []);
    } catch (err) {
      toast({ title: "Gagal mengambil data komentar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter(c => c.id !== id));
      toast({ title: "Komentar berhasil dihapus" });
    } catch (err) {
      toast({ title: "Gagal menghapus komentar", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editTarget || !editContent.trim()) return;
    setIsUpdating(true);
    try {
      await api.put(`/comments/${editTarget.id}`, { content: editContent.trim() });
      toast({ title: "Komentar berhasil diperbarui" });
      setEditTarget(null);
      fetchComments();
    } catch (err) {
      toast({ title: "Gagal memperbarui komentar", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!replyIndex || !replyContent.trim()) return;
    setIsReplying(true);
    try {
      await api.post("/comments", {
        article_id: replyIndex.article_id,
        content: `Membalas @${replyIndex.display_name}: ${replyContent}`, 
        parent_id: replyIndex.id
      });
      toast({ title: "Balasan berhasil dikirim" });
      setReplyIndex(null);
      setReplyContent("");
      fetchComments();
    } catch (err) {
      toast({ title: "Gagal mengirim balasan", variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  const filteredComments = comments.filter(c => 
    c.content.toLowerCase().includes(search.toLowerCase()) ||
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.article_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari komentar, user, atau artikel..." 
            className="pl-9 rounded-xl border-border/50 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest h-10 w-full md:w-auto">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button 
            onClick={fetchComments}
            variant="outline" 
            size="sm" 
            className="rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest h-10 w-full md:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest">Memuat Komentar...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
             <MessageCircle className="h-12 w-12 opacity-10" />
             <p className="font-bold opacity-50 uppercase text-[10px] tracking-[0.2em]">Tidak Ada Komentar Ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredComments.map((c) => (
              <div key={c.id} className="p-6 md:p-8 hover:bg-muted/30 transition-colors group">
                <div className="flex flex-col md:flex-row gap-6">
                   {/* User Profile Info */}
                   <div className="md:w-48 flex flex-row md:flex-col items-center md:items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20 shadow-sm">
                         {c.initials}
                      </div>
                      <div className="min-w-0">
                         <p className="text-sm font-black truncate">{c.display_name}</p>
                         <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                               {new Date(c.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                            </span>
                         </div>
                      </div>
                   </div>

                   {/* Content */}
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="rounded-lg bg-background border-border/50 text-[10px] font-bold uppercase h-6 px-2.5">
                            {c.article_title}
                         </Badge>
                         {c.parent_id && <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase tracking-widest h-5">Balasan</Badge>}
                      </div>
                      
                      <div className="text-sm leading-relaxed text-foreground bg-background/50 p-4 rounded-3xl border border-border/30">
                         {c.content}
                      </div>

                      <div className="flex items-center gap-3">
                         <Button 
                           onClick={() => setReplyIndex(c)}
                           variant="ghost" 
                           size="sm" 
                           className="h-9 rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                         >
                            <Reply className="h-4 w-4" /> Balas
                         </Button>
                         <Button 
                           onClick={() => {
                             setEditTarget(c);
                             setEditContent(c.content);
                           }}
                           variant="ghost" 
                           size="sm" 
                           className="h-9 rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                         >
                            <Edit className="h-4 w-4" /> Edit
                         </Button>
                         <Button 
                           onClick={() => handleDelete(c.id)}
                           variant="ghost" 
                           size="sm" 
                           className="h-9 rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                         >
                            <Trash2 className="h-4 w-4" /> Hapus
                         </Button>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!replyIndex} onOpenChange={() => setReplyIndex(null)}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Reply className="h-5 w-5 text-primary" />
               </div>
               Balas Komentar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="p-4 rounded-2xl bg-muted/50 border border-border italic text-xs text-muted-foreground">
                "{replyIndex?.content}"
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-2">Isi Balasan Admin</p>
                <Textarea 
                   value={replyContent}
                   onChange={(e) => setReplyContent(e.target.value)}
                   placeholder="Tulis balasan bijak Anda di sini..."
                   className="min-h-[120px] rounded-[1.5rem] border-primary/20 focus-visible:ring-primary/30 resize-none p-4 text-sm"
                />
             </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setReplyIndex(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">
               Batal
            </Button>
            <Button 
               onClick={handleReply} 
               disabled={isReplying || !replyContent.trim()}
               className="rounded-xl font-black uppercase tracking-[0.15em] text-[10px] h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[120px]"
            >
               {isReplying ? "Mengirim..." : "Kirim Balasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg border-amber-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-amber-600" />
               </div>
               Edit Komentar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-2">Konten Komentar</p>
                <Textarea 
                   value={editContent}
                   onChange={(e) => setEditContent(e.target.value)}
                   className="min-h-[150px] rounded-[1.5rem] border-amber-200 focus-visible:ring-amber-300 resize-none p-4 text-sm"
                />
             </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">
               Batal
            </Button>
            <Button 
               onClick={handleUpdate} 
               disabled={isUpdating || !editContent.trim()}
               className="rounded-xl font-black uppercase tracking-[0.15em] text-[10px] h-11 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 min-w-[120px]"
            >
               {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
