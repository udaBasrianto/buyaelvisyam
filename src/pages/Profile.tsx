import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Camera, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    avatar_url: "",
    password: "",
    confirm_password: ""
  });

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setFormData({
        ...formData,
        display_name: data.display_name || "",
        email: data.email || "",
        avatar_url: data.avatar_url || ""
      });
    } catch (err) {
      toast({ title: "Gagal mengambil data profil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("image", file);

    try {
      const { data } = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Construct full URL if it's relative
      const fullUrl = data.url.startsWith('http') ? data.url : data.url; 
      setFormData(prev => ({ ...prev, avatar_url: fullUrl }));
      toast({ title: "Foto profil terpilih!", description: "Klik simpan untuk menerapkan." });
    } catch (err) {
      toast({ title: "Gagal mengunggah foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirm_password) {
      toast({ title: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        display_name: formData.display_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
        ...(formData.password ? { password: formData.password } : {})
      };

      await api.post("/auth/profile", payload);
      toast({ title: "Profil berhasil diperbarui!" });
      setFormData(prev => ({ ...prev, password: "", confirm_password: "" }));
    } catch (err: any) {
      toast({ 
        title: "Gagal memperbarui profil", 
        description: err.response?.data?.error || "Terjadi kesalahan", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Menyiapkan Profil...</p>
        </div>
      </div>
    );
  }

  const initials = formData.display_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pb-24 max-w-2xl bottom-nav-safe">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pengaturan Profil</h1>
            <p className="text-sm text-muted-foreground">Kelola informasi publik dan keamanan akun Anda</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            
            <div className="relative group mb-4">
              <Avatar className="h-28 w-28 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-1 right-1 h-9 w-9 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-background">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            
            <h2 className="text-lg font-bold">{formData.display_name || "Tanpa Nama"}</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Level: {user?.role}</p>
          </div>

          {/* Basic Info */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest">Informasi Dasar</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="pl-11 rounded-xl h-12 bg-muted/20 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Alamat Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-11 rounded-xl h-12 bg-muted/20 border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest">Keamanan</h3>
            </div>
            
            <p className="text-[10px] text-muted-foreground italic bg-muted/50 p-3 rounded-xl">Biarkan kosong jika tidak ingin mengganti password.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Password Baru</Label>
                <Input 
                  id="pass"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl h-12 bg-muted/20 border-border/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Ulangi Password</Label>
                <Input 
                  id="confirm"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="rounded-xl h-12 bg-muted/20 border-border/50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={saving || uploading} 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-xs gap-3 transition-all active:scale-95"
          >
            {saving ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </main>
      
      <BottomNav />
    </div>
  );
}
