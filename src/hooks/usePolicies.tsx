import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Policy {
  id: string;
  policy_name: string;
  policy_type: 'approval' | 'fraud' | 'validation';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyStats {
  total_policies: number;
  active_policies: number;
  approval_policies: number;
  fraud_policies: number;
  recent_triggers: number;
}

export const usePolicies = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = async (filters?: { 
    policy_type?: string; 
    is_active?: boolean; 
  }) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase.from('policies').select('*').order('priority');
      
      if (filters?.policy_type) {
        query = query.eq('policy_type', filters.policy_type);
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setPolicies((data as Policy[]) || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: {
    policy_name: string;
    policy_type: string;
    conditions: Record<string, any>;
    actions: Record<string, any>;
    priority?: number;
    is_active?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('policies')
        .insert([policyData])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh policies list
      fetchPolicies();
      return data;
    } catch (error) {
      console.error('Error creating policy:', error);
      return null;
    }
  };

  const updatePolicy = async (
    policyId: string,
    updates: Partial<Omit<Policy, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('policies')
        .update(updates)
        .eq('id', policyId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setPolicies(prev => 
        prev.map(policy => 
          policy.id === policyId ? { ...policy, ...(data as Policy) } : policy
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error updating policy:', error);
      return null;
    }
  };

  const deletePolicy = async (policyId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;
      
      // Remove from local state
      setPolicies(prev => prev.filter(policy => policy.id !== policyId));
      return true;
    } catch (error) {
      console.error('Error deleting policy:', error);
      return false;
    }
  };

  const togglePolicyStatus = async (policyId: string, isActive: boolean) => {
    return updatePolicy(policyId, { is_active: isActive });
  };

  const evaluateInvoiceAgainstPolicies = async (invoiceData: {
    amount: number;
    vendor_id?: string;
    confidence_score?: number;
  }) => {
    if (!user) return null;

    try {
      // Call the policy engine
      const response = await supabase.functions.invoke('policy-engine', {
        body: {
          invoice_id: crypto.randomUUID(), // Temporary ID for evaluation
          invoice_data: invoiceData,
          policy_types: ['approval', 'fraud']
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error evaluating policies:', error);
      return null;
    }
  };

  const getPolicyStats = async (): Promise<PolicyStats | null> => {
    if (!user) return null;

    try {
      const { data: allPolicies } = await supabase
        .from('policies')
        .select('*');

      const { data: recentTriggers } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'POLICY_EVALUATION')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!allPolicies) return null;

      return {
        total_policies: allPolicies.length,
        active_policies: allPolicies.filter(p => p.is_active).length,
        approval_policies: allPolicies.filter(p => p.policy_type === 'approval').length,
        fraud_policies: allPolicies.filter(p => p.policy_type === 'fraud').length,
        recent_triggers: recentTriggers?.count || 0,
      };
    } catch (error) {
      console.error('Error getting policy stats:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPolicies();
    }
  }, [user]);

  return {
    policies,
    loading,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus,
    evaluateInvoiceAgainstPolicies,
    getPolicyStats,
  };
};