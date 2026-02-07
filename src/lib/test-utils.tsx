// Polyfill matchMedia for jsdom environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { vi } from 'vitest';
import React, { ReactElement } from 'react';
import { render, RenderOptions, renderHook as rtlRenderHook } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import '@testing-library/jest-dom';
import '@/i18n/config'; // Initialize i18next

// Polyfill ResizeObserver for components that rely on it (e.g., Radix UI)
if (typeof global.ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - assign to global for test environment
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

const customRender = (
  ui: ReactElement,
  { route = '/', ...options }: CustomRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const testQueryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={[route]}>
          <TooltipProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

const customRenderHook = <Result, Props>(
  render: (initialProps: Props) => Result,
  { route = '/', ...options }: CustomRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const testQueryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={[route]}>
          <TooltipProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  return rtlRenderHook(render, { wrapper: Wrapper, ...options });
};

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'admin' as const,
  user_metadata: {
    full_name: 'Test User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
};

// Mock authenticated user context
export const mockAuthContext = {
  user: mockUser,
  loading: false,
  signOut: vi.fn(),
  session: null,
  userRole: 'admin',
  hasRole: vi.fn(() => true),
};

// Mock Supabase client
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

// Mock data generators
export const generateMockInvoice = (overrides: any = {}) => ({
  id: 'mock-invoice-1',
  vendor_name: 'Test Vendor',
  invoice_number: 'INV-001',
  invoice_date: '2023-01-01',
  amount: 1000,
  status: 'pending',
  user_id: 'test-user-id',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

// Test environment setup
export const setupTestEnvironment = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  })) as any;

  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  })) as any;

  global.fetch = vi.fn();
  
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
};

// Re-export everything
export { screen, waitFor, userEvent };
export { customRender as render };
export { customRenderHook as renderHook };
export { createTestQueryClient };