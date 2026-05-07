import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    })
  }
}));

vi.mock('../useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('useFileUpload', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('batches document counts correctly', async () => {
    const mockData = [
      { invoice_id: 'inv-1' },
      { invoice_id: 'inv-1' },
      { invoice_id: 'inv-2' }
    ];

    // set up the mock chain
    const selectMock = vi.fn().mockReturnThis();
    const inMock = vi.fn().mockResolvedValue({ data: mockData, error: null });

    (supabase.from as any).mockReturnValue({
      select: selectMock.mockReturnValue({ in: inMock })
    });

    const { result } = renderHook(() => useFileUpload());

    let counts;
    await act(async () => {
      counts = await result.current.getDocumentCounts(['inv-1', 'inv-2', 'inv-3']);
    });

    expect(counts).toEqual({
      'inv-1': 2,
      'inv-2': 1,
      'inv-3': 0
    });

    expect(supabase.from).toHaveBeenCalledWith('invoice_documents');
    expect(inMock).toHaveBeenCalledWith('invoice_id', ['inv-1', 'inv-2', 'inv-3']);
  });
});
