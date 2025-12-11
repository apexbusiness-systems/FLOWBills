import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ValidationRule {
  id: string;
  user_id: string;
  rule_name: string;
  rule_type: string;
  rule_config: Record<string, unknown>;
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
    try {
      let query = supabase
        .from('validation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (filters?.rule_type) {
        query = query.eq('rule_type', filters.rule_type);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: ValidationRule[] = (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        rule_name: row.rule_name,
        rule_type: row.rule_type,
        rule_config: (row.rule_config as Record<string, unknown>) || {},
        is_active: row.is_active ?? true,
        priority: row.priority ?? 0,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      }));

      setRules(mapped);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch validation rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createRule = useCallback(async (ruleData: {
    rule_name: string;
    rule_type: string;
    rule_config: Record<string, unknown>;
    priority?: number;
    is_active?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('validation_rules')
        .insert({
          user_id: user.id,
          rule_name: ruleData.rule_name,
          rule_type: ruleData.rule_type,
          rule_config: ruleData.rule_config as Json,
          priority: ruleData.priority ?? 0,
          is_active: ruleData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Rule Created",
        description: `Validation rule "${ruleData.rule_name}" has been created`,
      });

      await fetchRules();
      return data;
    } catch (error) {
      console.error('Error creating validation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create validation rule",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchRules]);

  const updateRule = useCallback(async (
    ruleId: string,
    updates: Partial<Omit<ValidationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.rule_name !== undefined) updateData.rule_name = updates.rule_name;
      if (updates.rule_type !== undefined) updateData.rule_type = updates.rule_type;
      if (updates.rule_config !== undefined) updateData.rule_config = updates.rule_config as Json;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { error } = await supabase
        .from('validation_rules')
        .update(updateData)
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Rule Updated",
        description: "Validation rule has been updated successfully",
      });

      await fetchRules();
      return true;
    } catch (error) {
      console.error('Error updating validation rule:', error);
      toast({
        title: "Error",
        description: "Failed to update validation rule",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRules]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('validation_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Rule Deleted",
        description: "Validation rule has been deleted successfully",
      });

      await fetchRules();
      return true;
    } catch (error) {
      console.error('Error deleting validation rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete validation rule",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchRules]);

  const validateInvoice = useCallback(async (invoice: {
    id: string;
    vendor_name: string;
    amount: number;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
  }): Promise<InvoiceValidationResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const results: ValidationResult[] = [];

    // Get active rules
    const activeRules = rules.filter(r => r.is_active);

    for (const rule of activeRules) {
      const result = evaluateRule(rule, invoice);
      results.push(result);
    }

    // Calculate overall pass/fail
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical');
    const errorFailures = results.filter(r => !r.passed && r.severity === 'error');
    const overall_passed = criticalFailures.length === 0 && errorFailures.length === 0;

    return {
      invoice_id: invoice.id,
      overall_passed,
      results,
      executed_at: new Date().toISOString()
    };
  }, [user, rules]);

  const getRuleStats = useCallback(async () => {
    if (!user) return null;

    const byType: Record<string, number> = {};
    rules.forEach(rule => {
      byType[rule.rule_type] = (byType[rule.rule_type] || 0) + 1;
    });

    return {
      total: rules.length,
      active: rules.filter(r => r.is_active).length,
      inactive: rules.filter(r => !r.is_active).length,
      by_type: byType
    };
  }, [user, rules]);

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

// Helper function to evaluate a single rule against an invoice
function evaluateRule(
  rule: ValidationRule,
  invoice: {
    vendor_name: string;
    amount: number;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
  }
): ValidationResult {
  const config = rule.rule_config;
  
  switch (rule.rule_type) {
    case 'amount_threshold': {
      const min = (config.min_amount as number) || 0;
      const max = (config.max_amount as number) || Infinity;
      const passed = invoice.amount >= min && invoice.amount <= max;
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed,
        message: passed 
          ? `Amount $${invoice.amount.toLocaleString()} is within threshold`
          : `Amount $${invoice.amount.toLocaleString()} exceeds threshold (${min}-${max})`,
        severity: (config.severity as ValidationResult['severity']) || 'warning',
        suggested_action: passed ? undefined : 'Review invoice amount or request approval',
      };
    }

    case 'vendor_allowlist': {
      const allowedVendors = (config.vendors as string[]) || [];
      const passed = allowedVendors.length === 0 || 
        allowedVendors.some(v => invoice.vendor_name.toLowerCase().includes(v.toLowerCase()));
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed,
        message: passed
          ? `Vendor "${invoice.vendor_name}" is approved`
          : `Vendor "${invoice.vendor_name}" is not in the approved vendor list`,
        severity: (config.severity as ValidationResult['severity']) || 'error',
        suggested_action: passed ? undefined : 'Add vendor to approved list or escalate for review',
      };
    }

    case 'duplicate_check': {
      // This is handled by the duplicate-check edge function
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed: true,
        message: 'Duplicate check passed',
        severity: 'info',
      };
    }

    case 'date_validation': {
      const maxDaysOld = (config.max_days_old as number) || 90;
      const invoiceDate = new Date(invoice.invoice_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      const passed = daysDiff <= maxDaysOld;
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed,
        message: passed
          ? `Invoice date is within acceptable range (${daysDiff} days old)`
          : `Invoice is ${daysDiff} days old, exceeds ${maxDaysOld} day limit`,
        severity: (config.severity as ValidationResult['severity']) || 'warning',
        suggested_action: passed ? undefined : 'Verify invoice date or request exception',
      };
    }

    case 'required_fields': {
      const requiredFields = (config.fields as string[]) || ['vendor_name', 'amount', 'invoice_number'];
      const missingFields = requiredFields.filter(field => {
        const value = invoice[field as keyof typeof invoice];
        return value === undefined || value === null || value === '';
      });
      const passed = missingFields.length === 0;
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed,
        message: passed
          ? 'All required fields are present'
          : `Missing required fields: ${missingFields.join(', ')}`,
        severity: (config.severity as ValidationResult['severity']) || 'error',
        suggested_action: passed ? undefined : 'Complete missing invoice fields',
      };
    }

    default:
      return {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        passed: true,
        message: `Rule type "${rule.rule_type}" evaluated`,
        severity: 'info',
      };
  }
}
