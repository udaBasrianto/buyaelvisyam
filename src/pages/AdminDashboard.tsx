import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Users, ArrowLeft, TrendingUp, Download, Menu, MessageCircle, ShieldAlert
} from "lucide-react";
import { PagesManager } from "@/components/admin/PagesManager";
import { ArticlesManager } from "@/components/admin/ArticlesManager";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { FeatureBarManager } from "@/components/admin/FeatureBarManager";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";
import { WidgetsManager } from "@/components/admin/WidgetsManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { LmsManager } from "@/components/admin/LmsManager";
import { WalletManager } from "@/components/admin/WalletManager";
import LeaderboardManager from "@/components/admin/LeaderboardManager";
import { NavigationManager } from "@/components/admin/NavigationManager";
import { AccessLogsManager } from "@/components/admin/AccessLogsManager";
import { CommentsManager } from "@/components/admin/CommentsManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { WordPressImportDialog } from "@/components/WordPressImportDialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WhatsAppSettingsManager } from "@/components/admin/WhatsAppSettingsManager";
import { UsersManager } from "@/components/admin/UsersManager";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

// removed mockUsers as we use real data now

const roleColor: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  kontributor: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  user: "bg-muted text-muted-foreground border-border",
};

export default function AdminDashboard() {
  const [wpImportDialog, setWpImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const stats = [
    { label: "Pengaturan", value: "Aktif", icon: TrendingUp, color: "text-primary" },
    { label: "Konten", value: "Dinamis", icon: FileText, color: "text-secondary-foreground" },
    { label: "Pengguna", value: "Aktif", icon: Users, color: "text-primary" },
    { label: "Status", value: "Live", icon: TrendingUp, color: "text-secondary-foreground" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsDashboard />;
      case "articles":
        return <ArticlesManager key={refreshKey} onWpImportClick={() => setWpImportDialog(true)} />;
      case "categories":
        return <CategoriesManager />;
      case "widgets":
        return <WidgetsManager />;
      case "pages":
        return <PagesManager />;
      case "features":
        return <FeatureBarManager />;
      case "settings":
        return <SiteSettingsManager />;
      case "whatsapp":
        return <WhatsAppSettingsManager />;
      case "lms":
        return <LmsManager />;
      case 'comments':
        return <CommentsManager />;
      case 'wallet':
        return <WalletManager />;
      case "leaderboard":
        return <LeaderboardManager />;
      case 'navigation':
        return <NavigationManager />;
      case "access_logs":
        return <AccessLogsManager />;
      case "users":
        return <UsersManager />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "analytics": return "Statistik Situs";
      case "articles": return "Manajemen Artikel";
      case "categories": return "Manajemen Kategori";
      case "widgets": return "Widget Sidebar";
      case "pages": return "Manajemen Halaman";
      case "features": return "Feature Bar";
      case "settings": return "Pengaturan Situs";
      case "whatsapp": return "WhatsApp Bot Settings";
      case "lms": return "Manajemen Akademi LMS";
      case "navigation": return "Manajemen Menu";
      case "access_logs": return "Log Keamanan Akses";
      case "users": return "Manajemen Pengguna";
      case "comments": return "Manajemen Komentar";
      default: return "Admin Panel";
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset>
          <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <Link to="/" className="text-muted-foreground hover:text-primary transition hidden md:flex">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="h-6 w-px bg-border hidden md:block" />
                <h1 className="font-bold text-foreground">{getPageTitle()}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-foreground">
                    {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {currentTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block mx-1" />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-accent/50">
                  <Badge className="h-2 w-2 p-0 rounded-full bg-primary" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {activeTab !== "analytics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {stats.map((s) => (
                  <div key={s.label} className="bg-card rounded-xl p-4 border card-shadow flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-accent">
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-0">
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
      <WordPressImportDialog 
        open={wpImportDialog} 
        onOpenChange={setWpImportDialog} 
        onImportSuccess={handleImportSuccess}
      />
    </SidebarProvider>
  );
}
