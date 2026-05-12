import { useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useInfiniteQuery, InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { INVOICE_STATUS, InvoiceStatus } from '@/lib/domain/constants';

const PAGE_SIZE = 50;

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  invoice_date: string;
  due_date?: string | null;
  status: InvoiceStatus | string;
  notes?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  duplicate_hash?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useInvoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invoicesQueryKey = ['invoices', user?.id];

  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: invoicesQueryKey,
    queryFn: async ({ pageParam }) => {
      if (!user) return [] as Invoice[];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);
      if (error) {
        toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' });
        throw error;
      }
      return data as Invoice[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if ((lastPage as Invoice[]).length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + 1;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const invoices = useMemo(() => data?.pages.flat() ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: async (invoiceData: {
      invoice_number?: string;
      vendor_name?: string;
      amount: number;
      invoice_date: string;
      due_date?: string;
      status?: string;
      notes?: string;
      file_url?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const {
        vendor_name = 'Unknown Vendor',
        invoice_number = `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        ...restData
      } = invoiceData;
      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...restData, invoice_number, vendor_name, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (newInvoice) => {
      queryClient.setQueryData(invoicesQueryKey, (old: InfiniteData<Invoice[], number> | undefined) => {
        if (!old) return { pages: [[newInvoice]], pageParams: [0] };
        return { ...old, pages: [[newInvoice, ...old.pages[0]], ...old.pages.slice(1)] };
      });
      toast({ title: 'Success', description: 'Invoice created successfully' });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoicesQueryKey, (old: InfiniteData<Invoice[], number> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page =>
            page.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv)
          ),
        };
      });
      toast({ title: 'Success', description: 'Invoice updated successfully' });
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast({ title: 'Error', description: 'Failed to update invoice', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(invoicesQueryKey, (old: InfiniteData<Invoice[], number> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => page.filter(inv => inv.id !== id)),
        };
      });
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    },
  });

  const createInvoice = useCallback(async (data: any) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    return updateMutation.mutateAsync({ id, updates });
  }, [updateMutation]);

  const deleteInvoice = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
    return true;
  }, [deleteMutation]);

  const fetchInvoices = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
  }, [queryClient, invoicesQueryKey]);

  const getInvoiceById = useCallback((id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  }, [invoices]);

  const getInvoicesByStatus = useCallback((status: Invoice['status']): Invoice[] => {
    return invoices.filter(invoice => invoice.status === status);
  }, [invoices]);

  const getInvoicesStats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingCount = invoices.filter(inv => inv.status === INVOICE_STATUS.PENDING).length;
    const approvedCount = invoices.filter(inv => inv.status === INVOICE_STATUS.APPROVED).length;
    const paidCount = invoices.filter(inv => inv.status === INVOICE_STATUS.PROCESSING).length;
    const rejectedCount = invoices.filter(inv => inv.status === INVOICE_STATUS.REJECTED).length;
    return { totalAmount, totalCount: invoices.length, pendingCount, approvedCount, paidCount, rejectedCount };
  }, [invoices]);

  return {
    invoices,
    loading,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesStats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
