import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create hoisted mocks so they can be used in vi.mock
const {
  mockFrom,
  mockInsert,
  mockSelect,
  mockSingle,
  mockUpload,
  mockRemove
} = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockInsert: vi.fn(),
    mockSelect: vi.fn(),
    mockSingle: vi.fn(),
    mockUpload: vi.fn(),
    mockRemove: vi.fn(),
  };
});

// Mock dependencies
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
      }),
    },
    from: mockFrom,
  },
}));

describe('useFileUpload Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    // Setup mock chains
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });

    // Simulate network delay for upload
    mockUpload.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms upload delay
      return { data: { path: 'uploaded/path' }, error: null };
    });

    // Simulate network delay for DB insert
    mockSingle.mockImplementation(async () => {
       await new Promise(resolve => setTimeout(resolve, 50)); // 50ms db delay
       return { data: { id: 'doc-id' }, error: null };
    });
  });

  it('uploads multiple files in parallel (optimized)', async () => {
    const { result } = renderHook(() => useFileUpload());

    const files = [
      new File(['content'], 'file1.txt', { type: 'text/plain' }),
      new File(['content'], 'file2.txt', { type: 'text/plain' }),
      new File(['content'], 'file3.txt', { type: 'text/plain' }),
    ];

    const start = Date.now();

    await act(async () => {
      await result.current.uploadMultipleFiles(files, 'invoice-123');
    });

    const end = Date.now();
    const duration = end - start;

    console.log(`Parallel Upload Duration: ${duration}ms`);

    // Sequential was > 400ms. Parallel should be around 150ms.
    // We set limit to 300ms to allow for some overhead but catch major regressions.
    expect(duration).toBeLessThan(300);
  });

  it('uploads files without invoice in parallel (optimized)', async () => {
    const { result } = renderHook(() => useFileUpload());

    const files = [
      new File(['content'], 'fileA.txt', { type: 'text/plain' }),
      new File(['content'], 'fileB.txt', { type: 'text/plain' }),
    ];

    const start = Date.now();

    await act(async () => {
      await result.current.uploadFilesWithoutInvoice(files);
    });

    const end = Date.now();
    const duration = end - start;

    console.log(`Parallel Without Invoice Upload Duration: ${duration}ms`);

    expect(duration).toBeLessThan(300);
  });
});
