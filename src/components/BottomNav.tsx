import { Link, useLocation } from "react-router-dom";
import { Home, Search, BookOpen, User, PenSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Beranda", href: "/" },
    { icon: Search, label: "Cari", href: "/search" },
    { icon: PenSquare, label: "Tulis", href: "/kontributor" },
    { icon: BookOpen, label: "Kategori", href: "/categories" },
    { icon: User, label: "Akun", href: user ? "/dashboard" : "/auth" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label === "Tulis" ? (
                <div className="islamic-gradient p-2.5 rounded-full -mt-5 shadow-lg border-4 border-background">
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-primary/10" : ""}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              )}
              <span className={`text-[10px] font-bold ${active ? "text-primary" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
