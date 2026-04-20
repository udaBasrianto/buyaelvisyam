import { useState } from "react";
import { MessageCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface WhatsAppRegisterProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppRegister({ onSuccess, onError }: WhatsAppRegisterProps) {
  const [step, setStep] = useState<"phone" | "verification">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Format phone number
      let formatted = phoneNumber.replace(/\D/g, "");
      if (formatted.startsWith("0")) {
        formatted = "62" + formatted.slice(1);
      }
      if (!formatted.startsWith("62")) {
        formatted = "62" + formatted;
      }

      const { data } = await api.post("/auth/whatsapp/request-token", {
        phone_number: formatted,
        display_name: displayName,
      });

      setExpiresAt(new Date(data.expires_at));
      setStep("verification");
      setSuccess("Token telah dikirim ke WhatsApp Anda!");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Gagal mengirim token";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Format phone number same as before
      let formatted = phoneNumber.replace(/\D/g, "");
      if (formatted.startsWith("0")) {
        formatted = "62" + formatted.slice(1);
      }
      if (!formatted.startsWith("62")) {
        formatted = "62" + formatted;
      }

      const { data } = await api.post("/auth/whatsapp/verify-token", {
        phone_number: formatted,
        token: token,
        display_name: displayName,
      });

      setSuccess("Selamat! Akun Anda telah dibuat!");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Verifikasi gagal";
      setError(errorMsg);
      setAttemptsLeft(err.response?.data?.attempts_left || 0);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setToken("");
    setError("");
    setSuccess("");
  };

  const isTokenExpired = expiresAt && new Date() > expiresAt;

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={handleRequestToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
            <Input
              type="text"
              placeholder="Masukkan nama Anda"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nomor WhatsApp</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                +62
              </span>
              <Input
                type="tel"
                placeholder="8xx xxxx xxxx (tanpa 0 di awal)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                required
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contoh: 812345678 atau 0812345678
            </p>
          </div>

          {error && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !displayName || !phoneNumber}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Minta Kode Verifikasi
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Verifikasi</label>
            <p className="text-xs text-muted-foreground mb-2">
              Masukkan kode 6 digit yang telah dikirim ke WhatsApp: +62{phoneNumber.replace(/\D/g, "").replace(/^0/, "")}
            </p>
            <Input
              type="text"
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.slice(0, 6))}
              disabled={loading || isTokenExpired}
              maxLength={6}
              required
              className="text-center text-lg tracking-widest"
            />
          </div>

          {isTokenExpired && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Kode telah kadaluarsa. Silakan minta kode baru.</span>
            </div>
          )}

          {error && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {attemptsLeft > 0 && (
                  <p className="text-xs mt-1">Kesempatan tersisa: {attemptsLeft}</p>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="flex gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToPhone}
              disabled={loading}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={loading || token.length < 6 || isTokenExpired}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifikasi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verifikasi Kode
                </>
              )}
            </Button>
          </div>

          {expiresAt && !isTokenExpired && (
            <p className="text-xs text-muted-foreground text-center">
              Kode berlaku sampai: {expiresAt.toLocaleTimeString("id-ID")}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
