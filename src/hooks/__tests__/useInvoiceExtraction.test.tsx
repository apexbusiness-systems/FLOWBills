import { renderHook, act } from '@testing-library/react';
import { useInvoiceExtraction } from '../useInvoiceExtraction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })
  }
}));

vi.mock('../useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('useInvoiceExtraction', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('correctly builds a base64 payload when passed a File', async () => {
    const mockData = { success: true, extracted_data: { vendor_name: 'Test' } };
    (supabase.functions.invoke as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useInvoiceExtraction());

    // Create a mock File object
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.extractInvoiceData('inv-1', file);
    });

    // Verify it called the function with a data url
    expect(supabase.functions.invoke).toHaveBeenCalledWith('invoice-extract', expect.objectContaining({
      body: expect.objectContaining({
        invoice_id: 'inv-1',
        file_type: 'application/pdf',
        file_content: expect.stringMatching(/^data:application\/pdf;base64,/)
      })
    }));
  });

  it('passes string payload directly', async () => {
    const mockData = { success: true, extracted_data: { vendor_name: 'Test' } };
    (supabase.functions.invoke as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useInvoiceExtraction());

    const base64String = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';

    await act(async () => {
      await result.current.extractInvoiceData('inv-1', base64String);
    });

    // Verify it called the function with the string
    expect(supabase.functions.invoke).toHaveBeenCalledWith('invoice-extract', expect.objectContaining({
      body: expect.objectContaining({
        invoice_id: 'inv-1',
        file_content: base64String
      })
    }));
  });
});
