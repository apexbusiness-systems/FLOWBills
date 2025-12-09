import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { mockSupabase, setupTestEnvironment, waitFor } from "@/lib/test-utils";
import { vi, describe, it, beforeEach, expect } from "vitest";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

setupTestEnvironment();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with loading state", () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it("sets user when session exists", async () => {
    const mockUser = {
      id: "user-id",
      email: "test@example.com",
      user_metadata: { full_name: "Test User" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles sign out", async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
