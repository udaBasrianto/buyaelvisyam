import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Mail, Lock, User, MessageCircle } from "lucide-react";
import { WhatsAppRegister } from "@/components/WhatsAppRegister";
import { WhatsAppLogin } from "@/components/WhatsAppLogin";

export default function Auth() {
  const { settings } = useSiteSettings();
  const { slug } = useParams();
  const isSecretPath = slug && slug === settings.admin_slug;

  const [mode, setMode] = useState<"whatsapp_login" | "whatsapp_register" | "admin_login">(
    isSecretPath ? "admin_login" : "whatsapp_login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithWhatsApp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "admin_login") {
      const { error } = await signIn(email, password, "");
      if (error) {
        toast({ title: "Gagal masuk", description: error, variant: "destructive" });
      } else {
        toast({ title: "Berhasil masuk!" });
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">☪</span>
          <h1 className="text-2xl font-bold text-primary mt-2">BlogUstad</h1>
          <p className="text-muted-foreground mt-1">
            {mode === "admin_login" 
              ? "Login Khusus Admin" 
              : mode === "whatsapp_login" 
                ? "Masuk ke akun Anda" 
                : "Daftar Akun Baru"}
          </p>
        </div>

        {/* Forms */}
        {mode === "admin_login" ? (
          <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 space-y-4 shadow-lg animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl islamic-gradient font-bold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Memproses..." : <><LogIn className="h-4 w-4 mr-2" /> Masuk Admin</>}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Bukan admin?{" "}
              <button
                type="button"
                onClick={() => setMode("whatsapp_login")}
                className="text-primary font-medium hover:underline"
              >
                Login via WhatsApp
              </button>
            </p>
          </form>
        ) : mode === "whatsapp_login" ? (
          <div className="bg-card border rounded-xl p-6 shadow-lg">
            <WhatsAppLogin
              onSuccess={(token, user) => {
                signInWithWhatsApp(token, user);
                toast({ title: "Berhasil masuk via WhatsApp!" });
                navigate("/");
              }}
              onError={(error) => {
                toast({ title: "Login Gagal", description: error, variant: "destructive" });
              }}
            />
            <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
              Belum punya akun?{" "}
              <button
                onClick={() => setMode("whatsapp_register")}
                className="text-primary font-medium hover:underline"
              >
                Daftar via WhatsApp
              </button>
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-6 shadow-lg">
            <WhatsAppRegister
              onSuccess={() => {
                toast({ title: "Selamat!", description: "Akun WhatsApp Anda telah dibuat. Silakan masuk." });
                setTimeout(() => setMode("whatsapp_login"), 2000);
              }}
              onError={(error) => {
                toast({ title: "Gagal", description: error, variant: "destructive" });
              }}
            />
            <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
              Sudah punya akun?{" "}
              <button
                onClick={() => setMode("whatsapp_login")}
                className="text-primary font-medium hover:underline"
              >
                Masuk via WhatsApp
              </button>
            </p>
          </div>
        )}

        {mode !== "admin_login" && isSecretPath && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setMode("admin_login")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Kembali ke Login Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
