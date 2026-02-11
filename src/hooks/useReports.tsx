import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { fetchUWIProductionDataOptimized, fetchUWIProductionDataLegacy, type UWIProductionData } from './useReports.utils';

export interface AFESpendingReport {
  afe_number: string;
  description: string;
  budget_amount: number;
  spent_amount: number;
  remaining: number;
  utilization: number;
  status: string;
  well_name: string | null;
}

export interface FieldTicketSummary {
  date: string;
  total_tickets: number;
  verified_tickets: number;
  unverified_tickets: number;
  total_amount: number;
  average_amount: number;
}

export { type UWIProductionData };

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getAFESpendingReport = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    if (!user) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('afes')
        .select('*')
        .eq('user_id', user.id);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const report: AFESpendingReport[] = (data || []).map(afe => ({
        afe_number: afe.afe_number,
        description: afe.description || '',
        budget_amount: Number(afe.budget_amount),
        spent_amount: Number(afe.spent_amount),
        remaining: Number(afe.budget_amount) - Number(afe.spent_amount),
        utilization: Number(afe.budget_amount) > 0 
          ? (Number(afe.spent_amount) / Number(afe.budget_amount)) * 100 
          : 0,
        status: afe.status,
        well_name: afe.well_name,
      }));

      return report;
    } catch (error: any) {
      console.error('Error fetching AFE spending report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch AFE spending report",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getFieldTicketSummary = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    if (!user) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('field_tickets')
        .select('*')
        .eq('user_id', user.id);

      if (filters?.startDate) {
        query = query.gte('service_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('service_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date
      const groupedByDate = (data || []).reduce((acc, ticket) => {
        const date = ticket.service_date;
        if (!acc[date]) {
          acc[date] = {
            date,
            tickets: [],
          };
        }
        acc[date].tickets.push(ticket);
        return acc;
      }, {} as Record<string, { date: string; tickets: any[] }>);

      const summary: FieldTicketSummary[] = Object.values(groupedByDate).map(group => {
        const verifiedCount = group.tickets.filter(t => t.verified).length;
        const totalAmount = group.tickets.reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          date: group.date,
          total_tickets: group.tickets.length,
          verified_tickets: verifiedCount,
          unverified_tickets: group.tickets.length - verifiedCount,
          total_amount: totalAmount,
          average_amount: totalAmount / group.tickets.length,
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return summary;
    } catch (error: any) {
      console.error('Error fetching field ticket summary:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch field ticket summary",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getUWIProductionData = useCallback(async (filters?: {
    province?: string;
    status?: string;
  }) => {
    if (!user) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('uwis')
        .select('*')
        .eq('user_id', user.id);

      if (filters?.province) {
        query = query.eq('province', filters.province);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: uwis, error: uwiError } = await query;

      if (uwiError) throw uwiError;

      const USE_OPTIMIZED_QUERY = import.meta.env.VITE_USE_OPTIMIZED_UWI_QUERY !== 'false';

      return USE_OPTIMIZED_QUERY
        ? await fetchUWIProductionDataOptimized(uwis || [], user.id, supabase)
        : await fetchUWIProductionDataLegacy(uwis || [], user.id, supabase);
    } catch (error: any) {
      console.error('Error fetching UWI production data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch UWI production data",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Report exported to ${filename}.csv`,
    });
  }, [toast]);

  return {
    loading,
    getAFESpendingReport,
    getFieldTicketSummary,
    getUWIProductionData,
    exportToCSV,
  };
};
