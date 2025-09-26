import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SessionSecurityProvider } from "@/hooks/useSessionSecurity";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import ErrorBoundary from "@/components/error-boundary/ErrorBoundary";
import { healthChecker } from "@/lib/health-check";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PasswordChange from "./pages/PasswordChange";
import ClientIntegration from "./pages/ClientIntegration";
import Profile from "./pages/Profile";
import Invoices from "./pages/Invoices";
import Exceptions from "./pages/Exceptions";
import ValidationRules from "./pages/ValidationRules";
import Compliance from "./pages/Compliance";
import Integrations from "./pages/Integrations";
import Analytics from "./pages/Analytics";
import Workflows from "./pages/Workflows";
import Search from "./pages/Search";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";
import { Footer } from "@/components/ui/footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
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
        path="/invoices" 
        element={
          <ProtectedRoute requiredRole="viewer">
            <Invoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exceptions" 
        element={
          <ProtectedRoute requiredRole="viewer">
            <Exceptions />
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
        path="/compliance" 
        element={
          <ProtectedRoute requiredRole="viewer">
            <Compliance />
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
        path="/analytics" 
        element={
          <ProtectedRoute requiredRole="viewer">
            <Analytics />
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
        path="/search" 
        element={
          <ProtectedRoute requiredRole="viewer">
            <Search />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client-integration" 
        element={<ClientIntegration />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        } 
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
        path="/" 
        element={<Landing />}
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Start health monitoring
    healthChecker.monitorHealth(60000); // Check every minute
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <SecurityHeaders />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SessionSecurityProvider>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">
                    <AuthRoutes />
                  </div>
                  <Footer />
                </div>
              </SessionSecurityProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
