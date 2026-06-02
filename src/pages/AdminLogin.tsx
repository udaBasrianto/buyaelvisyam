import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Mail, Lock, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (!googleBtnRef.current) return;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).google?.accounts?.id) return resolve();
        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google script"));
        document.head.appendChild(script);
      });

    loadScript()
      .then(() => {
        const google = (window as any).google;
        if (!google?.accounts?.id) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            const credential = String(response?.credential || "").trim();
            if (!credential) {
              toast({ title: "Gagal", description: "Google credential tidak valid", variant: "destructive" });
              return;
            }
            setLoading(true);
            const { error } = await signInWithGoogle(credential, token);
            if (error) {
              toast({ title: "Gagal masuk", description: error, variant: "destructive" });
            } else {
              toast({ title: "Berhasil masuk!" });
              navigate("/admin");
            }
            setLoading(false);
          },
        });
        if (!googleBtnRef.current) return;
        googleBtnRef.current.innerHTML = "";
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: "360",
          text: "signin_with",
          shape: "pill",
        });
      })
      .catch(() => {});
  }, [navigate, signInWithGoogle, toast, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password, token);
    if (error) {
      toast({ title: "Gagal masuk", description: error, variant: "destructive" });
    } else {
      toast({ title: "Berhasil masuk!" });
      navigate("/admin");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🔐</span>
          <h1 className="text-3xl font-bold text-white mb-2">Portal Admin</h1>
          <p className="text-slate-400">Akses terbatas untuk administrator</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-5 shadow-2xl">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <Input
                type="email"
                placeholder="Masukkan email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 rounded-lg bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <Input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-12 rounded-lg bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Admin</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <Input
                type="password"
                placeholder="Masukkan token admin"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-12 h-12 rounded-lg bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div className="pt-1">
              <div ref={googleBtnRef} />
            </div>
          ) : null}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <LogIn className="h-5 w-5 mr-2" />
                Masuk ke Dashboard
              </span>
            )}
          </Button>

          {/* Security Note */}
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              🔒 Koneksi aman. Jangan bagikan kredensial Anda kepada siapa pun.
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          BlogUstad Admin v1.0
        </p>
      </div>
    </div>
  );
}
