import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, Mail, Lock, Phone, User, CheckCircle2, MessageSquare } from "lucide-react";
import api from "@/lib/api";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Input details, 2: OTP
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "whatsapp">("email");
  const [loginStep, setLoginStep] = useState(1); // 1: Input number, 2: OTP
  const [settings, setSettings] = useState<any>(null);
  const { signIn, signInWithWhatsApp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch site settings for dynamic logo/text
    api.get("/settings").then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, "");
    if (error) {
      toast({ title: "Gagal masuk", description: error, variant: "destructive" });
    } else {
      toast({ title: "Berhasil masuk!" });
      navigate("/");
    }
    setLoading(false);
  };

  const handleRequestLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
      await api.post("/auth/whatsapp/login/request", { phone_number: cleanPhone });
      toast({ title: "OTP Terkirim", description: "Cek pesan WhatsApp Anda" });
      setLoginStep(2);
    } catch (error: any) {
      toast({ 
        title: "Gagal", 
        description: error.response?.data?.error || "Gagal mengirim kode", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
      const { data } = await api.post("/auth/whatsapp/login/verify", {
        phone_number: cleanPhone,
        token: otp
      });
      
      signInWithWhatsApp(data.token, data.user);
      toast({ title: "Selamat Datang!", description: "Berhasil masuk via WhatsApp" });
      navigate("/");
    } catch (error: any) {
      toast({ 
        title: "Gagal", 
        description: error.response?.data?.error || "Kode OTP salah", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !displayName) {
      toast({ title: "Data tidak lengkap", description: "Mohon isi nama dan nomor WhatsApp", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Clean phone number (remove +, spaces, etc)
      const cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
      await api.post("/auth/whatsapp/request-token", { 
        phone_number: cleanPhone,
        display_name: displayName 
      });
      toast({ title: "OTP Terkirim", description: "Cek pesan WhatsApp Anda" });
      setStep(2);
    } catch (error: any) {
      toast({ 
        title: "Gagal kirim OTP", 
        description: error.response?.data?.error || "Terjadi kesalahan", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
      const { data } = await api.post("/auth/whatsapp/verify-token", {
        phone_number: cleanPhone,
        token: otp,
        display_name: displayName
      });
      
      toast({ title: "Akun Berhasil Dibuat", description: "Selamat datang di BlogUstad!" });
      
      // Auto-login after registration
      try {
        const loginRes = await api.post("/auth/whatsapp/login/request", { phone_number: cleanPhone });
        // It will send another OTP for security on first login, or we can just redirect to login tab
        setStep(1);
        setOtp("");
        toast({ title: "Pendaftaran Selesai", description: "Silakan masuk dengan kartu akses WhatsApp Anda" });
      } catch (tokenError) {
        setStep(1);
      }
    } catch (error: any) {
      toast({ 
        title: "Verifikasi Gagal", 
        description: error.response?.data?.error || "Kode OTP salah", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Dinamis */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 overflow-hidden">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.site_name} 
                className="h-16 w-auto object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-blue-200">
                ☪
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {settings?.site_name || "BlogUstad"}
          </h1>
          <p className="text-gray-500 italic">
            {settings?.description || "Platform Literasi & Edukasi Islami"}
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-gray-100 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <LogIn className="h-4 w-4 mr-2" /> Masuk
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" /> Daftar (WA)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="bg-white rounded-2xl p-8 space-y-6 border border-gray-100 shadow-xl shadow-gray-200/50">
              {loginMethod === "email" ? (
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

                  <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-100" disabled={loading}>
                    {loading ? "Memproses..." : "Masuk Sekarang"}
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Atau</span></div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 border-green-100 text-green-700 hover:bg-green-50"
                    onClick={() => setLoginMethod("whatsapp")}
                  >
                    <Phone className="h-4 w-4 mr-2" /> Masuk via WhatsApp
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  {loginStep === 1 ? (
                    <form onSubmit={handleRequestLoginOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nomor WhatsApp Terdaftar</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Contoh: 628123456789"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg" disabled={loading}>
                        {loading ? "Mengirim OTP..." : "Kirim Kode Verifikasi"}
                      </Button>
                      <button type="button" onClick={() => setLoginMethod("email")} className="w-full text-xs text-gray-500 hover:text-blue-600">
                        Masuk dengan Email saja
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyLoginOtp} className="space-y-5 text-center">
                      <h3 className="font-bold">Verifikasi Identitas</h3>
                      <p className="text-sm text-gray-500">Masukkan kode yang baru saja kami kirim ke nomor WA Anda.</p>
                      <Input
                        placeholder="6 Digit Kode"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-12 text-center text-xl font-bold tracking-widest bg-gray-50"
                        maxLength={6}
                        required
                      />
                      <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg" disabled={loading}>
                        {loading ? "Memproses..." : "Konfirmasi & Masuk"}
                      </Button>
                      <button type="button" onClick={() => setLoginStep(1)} className="w-full text-xs text-gray-500">
                        Salah nomor? Ganti nomor
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="bg-white rounded-2xl p-8 space-y-5 border border-gray-100 shadow-xl shadow-gray-200/50">
              {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div className="bg-green-50 p-4 rounded-xl flex items-start gap-3 mb-2 border border-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700 leading-relaxed">
                      Pendaftaran praktis via WhatsApp. Kami akan mengirimkan kode verifikasi 6-digit ke nomor Anda.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Masukkan nama Anda"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nomor WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Contoh: 628123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10 h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-100" disabled={loading}>
                    {loading ? "Mengirim OTP..." : "Daftar via WhatsApp"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Verifikasi Nomor</h3>
                    <p className="text-sm text-gray-500 mt-1">Masukkan 6 digit kode yang dikirim ke <span className="font-semibold text-gray-900">{phoneNumber}</span></p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Masukkan 6 Digit Kode"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-14 text-center text-2xl font-bold tracking-[0.5em] bg-gray-50 border-gray-100 focus:bg-white transition-all"
                      maxLength={6}
                      required
                    />
                    
                    <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all" disabled={loading}>
                      {loading ? "Memverifikasi..." : "Konfirmasi & Daftar"}
                    </Button>
                    
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="w-full text-sm text-gray-500 hover:text-blue-600 font-medium"
                    >
                      Bukan nomor saya? Ubah nomor
                    </button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-12 px-8 leading-relaxed">
          Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi BlogUstad.
        </p>
      </div>
    </div>
  );
}
