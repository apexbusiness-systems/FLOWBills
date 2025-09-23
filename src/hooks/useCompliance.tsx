import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ComplianceRecord {
  id: string;
  user_id: string;
  title: string;
  record_type: string;
  description?: string;
  compliance_date: string;
  due_date?: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  responsible_party?: string;
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface ComplianceStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_soon: number;
  by_risk_level: Record<string, number>;
  by_type: Record<string, number>;
}

export const useCompliance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecords = useCallback(async (filters?: {
    status?: string;
    risk_level?: string;
    record_type?: string;
    due_soon?: boolean;
  }) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('compliance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters?.record_type) {
        query = query.eq('record_type', filters.record_type);
      }
      if (filters?.due_soon) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query.lte('due_date', nextWeek.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords((data || []) as ComplianceRecord[]);
    } catch (error: any) {
      console.error('Error fetching compliance records:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createRecord = useCallback(async (recordData: {
    title: string;
    record_type: string;
    description?: string;
    compliance_date: string;
    due_date?: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    responsible_party?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .insert({
          ...recordData,
          user_id: user.id,
          status: 'pending',
          documents: []
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Record Created",
        description: `Compliance record "${recordData.title}" has been created`,
      });

      await fetchRecords();
      return data;
    } catch (error: any) {
      console.error('Error creating compliance record:', error);
      toast({
        title: "Error",
        description: "Failed to create compliance record",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchRecords]);

  const updateRecord = useCallback(async (
    recordId: string,
    updates: Partial<Omit<ComplianceRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('compliance_records')
        .update(updates)
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Record Updated",
        description: "Compliance record has been updated successfully",
      });

      await fetchRecords();
      return true;
    } catch (error: any) {
      console.error('Error updating compliance record:', error);
      toast({
        title: "Error",
        description: "Failed to update compliance record",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRecords]);

  const markCompleted = useCallback(async (recordId: string) => {
    return await updateRecord(recordId, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0]
    });
  }, [updateRecord]);

  const deleteRecord = useCallback(async (recordId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('compliance_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Record Deleted",
        description: "Compliance record has been deleted successfully",
      });

      await fetchRecords();
      return true;
    } catch (error: any) {
      console.error('Error deleting compliance record:', error);
      toast({
        title: "Error",
        description: "Failed to delete compliance record",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRecords]);

  const getComplianceStats = useCallback(async (): Promise<ComplianceStats | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .select('status, risk_level, record_type, due_date')
        .eq('user_id', user.id);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const stats: ComplianceStats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        in_progress: data.filter(r => r.status === 'in_progress').length,
        completed: data.filter(r => r.status === 'completed').length,
        overdue: data.filter(r => 
          r.due_date && r.due_date < today && r.status !== 'completed'
        ).length,
        due_soon: data.filter(r => 
          r.due_date && r.due_date >= today && r.due_date <= nextWeekStr && r.status !== 'completed'
        ).length,
        by_risk_level: data.reduce((acc: Record<string, number>, record) => {
          acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
          return acc;
        }, {}),
        by_type: data.reduce((acc: Record<string, number>, record) => {
          acc[record.record_type] = (acc[record.record_type] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching compliance stats:', error);
      return null;
    }
  }, [user]);

  const getUpcomingDeadlines = useCallback(async (days: number = 30) => {
    if (!user) return [];

    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as ComplianceRecord[];
    } catch (error: any) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }
  }, [user]);

  const getOverdueRecords = useCallback(async () => {
    if (!user) return [];

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as ComplianceRecord[];
    } catch (error: any) {
      console.error('Error fetching overdue records:', error);
      return [];
    }
  }, [user]);

  const generateComplianceReport = useCallback(async (
    startDate: string, 
    endDate: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('compliance_date', startDate)
        .lte('compliance_date', endDate)
        .order('compliance_date', { ascending: false });

      if (error) throw error;

      const report = {
        period: { startDate, endDate },
        summary: {
          total_records: data.length,
          completed: data.filter(r => r.status === 'completed').length,
          overdue: data.filter(r => {
            const today = new Date().toISOString().split('T')[0];
            return r.due_date && r.due_date < today && r.status !== 'completed';
          }).length,
          by_type: data.reduce((acc: Record<string, number>, record) => {
            acc[record.record_type] = (acc[record.record_type] || 0) + 1;
            return acc;
          }, {}),
          by_risk_level: data.reduce((acc: Record<string, number>, record) => {
            acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
            return acc;
          }, {})
        },
        records: data as ComplianceRecord[]
      };

      return report;
    } catch (error: any) {
      console.error('Error generating compliance report:', error);
      return null;
    }
  }, [user]);

  return {
    records,
    loading,
    fetchRecords,
    createRecord,
    updateRecord,
    markCompleted,
    deleteRecord,
    getComplianceStats,
    getUpcomingDeadlines,
    getOverdueRecords,
    generateComplianceReport,
  };
};