import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { KeyRound } from "lucide-react";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const [, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSiteSettings();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || settings.google_client_id;
  const disableGoogleLogin = import.meta.env.VITE_DISABLE_GOOGLE_LOGIN === "true";
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const canUseGoogleLogin = Boolean(googleClientId) && !isLocalhost && !disableGoogleLogin;

  useEffect(() => {
    if (!canUseGoogleLogin) return;
    const clientId = googleClientId;
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
  }, [navigate, settings.google_client_id, signInWithGoogle, toast, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02]"
            aria-label="Kembali ke beranda"
          >
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-16 w-auto object-contain drop-shadow-md" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-lg shadow-emerald-900/30">
                {settings.site_name?.charAt(0)?.toUpperCase() || "B"}
              </div>
            )}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{settings.site_name || "Portal Admin"}</h1>
          <p className="text-slate-400">{settings.site_description || settings.tagline || "Akses terbatas untuk administrator"}</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-5 shadow-2xl">
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

          {canUseGoogleLogin ? (
            <div className="pt-1">
              <div ref={googleBtnRef} />
            </div>
          ) : null}

          {/* Security Note */}
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              🔒 Koneksi aman. Jangan bagikan kredensial Anda kepada siapa pun.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          {settings.site_name || "Buyaelvisyam.id"} Admin v1.0
        </p>
      </div>
    </div>
  );
}
