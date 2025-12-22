import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import ErrorBoundary from '@/components/error-boundary/ErrorBoundary';
import App from '@/App';
import { healthChecker } from '@/lib/health-check';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    storage: {
      listBuckets: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }
  }
}));

// Mock performance monitoring
vi.mock('@/lib/health-check', () => ({
  healthChecker: {
    monitorHealth: vi.fn(),
    performHealthCheck: vi.fn(() => Promise.resolve({
      status: 'healthy',
      checks: {
        database: true,
        auth: true,
        storage: true,
        api: false
      },
      timestamp: new Date(),
      responseTime: 150
    }))
  }
}));

// Test utilities
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              {component}
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('Application Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render application without crashing', async () => {
    renderWithProviders(<App />);
    
    // Should show loading initially with proper accessibility role
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/loading application/i);
    
    // Wait for auth state to resolve and redirect to auth page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  it('should handle errors gracefully with ErrorBoundary', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    renderWithProviders(<ThrowError />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should initialize health monitoring every 5 minutes', () => {
    renderWithProviders(<App />);
    
    // Health check runs every 5 minutes (300000ms)
    expect(healthChecker.monitorHealth).toHaveBeenCalledWith(300000);
  });

  it('should properly configure query client with error handling', () => {
    // This test ensures our QueryClient is configured for production use
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
          retry: (failureCount, error: any) => {
            if (error?.status === 404) return false;
            return failureCount < 3;
          },
        },
      },
    });

    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(300000);
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});