import {
  FileText,
  FolderOpen,
  Users,
  FileCode,
  Settings,
  Sparkles,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  GraduationCap,
  Menu,
  ShieldAlert,
  Wallet,
  Trophy,
  User,
  HandHeart,
  ShoppingBag,
  Receipt
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const { signOut } = useAuth();
  const { settings } = useSiteSettings();

  const groups = [
    {
      label: "Ikhtisar",
      items: [
        { id: "analytics", label: "Statistik", icon: LayoutDashboard },
      ]
    },
    {
      label: "Manajemen Konten",
      items: [
        { id: "articles", label: "Artikel", icon: FileText },
        { id: "pages", label: "Halaman", icon: FileCode },
        { id: "categories", label: "Kategori", icon: FolderOpen },
        { id: "comments", label: "Komentar", icon: MessageCircle },
      ]
    },
    {
      label: "Bisnis & Donasi",
      items: [
        { id: "products", label: "Produk", icon: ShoppingBag },
        { id: "orders", label: "Order Masuk", icon: Receipt },
        { id: "wallet", label: "Keuangan", icon: Wallet },
        { id: "donations", label: "Donasi", icon: HandHeart },
      ]
    },
    {
      label: "Akademi & Pembelajaran",
      items: [
        { id: "lms", label: "Akademi LMS", icon: GraduationCap },
        { id: "leaderboard", label: "Peringkat", icon: Trophy },
      ]
    },
    {
      label: "Konfigurasi Sistem",
      items: [
        { id: "navigation", label: "Menu Navigasi", icon: Menu },
        { id: "widgets", label: "Widget Sidebar", icon: FileCode },
        { id: "features", label: "Feature Bar", icon: Sparkles },
        { id: "users", label: "Pengguna", icon: Users },
        { id: "access_logs", label: "Security Logs", icon: ShieldAlert },
        { id: "settings", label: "Pengaturan", icon: Settings },
      ]
    },
    {
      label: "Akun",
      items: [
        { id: "profile", label: "Profil Saya", icon: User },
      ]
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2.5">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name}
              className="h-8 w-auto object-contain rounded"
            />
          ) : (
            <div className="h-8 w-8 rounded islamic-gradient flex items-center justify-center text-primary-foreground font-bold">
              {settings.site_name?.charAt(0)?.toUpperCase() || "B"}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-primary truncate">
              {settings.site_name}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              Admin Panel
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, gIdx) => (
          <SidebarGroup key={gIdx} className={gIdx > 0 ? "pt-0" : ""}>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => setActiveTab(item.id)}
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
