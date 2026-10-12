import { useState, useEffect } from "react";
import { Menu, X, LogIn, LogOut, ShieldCheck, Edit, LayoutDashboard, User, ChevronDown, ChevronRight, ArrowRight, Shield, PenTool, ShoppingCart, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useNavPages } from "@/hooks/useNavPages";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { NewsTicker } from "@/components/NewsTicker";
import api from "@/lib/api";
import { asArray } from "@/lib/api-response";
import * as LucideIcons from "lucide-react";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  if (!name) return null;
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const IconComponent = (LucideIcons as any)[formattedName];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

const getFallbackIconName = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes("beranda") || l.includes("home")) return "Home";
  if (l.includes("produk") || l.includes("shop") || l.includes("toko")) return "ShoppingBag";
  if (l.includes("akademi") || l.includes("lms") || l.includes("course") || l.includes("belajar")) return "GraduationCap";
  if (l.includes("donasi") || l.includes("sedekah") || l.includes("donation")) return "HandHeart";
  if (l.includes("tentang") || l.includes("about")) return "Info";
  if (l.includes("kontak") || l.includes("contact")) return "Phone";
  if (l.includes("kategori")) return "LayoutGrid";
  if (l.includes("unduhan") || l.includes("download")) return "Download";
  if (l.includes("faq") || l.includes("bantuan") || l.includes("help")) return "HelpCircle";
  return "";
};

// External menu links open in a new tab; URLs saved without a protocol get https:// prefixed
const getExternalLinkProps = (href: string, isExternal?: boolean) => {
  if (!isExternal) return { href };
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) || href.startsWith("//");
  return {
    href: hasScheme ? href : `https://${href}`,
    target: "_blank" as const,
    rel: "noopener noreferrer",
  };
};

