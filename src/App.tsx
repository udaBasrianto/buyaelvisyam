import { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import api from "@/lib/api";
import Index from "./pages/Index.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import { ScrollToTop } from "./components/ScrollToTop";
import { ThemeInitializer } from "./components/ThemeInitializer";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { VisitorTracker } from "./components/VisitorTracker";
import { InfoPopup } from "./components/InfoPopup";
import { CapacitorAppBridge } from "./components/CapacitorAppBridge";

// Pages other than the homepage/article are loaded on demand to keep the
// initial JavaScript bundle small.
// After a new deploy, an open tab may request a chunk that no longer exists;
// reload once to pick up the fresh build instead of showing a blank page.
function lazyPage<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory()
      .then((mod) => {
        sessionStorage.removeItem("chunk-reload");
        return mod;
      })
      .catch((err) => {
        if (!sessionStorage.getItem("chunk-reload")) {
          sessionStorage.setItem("chunk-reload", "1");
          window.location.reload();
        }
        throw err;
      })
  );
}
const AdminDashboard = lazyPage(() => import("./pages/AdminDashboard.tsx"));
const ArticleEditor = lazyPage(() => import("./pages/ArticleEditor.tsx"));
const ContributorDashboard = lazyPage(() => import("./pages/ContributorDashboard.tsx"));
const ReaderDashboard = lazyPage(() => import("./pages/ReaderDashboard.tsx"));
const Auth = lazyPage(() => import("./pages/Auth.tsx"));
const CategoryPage = lazyPage(() => import("./pages/CategoryPage.tsx"));
const PageView = lazyPage(() => import("./pages/PageView.tsx"));
const NotFound = lazyPage(() => import("./pages/NotFound.tsx"));
const About = lazyPage(() => import("./pages/About.tsx"));
const SearchPage = lazyPage(() => import("./pages/SearchPage.tsx"));
const CategoriesPage = lazyPage(() => import("./pages/CategoriesPage.tsx"));
const Courses = lazyPage(() => import("./pages/Courses.tsx"));
const CourseDetail = lazyPage(() => import("./pages/CourseDetail.tsx"));
const LessonView = lazyPage(() => import("./pages/LessonView.tsx"));
const Profile = lazyPage(() => import("./pages/Profile.tsx"));
const Donation = lazyPage(() => import("./pages/Donation.tsx"));
const DonationHistory = lazyPage(() => import("./pages/DonationHistory.tsx"));
const PrivacyPolicy = lazyPage(() => import("./pages/PrivacyPolicy.tsx"));
const AccountDeletion = lazyPage(() => import("./pages/AccountDeletion.tsx"));
const ProductsPage = lazyPage(() => import("./pages/ProductsPage.tsx"));
const ProductDetail = lazyPage(() => import("./pages/ProductDetail.tsx"));
const Checkout = lazyPage(() => import("./pages/Checkout"));
const CheckoutSuccess = lazyPage(() => import("./pages/Checkout").then((m) => ({ default: m.CheckoutSuccess })));
const Arsip = lazyPage(() => import("./pages/Arsip.tsx"));
const DownloadsPage = lazyPage(() => import("./pages/DownloadsPage.tsx"));
const FAQ = lazyPage(() => import("./pages/FAQ.tsx"));
const PrayerAirQualityPage = lazyPage(() => import("./pages/PrayerAirQualityPage"));
const DzikirPage = lazyPage(() => import("./pages/DzikirPage"));
const ManasikPage = lazyPage(() => import("./pages/ManasikPage"));
const TasbihPage = lazyPage(() => import("./pages/TasbihPage"));

const queryClient = new QueryClient();

