import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  views: number;
  readingMinutes?: number;
}

export interface Category {
  name: string;
  slug: string;
  postCount: number;
  color: string;
}

export const heroSlides: Post[] = [
  {
    id: "1",
    slug: "keutamaan-shalat-tahajud",
    title: "Keutamaan Shalat Tahajud dan Cara Menjalankannya",
    excerpt: "Shalat tahajud memiliki banyak keutamaan yang luar biasa bagi kehidupan seorang muslim...",
    image: hero1,
    category: "Ibadah",
    tags: ["Shalat", "Tahajud"],
    author: "Ustadz Ahmad",
    date: "12 April 2026",
    views: 1250,
  },
  {
    id: "2",
    slug: "panduan-lengkap-tajwid",
    title: "Panduan Lengkap Membaca Al-Quran dengan Tajwid",
    excerpt: "Mempelajari tajwid adalah kewajiban setiap muslim agar dapat membaca Al-Quran dengan benar...",
    image: hero2,
    category: "Al-Quran",
    tags: ["Quran", "Tajwid"],
    author: "Ustadz Ahmad",
    date: "10 April 2026",
    views: 2100,
  },
  {
    id: "3",
    slug: "makna-hikmah-kaligrafi",
    title: "Makna dan Hikmah di Balik Seni Kaligrafi Islam",
    excerpt: "Seni kaligrafi Islam bukan hanya keindahan visual, namun juga mengandung makna spiritual...",
    image: hero3,
    category: "Kebudayaan",
    tags: ["Seni", "Kaligrafi"],
    author: "Ustadz Ahmad",
    date: "8 April 2026",
    views: 890,
  },
];

export const latestPosts: Post[] = [
  {
    id: "4",
    slug: "adab-shalat-berjamaah",
    title: "Adab Shalat Berjamaah di Masjid yang Perlu Diketahui",
    excerpt: "Shalat berjamaah memiliki adab-adab yang perlu diperhatikan agar ibadah kita lebih sempurna...",
    image: post1,
    category: "Ibadah",
    tags: ["Shalat", "Jamaah"],
    author: "Ustadz Ahmad",
    date: "7 April 2026",
    views: 310,
  },
  {
    id: "5",
    slug: "menyambut-ramadhan",
    title: "Menyambut Bulan Ramadhan dengan Persiapan Spiritual",
    excerpt: "Bulan Ramadhan adalah bulan penuh berkah yang harus disambut dengan persiapan lahir dan batin...",
    image: post2,
    category: "Ramadhan",
    tags: ["Ramadhan", "Puasa"],
    author: "Ustadz Ahmad",
    date: "5 April 2026",
    views: 520,
  },
  {
    id: "6",
    slug: "pentingnya-pendidikan-agama",
    title: "Pentingnya Pendidikan Agama dalam Keluarga Muslim",
    excerpt: "Keluarga adalah madrasah pertama bagi seorang anak dalam mengenal dan mencintai Islam...",
    image: post3,
    category: "Keluarga",
    tags: ["Pendidikan", "Keluarga"],
    author: "Ustadz Ahmad",
    date: "3 April 2026",
    views: 445,
  },
];

export const categories: Category[] = [
  { name: "Ibadah", slug: "ibadah", postCount: 12, color: "bg-primary/10 text-primary" },
  { name: "Al-Quran", slug: "al-quran", postCount: 8, color: "bg-secondary/20 text-secondary-foreground" },
  { name: "Akhlak", slug: "akhlak", postCount: 6, color: "bg-accent text-accent-foreground" },
  { name: "Keluarga", slug: "keluarga", postCount: 5, color: "bg-primary/10 text-primary" },
  { name: "Ramadhan", slug: "ramadhan", postCount: 9, color: "bg-secondary/20 text-secondary-foreground" },
  { name: "Kebudayaan", slug: "kebudayaan", postCount: 4, color: "bg-accent text-accent-foreground" },
];
