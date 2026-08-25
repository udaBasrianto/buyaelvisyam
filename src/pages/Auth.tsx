import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Mail, Lock, KeyRound } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSiteSettings();

  const isAdminRoute = settings?.admin_slug
    ? window.location.pathname === `/${settings.admin_slug}`
    : window.location.pathname === "/yaakhi";

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || settings?.google_client_id;
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
        // Cancel any previous initialization to avoid "called multiple times" warning
        try { google.accounts.id.cancel(); } catch {}
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            const credential = String(response?.credential || "").trim();
            if (!credential) {
              toast({ title: "Gagal", description: "Google credential tidak valid", variant: "destructive" });
              return;
            }
            setLoading(true);
            const { error } = await signInWithGoogle(credential, adminToken);
            if (error) {
              toast({ title: "Gagal masuk", description: error, variant: "destructive" });
            } else {
              toast({ title: "Berhasil masuk!" });
              navigate("/");
            }
            setLoading(false);
          },
        });

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
  }, [adminToken, navigate, settings?.google_client_id, signInWithGoogle, toast]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, adminToken);
    if (error) {
      toast({ title: "Gagal masuk", description: error, variant: "destructive" });
    } else {
      toast({ title: "Berhasil masuk!" });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center mb-4 overflow-hidden transition-transform hover:scale-[1.02]"
            aria-label="Kembali ke beranda"
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-16 w-auto object-contain drop-shadow-md" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-blue-200">
                ☪
              </div>
            )}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings?.site_name || "BlogUstad"}</h1>
          <p className="text-gray-500 italic">{settings?.site_description || settings?.tagline || "Platform Literasi & Edukasi Islami"}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 space-y-6 border border-gray-100 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Token Administrator {isAdminRoute ? "" : "(opsional)"}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Masukkan token admin jika login sebagai admin"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  required={isAdminRoute}
                />
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                {isAdminRoute
                  ? "Route admin terdeteksi. Token wajib diisi untuk akun admin."
                  : "Isi token ini hanya jika Anda login sebagai admin. Untuk akun biasa bisa dikosongkan."}
              </p>
            </div>

            {(import.meta.env.VITE_GOOGLE_CLIENT_ID || settings?.google_client_id) && (
              <div className="pt-1">
                <div ref={googleBtnRef} />
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-100" disabled={loading}>
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-12 px-8 leading-relaxed">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link to="/privacy-policy" className="font-semibold text-blue-600 hover:text-blue-700">
            Kebijakan Privasi
          </Link>{" "}
          {settings?.site_name || "BlogUstad"}.
        </p>
      </div>
    </div>
  );
}
