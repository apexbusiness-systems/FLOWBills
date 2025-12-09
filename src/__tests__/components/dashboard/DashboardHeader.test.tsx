import React from "react";
import userEvent from "@testing-library/user-event";
import { render, mockAuthContext, setupTestEnvironment, screen } from "@/lib/test-utils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { vi, describe, it, beforeEach, expect } from "vitest";

// Mock the auth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthContext,
}));

// Setup test environment
setupTestEnvironment();

describe("DashboardHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard header with user greeting", () => {
    render(<DashboardHeader />);

    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getByText(/Oil & Gas Billing Platform/)).toBeInTheDocument();
  });

  it("displays user menu when user is authenticated", () => {
    render(<DashboardHeader />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    expect(userButton).toBeInTheDocument();
  });

  it("opens user menu on click", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    await user.click(userButton);

    expect(screen.getByText(/Profile/)).toBeInTheDocument();
    expect(screen.getByText(/Sign out/)).toBeInTheDocument();
  });

  it("calls signOut when logout is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    await user.click(userButton);

    const signOutButton = screen.getByText(/Sign out/);
    await user.click(signOutButton);

    expect(mockAuthContext.signOut).toHaveBeenCalledTimes(1);
  });

  it("displays search functionality", () => {
    render(<DashboardHeader />);

    const searchInput = screen.getByPlaceholderText(/Search invoices/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("handles search input changes", async () => {
    const user = userEvent.setup();
    render(<DashboardHeader />);

    const searchInput = screen.getByPlaceholderText(/Search invoices/i);
    await user.type(searchInput, "test search");

    expect(searchInput).toHaveValue("test search");
  });
});
