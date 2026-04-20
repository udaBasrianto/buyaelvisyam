import { useState, useEffect } from "react";
import { 
  Users, MoreVertical, Edit, Trash2, Search, UserPlus, Shield, Smartphone, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  whatsapp_number: string;
  role: string;
  articles: number;
  created_at: string;
}

const roleColor: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  kontributor: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  pembaca: "bg-muted text-muted-foreground border-border",
};

export function UsersManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      if (data) setUsers(data);
    } catch (error: any) {
      toast({ 
        title: "Gagal memuat pengguna", 
        description: error.response?.data?.error || error.message, 
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast({ title: "Berhasil", description: `Role berhasil diubah ke ${newRole}` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini? Semua data terkait juga akan terhapus.")) return;
    try {
      await api.delete(`/users/${userId}`);
      toast({ title: "Berhasil", description: "Pengguna telah dihapus" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const filtered = users.filter(u => 
    u.display_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.whatsapp_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau nomor WA..." 
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Tambah Admin
        </Button>
      </div>

      <div className="bg-card rounded-2xl border card-shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
             <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Memuat Pengguna...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Profil Pengguna</th>
                  <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-blue-600 flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> Nomor WA</th>
                  <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Otoritas / Role</th>
                  <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Post</th>
                  <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Bergabung</th>
                  <th className="text-right py-4 px-6 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-accent/10 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                          {u.display_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{u.display_name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-tighter">ID: {u.user_id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                             <MessageCircle className="h-3 w-3" />
                         </div>
                         <span className="font-bold text-foreground tracking-tight">{u.whatsapp_number || "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`font-black uppercase text-[9px] px-2.5 py-1 tracking-widest ${roleColor[u.role] || "bg-muted text-muted-foreground"}`}>
                          {u.role}
                        </Badge>
                        {u.role === "admin" && <Shield className="h-3 w-3 text-primary" />}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-accent/50 font-black text-foreground border border-border/50 text-xs">
                          {u.articles}
                       </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-medium text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg mb-1" onClick={() => handleUpdateRole(u.user_id, "admin")}>
                            <Shield className="h-4 w-4 text-primary" /> Jadikan Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg mb-1" onClick={() => handleUpdateRole(u.user_id, "kontributor")}>
                            <Edit className="h-4 w-4 text-blue-500" /> Jadikan Kontributor
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg mb-1" onClick={() => handleUpdateRole(u.user_id, "pembaca")}>
                            <Users className="h-4 w-4 text-muted-foreground" /> Jadikan Pembaca
                          </DropdownMenuItem>
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteUser(u.user_id)}>
                            <Trash2 className="h-4 w-4" /> Hapus Pengguna
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
