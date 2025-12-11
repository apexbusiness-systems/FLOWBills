import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Invoice } from './useInvoices';

export const useBulkActions = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const bulkApprove = useCallback(async (invoiceIds: string[]) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'approved' })
        .in('id', invoiceIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${invoiceIds.length} invoice(s) approved`,
      });

      return true;
    } catch (error: any) {
      console.error('Bulk approve error:', error);
      toast({
        title: "Error",
        description: "Failed to approve invoices",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const bulkReject = useCallback(async (invoiceIds: string[]) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'rejected' })
        .in('id', invoiceIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${invoiceIds.length} invoice(s) rejected`,
      });

      return true;
    } catch (error: any) {
      console.error('Bulk reject error:', error);
      toast({
        title: "Error",
        description: "Failed to reject invoices",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const bulkDelete = useCallback(async (invoiceIds: string[]) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', invoiceIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${invoiceIds.length} invoice(s) deleted`,
      });

      return true;
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoices",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const bulkExport = useCallback((invoices: Invoice[]) => {
    try {
      const csv = [
        ['Invoice #', 'Vendor', 'Amount', 'Date', 'Due Date', 'Status'].join(','),
        ...invoices.map(inv => [
          inv.invoice_number,
          inv.vendor_name || 'N/A',
          inv.amount,
          inv.invoice_date,
          inv.due_date || 'N/A',
          inv.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${invoices.length} invoice(s)`,
      });

      return true;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export invoices",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    processing,
    bulkApprove,
    bulkReject,
    bulkDelete,
    bulkExport,
  };
};