// Special wrapper to use beautiful About layout if slug is 'tentang'
function PageViewWrapper() {
  const { slug } = useParams();
  if (slug === "tentang") return <About />;
  return <PageView />;
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole && role !== "admin" && role !== "superadmin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
        <AuthProvider>
          <ThemeInitializer />
          <ScrollToTop />
          <CapacitorAppBridge />
          <GoogleAnalytics />
          <VisitorTracker />
          <InfoPopup />

          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Login Route */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/:tab?" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/articles/edit/:id" element={
              <ProtectedRoute requiredRole="admin">
                <ArticleEditor />
              </ProtectedRoute>
            } />
            <Route path="/admin/articles/new" element={
              <ProtectedRoute requiredRole="admin">
                <ArticleEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/kontributor" element={
              <ProtectedRoute requiredRole="kontributor">
                <ContributorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ReaderDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/donasi" element={<Donation />} />
            <Route path="/donasi-history" element={
              <ProtectedRoute>
                <DonationHistory />
              </ProtectedRoute>
            } />
            <Route path="/produk" element={<ProductsPage />} />
            <Route path="/produk/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Checkout />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success/:token" element={<CheckoutSuccess />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
            <Route path="/hapus-akun" element={<AccountDeletion />} />
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/kategori/:slug" element={<CategoryPage />} />
            <Route path="/p/:slug" element={<PageViewWrapper />} />
            <Route path="/tentang" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/bantuan" element={<FAQ />} />
            <Route path="/lms" element={<Courses />} />
            <Route path="/lms/course/:slug" element={<CourseDetail />} />
            <Route path="/lms/lesson/:slug" element={<LessonView />} />
            <Route path="/arsip" element={<Arsip />} />
            <Route path="/unduhan" element={<DownloadsPage />} />
            <Route path="/jadwal-sholat" element={<PrayerAirQualityPage />} />
            <Route path="/dzikir" element={<DzikirPage />} />
            <Route path="/manasik" element={<ManasikPage />} />
            <Route path="/haji-umroh" element={<ManasikPage />} />
            <Route path="/tasbih" element={<TasbihPage />} />
            <Route path="/jadwal" element={<Navigate to="/jadwal-sholat" replace />} />
            
            {/* Backward compatibility */}
            <Route path="/artikel/:id" element={<ArticleDetail />} />

            {/* Secret & Article Route Handler */}
            <Route path="/:slug" element={<SecretRouteHandler />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function SecretRouteHandler() {
  const { slug } = useParams();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articleExists, setArticleExists] = useState<boolean | null>(null);

  // Check if this slug belongs to an article
  useEffect(() => {
    if (!slug) return;
    // Don't check for known static/admin paths
    const knownPaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi", "donasi", "jadwal-sholat", "jadwal", "dzikir"];
    if (knownPaths.includes(slug)) { setArticleExists(false); return; }
    api.get(`/articles/${slug}`)
      .then(() => setArticleExists(true))
      .catch(() => setArticleExists(false));
  }, [slug]);

  useEffect(() => {
    if (settingsLoading) return;
    if (settings.admin_slug && slug === settings.admin_slug) return;
    const sensitivePaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi", "donasi", "jadwal-sholat", "jadwal"];
    if (sensitivePaths.includes(slug || "")) {
      api.post("/log-attempt", { path: `/${slug}`, status: "blocked" });
      navigate("/", { replace: true });
    }
  }, [slug, settings.admin_slug, settingsLoading, navigate]);

  // Still loading settings or article check
  if (settingsLoading || articleExists === null) {
    return <LoadingScreen />;
  }

  // Secret admin route
  if (settings.admin_slug && slug === settings.admin_slug) {
    if (user) return <Navigate to="/admin" replace />;
    return <Auth />;
  }

  // Article found — render article detail
  if (articleExists) return <ArticleDetail />;

  return <NotFound />;
}

function LoadingScreen() {
  const { settings } = useSiteSettings();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt={settings.site_name} className="h-14 w-auto object-contain" />
        ) : (
          <div className="h-14 w-14 rounded-2xl islamic-gradient flex items-center justify-center text-primary-foreground font-black text-2xl">
            {settings.site_name?.charAt(0)?.toUpperCase() || "B"}
          </div>
        )}
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    </div>
  );
}

export default App;
