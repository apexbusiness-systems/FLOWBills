import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Exception {
  id: string;
  invoice_id?: string;
  exception_type: 'duplicate' | 'amount_variance' | 'vendor_mismatch' | 'missing_po' | 'compliance_issue';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export const useExceptions = () => {
  const [loading, setLoading] = useState(false);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExceptions = useCallback(async (filters?: {
    severity?: string;
    invoice_id?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('exceptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.invoice_id) {
        query = query.eq('invoice_id', filters.invoice_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExceptions((data || []) as Exception[]);
    } catch (error: any) {
      console.error('Error fetching exceptions:', error);
      toast({
        title: "Error",
        description: "Failed to load exceptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createException = useCallback(async (exceptionData: {
    invoice_id?: string;
    exception_type: 'duplicate' | 'amount_variance' | 'vendor_mismatch' | 'missing_po' | 'compliance_issue';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    try {
      const { data, error } = await supabase
        .from('exceptions')
        .insert(exceptionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Exception Created",
        description: "New exception has been logged",
      });

      await fetchExceptions();
      return data;
    } catch (error: any) {
      console.error('Error creating exception:', error);
      toast({
        title: "Error",
        description: "Failed to create exception",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, fetchExceptions]);

  const updateException = useCallback(async (
    exceptionId: string,
    updateData: Partial<Exception>
  ) => {
    try {
      const { error } = await supabase
        .from('exceptions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', exceptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exception updated successfully",
      });

      await fetchExceptions();
      return true;
    } catch (error: any) {
      console.error('Error updating exception:', error);
      toast({
        title: "Error",
        description: "Failed to update exception",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchExceptions]);

  const getExceptionStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exceptions')
        .select('severity, resolved_at');

      if (error) throw error;

      const stats = {
        total: data.length,
        resolved: data.filter(e => e.resolved_at).length,
        unresolved: data.filter(e => !e.resolved_at).length,
        critical: data.filter(e => e.severity === 'critical').length,
        high: data.filter(e => e.severity === 'high').length,
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching exception stats:', error);
      return null;
    }
  }, []);

  return {
    exceptions,
    loading,
    fetchExceptions,
    createException,
    updateException,
    getExceptionStats,
  };
};