// Menu items dari database - fallback default menu jika belum ada konfigurasi yang tersimpan
const baseNavItems = [
  { id: "produk", label: "__PRODUCTS__", href: "/produk", isExternal: false, parent_id: null },
  { id: "unduhan", label: "Unduhan", href: "/unduhan", isExternal: false, parent_id: null },
  { id: "faq", label: "FAQ", href: "/faq", isExternal: false, parent_id: null },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileParent, setOpenMobileParent] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categories, setCategories] = useState<any[]>([]);
  const [dbNavItems, setDbNavItems] = useState<any[]>([]);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { totalCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 4) {
      setSearchSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const { data } = await api.get(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchSuggestions(asArray<any>(data).slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(asArray<any>(data))).catch(() => {});
    api.get("/navigation").then(({ data }) => {
      const items = asArray<any>(data);
      if (items.length > 0) setDbNavItems(items);
    }).catch(() => {});
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Navigation Manager is the single source of truth for menu items
  const lmsLabel = (settings as any).lms_menu_label || "Akademi";
  const productsLabel = (settings as any).products_menu_label || "Produk";
  const rawNavItems = dbNavItems.length > 0 
    ? dbNavItems.filter(i => i.is_active).map(i => ({ id: i.id, label: i.label === "Produk" ? productsLabel : i.label, href: i.url, isExternal: i.is_external, parent_id: i.parent_id, icon: i.icon }))
    : baseNavItems.map(i => ({ ...i, id: i.id, label: i.label === "__PRODUCTS__" ? productsLabel : i.label === "__LMS__" ? lmsLabel : i.label, isExternal: false, parent_id: null, icon: "" }));

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
            {settingsLoading ? (
              /* Skeleton while settings load — prevents letter→logo flash */
              <div className="h-9 w-9 rounded-lg bg-primary/10 animate-pulse" />
            ) : settings.logo_url && !logoLoadError ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                onError={() => setLogoLoadError(true)}
                className="h-9 w-auto max-w-[120px] object-contain rounded-lg"
              />
            ) : (
              <div className="h-9 w-9 rounded-lg islamic-gradient flex items-center justify-center shadow-sm">
                <span className="text-lg text-primary-foreground font-bold">
                  {settings.site_name?.charAt(0)?.toUpperCase() || "B"}
                </span>
              </div>
            )}
            <span className="text-lg font-black tracking-tight text-primary uppercase leading-tight">
              {settings.site_name || "Buyaelvisyam.id"}
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const iconName = item.icon || getFallbackIconName(item.label);
              
              if (item.label.toLowerCase() === "kategori" || hasChildren) {
                return (
                  <div key={item.id} className="relative group">
                    <button className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-full px-3 py-2 hover:bg-primary/5 group/btn">
                      {iconName && <DynamicIcon name={iconName} className="h-4 w-4 shrink-0 opacity-75 group-hover/btn:text-primary transition-colors" />}
                      <span>{item.label}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 group-hover:rotate-180 group-hover:text-primary" />
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                      {/* caret */}
                      <div className="absolute left-1/2 top-[7px] -translate-x-1/2 h-2.5 w-2.5 rotate-45 bg-card border-l border-t border-border/60" />
                      <div className="relative w-max min-w-[340px] max-w-[92vw] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/10 ring-1 ring-black/5 overflow-hidden">
                        {/* Dropdown header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                          <div className="h-9 w-9 rounded-xl islamic-gradient flex items-center justify-center shadow-sm shrink-0">
                            {iconName ? <DynamicIcon name={iconName} className="h-4 w-4 text-primary-foreground" /> : <LayoutGrid className="h-4 w-4 text-primary-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              {item.label.toLowerCase() === "kategori" ? "Telusuri kajian berdasarkan topik" : "Jelajahi menu pilihan"}
                            </p>
                          </div>
                        </div>

                        {/* Dropdown body */}
                        {item.label.toLowerCase() === "kategori" ? (
                          categories.length > 0 ? (
                            <div className={`p-2 pr-1.5 grid ${categories.length > 8 ? "grid-cols-2 w-[600px]" : "grid-cols-1"} max-h-[55vh] overflow-y-auto overscroll-contain`}>
                              {categories.filter(cat => (cat.article_count || 0) > 0).map((cat) => (
                                <a key={cat.id} href={`/kategori/${cat.slug}`} className="group/item flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary/10 transition-all">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-foreground/90 leading-snug group-hover/item:text-primary transition-colors">{cat.name}</p>
                                    <p className="text-[9px] text-muted-foreground">{cat.article_count || 0} artikel</p>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-6 text-sm text-muted-foreground italic text-center">Memuat kategori...</div>
                          )
                        ) : (
                          <div className="p-2 flex flex-col gap-0.5">
                            {item.children.map((child: any) => {
                              const childIconName = child.icon || getFallbackIconName(child.label);
                              return (
                                <a key={child.id} {...getExternalLinkProps(child.href, child.isExternal)} className="group/item flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary/10 transition-all">
                                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover/item:bg-primary/10 transition-colors">
                                    {childIconName ? (
                                      <DynamicIcon name={childIconName} className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                    ) : (
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover/item:bg-primary transition-colors" />
                                    )}
                                  </div>
                                  <span className="text-[13px] font-semibold text-foreground/90 leading-snug group-hover/item:text-primary transition-colors">{child.label}</span>
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Dropdown footer */}
                        {item.label.toLowerCase() === "kategori" && (
                          <a href="/categories" className="flex items-center justify-center gap-1.5 border-t border-border/40 px-4 py-2.5 text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors">
                            Lihat Semua Kategori
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <a 
                  key={item.href} 
                  {...getExternalLinkProps(item.href, item.isExternal)}
                  className="flex items-center gap-1.5 px-3 text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full group/link"
                >
                  {iconName && <DynamicIcon name={iconName} className="h-4 w-4 shrink-0 opacity-75 group-hover/link:text-primary transition-colors" />}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Search Input toggle */}
            <div className="relative flex items-center">
              {searchOpen && (
                <>
                  <input
                    type="text"
                    placeholder="Cari artikel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchSuggestions([]);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchSuggestions([]);
                      }, 250);
                    }}
                    className="w-32 sm:w-44 md:w-56 h-9 px-3 mr-1 text-xs rounded-full border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300 animate-in slide-in-from-right-3"
                    autoFocus
                  />
                  
                  {/* Suggestions Dropdown */}
                  {searchQuery.trim().length >= 4 && (
                    <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 md:w-96 bg-card border border-border/60 rounded-2xl shadow-2xl p-3 z-[60] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 pb-1 border-b border-border/40 flex items-center justify-between">
                        <span>Rekomendasi Artikel</span>
                        {suggestionsLoading && <span className="animate-pulse text-primary lowercase font-medium">mencari...</span>}
                      </div>
                      
                      {suggestionsLoading && searchSuggestions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground italic">
                          Mencari kajian...
                        </div>
                      ) : searchSuggestions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground italic">
                          Tidak ada hasil yang cocok
                        </div>
                      ) : (
                        <div className="max-h-[250px] overflow-y-auto space-y-1 pr-1">
                          {searchSuggestions.map((item) => (
                            <a
                              key={item.id}
                              href={`/${item.slug || item.id}`}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/10 transition-all group/item text-left"
                            >
                              <div className="h-9 w-9 rounded overflow-hidden bg-muted shrink-0">
                                <img
                                  src={item.cover_image || "/placeholder.svg"}
                                  alt=""
                                  className="h-full w-full object-cover group-hover/item:scale-105 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-bold text-foreground group-hover/item:text-primary transition-colors line-clamp-2 leading-tight">
                                  {item.title}
                                </h4>
                                {item.category && (
                                  <span className="text-[7px] font-black uppercase text-primary bg-primary/5 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/70 hover:text-primary transition-colors shrink-0"
                onClick={() => {
                  if (searchOpen && searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchSuggestions([]);
                  } else {
                    setSearchOpen(!searchOpen);
                  }
                }}
                title="Cari Artikel"
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>

            {/* Shopping Cart Link */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground/70 hover:text-primary"
              onClick={() => navigate("/checkout")}
              title="Keranjang Belanja"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white shadow-sm ring-2 ring-background">
                  {totalCount}
                </span>
              )}
            </Button>

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
                {(role === "admin" || role === "superadmin") && (
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
          <div className="md:hidden border-t bg-card px-4 py-4 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const iconName = item.icon || getFallbackIconName(item.label);
              const isCategory = item.label.toLowerCase() === "kategori";
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = openMobileParent === String(item.id);

              if (isCategory || hasChildren) {
                return (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <button
                      onClick={() => setOpenMobileParent(isOpen ? null : String(item.id))}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-primary/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isOpen ? "islamic-gradient text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                          {iconName ? <DynamicIcon name={iconName} className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight text-foreground/90">{item.label}</p>
                          <p className="text-[10px] leading-tight text-muted-foreground">
                            {isCategory
                              ? `${categories.filter(c => (c.article_count || 0) > 0).length} topik`
                              : `${item.children.length} menu`}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 px-3 pb-3">
                        {isCategory ? (
                          categories.filter(cat => (cat.article_count || 0) > 0).map((cat) => (
                            <a key={cat.id} href={`/kategori/${cat.slug}`} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-3 py-2.5 transition-colors active:bg-primary/10">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <LayoutGrid className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold leading-snug text-foreground/90">{cat.name}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">{cat.article_count || 0}</span>
                            </a>
                          ))
                        ) : (
                          item.children.map((child: any) => {
                            const childIconName = child.icon || getFallbackIconName(child.label);
                            return (
                              <a key={child.id} {...getExternalLinkProps(child.href, child.isExternal)} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-3 py-2.5 transition-colors active:bg-primary/10">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                  {childIconName ? (
                                    <DynamicIcon name={childIconName} className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                  )}
                                </div>
                                <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-foreground/90">{child.label}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              </a>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a key={item.id} {...getExternalLinkProps(item.href, item.isExternal)} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5 transition-colors active:bg-primary/5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {iconName ? <DynamicIcon name={iconName} className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-bold text-foreground/90">{item.label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
                </a>
              );
            })}

            {/* Mobile role shortcuts */}
            {user && (role === "admin" || role === "superadmin") && (
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
