import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Heart, Target, Users, BookOpen, Quote, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import api from "@/lib/api";

type PageData = {
  title: string;
  content: string;
  excerpt: string;
};

export default function About() {
  const { settings } = useSiteSettings();
  const [dbPage, setDbPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/pages")
      .then(({ data }) => {
        const aboutPage = (data as any[]).find(p => p.slug === "tentang");
        if (aboutPage) {
          setDbPage({
            title: aboutPage.title,
            content: aboutPage.content,
            excerpt: aboutPage.excerpt || ""
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);



  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Tentang Kami - ${settings.site_name}`} description={settings.tagline} />
      <Navbar />

      <main className="bottom-nav-safe">
        {/* Header Section */}
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-primary/10">
            <img 
              src={(settings as any).about_hero_image || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop"} 
              className="w-full h-full object-cover opacity-20"
              alt="Decorative background"
            />
          </div>
          <div className="container mx-auto px-4 relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Mengenal Lebih Dekat
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 uppercase tracking-tight">
              {dbPage?.title || settings.site_name}
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
              {dbPage?.excerpt || "Platform literasi digital Islami yang berkomitmen menyajikan konten edukatif, inspiratif, dan sesuai dengan tuntunan Al-Quran dan As-Sunnah."}
            </p>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="space-y-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Visi & Misi Kami</h2>
                  {dbPage?.content ? (
                    <div 
                      className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: dbPage.content }}
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      Kami percaya bahwa ilmu adalah cahaya. Di era informasi yang begitu cepat, kami hadir untuk menjadi penyaring yang mengedukasi umat dengan sumber yang valid dan penyampaian yang modern.
                    </p>
                  )}
                  
                  <ul className="space-y-4">
                    {[
                      "Menyebarkan dakwah Islam yang rahmatan lil 'alamin.",
                      "Menyediakan rujukan ilmu agama yang praktis dan aplikatif.",
                      "Membangun komunitas pembaca yang kritis dan berilmu.",
                      "Memanfaatkan teknologi untuk kemudahan akses literasi Islam."
                    ].map((misi, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                           <span className="text-[10px] font-bold">{i+1}</span>
                        </div>
                        {misi}
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-12">
                     <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                        <img src={(settings as any).about_vision_image_1 || "https://images.unsplash.com/photo-1584281723350-467496607bc0?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Islamic Art" />
                     </div>
                     <div className="h-32 rounded-3xl bg-secondary flex items-center justify-center text-secondary-foreground p-6 text-center">
                        <p className="text-xs font-bold leading-tight uppercase tracking-widest">Kajian Berbasis Sunnah</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="h-32 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground p-6 text-center">
                        <p className="text-xs font-bold leading-tight uppercase tracking-widest">Amanah & Terpercaya</p>
                     </div>
                     <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                        <img src={(settings as any).about_vision_image_2 || "https://images.unsplash.com/photo-1506485338023-6ce5f36692df?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Library" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24">
           <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-black uppercase mb-4">Nilai-Nilai Utama</h2>
                 <p className="text-sm text-muted-foreground uppercase tracking-widest">Pilar yang Menopang Da'wah Digital Kami</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { title: (settings as any).about_value_1_title || "Integritas Ilmu", desc: (settings as any).about_value_1_desc || "Setiap artikel melalui proses verifikasi sumber hukum (Dalil) yang ketat.", icon: BookOpen },
                   { title: (settings as any).about_value_2_title || "Empati Umat", desc: (settings as any).about_value_2_desc || "Membahas masalah kekinian yang dihadapi umat dengan bahasa yang santun.", icon: Heart },
                   { title: (settings as any).about_value_3_title || "Modernitas", desc: (settings as any).about_value_3_desc || "Menampilkan konten islami dengan visual yang estetik dan menarik minat generasi muda.", icon: Target }
                 ].map((val, i) => (
                   <div key={i} className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all text-center">
                      <div className="h-16 w-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                         <val.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{val.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>



        {/* Contact Info */}
        <section className="py-24 border-t">
           <div className="container mx-auto px-4">
              <div className="bg-card border border-border/50 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row gap-16 items-center">
                 <div className="max-w-md">
                    <h2 className="text-3xl font-black uppercase mb-6">Butuh Informasi <br/><span className="text-primary text-4xl">Lebih Lanjut?</span></h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                      Jangan ragu untuk menghubungi kami untuk kerjasama dakwah, kritik, maupun saran demi kemajuan platform ini.
                    </p>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Mail className="h-4 w-4" /></div>
                          <span className="text-sm font-medium">{(settings as any).about_contact_email || "kontak@blogustad.com"}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Phone className="h-4 w-4" /></div>
                          <span className="text-sm font-medium">{(settings as any).about_contact_phone || "+62 812-3456-7890"}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex-1 w-full bg-muted rounded-3xl p-8 space-y-4 border border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="Nama Anda" className="bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                       <input type="email" placeholder="Email Anda" className="bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <textarea placeholder="Pesan Anda" rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                    <button className="w-full islamic-gradient text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all">Kirim Pesan Sekarang</button>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-card border-t pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
            <Quote className="h-12 w-12 text-primary/20 mx-auto mb-8" />
            <h2 className="text-2xl italic font-serif max-w-2xl mx-auto mb-16 leading-relaxed">
              "{(settings as any).about_footer_quote || "Sampaikanlah dariku walau hanya satu ayat."}"
              <span className="block text-sm font-bold uppercase tracking-widest mt-4 not-italic text-primary">— {(settings as any).about_footer_author || "HR. Bukhari"}</span>
            </h2>
            <div className="border-t border-border pt-12">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                {settings.footer_text}
              </p>
            </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
