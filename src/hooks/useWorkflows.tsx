import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface WorkflowStep {
  id: string;
  type: 'validation' | 'approval' | 'notification' | 'integration';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  current_step: number;
  step_data: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWorkflows = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our Workflow interface
      const typedWorkflows = (data || []).map(item => ({
        ...item,
        steps: Array.isArray(item.steps) ? item.steps as unknown as WorkflowStep[] : [],
      })) as Workflow[];
      
      setWorkflows(typedWorkflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflows",
        variant: "destructive",
      });
    }
  };

  const fetchInstances = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our WorkflowInstance interface
      const typedInstances = (data || []).map(item => ({
        ...item,
        status: item.status as 'running' | 'completed' | 'failed' | 'paused',
        step_data: typeof item.step_data === 'object' ? item.step_data as Record<string, any> : {},
      })) as WorkflowInstance[];
      
      setInstances(typedInstances);
    } catch (error) {
      console.error('Error fetching workflow instances:', error);
    }
  };

  const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: workflow.name,
          description: workflow.description,
          workflow_type: workflow.workflow_type,
          steps: workflow.steps as any, // Cast to any for JSONB storage
          is_active: workflow.is_active,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const typedWorkflow = {
        ...data,
        steps: Array.isArray(data.steps) ? data.steps as unknown as WorkflowStep[] : [],
      } as Workflow;

      setWorkflows(prev => [typedWorkflow, ...prev]);
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });

      return typedWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.workflow_type) updateData.workflow_type = updates.workflow_type;
      if (updates.steps) updateData.steps = updates.steps as any; // Cast to any for JSONB storage
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('workflows')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const typedWorkflow = {
        ...data,
        steps: Array.isArray(data.steps) ? data.steps as unknown as WorkflowStep[] : [],
      } as Workflow;

      setWorkflows(prev => prev.map(w => w.id === id ? typedWorkflow : w));
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });

      return typedWorkflow;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const executeWorkflow = async (workflowId: string, entityType: string, entityId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .insert({
          workflow_id: workflowId,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id,
          status: 'running',
          current_step: 0,
          step_data: {},
        })
        .select()
        .single();

      if (error) throw error;

      const typedInstance = {
        ...data,
        status: data.status as 'running' | 'completed' | 'failed' | 'paused',
        step_data: typeof data.step_data === 'object' ? data.step_data as Record<string, any> : {},
      } as WorkflowInstance;

      setInstances(prev => [typedInstance, ...prev]);
      toast({
        title: "Success",
        description: "Workflow started successfully",
      });

      return typedInstance;
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to start workflow",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchWorkflows(), fetchInstances()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  return {
    workflows,
    instances,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    refetch: () => Promise.all([fetchWorkflows(), fetchInstances()]),
  };
};