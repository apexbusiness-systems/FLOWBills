import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { INVOICE_STATUS, InvoiceStatus } from '@/lib/domain/constants';

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

  const { data: invoices = [], isLoading: loading, error } = useQuery({
    queryKey: invoicesQueryKey,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100); // Or implement proper pagination using useInfiniteQuery

      if (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        });
        throw error;
      }

      return data as Invoice[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  const createMutation = useMutation({
    mutationFn: async (invoiceData: { invoice_number?: string; vendor_name?: string; amount: number; invoice_date: string; due_date?: string; status?: string; notes?: string; file_url?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { vendor_name = 'Unknown Vendor', invoice_number = `INV-${Date.now()}`, ...restData } = invoiceData;
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...restData,
          invoice_number,
          vendor_name,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (newInvoice) => {
      // Optimistic update of the cache
      queryClient.setQueryData(invoicesQueryKey, (old: Invoice[] | undefined) => {
        return old ? [newInvoice, ...old] : [newInvoice];
      });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Invoice> }) => {
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
      queryClient.setQueryData(invoicesQueryKey, (old: Invoice[] | undefined) => {
        return old ? old.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv) : [updatedInvoice];
      });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(invoicesQueryKey, (old: Invoice[] | undefined) => {
        return old ? old.filter(inv => inv.id !== id) : [];
      });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
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

    return {
      totalAmount,
      totalCount: invoices.length,
      pendingCount,
      approvedCount,
      paidCount,
      rejectedCount,
    };
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
  };
};
