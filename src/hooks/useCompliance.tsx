import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ComplianceRecord {
  id: string;
  entity_id: string;
  entity_type: string;
  regulation: string;
  status: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_audit_date?: string;
  next_audit_date?: string;
  audit_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceStats {
  total: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  dueSoon: number;
  overdue: number;
  highRisk: number;
  byType: Record<string, number>;
}

export const useCompliance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecords = useCallback(async (filters?: {
    status?: string;
    risk_level?: string;
    entity_type?: string;
    due_soon?: boolean;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('compliance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.due_soon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        query = query.lte('next_audit_date', thirtyDaysFromNow.toISOString());
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
  }, [toast]);

  const createRecord = useCallback(async (recordData: {
    entity_id: string;
    entity_type: string;
    regulation: string;
    status: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    last_audit_date?: string;
    next_audit_date?: string;
    audit_notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .insert(recordData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance record created successfully",
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
  }, [toast, fetchRecords]);

  const updateRecord = useCallback(async (
    recordId: string, 
    updates: Partial<Omit<ComplianceRecord, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('compliance_records')
        .update(updates)
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance record updated successfully",
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
  }, [toast, fetchRecords]);

  const markCompleted = useCallback(async (recordId: string) => {
    return await updateRecord(recordId, { status: 'compliant' });
  }, [updateRecord]);

  const deleteRecord = useCallback(async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance record deleted successfully",
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
  }, [toast, fetchRecords]);

  const getComplianceStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .select('status, risk_level, next_audit_date, entity_type');

      if (error) throw error;

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const stats = {
        total: data.length,
        compliant: data.filter(r => r.status === 'compliant').length,
        nonCompliant: data.filter(r => r.status === 'non_compliant').length,
        pending: data.filter(r => r.status === 'pending').length,
        dueSoon: data.filter(r => {
          if (!r.next_audit_date) return false;
          const dueDate = new Date(r.next_audit_date);
          return dueDate <= thirtyDaysFromNow && r.status !== 'compliant';
        }).length,
        overdue: data.filter(r => {
          if (!r.next_audit_date) return false;
          const dueDate = new Date(r.next_audit_date);
          return dueDate < now && r.status !== 'compliant';
        }).length,
        highRisk: data.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length,
        byType: data.reduce((acc, r) => {
          const type = r.entity_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching compliance stats:', error);
      return null;
    }
  }, []);

  const getUpcomingDeadlines = useCallback(async (days: number = 30) => {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);

      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .lte('next_audit_date', targetDate.toISOString())
        .neq('status', 'compliant')
        .order('next_audit_date', { ascending: true });

      if (error) throw error;
      return (data || []) as ComplianceRecord[];
    } catch (error: any) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }
  }, []);

  const getOverdueRecords = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .lt('next_audit_date', now)
        .neq('status', 'compliant')
        .order('next_audit_date', { ascending: true });

      if (error) throw error;
      return (data || []) as ComplianceRecord[];
    } catch (error: any) {
      console.error('Error fetching overdue records:', error);
      return [];
    }
  }, []);

  const generateComplianceReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('compliance_records')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        period: { start: startDate, end: endDate },
        records: (data || []) as ComplianceRecord[],
        summary: {
          total: data?.length || 0,
          compliant: data?.filter(r => r.status === 'compliant').length || 0,
          nonCompliant: data?.filter(r => r.status === 'non_compliant').length || 0,
          pending: data?.filter(r => r.status === 'pending').length || 0,
        }
      };
    } catch (error: any) {
      console.error('Error generating compliance report:', error);
      return null;
    }
  }, []);

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