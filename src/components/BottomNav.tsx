import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import {
  X,
  ExternalLink,
  ChevronRight,
  Check,
  User,
  LogOut,
  LogIn,
  Sparkles,
  Grid,
  Bookmark,
  MessageCircle,
  Wallet,
  Trophy,
  Heart,
  LayoutDashboard,
  Shield,
  PenTool
} from "lucide-react";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// -------------------------------------------------------------
// PURE SVG ICONS FOR MAIN FLOATING BOTTOM BAR
// -------------------------------------------------------------
const BerandaIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    <path
      d="M3 10.5L12 3l9 7.5v9.75a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 20.25V10.5z"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 70 }}
    />
    <path
      d="M9 21v-6a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v6"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 24 }}
    />
  </svg>
);

const KategoriIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    <rect
      x="3.5"
      y="3.5"
      width="6.5"
      height="6.5"
      rx="2"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 26 }}
    />
    <rect
      x="14"
      y="3.5"
      width="6.5"
      height="6.5"
      rx="2"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 26 }}
    />
    <rect
      x="14"
      y="14"
      width="6.5"
      height="6.5"
      rx="2"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 26 }}
    />
    <rect
      x="3.5"
      y="14"
      width="6.5"
      height="6.5"
      rx="2"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 26 }}
    />
  </svg>
);

const ManasikIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    <rect
      x="4"
      y="7"
      width="16"
      height="14"
      rx="2.5"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 60 }}
    />
    <path
      d="M4 11.5h16"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 16 }}
    />
    <path
      d="M10 21v-4a2 2 0 014 0v4"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 12 }}
    />
    <path
      d="M12 2.5v2M10 4a2 2 0 014 0"
      strokeWidth="1.5"
      className={active ? "nav-line-anim" : ""}
    />
  </svg>
);

const TasbihBarIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    {/* Circular Tasbih beads ring */}
    <circle
      cx="12"
      cy="13.5"
      r="7"
      strokeDasharray="2.5 3.5"
      strokeWidth={active ? "2.4" : "2"}
      className={active ? "nav-line-anim" : ""}
    />
    {/* Top marker bead */}
    <circle
      cx="12"
      cy="5.25"
      r="1.8"
      className={active ? "nav-line-anim" : ""}
      fill={active ? "currentColor" : "none"}
      style={{ strokeDasharray: 12 }}
    />
    <path
      d="M12 2v1.5M10.5 3.5h3"
      strokeWidth="1.5"
      className={active ? "nav-line-anim" : ""}
    />
  </svg>
);

const DzikirBarIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    <path
      d="M4 19.5v-14A2.5 2.5 0 016.5 3H20v18H6.5a2.5 2.5 0 01-2.5-2.5z"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 65 }}
    />
    <path
      d="M7.5 7.5h8.5M7.5 11.5h8.5M7.5 15.5h5.5"
      className={active ? "nav-line-anim" : ""}
      style={{ strokeDasharray: 24 }}
    />
    <path
      d="M17 14l1.5-1.5M17 18l1.5 1.5"
      strokeWidth="1.4"
      className={active ? "nav-line-anim" : ""}
    />
  </svg>
);

