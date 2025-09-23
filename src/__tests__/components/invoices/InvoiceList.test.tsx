import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, mockSupabase, generateMockInvoice, setupTestEnvironment } from '@/lib/test-utils';
import InvoiceList from '@/components/invoices/InvoiceList';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock the useInvoices hook
vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({
    invoices: [
      generateMockInvoice({ id: '1', vendor_name: 'Vendor A', amount: 1000 }),
      generateMockInvoice({ id: '2', vendor_name: 'Vendor B', amount: 2000 }),
    ],
    loading: false,
    error: null,
    fetchInvoices: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
  }),
}));

setupTestEnvironment();

const mockInvoiceListProps = {
  invoices: [
    generateMockInvoice({ id: '1', vendor_name: 'Vendor A', amount: 1000 }),
    generateMockInvoice({ id: '2', vendor_name: 'Vendor B', amount: 2000 }),
  ],
  loading: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onCreate: vi.fn(),
};

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of invoices', async () => {
    render(<InvoiceList {...mockInvoiceListProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Vendor A')).toBeInTheDocument();
      expect(screen.getByText('Vendor B')).toBeInTheDocument();
    });
  });

  it('displays invoice amounts correctly', async () => {
    render(<InvoiceList {...mockInvoiceListProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    const loadingProps = { ...mockInvoiceListProps, loading: true, invoices: [] };
    render(<InvoiceList {...loadingProps} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no invoices exist', () => {
    const emptyProps = { ...mockInvoiceListProps, invoices: [] };
    render(<InvoiceList {...emptyProps} />);
    
    expect(screen.getByText(/no invoices found/i)).toBeInTheDocument();
  });
});