import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { queryOptimizer } from '@/lib/query-optimizer';

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_id?: string;
  amount: number;
  invoice_date: string;
  due_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  notes?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  vendor_name?: string; // Computed field for display
}

type Page = { items: Invoice[]; nextCursor?: { created_at: string; id: string } };

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPage = useCallback(async (cursor?: { created_at: string; id: string }): Promise<Page> => {
    if (!user) return { items: [] };

    const cacheKey = `invoices_${user.id}_${cursor?.created_at || 'initial'}`;
    
    const result = await queryOptimizer.supabaseQuery(
      'invoices',
      async (client) => {
        const q = client
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(50);
          
        if (cursor) {
          q.lt('created_at', cursor.created_at).or(`created_at.eq.${cursor.created_at},id.lt.${cursor.id}`);
        }
        
        return await q;
      },
      cacheKey,
      { ttl: 60000, cache: true }
    );
    
    if (result.error) throw result.error;
    
    const mappedInvoices = result.data?.map(record => ({
      ...record,
      vendor_name: 'Unknown Vendor'
    })) as Invoice[] || [];
    
    const last = mappedInvoices[mappedInvoices.length - 1];
    return { 
      items: mappedInvoices, 
      nextCursor: last ? { created_at: last.created_at, id: last.id } : undefined 
    };
  }, [user]);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const page = await fetchPage();
      setInvoices(page.items);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, fetchPage, toast]);

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'vendor_name'>) => {
    if (!user) return null;

    setCreating(true);
    try {
      const { vendor_name, ...dbData } = invoiceData as any;
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...dbData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      const mappedInvoice = { ...data, vendor_name: 'Unknown Vendor' } as Invoice;
      setInvoices(prev => [mappedInvoice, ...prev]);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!user) return null;

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedInvoice = { ...data, vendor_name: 'Unknown Vendor' } as Invoice;
      setInvoices(prev => 
        prev.map(invoice => invoice.id === id ? mappedInvoice : invoice)
      );
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
      return false;
    }
  };

  const getInvoiceById = (id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  };

  const getInvoicesByStatus = (status: Invoice['status']): Invoice[] => {
    return invoices.filter(invoice => invoice.status === status);
  };

  const getInvoicesStats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
    const approvedCount = invoices.filter(inv => inv.status === 'approved').length;
    const paidCount = invoices.filter(inv => inv.status === 'processing').length;
    const rejectedCount = invoices.filter(inv => inv.status === 'rejected').length;

    return {
      totalAmount,
      totalCount: invoices.length,
      pendingCount,
      approvedCount,
      paidCount,
      rejectedCount,
    };
  }, [invoices]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  return {
    invoices,
    loading,
    creating,
    updating,
    fetchInvoices,
    fetchPage,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesStats,
  };
};