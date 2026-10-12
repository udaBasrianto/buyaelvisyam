export interface GoogleFontOption {
  id: string;
  name: string;
  description: string;
  category: "sans-serif" | "serif" | "monospace";
  fontFamily: string;
  weights: string;
  popularFor: string;
  sampleQuote: string;
}

export const GOOGLE_FONTS: GoogleFontOption[] = [
  {
    id: "inter",
    name: "Inter",
    description: "Modern Sans-Serif",
    category: "sans-serif",
    fontFamily: "'Inter', sans-serif",
    weights: "300, 400, 500, 600, 700",
    popularFor: "UI Modern, Dashboard, Aplikasi",
    sampleQuote: "Menuntut ilmu adalah kewajiban bagi setiap muslim.",
  },
  {
    id: "roboto",
    name: "Roboto",
    description: "Netral & Bersih",
    category: "sans-serif",
    fontFamily: "'Roboto', sans-serif",
    weights: "300, 400, 500, 700",
    popularFor: "Teks Berita, Pembacaan Netral, Mobile",
    sampleQuote: "Barangsiapa menempuh jalan untuk menuntut ilmu, Allah mudahkan jalannya menuju surga.",
  },
  {
    id: "poppins",
    name: "Poppins",
    description: "Geometris & Ramah",
    category: "sans-serif",
    fontFamily: "'Poppins', sans-serif",
    weights: "300, 400, 500, 600, 700, 800",
    popularFor: "Brand Buya Elvisyam, Tampilan Hangat & Ramah",
    sampleQuote: "Berilmu Sebelum Berkata dan Beramal.",
  },
  {
    id: "open-sans",
    name: "Open Sans",
    description: "Terbaca tinggi",
    category: "sans-serif",
    fontFamily: "'Open Sans', sans-serif",
    weights: "300, 400, 500, 600, 700",
    popularFor: "Keterbacaan Optimal di Berbagai Ukuran Layar",
    sampleQuote: "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya.",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    description: "Tegas & Elegan",
    category: "sans-serif",
    fontFamily: "'Montserrat', sans-serif",
    weights: "400, 500, 600, 700, 800",
    popularFor: "Judul Eksklusif, Banner, Poster Dakwah",
    sampleQuote: "Dakwah Sunnah Berlandaskan Dalil Shahih dan Pemahaman Salaf.",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    description: "Serif Elegan",
    category: "serif",
    fontFamily: "'Playfair Display', serif",
    weights: "400, 600, 700",
    popularFor: "Editorial Mewah, Tajuk Buku, Nasihat Ulama",
    sampleQuote: "Mutiara Nasihat dan Untaian Faedah Ulama Terpercaya.",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    description: "Serif untuk Teks Panjang",
    category: "serif",
    fontFamily: "'Merriweather', serif",
    weights: "300, 400, 700",
    popularFor: "Artikel Panjang, Fiqih, Studi Kitab, Koran",
    sampleQuote: "Kajian Fiqih Ibadah Tematik dan Penjelasan Dalil As-Sunnah.",
  },
  {
    id: "fira-code",
    name: "Fira Code",
    description: "Monospace / Koding",
    category: "monospace",
    fontFamily: "'Fira Code', monospace",
    weights: "400, 500, 600, 700",
    popularFor: "Tampilan Teknis, Data, Script, Monospace",
    sampleQuote: "const nasehat = 'Ikhlas dalam setiap perkataan dan perbuatan';",
  },
  {
    id: "plus-jakarta-sans",
    name: "Plus Jakarta Sans",
    description: "Modern Dinamis",
    category: "sans-serif",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    weights: "400, 500, 600, 700, 800",
    popularFor: "Desain Kontemporer Nusantara, Startup, Media",
    sampleQuote: "Portal Resmi Pembelajaran dan Arsip Kajian Buya Muhammad Elvisyam.",
  },
  {
    id: "oswald",
    name: "Oswald",
    description: "Condensed / Judul Tegas",
    category: "sans-serif",
    fontFamily: "'Oswald', sans-serif",
    weights: "400, 500, 600, 700",
    popularFor: "Headline Padat & Berbobot, Tipografi Majalah",
    sampleQuote: "JADWAL KAJIAN RUTIN DAN TABLIGH AKBAR SUMATERA BARAT 2026",
  },
];

export function findFontOption(id?: string): GoogleFontOption {
  if (!id) return GOOGLE_FONTS[2]; // Default Poppins
  return GOOGLE_FONTS.find((f) => f.id === id) || GOOGLE_FONTS[2];
}

export function applyGlobalFont(font: GoogleFontOption) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-sans", font.fontFamily);
  document.documentElement.style.setProperty("--font-heading", font.fontFamily);
  document.body.style.fontFamily = font.fontFamily;
}