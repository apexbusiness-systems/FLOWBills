import React from 'react';
import { act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { mockSupabase, setupTestEnvironment, waitFor, renderHook } from '@/lib/test-utils';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock react-router-dom to avoid navigation issues in tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

setupTestEnvironment();

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns expected hook interface', () => {
    const { result } = renderHook(() => useAuth());

    // Check that the hook returns the expected interface
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('userRole');
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).toHaveProperty('hasRole');

    // Check that signOut is a function
    expect(typeof result.current.signOut).toBe('function');

    // Check that hasRole is a function
    expect(typeof result.current.hasRole).toBe('function');
  });

  it('hasRole returns boolean', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.hasRole('admin')).toBe('boolean');
    expect(typeof result.current.hasRole('operator')).toBe('boolean');
    expect(typeof result.current.hasRole('viewer')).toBe('boolean');
  });

  it('signOut is callable', async () => {
    const { result } = renderHook(() => useAuth());

    // Should not throw when called
    await expect(result.current.signOut()).resolves.not.toThrow();
  });
});