import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import { ScrollToTop } from "./components/ScrollToTop";
import { ThemeInitializer } from "./components/ThemeInitializer";
import { GoogleAnalytics } from "./components/GoogleAnalytics";

const queryClient = new QueryClient();

// Special wrapper to use beautiful About layout if slug is 'tentang'
function PageViewWrapper() {
  const { slug } = useParams();
  if (slug === "tentang") return <About />;
  return <PageView />;
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
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
        <AuthProvider>
          <ThemeInitializer />
          <ScrollToTop />
          <GoogleAnalytics />
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
    const knownPaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi"];
    if (knownPaths.includes(slug)) { setArticleExists(false); return; }
    api.get(`/articles/${slug}`)
      .then(() => setArticleExists(true))
      .catch(() => setArticleExists(false));
  }, [slug]);

  useEffect(() => {
    if (settingsLoading) return;
    if (settings.admin_slug && slug === settings.admin_slug) return;
    const sensitivePaths = ["auth", "login", "admin", "wp-admin", "masuk", "yaakhi"];
    if (sensitivePaths.includes(slug || "")) {
      api.post("/log-attempt", { path: `/${slug}`, status: "blocked" });
      navigate("/", { replace: true });
    }
  }, [slug, settings.admin_slug, settingsLoading, navigate]);

  // Still loading settings or article check
  if (settingsLoading || articleExists === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium animate-pulse">Memuat...</p>
      </div>
    );
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

export default App;
