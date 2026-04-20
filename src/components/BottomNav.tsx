import { Home, Search, BookOpen, User, PenSquare } from "lucide-react";

const navItems = [
  { icon: Home, label: "Beranda", href: "/" },
  { icon: Search, label: "Cari", href: "/cari" },
  { icon: PenSquare, label: "Tulis", href: "/tulis" },
  { icon: BookOpen, label: "Kategori", href: "/kategori" },
  { icon: User, label: "Akun", href: "/akun" },
];

export function BottomNav() {
  const currentPath = "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = currentPath === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label === "Tulis" ? (
                <div className="islamic-gradient p-2.5 rounded-full -mt-5 shadow-lg">
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
