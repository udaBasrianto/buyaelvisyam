import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";
import { Play, Lock, BookOpen, Clock, ChevronRight, ArrowLeft, Star, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructor: string;
  level: string;
  category: string;
  price: number;
};

type Module = {
  id: string;
  title: string;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  content_type: string;
  is_free: boolean;
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null); // null, pending, active
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const fetchEnrollmentStatus = async (courseId: string) => {
    if (!user) return;
    try {
      const { data } = await api.get(`/courses/${courseId}/enrollment-status`);
      if (data.enrolled) {
        setEnrollmentStatus(data.status);
      }
      
      const { data: walletData } = await api.get("/wallet");
      setUserBalance(walletData.balance);
    } catch (err) {
      console.error("Scale enrollment check failed", err);
    }
  };

  const handlePayWithWallet = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      await api.post(`/courses/${course.id}/pay-wallet`);
      toast({ title: "Berhasil!", description: "Kursus telah aktif menggunakan saldo Anda." });
      setEnrollmentStatus("active");
      setShowPaymentModal(false);
    } catch (err: any) {
      toast({ title: "Gagal", description: err.response?.data?.error || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: c } = await api.get(`/courses/${slug}`);
        if (!c) return;
        setCourse(c);
        
        fetchEnrollmentStatus(c.id);

        const { data: mods } = await api.get(`/courses/${c.id}/modules`);
        setModules(mods);
        
        const lessonMap: Record<string, Lesson[]> = {};
        for (const m of mods as Module[]) {
          const { data: less } = await api.get(`/modules/${m.id}/lessons`);
          lessonMap[m.id] = less;
        }
        setLessons(lessonMap);
      } catch (err) {
        console.error("Error fetching course", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user) {
      toast({ title: "Login Diperlukan", description: "Silakan login untuk mendaftar kursus." });
      navigate("/auth");
      return;
    }

    if (!course) return;

    setEnrolling(true);
    try {
      const { data } = await api.post(`/courses/${course.id}/enroll`);
      setEnrollmentStatus(data.status);
      
      if (data.status === "pending") {
        setShowPaymentModal(true);
      } else {
        toast({ title: "Berhasil Terdaftar!", description: "Selamat belajar di kursus ini." });
      }
    } catch (err: any) {
      toast({ 
        title: "Gagal Mendaftar", 
        description: err.response?.data?.error || "Terjadi kesalahan.",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat kursus...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Kursus tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={course.title} description={course.description} />
      <Navbar />

      <main className="container mx-auto px-4 py-8 bottom-nav-safe">
        <Button variant="ghost" onClick={() => navigate("/lms")} className="mb-6 gap-2 text-muted-foreground hover:text-primary">
           <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
             <div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                  {course.category}
                </span>
                <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight uppercase tracking-tighter">
                  {course.title}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8 italic">
                  "{course.description}"
                </p>
                <div className="flex flex-wrap gap-6 py-6 border-y border-border/50">
                  <div className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-primary" />
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Instruktur</p>
                        <p className="text-sm font-black">{course.instructor}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Star className="h-5 w-5 text-amber-500" />
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Level</p>
                        <p className="text-sm font-black">{course.level}</p>
                     </div>
                  </div>
                </div>
             </div>

             {/* Curriculum */}
             <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                   <BookOpen className="h-6 w-6 text-primary" /> Kurikulum Belajar
                </h2>
                <div className="space-y-4">
                   {modules.map((m, i) => (
                     <div key={m.id} className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="bg-muted/50 px-8 py-5 border-b flex items-center justify-between">
                           <h3 className="font-black text-sm uppercase tracking-wider">Modul {i+1}: {m.title}</h3>
                        </div>
                        <div className="divide-y divide-border/30">
                           {lessons[m.id]?.length > 0 ? (
                             lessons[m.id].map((l, j) => (
                               <Link 
                                 key={l.id} 
                                 to={`/lms/lesson/${l.slug}`}
                                 className="flex items-center justify-between px-8 py-4 hover:bg-primary/5 transition-colors group cursor-pointer"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                        {j+1}
                                     </div>
                                     <p className="text-sm font-bold">{l.title}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     {l.is_free ? (
                                       <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">Gratis</span>
                                     ) : (
                                       <Lock className="h-3 w-3 text-muted-foreground" />
                                     )}
                                     <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                               </Link>
                             ))
                           ) : (
                             <div className="px-8 py-6 text-center text-xs text-muted-foreground italic">Belum ada materi di modul ini.</div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Sidebar / CTA */}
          <div className="space-y-6">
             <div className="sticky top-24 bg-card border-2 border-primary rounded-[2.5rem] p-8 shadow-2xl shadow-primary/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <div className="aspect-video rounded-2xl overflow-hidden mb-6 border shadow-inner">
                   <img src={course.thumbnail} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-muted-foreground">Harga Kursus</p>
                       <p className="text-2xl font-black text-primary">
                          {course.price === 0 ? "GRATIS" : `Rp ${course.price.toLocaleString("id-ID")}`}
                       </p>
                    </div>

                    {!enrollmentStatus ? (
                      <Button 
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                      >
                         {enrolling ? "Memproses..." : course.price === 0 ? "Daftar Gratis" : "Beli Kursus Sekarang"}
                      </Button>
                    ) : enrollmentStatus === "pending" ? (
                      <Button 
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-amber-200 bg-amber-500 hover:bg-amber-600"
                      >
                         Menunggu Pembayaran
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          const firstLesson = Object.values(lessons).flat()[0];
                          if (firstLesson) navigate(`/lms/lesson/${firstLesson.slug}`);
                        }}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-emerald-200 bg-emerald-500 hover:bg-emerald-600"
                      >
                         Mulai Belajar
                      </Button>
                    )}

                    <p className="text-[10px] text-center text-muted-foreground px-4 leading-normal font-medium">
                       Akses seumur hidup • Video kualitas HD • Sertifikat setelah selesai (Segera hadir)
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="rounded-[2.5rem] p-8 max-w-md border-amber-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                 </div>
                 Instruksi Pembayaran
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
               <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Pembayaran</p>
                  <p className="text-2xl font-black text-primary">Rp {course.price.toLocaleString("id-ID")}</p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border-b">
                     <span className="text-sm font-bold">Transfer Bank</span>
                     <span className="text-sm font-black">BSI (Bank Syariah Indonesia)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border-b">
                     <span className="text-sm font-bold">Nomor Rekening</span>
                     <span className="text-sm font-black text-primary select-all">7123456789</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                     <span className="text-sm font-bold">Atas Nama</span>
                     <span className="text-sm font-black">Yayasan Blogs Ustad</span>
                  </div>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                  <p className="text-xs font-bold text-amber-700">TIPS:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                     Setelah transfer, silakan kirim bukti pembayaran ke WhatsApp Admin untuk aktivasi instan. <b>Gunakan kode unik (jika ada) atau berikan berita acara sesuai nama akun Anda.</b>
                  </p>
               </div>
            </div>
            <DialogFooter className="flex-col gap-3">
               <div className="w-full p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Wallet className="h-5 w-5 text-primary" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground mr-auto">Saldo Saya</p>
                        <p className="text-sm font-black">Rp {userBalance.toLocaleString("id-ID")}</p>
                     </div>
                  </div>
                  {userBalance >= course.price ? (
                    <Button 
                      onClick={handlePayWithWallet}
                      disabled={enrolling}
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-[10px] font-black uppercase px-4 rounded-xl"
                    >
                       Bayar Pakai Saldo
                    </Button>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded">Saldo Kurang</span>
                  )}
               </div>

               <Button 
                 onClick={() => {
                   window.open(`https://wa.me/628123456789?text=Assalamu'alaikum Admin, saya ingin konfirmasi pembayaran kursus *${course.title}* atas nama ${user?.display_name || user?.email}`, "_blank");
                 }} 
                 className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
               >
                  Konfirmasi via WhatsApp (Transfer Bank)
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNav />
    </div>
  );
}
