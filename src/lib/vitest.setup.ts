// Vitest Setup - Mocks must be in a separate setup file to ensure hoisting works correctly
// This file runs BEFORE test-utils.tsx
import { vi } from 'vitest';

// CRITICAL: Mock Supabase to prevent act() warnings
// The onAuthStateChange callback must NOT fire synchronously during tests
// as this would cause React state updates after test components render
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      onAuthStateChange: vi.fn((_callback) => {
        // Do NOT call callback synchronously - this causes act() warnings
        // The callback would trigger state updates after render completes
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        };
      }),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
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
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    storage: {
      listBuckets: vi.fn(() => Promise.resolve({ data: [], error: null })),
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock' } }))
      }))
    }
  }
}));
