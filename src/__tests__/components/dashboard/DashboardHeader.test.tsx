import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockAuthContext, setupTestEnvironment } from '@/lib/test-utils';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

// Setup test environment
setupTestEnvironment();

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header with user greeting', () => {
    render(<DashboardHeader />);
    
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getByText(/Oil & Gas Billing Platform/)).toBeInTheDocument();
  });

  it('displays user menu when user is authenticated', () => {
    render(<DashboardHeader />);
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    expect(userButton).toBeInTheDocument();
  });

  it('opens user menu on click', () => {
    render(<DashboardHeader />);
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    expect(screen.getByText(/Profile/)).toBeInTheDocument();
    expect(screen.getByText(/Sign out/)).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', () => {
    render(<DashboardHeader />);
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    const signOutButton = screen.getByText(/Sign out/);
    fireEvent.click(signOutButton);
    
    expect(mockAuthContext.signOut).toHaveBeenCalledTimes(1);
  });

  it('displays search functionality', () => {
    render(<DashboardHeader />);
    
    const searchInput = screen.getByPlaceholderText(/Search invoices/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<DashboardHeader />);
    
    const searchInput = screen.getByPlaceholderText(/Search invoices/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });
});