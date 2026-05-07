import { renderHook, act, waitFor } from '@testing-library/react';
import { useInvoices } from '../useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { queryOptimizer } from '@/lib/query-optimizer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/integrations/supabase/client', () => {
  const singleMock = vi.fn();
  const selectMock = vi.fn().mockReturnValue({ single: singleMock });
  const eqMock = vi.fn().mockReturnValue({ select: selectMock });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  const insertMock = vi.fn().mockReturnValue({ select: selectMock });

  const queryBuilder = {
    insert: insertMock,
    update: updateMock,
    delete: vi.fn().mockReturnThis(),
    select: selectMock,
    single: singleMock,
    eq: eqMock,
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(queryBuilder)
    }
  };
});

vi.mock('../useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('useInvoices', () => {
  const mockUser = { id: 'user-123' };
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('preserves vendor_name when creating an invoice', async () => {
    const mockData = { id: 'inv-1', vendor_name: 'Real Vendor', amount: 100, invoice_date: '2025-01-01', status: 'pending', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', user_id: 'user-123', invoice_number: 'INV-1' };

    // We mocked 'single' directly above. Get its reference.
    const singleMock = supabase.from('invoices').insert({}).select().single;
    (singleMock as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useInvoices(), { wrapper });

    let createdInvoice;
    await act(async () => {
      createdInvoice = await result.current.createInvoice({
        amount: 100,
        invoice_date: '2025-01-01',
        vendor_name: 'Real Vendor'
      });
    });

    expect(createdInvoice).toBeDefined();
    expect(createdInvoice.vendor_name).toBe('Real Vendor');
  });

  it('preserves vendor_name when updating an invoice', async () => {
    const mockData = { id: 'inv-1', vendor_name: 'Updated Vendor', amount: 150, invoice_date: '2025-01-01', status: 'pending', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', user_id: 'user-123', invoice_number: 'INV-1' };

    const singleMock = supabase.from('invoices').update({}).eq('', '').select().single;
    (singleMock as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useInvoices(), { wrapper });

    let updatedInvoice;
    await act(async () => {
      updatedInvoice = await result.current.updateInvoice('inv-1', {
        vendor_name: 'Updated Vendor'
      });
    });

    expect(updatedInvoice).toBeDefined();
    expect(updatedInvoice.vendor_name).toBe('Updated Vendor');
  });
});
