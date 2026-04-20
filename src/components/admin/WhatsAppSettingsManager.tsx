import { useState, useEffect } from "react";
import { MessageCircle, QrCode, Loader2, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

import { QRCodeSVG } from "qrcode.react";

interface WhatsAppStatus {
  enabled: boolean;
  connected: boolean;
  phone?: string;
  name?: string;
  jid?: string;
  last_connected?: string;
  qr_code?: string;
}

export function WhatsAppSettingsManager() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get("/auth/whatsapp/status");
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch WhatsApp status", err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setQrCode("");
    try {
      // Kick off connection — backend returns immediately, QR comes via polling
      await api.post("/auth/whatsapp/connect");

      setShowQR(true);
      toast({
        title: "Menghubungkan WhatsApp...",
        description: "QR Code sedang disiapkan, mohon tunggu sebentar",
      });

      // Poll /status every 2 seconds for QR code and connection state
      const interval = setInterval(async () => {
        try {
          const { data: newStatus } = await api.get("/auth/whatsapp/status");

          // Update QR code whenever it arrives/changes
          if (newStatus.qr_code) {
            setQrCode(newStatus.qr_code);
          }

          // If connected, stop polling and close QR modal
          if (newStatus.connected) {
            setStatus(newStatus);
            clearInterval(interval);
            setShowQR(false);
            setQrCode("");
            toast({
              title: "WhatsApp Terhubung! ✅",
              description: `Nomor: ${newStatus.phone}`,
            });
          }
        } catch {
          // Continue polling silently
        }
      }, 2000);

      // Auto-stop after 2 minutes
      setTimeout(() => {
        clearInterval(interval);
        setShowQR(false);
      }, 120000);
    } catch (err: any) {
      toast({
        title: "Gagal Menghubungkan",
        description: err.response?.data?.error || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan WhatsApp?")) return;

    try {
      await api.post("/auth/whatsapp/disconnect");
      setStatus({ ...status!, connected: false });
      setShowQR(false);
      toast({
        title: "WhatsApp Terputus",
        description: "Akun WhatsApp telah diputuskan",
      });
      fetchStatus();
    } catch (err: any) {
      toast({
        title: "Gagal Memutuskan",
        description: err.response?.data?.error || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status?.enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-700">WhatsApp registration belum diaktifkan di server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Status Koneksi</h3>
              <p className="text-sm text-muted-foreground">Status WhatsApp Bot Anda</p>
            </div>
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>

          {status.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Terhubung</span>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                {status.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor:</span>
                    <span className="font-mono font-medium">{status.phone}</span>
                  </div>
                )}
                {status.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="font-medium">{status.name}</span>
                  </div>
                )}
                {status.last_connected && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terhubung:</span>
                    <span className="text-xs">
                      {new Date(status.last_connected).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full mt-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Putuskan Koneksi
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Tidak Terhubung</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Hubungkan akun WhatsApp Anda untuk mengaktifkan pengiriman token verifikasi
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Hubungkan WhatsApp
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Instructions Card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Panduan Koneksi</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Klik "Hubungkan WhatsApp"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>QR Code akan muncul di bawah</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Buka WhatsApp di ponsel Anda</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Pindai QR Code dengan kamera WhatsApp</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>Tunggu 2-3 detik untuk koneksi</span>
            </li>
          </ol>
        </div>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center">
          <h3 className="font-semibold text-foreground mb-4">Scan QR Code</h3>
          <div className="bg-muted/30 rounded-lg p-8 mb-4">
            <div className="bg-white rounded-lg inline-block p-4">
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={256} level="M" />
              ) : (
                <div className="w-64 h-64 bg-muted flex items-center justify-center rounded">
                  <div className="text-center">
                    <Loader2 className="h-20 w-20 text-muted-foreground mx-auto mb-2 animate-spin" />
                    <p className="text-xs text-muted-foreground">Menyiapkan QR Code...</p>
                    <p className="text-xs text-muted-foreground mt-1">Polling setiap 2 detik</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {qrCode ? "Scan QR Code dengan WhatsApp Anda" : "Menunggu QR Code dari server..."}
          </p>
          <Button
            onClick={() => setShowQR(false)}
            variant="outline"
            className="mt-4"
          >
            Batal
          </Button>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-700 mb-2">ℹ️ Informasi</h4>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• WhatsApp Bot ini hanya untuk mengirim kode verifikasi ke pembaca</li>
          <li>• Pastikan nomor WhatsApp aktif dan tidak sedang login di perangkat lain</li>
          <li>• Koneksi akan otomatis terjaga, namun pastikan server tetap running</li>
          <li>• Jika koneksi terputus, cukup hubungkan kembali</li>
        </ul>
      </div>
    </div>
  );
}
