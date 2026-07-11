import { useState, useEffect } from "react";
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
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ContributorDashboard from "./pages/ContributorDashboard.tsx";
import ReaderDashboard from "./pages/ReaderDashboard.tsx";
import Auth from "./pages/Auth.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import PageView from "./pages/PageView.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import CategoriesPage from "./pages/CategoriesPage.tsx";
import Courses from "./pages/Courses.tsx";
import CourseDetail from "./pages/CourseDetail.tsx";
import LessonView from "./pages/LessonView.tsx";
import Profile from "./pages/Profile.tsx";
import Donation from "./pages/Donation.tsx";
import DonationHistory from "./pages/DonationHistory.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import AccountDeletion from "./pages/AccountDeletion.tsx";
import ProductsPage from "./pages/ProductsPage.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Checkout, { CheckoutSuccess } from "./pages/Checkout";
import { ScrollToTop } from "./components/ScrollToTop";
import { ThemeInitializer } from "./components/ThemeInitializer";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { VisitorTracker } from "./components/VisitorTracker";
import { CapacitorAppBridge } from "./components/CapacitorAppBridge";



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
  if (requiredRole && role !== requiredRole && role !== "admin") return <Navigate to="/" replace />;
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

          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Login Route */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
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
            <Route path="/lms" element={<Courses />} />
            <Route path="/lms/course/:slug" element={<CourseDetail />} />
            <Route path="/lms/lesson/:slug" element={<LessonView />} />
            
            {/* Backward compatibility */}
            <Route path="/artikel/:id" element={<ArticleDetail />} />

            {/* Secret & Article Route Handler */}
            <Route path="/:slug" element={<SecretRouteHandler />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
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
    const knownPaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi", "donasi"];
    if (knownPaths.includes(slug)) { setArticleExists(false); return; }
    api.get(`/articles/${slug}`)
      .then(() => setArticleExists(true))
      .catch(() => setArticleExists(false));
  }, [slug]);

  useEffect(() => {
    if (settingsLoading) return;
    if (settings.admin_slug && slug === settings.admin_slug) return;
    const sensitivePaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi", "donasi"];
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
