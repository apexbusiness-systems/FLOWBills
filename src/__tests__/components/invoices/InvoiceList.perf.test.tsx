import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InvoiceList from '@/components/invoices/InvoiceList';
import { Invoice } from '@/hooks/useInvoices';
import React from 'react';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    hasRole: () => true,
    user: { id: 'test-user' },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockGetDocuments = vi.fn().mockResolvedValue([]);
const mockGetDocumentCounts = vi.fn().mockResolvedValue({ 'inv-0': 1, 'inv-1': 2 });

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    getDocuments: mockGetDocuments,
    getDocumentCounts: mockGetDocumentCounts,
  }),
}));

vi.mock('@/hooks/useBulkActions', () => ({
  useBulkActions: () => ({
    processing: false,
    bulkApprove: vi.fn(),
    bulkReject: vi.fn(),
    bulkDelete: vi.fn(),
    bulkExport: vi.fn(),
  }),
}));

// Mock UI components to simplify testing
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: () => <div data-testid="checkbox" />,
}));

vi.mock('@/components/invoices/BulkActionsToolbar', () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions" />,
}));

describe('InvoiceList Performance', () => {
  const mockInvoices: Invoice[] = Array.from({ length: 5 }, (_, i) => ({
    id: `inv-${i}`,
    invoice_number: `INV-${i}`,
    vendor_name: `Vendor ${i}`,
    amount: 100 * (i + 1),
    invoice_date: '2023-01-01',
    due_date: '2023-02-01',
    status: 'pending',
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getDocumentCounts once instead of getDocuments N times', async () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onCreate={vi.fn()}
      />
    );

    await waitFor(() => {
      // Expect getDocumentCounts to be called exactly once
      expect(mockGetDocumentCounts).toHaveBeenCalledTimes(1);
      // Expect getDocuments NOT to be called
      expect(mockGetDocuments).not.toHaveBeenCalled();
    });
  });
});
