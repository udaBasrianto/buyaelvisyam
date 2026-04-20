import { useState, useEffect } from "react";
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
}

export function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
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
    
    // NOTE: Realtime subscription is temporarily simplified using polling or removed.
    // In a fully featured GoFiber app, you would use WebSockets.
    // For now we will just load once, but the user can reload or see their own instantly.
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
      });
      setNewComment("");
      fetchComments(); // Refresh comments
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments(); // Refresh comments
    } catch (error: any) {
      toast({ title: "Gagal", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        Komentar ({comments.length})
      </h3>

      {/* New comment */}
      {user ? (
        <div className="flex gap-3 mb-8">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user.email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Tulis komentar Anda..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] bg-accent/30 border-border focus:border-primary resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Kirim
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/auth" className="text-primary underline">Login</a> untuk menulis komentar.
        </p>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat komentar...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">{c.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{c.display_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                {user?.id === c.user_id && (
                  <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1 mt-2 text-xs text-destructive hover:text-destructive/80 transition">
                    <Trash2 className="h-3 w-3" /> Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
