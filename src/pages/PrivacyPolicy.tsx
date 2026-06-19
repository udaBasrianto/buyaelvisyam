import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const updatedAt = "19 Juni 2026";

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "Buya Elvisyam";
  const contactEmail = (settings as any).about_contact_email || "kontak@buyaelvisyam.id";
  const contactPhone = (settings as any).about_contact_phone || "-";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Kebijakan Privasi"
        description={`Kebijakan privasi resmi ${siteName} untuk website dan aplikasi Android.`}
        canonical={`${window.location.origin}/privacy-policy`}
      />
      <Navbar />

      <main className="bottom-nav-safe">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Privacy Policy
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                Kebijakan Privasi
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Halaman ini menjelaskan bagaimana {siteName} mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna pada website serta aplikasi Android kami.
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
                    <li><a href="#informasi-yang-dikumpulkan" className="transition-colors hover:text-primary">Informasi yang kami kumpulkan</a></li>
                    <li><a href="#penggunaan-data" className="transition-colors hover:text-primary">Cara kami menggunakan data</a></li>
                    <li><a href="#penyimpanan-dan-keamanan" className="transition-colors hover:text-primary">Penyimpanan dan keamanan</a></li>
                    <li><a href="#hak-pengguna" className="transition-colors hover:text-primary">Hak pengguna</a></li>
                    <li><a href="#kontak" className="transition-colors hover:text-primary">Kontak</a></li>
                  </ul>
                </div>
              </aside>

              <article className="prose prose-neutral max-w-none rounded-[32px] border border-border/60 bg-card/70 px-5 py-8 shadow-sm backdrop-blur dark:prose-invert sm:px-8 lg:px-10">
                <p>
                  Dengan menggunakan website atau aplikasi Android {siteName}, Anda menyetujui praktik pengelolaan data sebagaimana dijelaskan dalam kebijakan ini.
                </p>

                <h2 id="informasi-yang-dikumpulkan">1. Informasi yang Kami Kumpulkan</h2>
                <p>Kami dapat mengumpulkan beberapa jenis informasi berikut:</p>
                <ul>
                  <li>Informasi akun, seperti nama, alamat email, dan data login saat Anda mendaftar atau masuk ke akun.</li>
                  <li>Informasi penggunaan, seperti artikel yang dibuka, aktivitas baca, bookmark, interaksi dasar aplikasi, dan halaman yang diakses.</li>
                  <li>Informasi perangkat dan teknis, seperti jenis perangkat, browser, sistem operasi, alamat IP, serta data log yang diperlukan untuk keamanan dan analitik.</li>
                  <li>Informasi tambahan yang Anda unggah secara sukarela, misalnya gambar atau bukti transfer apabila fitur tertentu diaktifkan pada layanan kami.</li>
                  <li>Informasi dari layanan pihak ketiga, seperti Google Sign-In, jika Anda memilih masuk menggunakan akun Google.</li>
                </ul>

                <h2 id="penggunaan-data">2. Cara Kami Menggunakan Data</h2>
                <p>Data yang dikumpulkan digunakan untuk tujuan berikut:</p>
                <ul>
                  <li>Menyediakan akses akun, autentikasi, dan personalisasi pengalaman pengguna.</li>
                  <li>Menampilkan konten artikel, riwayat baca, bookmark, serta fitur-fitur yang relevan dengan akun Anda.</li>
                  <li>Meningkatkan performa, keamanan, kualitas layanan, serta memahami penggunaan aplikasi dan website.</li>
                  <li>Menanggapi permintaan bantuan, pertanyaan, laporan masalah, atau verifikasi transaksi jika diperlukan.</li>
                  <li>Mengirimkan layanan inti yang diminta pengguna, termasuk notifikasi atau pembaruan yang berkaitan dengan akun dan layanan.</li>
                </ul>

                <h2>3. Dasar Pemrosesan Data</h2>
                <p>Kami memproses data berdasarkan kebutuhan untuk menjalankan layanan, persetujuan pengguna, kepatuhan hukum, dan kepentingan sah untuk menjaga keamanan serta kualitas platform.</p>

                <h2>4. Pembagian Data dengan Pihak Ketiga</h2>
                <p>Kami tidak menjual data pribadi pengguna. Dalam kondisi tertentu, data dapat diproses oleh penyedia layanan yang membantu operasional platform, misalnya:</p>
                <ul>
                  <li>penyedia hosting, infrastruktur server, dan database;</li>
                  <li>penyedia analitik dan pengukuran performa;</li>
                  <li>layanan autentikasi pihak ketiga seperti Google Sign-In, bila digunakan;</li>
                  <li>otoritas hukum apabila diwajibkan oleh peraturan perundang-undangan yang berlaku.</li>
                </ul>

                <h2 id="penyimpanan-dan-keamanan">5. Penyimpanan dan Keamanan Data</h2>
                <p>Kami berupaya menjaga data pengguna dengan langkah teknis dan administratif yang wajar, termasuk pembatasan akses, autentikasi, dan pengamanan server. Meskipun demikian, tidak ada metode transmisi atau penyimpanan data yang dapat dijamin sepenuhnya bebas risiko.</p>

                <h2>6. Penyimpanan Data</h2>
                <p>Kami menyimpan data selama diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, menyelesaikan sengketa, dan menegakkan kebijakan internal kami.</p>

                <h2>7. Cookie dan Teknologi Serupa</h2>
                <p>Website kami dapat menggunakan cookie atau teknologi serupa untuk menjaga sesi login, memahami perilaku penggunaan, dan meningkatkan pengalaman pengguna. Pada aplikasi Android, fungsi serupa dapat digunakan untuk menjaga sesi dan preferensi lokal.</p>

                <h2 id="hak-pengguna">8. Hak Pengguna</h2>
                <p>Sepanjang diizinkan oleh hukum yang berlaku, Anda dapat mengajukan permintaan untuk:</p>
                <ul>
                  <li>mengakses data pribadi Anda;</li>
                  <li>memperbarui atau memperbaiki data yang tidak akurat;</li>
                  <li>menghapus akun atau data tertentu;</li>
                  <li>menarik persetujuan untuk pemrosesan tertentu, sepanjang fitur tersebut bergantung pada persetujuan.</li>
                </ul>

                <h2>9. Pengguna Anak</h2>
                <p>Layanan ini tidak secara khusus ditujukan kepada anak di bawah usia yang dibatasi oleh hukum setempat tanpa persetujuan orang tua atau wali. Jika Anda meyakini ada data anak yang dikirimkan tanpa otorisasi yang semestinya, silakan hubungi kami.</p>

                <h2>10. Perubahan Kebijakan Privasi</h2>
                <p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Versi terbaru akan selalu tersedia pada halaman ini dan tanggal pembaruan akan disesuaikan di bagian atas dokumen.</p>

                <h2 id="kontak">11. Kontak</h2>
                <p>Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi kami melalui:</p>
                <ul>
                  <li>Email: {contactEmail}</li>
                  <li>Telepon/WhatsApp: {contactPhone}</li>
                  <li>Website: <Link to="/" className="font-semibold text-primary no-underline">Beranda {siteName}</Link></li>
                </ul>

                <hr />
                <p className="text-sm text-muted-foreground">
                  Dokumen ini disediakan untuk kebutuhan transparansi layanan website dan aplikasi Android {siteName}, termasuk persyaratan publikasi di Google Play.
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
