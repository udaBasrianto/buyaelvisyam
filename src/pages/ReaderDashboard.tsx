import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, User, MessageCircle, Edit, Trash2, LayoutDashboard
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  article_id: string;
  articles?: { title: string; slug: string } | null;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
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

  const fetchData = async () => {
    if (!user) return;

    try {
      // In a real robust system, we would have /api/profile
      // For now, let's use the local storage user metadata or the /api/me 
      const profileData = {
        display_name: user?.display_name || user?.name || "Pembaca",
        avatar_url: ""
      };
      
      setProfile(profileData);
      setProfileForm({ display_name: profileData.display_name || "", avatar_url: profileData.avatar_url || "" });
      
      const { data: commentsData } = await api.get("/comments", { params: { user_id: user.id } });
      if (commentsData) setComments(commentsData as Comment[]);
    } catch (err: any) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    toast({ title: "Fitur dalam pengembangan", description: "Backend profil sedang dibangun" });
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

  const initials = (profile.display_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Dashboard Pembaca</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl">
        <Tabs defaultValue="profil" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="profil" className="gap-1.5"><User className="h-4 w-4" /> Profil</TabsTrigger>
            <TabsTrigger value="komentar" className="gap-1.5"><MessageCircle className="h-4 w-4" /> Komentar</TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profil">
            <div className="bg-card rounded-xl border p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{profile.display_name || "Pembaca"}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Nama Tampilan</Label>
                  <Input value={profileForm.display_name} onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} placeholder="Nama Anda" />
                </div>
                <div>
                  <Label>URL Avatar</Label>
                  <Input value={profileForm.avatar_url} onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })} placeholder="https://..." />
                </div>
                <Button onClick={updateProfile}>Simpan Profil</Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{comments.length}</p>
                  <p className="text-xs text-muted-foreground">Komentar</p>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <p className="text-2xl font-bold text-secondary-foreground">
                    {new Set(comments.map((c) => c.article_id)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Artikel Dikomentari</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="komentar">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Memuat...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Belum ada komentar.</p>
                <Link to="/" className="text-primary text-sm hover:underline mt-1 inline-block">
                  Jelajahi artikel →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="bg-card rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {editingComment === c.id ? (
                          <div className="space-y-2">
                            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[60px]" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEditComment(c.id)}>Simpan</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>Batal</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground/80">{c.content}</p>
                        )}
                      </div>
                      {editingComment !== c.id && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingComment(c.id); setEditText(c.content); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteComment(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