const LainnyaIcon = (active: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? "2.2" : "1.8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-[21px] h-[21px] transition-all duration-300 ${
      active
        ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
        : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
    }`}
  >
    <circle cx="5" cy="5" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="12" cy="5" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="19" cy="5" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="5" cy="12" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="12" cy="12" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="19" cy="12" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="5" cy="19" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="12" cy="19" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
    <circle cx="19" cy="19" r="1.75" className={active ? "nav-line-anim" : ""} style={{ strokeDasharray: 12 }} />
  </svg>
);

// -------------------------------------------------------------
// PURE SVG ICONS FOR ALL APPLICATIONS & MENUS IN "LAINNYA" MODAL
// -------------------------------------------------------------
const UnduhanAppSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5v10M8.5 10l3.5 3.5 3.5-3.5" />
    <path d="M4 17.5v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
  </svg>
);

const FAQAppSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.75" fill="currentColor" />
  </svg>
);

const TasbihSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="7.5" strokeDasharray="3 3.5" strokeWidth="2.2" />
    <circle cx="12" cy="5.5" r="1.75" fill="currentColor" />
    <path d="M12 2v2M12 7.25v2.25M10.5 3.5l3 0" />
  </svg>
);

const DzikirSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-2.5-2.5z" />
    <path d="M6 6h10M6 10h8M6 14h5" />
    <circle cx="17.5" cy="14.5" r="1.5" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

const SholatUdaraSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3 2" />
    <path d="M5 12h1.5M17.5 12H19M12 5V3.5" strokeWidth="1.4" />
  </svg>
);

const TokoSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const SurauTvSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2.5" />
    <polygon points="10 11 15 14 10 17 10 11" fill="currentColor" fillOpacity="0.25" />
    <path d="M16 3l-4 4-4-4" />
  </svg>
);

const DeikidsTvSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="15" rx="3" />
    <circle cx="8" cy="12" r="1" fill="currentColor" />
    <circle cx="16" cy="12" r="1" fill="currentColor" />
    <path d="M9.5 15.5c1.5 1 3.5 1 5 0" />
    <path d="M12 2v4" />
  </svg>
);

const TranscriptSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const SekolahSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const DonasiSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ArsipSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="5" rx="1" />
    <path d="M4 9v10a2 2 0 002 2h12a2 2 0 002-2V9" />
    <path d="M10 13h4" />
  </svg>
);

// Account tabs for Reader Dashboard
const accountTabs = [
  {
    id: "overview",
    label: "Overview",
    description: "Profil, aktivitas & lanjutkan bacaan",
    icon: LayoutDashboard,
    badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "bookmarks",
    label: "Koleksi",
    description: "Artikel dan kajian tersimpan",
    icon: Bookmark,
    badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "komentar",
    label: "Komentar",
    description: "Diskusi & riwayat komentar Anda",
    icon: MessageCircle,
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "wallet",
    label: "Dompet",
    description: "Saldo akun & mutasi transaksi",
    icon: Wallet,
    badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "leaderboard",
    label: "Peringkat",
    description: "Leaderboard pembaca aktif",
    icon: Trophy,
    badgeColor: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  {
    id: "donasi",
    label: "Donasi",
    description: "Riwayat donasi dan infaq Anda",
    icon: Heart,
    badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
];

export function BottomNav({ activeTab = "overview", onTabChange }: BottomNavProps = {}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"apps" | "account">("apps");
  const [dbNavItems, setDbNavItems] = useState<any[]>([]);

  const isReaderDashboard = pathname === "/dashboard";

  // Fetch dynamic navigation items from database so newly added apps sync automatically
  useEffect(() => {
    api.get("/navigation")
      .then(({ data }) => {
        const items = asArray<any>(data);
        if (items.length > 0) setDbNavItems(items);
      })
      .catch(() => {});
  }, []);

  const isItemActive = (href?: string): boolean => {
    if (!href || typeof href !== "string") {
      return false;
    }
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/categories") {
      return pathname === "/categories" || pathname.startsWith("/kategori/");
    }
    if (href === "/haji-umroh") {
      return pathname === "/haji-umroh" || pathname === "/manasik";
    }
    if (href === "/tasbih") {
      return pathname === "/tasbih";
    }
    if (href === "/dzikir") {
      return pathname === "/dzikir";
    }
    if (href === "/unduhan") {
      return pathname === "/unduhan";
    }
    if (href === "/faq") {
      return pathname === "/faq" || pathname === "/bantuan";
    }
    if (href === "/jadwal-sholat") {
      return pathname === "/jadwal-sholat" || pathname === "/jadwal";
    }
    if (href === "/produk") {
      return pathname === "/produk" || pathname.startsWith("/produk/") || pathname === "/cart" || pathname === "/checkout";
    }
    if (href === "/search") {
      return pathname === "/search";
    }
    if (href === "/arsip") {
      return pathname === "/arsip";
    }
    if (href.startsWith("/dashboard") || href.startsWith("/admin") || href === "/auth") {
      return (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname === "/auth" ||
        pathname === "/profile"
      );
    }
    return pathname === href;
  };

  // Check if any item grouped in "Lainnya" is currently active
  const isLainnyaActive =
    sheetOpen ||
    pathname === "/unduhan" ||
    pathname === "/faq" ||
    pathname === "/bantuan" ||
    pathname === "/jadwal-sholat" ||
    pathname === "/jadwal" ||
    pathname === "/produk" ||
    pathname.startsWith("/produk/") ||
    pathname === "/donasi" ||
    pathname === "/arsip" ||
    pathname === "/profile" ||
    pathname.startsWith("/dashboard");

  // All applications & features inside "Lainnya" grouping menu
  // (Download & FAQ are now grouped here, along with other apps)
  const allApps = [
    {
      id: "unduhan",
      label: "Unduhan Berkas",
      description: "E-book, panduan materi & kajian Buya",
      href: "/unduhan",
      badge: "Materi",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      icon: UnduhanAppSvg,
    },
    {
      id: "faq",
      label: "Tanya Jawab (FAQ)",
      description: "Jawaban masalah syar'i & seputar dakwah",
      href: "/faq",
      badge: "Bantuan",
      badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      icon: FAQAppSvg,
    },
    {
      id: "jadwal-sholat",
      label: "Sholat & Udara",
      description: "Waktu azan akurat & indeks ISPU",
      href: "/jadwal-sholat",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      icon: SholatUdaraSvg,
    },
    {
      id: "toko",
      label: "Toko & Buku",
      description: "Karya Buya, kurma & merchandise",
      href: "/produk",
      iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      icon: TokoSvg,
    },
    {
      id: "surautv",
      label: "Surau TV",
      description: "Live streaming siaran dakwah 24 jam",
      href: "https://www.surautv.id/",
      isExternal: true,
      badge: "Live",
      badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      iconBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: SurauTvSvg,
    },
    {
      id: "deikids",
      label: "Deikids TV",
      description: "Kartun & video edukasi islami anak",
      href: "https://deikids.tv/",
      isExternal: true,
      iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      icon: DeikidsTvSvg,
    },
    {
      id: "transcript",
      label: "Arabic Transcript",
      description: "AI transkripsi audio ceramah Arab & Indo",
      href: "https://arabic-transcript.lovable.app/",
      isExternal: true,
      badge: "AI",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: TranscriptSvg,
    },
    {
      id: "sekolah",
      label: "Sekolah Dar El-Iman",
      description: "Pendidikan Sunnah TK, SD, SMP, SMA",
      href: "https://dareliman.sch.id/",
      isExternal: true,
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      icon: SekolahSvg,
    },
    {
      id: "donasi",
      label: "Donasi & Infaq",
      description: "Salurkan bantuan dakwah & operasional",
      href: "/donasi",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      icon: DonasiSvg,
    },
    {
      id: "arsip",
      label: "Arsip Kajian",
      description: "Kumpulan artikel dan audio kajian",
      href: "/arsip",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      icon: ArsipSvg,
    },
  ];

  // Merge any dynamic external child items from the "Applikasi" parent menu in backend
  const appParent = dbNavItems.find(
    (i) => i.is_active && (i.label?.toLowerCase() === "applikasi" || i.label?.toLowerCase() === "aplikasi")
  );
  const extraDbApps = appParent
    ? dbNavItems
        .filter((i) => i.is_active && i.parent_id === appParent.id && (i.url || i.href))
        .filter((i) => !allApps.some((a) => (a.href && (a.href === i.url || a.href === i.href)) || (a.label && i.label && a.label.toLowerCase() === i.label.toLowerCase())))
    : [];

  // Main Nav Items in Bottom Bar:
  // Beranda, Kategori, Manasik, Tasbih Digital, Dzikir, Lainnya
  const standardNavItems = [
    {
      id: "beranda",
      label: "Beranda",
      href: "/",
      type: "link" as const,
      icon: BerandaIcon,
    },
    {
      id: "kategori",
      label: "Kategori",
      href: "/categories",
      type: "link" as const,
      icon: KategoriIcon,
    },
    {
      id: "manasik",
      label: "Manasik",
      href: "/haji-umroh",
      type: "link" as const,
      icon: ManasikIcon,
    },
    {
      id: "tasbih",
      label: "Tasbih",
      href: "/tasbih",
      type: "link" as const,
      icon: TasbihBarIcon,
    },
    {
      id: "dzikir",
      label: "Dzikir",
      href: "/dzikir",
      type: "link" as const,
      icon: DzikirBarIcon,
    },
    {
      id: "lainnya",
      label: "Lainnya",
      type: "button" as const,
      active: isLainnyaActive,
      onClick: () => {
        setSheetTab("apps");
        setSheetOpen(true);
      },
      icon: LainnyaIcon,
    },
  ];

  const handleSelectAccountTab = (tabId: string) => {
    setSheetOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      navigate(`/dashboard?tab=${tabId}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes navStrokeDraw {
          0% {
            stroke-dashoffset: 60;
            opacity: 0.4;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        .nav-line-anim {
          animation: navStrokeDraw 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes navGlow {
          0%, 100% {
            filter: drop-shadow(0 0 1px hsl(var(--primary) / 0.35));
          }
          50% {
            filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.65));
          }
        }
        .nav-active-glow {
          animation: navGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* ========================================================= */}
      {/* iOS-STYLE BOTTOM SHEET: GRUPING MENU LAINNYA & APLIKASI   */}
      {/* ========================================================= */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet Modal Container */}
          <div
            className="fixed inset-x-0 bottom-0 bg-background/98 dark:bg-card/98 backdrop-blur-2xl border-t border-border/70 rounded-t-[32px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-hidden"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 18px)",
            }}
          >
            {/* Top Drag Handle */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-2" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Grid className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground tracking-tight leading-tight">
                    {sheetTab === "apps" ? "Semua Aplikasi & Menu Lainnya" : "Menu Akun Saya"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium leading-tight">
                    {sheetTab === "apps" ? "Unduhan, FAQ, aplikasi islami & navigasi" : "Kelola profil dan bacaan"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Switcher for Reader Dashboard users */}
            {isReaderDashboard && (
              <div className="flex px-5 pt-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSheetTab("apps")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sheetTab === "apps"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  Semua Aplikasi & Menu
                </button>
                <button
                  type="button"
                  onClick={() => setSheetTab("account")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sheetTab === "account"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  Tab Akun Saya
                </button>
              </div>
            )}

            {/* User Account Quick Banner */}
            <div className="px-5 pt-3 pb-1">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {user ? (
                      user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {user ? user.username || user.email : "Tamu (Belum Masuk)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                      {user ? (
                        role === "admin" || role === "superadmin" ? "Superadmin" : role === "kontributor" ? "Kontributor" : "Pembaca"
                      ) : (
                        "Masuk untuk simpan riwayat & bookmark"
                      )}
                    </p>
                  </div>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      navigate(role === "admin" || role === "superadmin" ? "/admin" : "/dashboard");
                    }}
                    className="shrink-0 text-[11px] font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    Profil
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      navigate("/auth");
                    }}
                    className="shrink-0 text-[11px] font-bold text-primary-foreground px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                  >
                    Masuk
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto max-h-[58vh] space-y-4 overscroll-contain">
              {sheetTab === "account" && isReaderDashboard ? (
                /* Reader Dashboard Tabs */
                <div className="grid grid-cols-2 gap-2.5">
                  {accountTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleSelectAccountTab(tab.id)}
                        className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 relative group active:scale-[0.98] ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/60 bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${tab.badgeColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {isSelected && (
                            <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-bold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {tab.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium mt-0.5 line-clamp-1">
                          {tab.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* All Grouped Applications & Menus (Including Download & FAQ) */
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {allApps.map((app) => {
                      const IconComponent = app.icon;
                      const appHref = app.href || "/";
                      const isActive = isItemActive(appHref);

                      if (app.isExternal) {
                        return (
                          <a
                            key={app.id}
                            href={appHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setSheetOpen(false)}
                            className="flex flex-col text-left p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 active:scale-[0.98] transition-all relative group"
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${app.iconBg}`}>
                                <IconComponent />
                              </div>
                              <div className="flex items-center gap-1">
                                {app.badge && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${app.badgeColor}`}>
                                    {app.badge}
                                  </span>
                                )}
                                <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                              </div>
                            </div>
                            <span className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                              {app.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5 line-clamp-1">
                              {app.description}
                            </span>
                          </a>
                        );
                      }

                      return (
                        <Link
                          key={app.id}
                          to={appHref}
                          onClick={() => setSheetOpen(false)}
                          className={`flex flex-col text-left p-3 rounded-2xl border transition-all active:scale-[0.98] relative group ${
                            isActive
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/60 bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${app.iconBg}`}>
                              <IconComponent />
                            </div>
                            {app.badge && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${app.badgeColor}`}>
                                {app.badge}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold leading-tight group-hover:text-primary transition-colors ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}>
                            {app.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium mt-0.5 line-clamp-1">
                            {app.description}
                          </span>
                        </Link>
                      );
                    })}

                    {/* Any extra dynamic apps added by admin in backend */}
                    {extraDbApps.map((extra) => (
                      <a
                        key={extra.id}
                        href={extra.url || extra.href || "#"}
                        target={extra.is_external ? "_blank" : undefined}
                        rel={extra.is_external ? "noopener noreferrer" : undefined}
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col text-left p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          {extra.is_external && <ExternalLink className="h-3 w-3 text-muted-foreground/60" />}
                        </div>
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {extra.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium mt-0.5 line-clamp-1">
                          Layanan Resmi
                        </span>
                      </a>
                    ))}
                  </div>

                  {/* Menu Navigasi Lengkap (Header shortcuts) */}
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Pintasan Halaman
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        to="/"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Beranda</span>
                      </Link>
                      <Link
                        to="/categories"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Kategori</span>
                      </Link>
                      <Link
                        to="/haji-umroh"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Manasik</span>
                      </Link>
                      <Link
                        to="/tasbih"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Tasbih</span>
                      </Link>
                      <Link
                        to="/dzikir"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Dzikir</span>
                      </Link>
                      <Link
                        to="/search"
                        onClick={() => setSheetOpen(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 text-center"
                      >
                        <span className="text-xs font-bold text-foreground">Cari</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="px-5 pt-3 pb-2 border-t border-border/50 flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      navigate("/profile");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-muted/60 text-foreground text-xs font-bold border border-border/50 hover:bg-muted active:scale-95 transition-all"
                  >
                    <User className="h-3.5 w-3.5 text-primary" /> Edit Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      signOut();
                    }}
                    className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20 hover:bg-destructive/20 active:scale-95 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Keluar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    navigate("/auth");
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                  <LogIn className="h-4 w-4" /> Masuk / Daftar Akun
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING iOS BOTTOM BAR WRAPPER                           */}
      {/* ========================================================= */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-3.5 left-3 left-3.5 right-3.5 sm:left-6 sm:right-6 max-w-md mx-auto z-50 md:hidden pointer-events-none"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          className="pointer-events-auto relative flex items-center justify-between sm:justify-around h-[56px] px-2 rounded-full
            bg-background/95 dark:bg-card/95 backdrop-blur-2xl
            border border-border/70 dark:border-white/10
            shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]
            dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.4)]
            transition-all duration-300"
        >
          {standardNavItems.map((item) => {
            const active = item.type === "button" ? Boolean(item.active) : isItemActive(item.href);

            if (item.type === "button") {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  title={item.label}
                  aria-label={item.label}
                  className="group relative flex-1 min-w-0 flex flex-col items-center justify-center h-full select-none active:scale-90 transition-transform"
                >
                  {/* Pure Animated SVG Line Icon */}
                  <div className="flex items-center justify-center h-8 w-8">
                    {item.icon(active)}
                  </div>

                  {/* Subtle iOS Active Dot Indicator */}
                  <span
                    className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary transition-all duration-300 ${
                      active
                        ? "opacity-100 scale-100 shadow-[0_0_8px_hsl(var(--primary))]"
                        : "opacity-0 scale-0"
                    }`}
                  />
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.href || "/"}
                title={item.label}
                aria-label={item.label}
                className="group relative flex-1 min-w-0 flex flex-col items-center justify-center h-full select-none active:scale-90 transition-transform"
              >
                {/* Pure Animated SVG Line Icon */}
                <div className="flex items-center justify-center h-8 w-8">
                  {item.icon(active)}
                </div>

                {/* Subtle iOS Active Dot Indicator */}
                <span
                  className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary transition-all duration-300 ${
                    active
                      ? "opacity-100 scale-100 shadow-[0_0_8px_hsl(var(--primary))]"
                      : "opacity-0 scale-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
