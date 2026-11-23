import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { HelpCircle, Mail, Phone, MessageCircle, BookOpen, HandHeart, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

type FAQItem = { id?: string; category: string; question: string; answer: string };

type CategoryMeta = { label: string; icon: React.ElementType };

/* Metadata kategori — ikon & label. Kategori kustom dari admin akan diberi label fallback. */
const CATEGORY_META: Record<string, CategoryMeta> = {
  akun: { label: "Akun & Login", icon: Users },
  konten: { label: "Artikel & Konten", icon: BookOpen },
  donasi: { label: "Donasi", icon: HandHeart },
  aplikasi: { label: "Aplikasi & Teknis", icon: ShieldCheck },
};

/* Konten bawaan — dipakai selama belum ada data FAQ di database. */
const DEFAULT_FAQS: FAQItem[] = [
  { category: "akun", question: "Bagaimana cara membuat akun?", answer: "Klik tombol Masuk / Daftar pada menu navigasi, lalu pilih opsi daftar. Anda dapat mendaftar menggunakan alamat email atau akun Google. Setelah formulir diisi, akun Anda langsung aktif dan bisa digunakan untuk membaca, menyimpan bookmark, serta mengakses fitur lainnya." },
  { category: "akun", question: "Bagaimana cara masuk ke akun saya?", answer: "Klik menu Masuk di pojok atas website, kemudian masukkan email dan kata sandi Anda. Tersedia juga opsi masuk cepat menggunakan akun Google." },
  { category: "akun", question: "Apakah saya bisa masuk menggunakan akun Google?", answer: "Bisa. Pada halaman masuk, pilih tombol lanjut dengan Google, lalu ikuti proses otorisasi. Akun akan dibuat otomatis jika email Google Anda belum terdaftar." },
  { category: "akun", question: "Bagaimana jika saya lupa kata sandi?", answer: "Pada halaman masuk, klik tautan Lupa Kata Sandi, masukkan email yang terdaftar, dan ikuti instruksi yang dikirim ke email Anda untuk membuat kata sandi baru." },
  { category: "konten", question: "Bagaimana cara mencari artikel?", answer: "Gunakan kolom pencarian di menu navigasi atau kunjungi halaman Arsip untuk menjelajahi seluruh artikel. Anda juga dapat memfilter berdasarkan kategori melalui halaman Kategori." },
  { category: "konten", question: "Apa itu kategori dan bagaimana cara menggunakannya?", answer: "Kategori adalah pengelompokan artikel berdasarkan tema, misalnya Hadits, Fiqih, atau Kajian. Klik kategori pada halaman Kategori untuk melihat semua artikel yang termasuk di dalamnya." },
  { category: "konten", question: "Apakah saya bisa mengunduh materi (PDF, audio, dsb.)?", answer: "Ya. Sebagian materi menyediakan berkas unduhan. Kunjungi halaman Unduhan untuk melihat daftar berkas yang tersedia, lalu klik tombol unduh pada berkas yang Anda butuhkan." },
  { category: "konten", question: "Apakah artikel boleh dibagikan ke media sosial?", answer: "Boleh, silakan bagikan tautan artikel melalui tombol bagikan yang tersedia. Dengan menyebarkan tautan (bukan menyalin isi artikel secara utuh), sumber kajian tetap jelas dan penulis tetap mendapatkan kredit." },
  { category: "konten", question: "Bagaimana jika saya menemukan kesalahan pada artikel?", answer: "Kami sangat terbuka terhadap koreksi. Silakan hubungi kami melalui email yang tertera di bagian bawah halaman FAQ ini, sertakan judul artikel dan bagian yang perlu dikoreksi." },
  { category: "donasi", question: "Bagaimana cara berdonasi?", answer: "Kunjungi halaman Donasi, pilih nominal yang diinginkan (atau isi nominal kustom), lalu ikuti instruksi pembayaran yang tersedia. Pastikan data Anda benar sebelum menyelesaikan pembayaran." },
  { category: "donasi", question: "Bagaimana cara melihat riwayat donasi saya?", answer: "Masuk ke akun Anda, lalu buka halaman Riwayat Donasi dari menu Profil atau Dashboard. Di sana tercatat seluruh donasi yang pernah Anda salurkan beserta statusnya." },
  { category: "donasi", question: "Apakah donasi saya bisa dibatalkan?", answer: "Donasi yang statusnya masih menunggu pembayaran akan otomatis dibatalkan jika tidak diselesaikan dalam batas waktu yang ditentukan. Untuk donasi yang sudah berhasil, silakan hubungi kami jika terdapat kendala." },
  { category: "donasi", question: "Apakah saya bisa berdonasi tanpa membuat akun?", answer: "Kami menyarankan untuk masuk terlebih dahulu agar riwayat donasi tercatat pada akun Anda. Namun, Anda tetap dapat berdonasi dengan mengisi data yang diperlukan pada proses pembayaran." },
  { category: "aplikasi", question: "Apakah tersedia aplikasi Android?", answer: "Ya. Aplikasi Android resmi dapat diunduh dari Google Play. Aplikasi menyediakan pengalaman membaca yang lebih nyaman, termasuk notifikasi artikel terbaru." },
  { category: "aplikasi", question: "Apakah data pribadi saya aman?", answer: "Kami menjaga kerahasiaan data pengguna dan tidak menjual data pribadi kepada pihak mana pun. Detail selengkapnya dapat dibaca pada halaman Kebijakan Privasi." },
  { category: "aplikasi", question: "Bagaimana cara menghubungi admin?", answer: "Anda dapat menghubungi kami melalui email atau telepon/WhatsApp yang tertera pada bagian kontak di bawah halaman ini. Tim kami akan berusaha merespons secepatnya pada jam kerja." },
  { category: "aplikasi", question: "Bagaimana cara menghapus akun saya?", answer: "Kunjungi halaman Hapus Akun untuk melihat langkah-langkah penghapusan akun beserta informasi terkait data yang akan dihapus." },
];

export default function FAQ() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "e-Kajian";
  const contactEmail = (settings as any).about_contact_email || "kontak@e-kajian.web.id";
  const contactPhone = (settings as any).about_contact_phone || "-";

  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("semua");

  // Muat FAQ dari database; jika kosong/gagal, pakai konten bawaan.
  useEffect(() => {
    let cancelled = false;
    api.get("/faqs")
      .then(({ data }) => {
        if (cancelled) return;
        const items = (data || []) as FAQItem[];
        if (items.length > 0) setFaqs(items);
      })
      .catch(() => { /* pakai default */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Daftar kategori: urutkan kategori bawaan lebih dulu, lalu kategori kustom.
  const categories = useMemo(() => {
    const present = Array.from(new Set(faqs.map(f => f.category)));
    const known = Object.keys(CATEGORY_META).filter(c => present.includes(c));
    const rest = present.filter(c => !known.includes(c));
    return [...known, ...rest];
  }, [faqs]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "semua") return faqs;
    return faqs.filter(f => f.category === activeCategory);
  }, [faqs, activeCategory]);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: filteredItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  }), [filteredItems]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="FAQ - Pertanyaan yang Sering Diajukan"
        description={`Pusat bantuan ${siteName}: jawaban atas pertanyaan umum seputar akun, artikel, donasi, dan aplikasi.`}
        canonical={`${window.location.origin}/faq`}
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="bottom-nav-safe">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-muted/30">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='currentColor' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }} />
          <div className="container relative mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <HelpCircle className="h-3.5 w-3.5" />
                Pusat Bantuan
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                Pertanyaan yang Sering Diajukan
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Temukan jawaban atas pertanyaan umum seputar akun, artikel, donasi, dan aplikasi {siteName}. Tidak menemukan jawabannya? Hubungi kami melalui kontak di bawah.
              </p>
            </div>
          </div>
        </section>

        {/* Category filter + Accordion */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              {/* Category pills */}
              {loaded && categories.length > 0 && (
                <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("semua")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                      activeCategory === "semua"
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    Semua
                  </button>
                  {categories.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const Icon = meta?.icon || HelpCircle;
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta?.label || cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Accordion */}
              <div className="rounded-[28px] border border-border/60 bg-card/70 p-2 shadow-sm backdrop-blur sm:p-4">
                {filteredItems.length === 0 ? (
                  <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Belum ada pertanyaan pada kategori ini.
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="px-2 sm:px-4">
                    {filteredItems.map((item, idx) => (
                      <AccordionItem key={item.id || `faq-${item.category}-${idx}`} value={item.id || `faq-${item.category}-${idx}`} className="border-border/50">
                        <AccordionTrigger className="text-left text-sm font-bold text-foreground hover:no-underline hover:text-primary sm:text-base">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-7 text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              {/* Need more help */}
              <div className="mt-10 rounded-[28px] border border-border/60 bg-card/70 p-8 text-center shadow-sm backdrop-blur md:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-foreground">
                  Masih butuh bantuan?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Jangan ragu untuk menghubungi tim kami. Kami siap membantu menjawab pertanyaan atau kendala yang Anda alami.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    {contactEmail}
                  </a>
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                  >
                    <Phone className="h-4 w-4" />
                    {contactPhone}
                  </a>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Pelajari juga: <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">Kebijakan Privasi</Link> ·{" "}
                  <Link to="/tentang" className="font-semibold text-primary hover:underline">Tentang Kami</Link> ·{" "}
                  <Link to="/unduhan" className="font-semibold text-primary hover:underline">Halaman Unduhan</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}