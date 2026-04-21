import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface CommentWithProfile {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string;
  initials: string;
  parent_id?: string | null;
}

export function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<CommentWithProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data } = await api.get("/comments", { params: { article_id: articleId } });
      setComments(data as CommentWithProfile[] || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) {
      if (!user) toast({ title: "Login diperlukan", description: "Silakan login untuk berkomentar", variant: "destructive" });
      return;
    }

    try {
      await api.post("/comments", {
        article_id: articleId,
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
      });
      setNewComment("");
      setReplyTo(null);
      fetchComments();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const renderComments = (parentId: string | null = null, depth = 0) => {
    return comments
      .filter((c) => c.parent_id === parentId)
      .map((c) => (
        <div key={c.id} className={`${depth > 0 ? "ml-8 md:ml-12 border-l-2 border-border/50 pl-4 mt-4" : "mt-6"}`}>
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
              <AvatarFallback className={`${depth > 0 ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"} text-[10px] font-bold`}>
                {c.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-foreground">{c.display_name}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-2xl border border-border/30 inline-block max-w-full">
                {c.content}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => {
                    setReplyTo(c);
                    document.getElementById("comment-input")?.focus();
                  }} 
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  Balas
                </button>
                {user?.id === c.user_id && (
                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="text-[10px] font-black uppercase text-destructive hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
          {renderComments(c.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="bg-card/50 rounded-[2rem] p-6 md:p-8 border border-border/50">
      <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter text-foreground mb-8">
        <MessageCircle className="h-5 w-5 text-primary" />
        Diskusi ({comments.length})
      </h3>

      {/* New comment input */}
      {user ? (
        <div className="space-y-4 mb-10 bg-background/50 p-6 rounded-3xl border border-border/50 border-dashed">
          {replyTo && (
            <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
               <p className="text-[10px] font-bold text-primary italic">Membalas @{replyTo.display_name}...</p>
               <button onClick={() => setReplyTo(null)} className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase">Batal</button>
            </div>
          )}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0 hidden md:flex ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-black uppercase">
                {user.display_name?.slice(0, 2).toUpperCase() || "ME"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                id="comment-input"
                placeholder={replyTo ? "Tulis balasan Anda..." : "Berikan pendapat atau pertanyaan Anda..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-card border-border/50 focus:border-primary/50 resize-none rounded-2xl p-4 text-sm"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!newComment.trim()} 
                  className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-lg shadow-primary/20"
                >
                  {replyTo ? "Kirim Balasan" : "Posting Komentar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-muted/30 rounded-3xl border border-dashed border-border mb-8">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Silakan <Link to="/auth" className="text-primary hover:underline">Masuk</Link> untuk bergabung dalam diskusi
          </p>
        </div>
      )}

      {/* Comment tree */}
      {loading ? (
        <div className="space-y-4">
           {[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Belum ada diskusi di sini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {renderComments(null)}
        </div>
      )}
    </div>
  );
}

