import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";
import { ArrowLeft, PlayCircle, BookOpen, ChevronRight, FileText, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function LessonView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/lesson/${slug}`).then(({ data }) => {
      setLesson(data);
      setLoading(false);
    }).catch(() => {
        setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat materi...</div>;
  if (!lesson) return <div className="min-h-screen flex items-center justify-center">Materi tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={lesson.title} description={lesson.title} />
      <Navbar />

      <main className="container mx-auto px-4 py-8 bottom-nav-safe">
        <div className="max-w-5xl mx-auto space-y-8">
           <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-primary">
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                 <BookOpen className="h-3 w-3" /> Pelajaran Sedang Berlangsung
              </div>
           </div>

           <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
                 {lesson.title}
              </h1>
           </div>

           {/* Video Player */}
           {lesson.content_type === "video" ? (
             <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border-4 border-card">
                {lesson.content.includes("youtube.com") || lesson.content.includes("youtu.be") ? (
                  <iframe 
                    src={lesson.content.includes("embed") ? lesson.content : `https://www.youtube.com/embed/${lesson.content.split('v=')[1] || lesson.content.split('/').pop()}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white flex-col gap-4">
                     <PlayCircle className="h-16 w-16 opacity-20" />
                     <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Memutar Video...</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="bg-card border border-border/50 rounded-[2.5rem] p-12 shadow-sm font-serif text-xl leading-relaxed text-foreground/90">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
             </div>
           )}

           {/* Control Bar */}
           <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-card border border-border/50 rounded-3xl shadow-lg">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <FileText className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status Belajar</p>
                    <p className="text-sm font-bold text-emerald-600">Terbuka Untuk Dipelajari</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold gap-2">
                    <LayoutList className="h-4 w-4" /> Daftar Materi
                 </Button>
                 <Button className="h-12 px-10 rounded-2xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                    Selesai & Lanjut <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
