import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user, role } = useAuth();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/categories") {
      return pathname === "/categories" || pathname.startsWith("/kategori/");
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

  const accountHref = user
    ? role === "admin" || role === "superadmin"
      ? "/admin"
      : "/dashboard"
    : "/auth";

  const accountLabel = user
    ? role === "admin" || role === "superadmin"
      ? "Admin"
      : "Akun"
    : "Akun";

  const navItems = [
    {
      id: "beranda",
      label: "Beranda",
      href: "/",
      icon: (active: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-[22px] h-[22px] transition-all duration-300 ${
            active
              ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
              : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
          }`}
        >
          {/* Roof line */}
          <path
            d="M3 10.5L12 3l9 7.5"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 32 }}
          />
          {/* Walls line */}
          <path
            d="M5 9.5V20a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V9.5"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 45 }}
          />
          {/* Arched entrance line */}
          <path
            d="M10 21v-4.5a2 2 0 014 0V21"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 20 }}
          />
        </svg>
      ),
    },
    {
      id: "kategori",
      label: "Kategori",
      href: "/categories",
      icon: (active: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-[22px] h-[22px] transition-all duration-300 ${
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
      ),
    },
    {
      id: "cari",
      label: "Cari",
      href: "/search",
      icon: (active: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-[22px] h-[22px] transition-all duration-300 ${
            active
              ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
              : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
          }`}
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 45 }}
          />
          <path
            d="M21 21l-4.5-4.5"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 14 }}
          />
          <path
            d="M8.5 8.5a3 3 0 013-1"
            strokeWidth="1.4"
            className={`transition-opacity duration-300 ${
              active ? "opacity-90" : "opacity-0 group-hover:opacity-60"
            }`}
          />
        </svg>
      ),
    },
    {
      id: "arsip",
      label: "Arsip",
      href: "/arsip",
      icon: (active: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-[22px] h-[22px] transition-all duration-300 ${
            active
              ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
              : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
          }`}
        >
          <path
            d="M4 19.5A2.5 2.5 0 016.5 17H20"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 25 }}
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 60 }}
          />
          <path
            d="M8.5 7h7"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 12 }}
          />
          <path
            d="M8.5 11h5"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 10 }}
          />
        </svg>
      ),
    },
    {
      id: "akun",
      label: accountLabel,
      href: accountHref,
      icon: (active: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-[22px] h-[22px] transition-all duration-300 ${
            active
              ? "stroke-primary -translate-y-0.5 scale-110 nav-active-glow"
              : "stroke-muted-foreground/80 group-hover:stroke-foreground group-hover:scale-105"
          }`}
        >
          <circle
            cx="12"
            cy="8"
            r="4.25"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 28 }}
          />
          <path
            d="M5 20.5a7 7 0 0114 0"
            className={active ? "nav-line-anim" : ""}
            style={{ strokeDasharray: 30 }}
          />
        </svg>
      ),
    },
  ];

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
          animation: navStrokeDraw 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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

      {/* Floating iOS Bottom Bar Wrapper */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-3.5 left-3.5 right-3.5 sm:left-6 sm:right-6 max-w-md mx-auto z-50 md:hidden pointer-events-none"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          className="pointer-events-auto relative flex items-center justify-around h-[62px] px-2 rounded-full
            bg-background/90 dark:bg-card/90 backdrop-blur-2xl
            border border-border/70 dark:border-white/10
            shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]
            dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)]
            transition-all duration-300"
        >
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.id}
                to={item.href}
                className="group relative flex-1 flex flex-col items-center justify-center h-full min-w-0 py-1 select-none active:scale-95 transition-transform"
              >
                {/* Pure Animated SVG Line Icon (No Background) */}
                <div className="flex items-center justify-center h-7 w-7">
                  {item.icon(active)}
                </div>

                {/* Menu Label */}
                <span
                  className={`text-[10px] leading-tight tracking-tight transition-all duration-300 mt-0.5 truncate max-w-[64px] ${
                    active
                      ? "text-primary scale-105 font-bold"
                      : "text-muted-foreground/75 group-hover:text-foreground font-medium"
                  }`}
                >
                  {item.label}
                </span>

                {/* Subtle iOS Active Dot Indicator */}
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full bg-primary transition-all duration-300 ${
                    active
                      ? "opacity-100 scale-100 shadow-[0_0_6px_hsl(var(--primary))]"
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
