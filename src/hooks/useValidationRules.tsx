import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ValidationRule {
  id: string;
  user_id: string;
  rule_name: string;
  rule_type: string;
  rule_config: any;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggested_action?: string;
}

export interface InvoiceValidationResult {
  invoice_id: string;
  overall_passed: boolean;
  results: ValidationResult[];
  executed_at: string;
}

export const useValidationRules = () => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRules = useCallback(async (filters?: {
    rule_type?: string;
    is_active?: boolean;
  }) => {
    if (!user) return;

    setLoading(true);
    // Stub implementation - return empty array after delay
    setTimeout(() => {
      setRules([]);
      setLoading(false);
    }, 500);
  }, [user]);

  const createRule = useCallback(async (ruleData: {
    rule_name: string;
    rule_type: string;
    rule_config: any;
    priority?: number;
    is_active?: boolean;
  }) => {
    if (!user) return null;

    // Stub implementation
    toast({
      title: "Rule Created",
      description: `Validation rule "${ruleData.rule_name}" has been created (stub implementation)`,
    });

    return null;
  }, [user, toast]);

  const updateRule = useCallback(async (
    ruleId: string,
    updates: Partial<Omit<ValidationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Rule Updated",
      description: "Validation rule has been updated successfully (stub implementation)",
    });

    return true;
  }, [user, toast]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Rule Deleted",
      description: "Validation rule has been deleted successfully (stub implementation)",
    });

    return true;
  }, [user, toast]);

  const validateInvoice = useCallback(async (invoice: any): Promise<InvoiceValidationResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Stub implementation - return mock validation result
    return {
      invoice_id: invoice.id || 'mock-id',
      overall_passed: true,
      results: [],
      executed_at: new Date().toISOString()
    };
  }, [user]);

  const getRuleStats = useCallback(async () => {
    if (!user) return null;

    // Stub implementation - return mock stats
    return {
      total: 0,
      active: 0,
      inactive: 0,
      by_type: {}
    };
  }, [user]);

  // Load rules on component mount and user change
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    validateInvoice,
    getRuleStats,
  };
};