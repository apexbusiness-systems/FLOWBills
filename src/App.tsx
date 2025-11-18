import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CSRFProvider } from "@/hooks/useCSRFProtection";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import ErrorBoundary from "@/components/error-boundary/ErrorBoundary";
import { healthChecker } from "@/lib/health-check";
import { Footer } from "@/components/ui/footer";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { CommandPalette } from "@/components/ui/command-palette";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// Lazy load all pages for code splitting
const Auth = React.lazy(() => import("./pages/Auth"));
const PasswordChange = React.lazy(() => import("./pages/PasswordChange"));
const ClientIntegration = React.lazy(() => import("./pages/ClientIntegration"));
const Profile = React.lazy(() => import("./pages/Profile"));
const ValidationRules = React.lazy(() => import("./pages/ValidationRules"));
const Integrations = React.lazy(() => import("./pages/Integrations"));
const Workflows = React.lazy(() => import("./pages/Workflows"));
const CountryPacks = React.lazy(() => import("./pages/CountryPacks"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Security = React.lazy(() => import("./pages/Security"));
const Features = React.lazy(() => import("./pages/Features"));
const IndexPage = React.lazy(() => import("./pages/Index"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const APIDocs = React.lazy(() => import("./pages/APIDocs"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Blog = React.lazy(() => import("./pages/Blog"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SupplierPortal = React.lazy(() => import("./pages/supplier/SupplierPortal"));
const CSPMonitoring = React.lazy(() => import("./pages/CSPMonitoring"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes cache retention
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      structuralSharing: true, // Optimize re-renders
      networkMode: 'offlineFirst', // Support offline-first strategy
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
      onError: (error: any) => {
        if (import.meta.env.DEV) {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

const AuthRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" replace /> : <Auth />} 
        />
        <Route 
          path="/change-password" 
          element={<PasswordChange />} 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/validation-rules" 
          element={
            <ProtectedRoute requiredRole="operator">
              <ValidationRules />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/integrations"
          element={
            <ProtectedRoute requiredRole="operator">
              <Integrations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workflows" 
          element={
            <ProtectedRoute requiredRole="operator">
              <Workflows />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/country-packs" 
          element={
            <ProtectedRoute requiredRole="operator">
              <CountryPacks />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client-integration" 
          element={<ClientIntegration />} 
        />
        <Route 
          path="/privacy"
          element={<Privacy />} 
        />
        <Route 
          path="/terms" 
          element={<Terms />} 
        />
        <Route 
          path="/security" 
          element={<Security />} 
        />
        <Route 
          path="/csp-monitoring" 
          element={
            <ProtectedRoute requiredRole="admin">
              <CSPMonitoring />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/features" 
          element={<Features />} 
        />
        <Route 
          path="/pricing" 
          element={<Pricing />} 
        />
        <Route 
          path="/api-docs" 
          element={<APIDocs />} 
        />
        <Route 
          path="/about" 
          element={<About />} 
        />
        <Route 
          path="/blog" 
          element={<Blog />} 
        />
        <Route 
          path="/contact" 
          element={<Contact />} 
        />
        <Route 
          path="/supplier-portal" 
          element={<SupplierPortal />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={<IndexPage />}
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

function App() {
  useEffect(() => {
    // Start health monitoring less frequently
    healthChecker.monitorHealth(300000); // Check every 5 minutes
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <SecurityHeaders />
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <InstallPrompt />
          <BrowserRouter>
            <CommandPalette />
            <AuthProvider>
              <CSRFProvider>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <AuthRoutes />
                  </div>
                  <Footer />
                </div>
              </CSRFProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
