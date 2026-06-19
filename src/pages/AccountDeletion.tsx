import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const updatedAt = "19 Juni 2026";

export default function AccountDeletion() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "Buya Elvisyam";
  const contactEmail = (settings as any).about_contact_email || "kontak@buyaelvisyam.id";
  const contactPhone = (settings as any).about_contact_phone || "-";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Penghapusan Akun"
        description={`Panduan resmi penghapusan akun dan data pengguna untuk layanan ${siteName}.`}
        canonical={`${window.location.origin}/hapus-akun`}
      />
      <Navbar />

      <main className="bottom-nav-safe">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Account Deletion
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                Penghapusan Akun
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Halaman ini menjelaskan cara meminta penghapusan akun beserta data terkait untuk layanan website dan aplikasi Android {siteName}.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-card px-4 py-2 shadow-sm ring-1 ring-border/60">Berlaku untuk website dan aplikasi Android</span>
                <span className="rounded-full bg-card px-4 py-2 shadow-sm ring-1 ring-border/60">Terakhir diperbarui: {updatedAt}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[28px] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Ringkasan</p>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li><a href="#cara-mengajukan" className="transition-colors hover:text-primary">Cara mengajukan</a></li>
                    <li><a href="#data-yang-dihapus" className="transition-colors hover:text-primary">Data yang dihapus</a></li>
                    <li><a href="#data-yang-disimpan" className="transition-colors hover:text-primary">Data yang masih disimpan</a></li>
                    <li><a href="#waktu-proses" className="transition-colors hover:text-primary">Waktu proses</a></li>
                    <li><a href="#kontak" className="transition-colors hover:text-primary">Kontak</a></li>
                  </ul>
                </div>
              </aside>

              <article className="prose prose-neutral max-w-none rounded-[32px] border border-border/60 bg-card/70 px-5 py-8 shadow-sm backdrop-blur dark:prose-invert sm:px-8 lg:px-10">
                <p>
                  Jika Anda ingin menghapus akun dan data yang terkait dengan akun Anda di layanan {siteName}, silakan ikuti petunjuk pada halaman ini.
                </p>

                <h2 id="cara-mengajukan">1. Cara Mengajukan Penghapusan Akun</h2>
                <p>Anda dapat meminta penghapusan akun dengan salah satu cara berikut:</p>
                <ol>
                  <li>Kirim email ke <strong>{contactEmail}</strong> dengan subjek <strong>Permintaan Hapus Akun</strong>.</li>
                  <li>Sertakan informasi akun yang digunakan pada aplikasi atau website, misalnya email login atau nomor WhatsApp yang terhubung.</li>
                  <li>Jika diperlukan, tim kami dapat meminta verifikasi sederhana untuk memastikan permintaan berasal dari pemilik akun yang sah.</li>
                </ol>

                <h2 id="data-yang-dihapus">2. Data yang Akan Dihapus</h2>
                <p>Setelah permintaan penghapusan akun diproses, kami akan menghapus atau menonaktifkan data akun utama Anda, termasuk sejauh berlaku:</p>
                <ul>
                  <li>profil pengguna dan identitas akun;</li>
                  <li>data autentikasi dan keterkaitan login dengan akun;</li>
                  <li>bookmark, progres baca, dan preferensi akun;</li>
                  <li>komentar atau konten yang secara teknis dapat dikaitkan langsung ke akun Anda, sesuai kebijakan internal dan batasan sistem.</li>
                </ul>

                <h2 id="data-yang-disimpan">3. Data yang Mungkin Masih Disimpan</h2>
                <p>Beberapa data dapat tetap disimpan untuk jangka waktu terbatas apabila diperlukan untuk:</p>
                <ul>
                  <li>kepatuhan hukum dan perpajakan;</li>
                  <li>pencegahan penyalahgunaan, spam, penipuan, atau pelanggaran keamanan;</li>
                  <li>arsip log teknis, audit, atau penyelesaian sengketa;</li>
                  <li>catatan transaksi atau donasi yang wajib disimpan menurut hukum yang berlaku.</li>
                </ul>

                <h2 id="waktu-proses">4. Waktu Proses dan Retensi</h2>
                <p>
                  Permintaan penghapusan akun biasanya kami proses dalam waktu maksimal <strong>30 hari kerja</strong> sejak permintaan terverifikasi. Data tertentu yang wajib disimpan untuk alasan hukum, keamanan, atau administrasi dapat disimpan lebih lama sesuai kebutuhan yang sah.
                </p>

                <h2>5. Penghapusan Data Tanpa Menghapus Akun</h2>
                <p>
                  Saat ini kami belum menyediakan fitur otomatis bagi pengguna untuk meminta penghapusan sebagian data tanpa menghapus akun. Jika Anda memiliki kebutuhan khusus terkait data tertentu, silakan hubungi kami untuk peninjauan manual.
                </p>

                <h2 id="kontak">6. Kontak</h2>
                <p>Untuk permintaan penghapusan akun atau pertanyaan terkait data pengguna, silakan hubungi kami melalui:</p>
                <ul>
                  <li>Email: {contactEmail}</li>
                  <li>Telepon/WhatsApp: {contactPhone}</li>
                  <li>Website: <Link to="/" className="font-semibold text-primary no-underline">Beranda {siteName}</Link></li>
                </ul>

                <hr />
                <p className="text-sm text-muted-foreground">
                  Halaman ini disediakan untuk memenuhi kebutuhan transparansi pengguna serta persyaratan publikasi aplikasi di Google Play.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
