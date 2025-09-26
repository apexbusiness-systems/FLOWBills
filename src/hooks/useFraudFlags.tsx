import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FraudFlag {
  id: string;
  entity_type: 'invoice' | 'vendor';
  entity_id: string;
  flag_type: string;
  risk_score: number;
  details: Record<string, any>;
  status: 'open' | 'resolved' | 'false_positive';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface FraudStats {
  total_flags: number;
  open_flags: number;
  resolved_flags: number;
  false_positives: number;
  high_risk_flags: number;
  flags_by_type: Record<string, number>;
}

export const useFraudFlags = () => {
  const { user } = useAuth();
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFraudFlags = async (filters?: {
    entity_type?: string;
    status?: string;
    risk_threshold?: number;
  }) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('fraud_flags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.risk_threshold) {
        query = query.gte('risk_score', filters.risk_threshold);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setFraudFlags((data as FraudFlag[]) || []);
    } catch (error) {
      console.error('Error fetching fraud flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFraudFlag = async (flagData: {
    entity_type: 'invoice' | 'vendor';
    entity_id: string;
    flag_type: string;
    risk_score: number;
    details: Record<string, any>;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fraud_flags')
        .insert([flagData])
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      setFraudFlags(prev => [data as FraudFlag, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating fraud flag:', error);
      return null;
    }
  };

  const resolveFraudFlag = async (
    flagId: string,
    resolution: 'resolved' | 'false_positive',
    notes?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fraud_flags')
        .update({
          status: resolution,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          details: notes ? { ...fraudFlags.find(f => f.id === flagId)?.details, resolution_notes: notes } : undefined
        })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setFraudFlags(prev => 
        prev.map(flag => 
          flag.id === flagId ? (data as FraudFlag) : flag
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error resolving fraud flag:', error);
      return null;
    }
  };

  const checkVendorForFraud = async (vendorData: {
    bank_account?: string;
    tax_id?: string;
    vendor_name: string;
  }) => {
    if (!user) return { flags: [], risk_score: 0 };

    try {
      const flags: string[] = [];
      let riskScore = 0;

      // Check for duplicate bank accounts
      if (vendorData.bank_account) {
        const { data: duplicateBankVendors } = await supabase
          .from('vendors')
          .select('id, vendor_name')
          .eq('bank_account', vendorData.bank_account);

        if (duplicateBankVendors && duplicateBankVendors.length > 0) {
          flags.push(`Bank account shared with ${duplicateBankVendors.length} other vendors`);
          riskScore += 30;
        }
      }

      // Check for duplicate tax IDs
      if (vendorData.tax_id) {
        const { data: duplicateTaxVendors } = await supabase
          .from('vendors')
          .select('id, vendor_name')
          .eq('tax_id', vendorData.tax_id);

        if (duplicateTaxVendors && duplicateTaxVendors.length > 0) {
          flags.push(`Tax ID shared with ${duplicateTaxVendors.length} other vendors`);
          riskScore += 40;
        }
      }

      // Check for similar vendor names (basic fuzzy matching)
      const { data: similarNameVendors } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .ilike('vendor_name', `%${vendorData.vendor_name.split(' ')[0]}%`);

      if (similarNameVendors && similarNameVendors.length > 1) {
        flags.push(`Similar vendor names found in database`);
        riskScore += 20;
      }

      return { flags, risk_score: Math.min(riskScore, 100) };
    } catch (error) {
      console.error('Error checking vendor for fraud:', error);
      return { flags: [], risk_score: 0 };
    }
  };

  const getFraudStats = async (): Promise<FraudStats | null> => {
    if (!user) return null;

    try {
      const { data: allFlags } = await supabase
        .from('fraud_flags')
        .select('*');

      if (!allFlags) return null;

      const flagsByType: Record<string, number> = {};
      allFlags.forEach(flag => {
        flagsByType[flag.flag_type] = (flagsByType[flag.flag_type] || 0) + 1;
      });

      return {
        total_flags: allFlags.length,
        open_flags: allFlags.filter(f => f.status === 'open').length,
        resolved_flags: allFlags.filter(f => f.status === 'resolved').length,
        false_positives: allFlags.filter(f => f.status === 'false_positive').length,
        high_risk_flags: allFlags.filter(f => f.risk_score >= 70).length,
        flags_by_type: flagsByType,
      };
    } catch (error) {
      console.error('Error getting fraud stats:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchFraudFlags();
    }
  }, [user]);

  return {
    fraudFlags,
    loading,
    fetchFraudFlags,
    createFraudFlag,
    resolveFraudFlag,
    checkVendorForFraud,
    getFraudStats,
  };
};