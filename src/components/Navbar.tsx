import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, ShieldCheck, Edit, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNavPages } from "@/hooks/useNavPages";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { NewsTicker } from "@/components/NewsTicker";
import { AnimatedLogoText } from "@/components/AnimatedLogoText";
import api from "@/lib/api";

const baseNavItems = [
  { label: "Beranda", href: "/" },
  { label: "Akademi (LMS)", href: "/lms" },
  { label: "Tentang Kami", href: "/tentang" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categories, setCategories] = useState<any[]>([]);
  const [dbNavItems, setDbNavItems] = useState<any[]>([]);
  const [navPages, setNavPages] = useState<any[]>([]);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data)).catch(() => {});
    api.get("/navigation").then(({ data }) => {
      if (data && data.length > 0) setDbNavItems(data);
    }).catch(() => {});
    
    // Fetch dynamic pages marked for nav
    api.get("/pages?show_in_nav=true&status=published").then(({ data }) => {
      if (data) setNavPages(data);
    }).catch(() => {});
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Combine database nav items and dynamic pages
  const rawNavItems = [
    ...(dbNavItems.length > 0 
      ? dbNavItems.filter(i => i.is_active).map(i => ({ id: i.id, label: i.label, href: i.url, isExternal: i.is_external, parent_id: i.parent_id }))
      : baseNavItems.map(i => ({ ...i, id: i.label, isExternal: false, parent_id: null }))),
    ...navPages.map(p => ({ id: p.id, label: p.title, href: `/p/${p.slug}`, isExternal: false, parent_id: null }))
  ];

  // Nest children under parents
  const navItems = rawNavItems.filter(item => !item.parent_id).map(parent => ({
    ...parent,
    children: rawNavItems.filter(child => child.parent_id === parent.id)
  }));

  return (
    <>
      {/* News Ticker — replaces old static banner */}
      <NewsTicker />

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Dynamic Logo + Site Name */}
          <a href="/" className="flex items-center gap-2.5 group">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="h-9 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 animate-float"
              />
            ) : (
              <div className="h-9 w-9 rounded-lg islamic-gradient flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105 animate-float">
                <span className="text-lg text-primary-foreground font-bold">
                  {settings.site_name?.charAt(0)?.toUpperCase() || "B"}
                </span>
              </div>
            )}
            <AnimatedLogoText
              texts={[settings.site_name, settings.tagline].filter(Boolean).length > 0 ? [settings.site_name, settings.tagline].filter(Boolean) as string[] : ["BlogUstad", "Memuat..."]}
              className="text-lg leading-tight"
              speed={100}
              deleteSpeed={50}
              delay={4000}
            />
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              
              if (item.label.toLowerCase() === "kategori" || hasChildren) {
                return (
                  <div key={item.id} className="relative group">
                    <button className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2">
                      {item.label} <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className={`bg-card rounded-2xl shadow-xl border border-border/50 p-4 ring-1 ring-black/5 ${
                        item.label.toLowerCase() === "kategori" && categories.length > 8 ? "w-[450px] grid grid-cols-2 gap-2" : "w-56 flex flex-col gap-1"
                      }`}>
                         {item.label.toLowerCase() === "kategori" ? (
                           categories.length > 0 ? categories.filter(cat => (cat.article_count || 0) > 0).map((cat) => (
                             <a key={cat.id} href={`/kategori/${cat.slug}`} className="px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
                               <div className="h-1.5 w-1.5 rounded-full bg-primary/30 group-hover/item:bg-primary transition-colors" />
                               <span className="font-medium truncate">{cat.name}</span>
                             </a>
                           )) : <div className="px-3 py-2 text-sm text-muted-foreground italic text-center">Memuat...</div>
                         ) : (
                           item.children.map((child: any) => (
                             <a key={child.id} href={child.href} className="px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 group/item">
                               <div className="h-1 w-3 rounded-full bg-primary/20 group-hover/item:bg-primary transition-all" />
                               <span className="font-medium truncate">{child.label}</span>
                             </a>
                           ))
                         )}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <a 
                  key={item.href} 
                  href={item.href} 
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Date and Time Display */}
            <div className="hidden md:flex items-center px-3 py-1.5 bg-muted/50 rounded-md text-sm font-medium text-foreground/80">
              <span>
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })} • {currentTime.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </span>
            </div>

            {/* Role-based shortcuts */}
            {user && (
              <div className="flex items-center gap-1">
                {role === "admin" && (
                  <Button variant="ghost" size="icon" className="hidden md:flex text-foreground/70 hover:text-primary" onClick={() => navigate("/admin")} title="Admin Panel">
                    <ShieldCheck className="h-5 w-5" />
                  </Button>
                )}
                {role === "kontributor" && (
                  <Button variant="ghost" size="icon" className="hidden md:flex text-foreground/70 hover:text-primary" onClick={() => navigate("/kontributor")} title="Dashboard Kontributor">
                    <Edit className="h-5 w-5" />
                  </Button>
                )}
                {role === "pembaca" && (
                  <Button variant="ghost" size="icon" className="hidden md:flex text-foreground/70 hover:text-primary" onClick={() => navigate("/dashboard")} title="Dashboard Saya">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                )}
                
                <Button variant="ghost" size="icon" className="hidden md:flex text-foreground/70 hover:text-primary" onClick={() => navigate("/profile")} title="Pengaturan Profil">
                  <User className="h-5 w-5" />
                </Button>
              </div>
            )}

            {user ? (
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-destructive" onClick={() => signOut()} title="Keluar">
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="hidden md:flex text-foreground/70 hover:text-primary" onClick={() => navigate("/auth")} title="Masuk">
                <LogIn className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden text-foreground/70" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              if (item.label.toLowerCase() === "kategori") {
                return (
                  <div key="mobile-kategori">
                    <button 
                      onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)} 
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground/80 hover:text-primary py-2"
                    >
                      {item.label} <ChevronDown className={`h-4 w-4 transition-transform ${isMobileCategoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isMobileCategoryOpen && (
                      <div className="pl-4 space-y-2 border-l-2 border-primary/20 ml-2 my-1">
                        {categories.filter(cat => (cat.article_count || 0) > 0).map((cat) => (
                          <a key={cat.id} href={`/kategori/${cat.slug}`} className="block text-sm text-muted-foreground hover:text-primary py-1.5">
                            {cat.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <a key={item.href} href={item.href} className="block text-sm font-medium text-foreground/80 hover:text-primary py-2">
                  {item.label}
                </a>
              );
            })}

            {/* Mobile role shortcuts */}
            {user && role === "admin" && (
              <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm font-medium text-primary py-2">
                <Shield className="h-4 w-4" /> Admin Panel
              </button>
            )}
            {user && role === "kontributor" && (
              <button onClick={() => navigate("/kontributor")} className="flex items-center gap-2 text-sm font-medium text-primary py-2">
                <PenTool className="h-4 w-4" /> Dashboard
              </button>
            )}
            {user && role === "pembaca" && (
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm font-medium text-primary py-2">
                <User className="h-4 w-4" /> Profil Saya
              </button>
            )}

            {/* Mobile Date and Time Display */}
            <div className="py-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                <div className="font-medium">
                  {currentTime.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
                <div className="text-lg font-mono font-bold text-foreground">
                  {currentTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </div>
              </div>
            </div>

            {user ? (
              <button onClick={() => signOut()} className="block text-sm font-medium text-destructive py-2">Keluar</button>
            ) : (
              <a href="/auth" className="block text-sm font-medium text-primary py-2">Masuk / Daftar</a>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
