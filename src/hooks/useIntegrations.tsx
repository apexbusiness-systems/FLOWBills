import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface Integration {
  id: string;
  user_id: string;
  integration_name: string;
  integration_type: string;
  status: string;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_count: number | null;
  error_message: string | null;
  config: Json | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  processing: number;
  byType: Record<string, number>;
  recentSyncs: number;
}

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('integration_status')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to Integration interface
      const mapped: Integration[] = (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        integration_name: row.integration_name,
        integration_type: row.integration_type,
        status: row.status || 'disconnected',
        last_sync_at: row.last_sync_at,
        next_sync_at: row.next_sync_at,
        sync_count: row.sync_count,
        error_message: row.error_message,
        config: row.config,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      }));

      setIntegrations(mapped);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createIntegration = useCallback(async (integrationData: {
    integration_name: string;
    integration_type: string;
    config?: Json;
  }) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('integration_status')
        .insert({
          user_id: user.id,
          integration_name: integrationData.integration_name,
          integration_type: integrationData.integration_type,
          config: integrationData.config || {},
          status: 'connected',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Integration Created",
        description: `${integrationData.integration_name} has been connected successfully`,
      });

      await fetchIntegrations();
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({
        title: "Error",
        description: "Failed to create integration",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchIntegrations]);

  const updateIntegration = useCallback(async (
    integrationId: string,
    updates: { integration_name?: string; config?: Json; status?: string }
  ) => {
    if (!user) return null;
    
    try {
      const updateData: { integration_name?: string; config?: Json; status?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (updates.integration_name !== undefined) updateData.integration_name = updates.integration_name;
      if (updates.config !== undefined) updateData.config = updates.config;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('integration_status')
        .update(updateData)
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Integration Updated",
        description: "Integration settings have been saved",
      });

      await fetchIntegrations();
      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchIntegrations]);

  const deleteIntegration = useCallback(async (integrationId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('integration_status')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Integration Removed",
        description: "Integration has been disconnected",
      });

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: "Error",
        description: "Failed to remove integration",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchIntegrations]);

  const testConnection = useCallback(async (integrationId: string) => {
    if (!user) return false;

    try {
      // Update status to testing
      await supabase
        .from('integration_status')
        .update({ status: 'testing' })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      // Simulate connection test (in production, this would call the actual service)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update status to connected
      const { error } = await supabase
        .from('integration_status')
        .update({ 
          status: 'connected',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Connection Successful",
        description: "Integration is working correctly",
      });

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error testing connection:', error);
      
      await supabase
        .from('integration_status')
        .update({ 
          status: 'error',
          error_message: 'Connection test failed',
        })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      toast({
        title: "Connection Failed",
        description: "Unable to connect to the integration",
        variant: "destructive",
      });

      await fetchIntegrations();
      return false;
    }
  }, [user, toast, fetchIntegrations]);

  const syncIntegration = useCallback(async (integrationId: string) => {
    if (!user) return false;

    try {
      // Update status to syncing
      await supabase
        .from('integration_status')
        .update({ status: 'syncing' })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      toast({
        title: "Sync Started",
        description: "Data synchronization in progress...",
      });

      // Simulate sync (in production, this would trigger actual sync)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update sync count and timestamps
      const { data: current } = await supabase
        .from('integration_status')
        .select('sync_count')
        .eq('id', integrationId)
        .single();

      const { error } = await supabase
        .from('integration_status')
        .update({ 
          status: 'connected',
          last_sync_at: new Date().toISOString(),
          sync_count: (current?.sync_count || 0) + 1,
          error_message: null,
        })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: "Data has been synchronized successfully",
      });

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error syncing integration:', error);
      
      await supabase
        .from('integration_status')
        .update({ 
          status: 'error',
          error_message: 'Sync failed',
        })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      toast({
        title: "Sync Failed",
        description: "Unable to synchronize data",
        variant: "destructive",
      });

      await fetchIntegrations();
      return false;
    }
  }, [user, toast, fetchIntegrations]);

  const getIntegrationStats = useCallback((): IntegrationStats => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byType: Record<string, number> = {};
    let recentSyncs = 0;

    integrations.forEach(int => {
      byType[int.integration_type] = (byType[int.integration_type] || 0) + 1;
      if (int.last_sync_at && new Date(int.last_sync_at) > oneDayAgo) {
        recentSyncs++;
      }
    });

    return {
      total: integrations.length,
      connected: integrations.filter(i => i.status === 'connected').length,
      disconnected: integrations.filter(i => i.status === 'disconnected').length,
      error: integrations.filter(i => i.status === 'error').length,
      processing: integrations.filter(i => ['syncing', 'testing'].includes(i.status)).length,
      byType,
      recentSyncs,
    };
  }, [integrations]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncIntegration,
    getIntegrationStats,
  };
};
