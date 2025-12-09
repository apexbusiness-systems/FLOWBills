import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface WorkflowCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "greater_or_equal"
    | "less_or_equal"
    | "contains"
    | "in";
  value: any;
}

export interface WorkflowStep {
  id: string;
  type: "validation" | "approval" | "notification" | "integration" | "condition";
  name: string;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  position: { x: number; y: number };
  connections: string[];
  true_connection?: string; // For condition steps
  false_connection?: string; // For condition steps
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
  status: "running" | "completed" | "failed" | "paused";
  current_step: number;
  step_data: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWorkflows = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkflows((data || []) as unknown as Workflow[]);
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      toast({
        title: "Error",
        description: "Failed to fetch workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workflow_instances")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setInstances((data || []) as unknown as WorkflowInstance[]);
    } catch (error: any) {
      console.error("Error fetching instances:", error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (
    workflowData: Omit<Workflow, "id" | "created_at" | "updated_at">
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("workflows")
        .insert({
          user_id: user.id,
          name: workflowData.name,
          description: workflowData.description,
          workflow_type: workflowData.workflow_type,
          steps: workflowData.steps as any,
          is_active: workflowData.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Workflow Created",
        description: `Workflow "${workflowData.name}" has been created successfully`,
      });

      await fetchWorkflows();
      return data;
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Workflow Updated",
      description: "Workflow has been updated successfully (stub implementation)",
    });

    return true;
  };

  const deleteWorkflow = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Workflow Deleted",
        description: "Workflow has been deleted successfully",
      });

      await fetchWorkflows();
      return true;
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
      return false;
    }
  };

  const startWorkflow = async (workflowId: string, entityType: string, entityId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("workflow-execute", {
        body: {
          workflow_id: workflowId,
          entity_type: entityType,
          entity_id: entityId,
        },
      });

      if (error) throw error;

      toast({
        title: "Workflow Started",
        description: "Workflow instance has been started successfully",
      });

      await fetchInstances();
      return data;
    } catch (error: any) {
      console.error("Error starting workflow:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start workflow",
        variant: "destructive",
      });
      return null;
    }
  };

  const pauseWorkflow = async (instanceId: string) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Workflow Paused",
      description: "Workflow instance has been paused (stub implementation)",
    });

    return true;
  };

  const resumeWorkflow = async (instanceId: string) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Workflow Resumed",
      description: "Workflow instance has been resumed (stub implementation)",
    });

    return true;
  };

  const cancelWorkflow = async (instanceId: string) => {
    if (!user) return false;

    // Stub implementation
    toast({
      title: "Workflow Cancelled",
      description: "Workflow instance has been cancelled (stub implementation)",
    });

    return true;
  };

  // Legacy API kept for compatibility - executeWorkflow is alias for startWorkflow
  const executeWorkflow = startWorkflow;

  const getWorkflowTemplates = () => {
    // Return predefined workflow templates
    return [
      {
        name: "Invoice Processing",
        description: "Standard invoice validation and approval workflow",
        workflow_type: "invoice_processing",
        steps: [
          {
            id: "validate",
            type: "validation" as const,
            name: "Validate Invoice",
            config: { rules: ["amount_check", "vendor_check"] },
            position: { x: 100, y: 100 },
            connections: ["approve"],
          },
          {
            id: "approve",
            type: "approval" as const,
            name: "Approval Required",
            config: { threshold: 1000 },
            position: { x: 300, y: 100 },
            connections: ["notify"],
          },
          {
            id: "notify",
            type: "notification" as const,
            name: "Send Notification",
            config: { recipients: ["finance@company.com"] },
            position: { x: 500, y: 100 },
            connections: [],
          },
        ],
      },
      {
        name: "Compliance Check",
        description: "Regulatory compliance verification workflow",
        workflow_type: "compliance",
        steps: [
          {
            id: "check_compliance",
            type: "validation" as const,
            name: "Compliance Check",
            config: { regulations: ["SOX", "GDPR"] },
            position: { x: 100, y: 100 },
            connections: ["audit"],
          },
          {
            id: "audit",
            type: "approval" as const,
            name: "Audit Review",
            config: { department: "compliance" },
            position: { x: 300, y: 100 },
            connections: [],
          },
        ],
      },
    ];
  };

  useEffect(() => {
    if (user) {
      fetchWorkflows();
      fetchInstances();
    }
  }, [user]);

  return {
    workflows,
    instances,
    loading,
    fetchWorkflows,
    fetchInstances,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    startWorkflow,
    executeWorkflow, // Legacy alias for startWorkflow
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    getWorkflowTemplates,
  };
};
