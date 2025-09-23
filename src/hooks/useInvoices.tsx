import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  invoice_date: string;
  due_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  file_name?: string;
  file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices((data as Invoice[]) || []);
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
  };

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoiceData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => [data as Invoice, ...prev]);
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

      setInvoices(prev => 
        prev.map(invoice => invoice.id === id ? data as Invoice : invoice)
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

  const getInvoicesStats = () => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
    const approvedCount = invoices.filter(inv => inv.status === 'approved').length;
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const rejectedCount = invoices.filter(inv => inv.status === 'rejected').length;

    return {
      totalAmount,
      totalCount: invoices.length,
      pendingCount,
      approvedCount,
      paidCount,
      rejectedCount,
    };
  };

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
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesStats,
  };
};