import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UWI {
  id: string;
  user_id: string;
  uwi: string;
  well_name: string | null;
  status: string;
  province: string | null;
  location: string | null;
  operator: string | null;
  spud_date: string | null;
  completion_date: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useUWIs = () => {
  const [loading, setLoading] = useState(false);
  const [uwis, setUwis] = useState<UWI[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUWIs = useCallback(async (filters?: {
    status?: string;
    province?: string;
    search?: string;
  }) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('uwis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.province) {
        query = query.eq('province', filters.province);
      }

      if (filters?.search) {
        query = query.or(`uwi.ilike.%${filters.search}%,well_name.ilike.%${filters.search}%,operator.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUwis((data || []) as UWI[]);
    } catch (error) {
      console.error('Error fetching UWIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch UWIs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createUWI = useCallback(async (uwiData: {
    uwi: string;
    well_name?: string;
    status?: string;
    province?: string;
    location?: string;
    operator?: string;
    spud_date?: string;
    completion_date?: string;
    metadata?: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('uwis')
        .insert({
          ...uwiData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `UWI ${uwiData.uwi} created successfully`,
      });

      await fetchUWIs();
      return data;
    } catch (error: any) {
      console.error('Error creating UWI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create UWI",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchUWIs]);

  const updateUWI = useCallback(async (
    uwiId: string,
    updates: Partial<Omit<UWI, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('uwis')
        .update(updates)
        .eq('id', uwiId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "UWI updated successfully",
      });

      await fetchUWIs();
      return true;
    } catch (error: any) {
      console.error('Error updating UWI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update UWI",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchUWIs]);

  const deleteUWI = useCallback(async (uwiId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('uwis')
        .delete()
        .eq('id', uwiId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "UWI deleted successfully",
      });

      await fetchUWIs();
      return true;
    } catch (error: any) {
      console.error('Error deleting UWI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete UWI",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchUWIs]);

  const getUWIById = useCallback((id: string) => {
    return uwis.find(uwi => uwi.id === id);
  }, [uwis]);

  const getUWIStats = useCallback(() => {
    const total = uwis.length;
    const active = uwis.filter(u => u.status === 'active').length;
    const drilling = uwis.filter(u => u.status === 'drilling').length;
    const completed = uwis.filter(u => u.status === 'completed').length;

    return {
      total,
      active,
      drilling,
      completed,
    };
  }, [uwis]);

  const getAssociatedData = useCallback(async (uwiId: string) => {
    if (!user) return { invoices: [], fieldTickets: [], extractions: [] };

    try {
      const [invoiceExtractions, fieldTickets] = await Promise.all([
        supabase
          .from('invoice_extractions')
          .select('invoice_id')
          .eq('uwi_id', uwiId)
          .eq('user_id', user.id),
        supabase
          .from('field_tickets')
          .select('*')
          .eq('uwi_id', uwiId)
          .eq('user_id', user.id),
      ]);

      return {
        invoices: invoiceExtractions.data || [],
        fieldTickets: fieldTickets.data || [],
        extractions: invoiceExtractions.data || [],
      };
    } catch (error) {
      console.error('Error fetching associated data:', error);
      return { invoices: [], fieldTickets: [], extractions: [] };
    }
  }, [user]);

  useEffect(() => {
    fetchUWIs();
  }, [fetchUWIs]);

  return {
    uwis,
    loading,
    fetchUWIs,
    createUWI,
    updateUWI,
    deleteUWI,
    getUWIById,
    getUWIStats,
    getAssociatedData,
  };
};
