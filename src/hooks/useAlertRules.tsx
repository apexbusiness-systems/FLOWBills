import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  alert_type: 'threshold' | 'percentage';
  threshold_value: number;
  notification_channels: string[];
  email_recipients: string[];
  is_active: boolean;
  afe_filter: any;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertLog {
  id: string;
  user_id: string;
  afe_id: string;
  alert_rule_id: string;
  alert_message: string;
  severity: 'warning' | 'critical';
  budget_utilization: number;
  metadata: any;
  created_at: string;
}

export const useAlertRules = () => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as AlertRule[]);
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alert rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchLogs = useCallback(async (limit = 50) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budget_alert_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data || []) as AlertLog[]);
    } catch (error) {
      console.error('Error fetching alert logs:', error);
    }
  }, [user]);

  const createRule = useCallback(async (ruleData: {
    rule_name: string;
    alert_type: 'threshold' | 'percentage';
    threshold_value: number;
    notification_channels?: string[];
    email_recipients: string[];
    afe_filter?: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('budget_alert_rules')
        .insert({
          ...ruleData,
          user_id: user.id,
          notification_channels: ruleData.notification_channels || ['email'],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Alert rule "${ruleData.rule_name}" created successfully`,
      });

      await fetchRules();
      return data;
    } catch (error: any) {
      console.error('Error creating alert rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create alert rule",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchRules]);

  const updateRule = useCallback(async (
    ruleId: string,
    updates: Partial<Omit<AlertRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('budget_alert_rules')
        .update(updates)
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert rule updated successfully",
      });

      await fetchRules();
      return true;
    } catch (error: any) {
      console.error('Error updating alert rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update alert rule",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRules]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('budget_alert_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert rule deleted successfully",
      });

      await fetchRules();
      return true;
    } catch (error: any) {
      console.error('Error deleting alert rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete alert rule",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRules]);

  const toggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    return updateRule(ruleId, { is_active: isActive });
  }, [updateRule]);

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, [fetchRules, fetchLogs]);

  return {
    rules,
    logs,
    loading,
    fetchRules,
    fetchLogs,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
};
