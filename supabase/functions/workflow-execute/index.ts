import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'contains' | 'in';
  value: any;
}

interface WorkflowStep {
  id: string;
  type: 'validation' | 'approval' | 'notification' | 'integration' | 'condition';
  name: string;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  position: { x: number; y: number };
  connections: string[];
  true_connection?: string;
  false_connection?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { workflow_id, entity_type, entity_id } = await req.json();

    // Fetch workflow
    const { data: workflow, error: workflowError } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('id', workflow_id)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.is_active) {
      throw new Error('Workflow is not active');
    }

    // Fetch entity data (invoice, AFE, etc.)
    let entityData: any = null;
    if (entity_type === 'invoice') {
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('*, invoice_extractions(*), afes(*)')
        .eq('id', entity_id)
        .single();

      if (invoiceError) throw invoiceError;
      entityData = invoice;
    }

    // Create workflow instance
    const { data: instance, error: instanceError } = await supabaseClient
      .from('workflow_instances')
      .insert({
        user_id: user.id,
        workflow_id,
        entity_type,
        entity_id,
        status: 'running',
        current_step: 0,
        step_data: {},
      })
      .select()
      .single();

    if (instanceError) throw instanceError;

    // Execute workflow steps
    const steps = workflow.steps as WorkflowStep[];
    let currentStepIndex = 0;
    let currentStep: WorkflowStep | null = steps[currentStepIndex] || null;
    const stepResults: any = {};

    while (currentStep) {
      console.log(`Executing step: ${currentStep.name} (${currentStep.type})`);

      try {
        switch (currentStep.type) {
          case 'condition':
            // Evaluate conditions
            const conditionResult = evaluateConditions(currentStep.conditions || [], entityData);
            stepResults[currentStep.id] = { passed: conditionResult };

            // Determine next step based on condition
            const nextStepId = conditionResult ? currentStep.true_connection : currentStep.false_connection;
            if (nextStepId) {
              const nextStepIndex = steps.findIndex(s => s.id === nextStepId);
              currentStepIndex = nextStepIndex >= 0 ? nextStepIndex : -1;
            } else {
              currentStepIndex = -1;
            }
            break;

          case 'validation':
            // Run validation rules
            const validationResult = await runValidation(currentStep.config, entityData, supabaseClient);
            stepResults[currentStep.id] = validationResult;

            // Move to next step
            if (currentStep.connections && currentStep.connections.length > 0) {
              const nextStepIndex = steps.findIndex(s => s.id === currentStep!.connections[0]);
              currentStepIndex = nextStepIndex >= 0 ? nextStepIndex : -1;
            } else {
              currentStepIndex = -1;
            }
            break;

          case 'approval':
            // Create approval task
            stepResults[currentStep.id] = { approval_required: true, approver_role: currentStep.config.approver_role };
            
            // Update invoice status to pending approval
            if (entity_type === 'invoice') {
              await supabaseClient
                .from('invoices')
                .update({ status: 'pending_approval' })
                .eq('id', entity_id);
            }

            // Move to next step
            if (currentStep.connections && currentStep.connections.length > 0) {
              const nextStepIndex = steps.findIndex(s => s.id === currentStep!.connections[0]);
              currentStepIndex = nextStepIndex >= 0 ? nextStepIndex : -1;
            } else {
              currentStepIndex = -1;
            }
            break;

          case 'notification':
            // Send notification (stub for now)
            stepResults[currentStep.id] = { notified: true, template: currentStep.config.template };
            
            // Move to next step
            if (currentStep.connections && currentStep.connections.length > 0) {
              const nextStepIndex = steps.findIndex(s => s.id === currentStep!.connections[0]);
              currentStepIndex = nextStepIndex >= 0 ? nextStepIndex : -1;
            } else {
              currentStepIndex = -1;
            }
            break;

          case 'integration':
            // External integration (stub for now)
            stepResults[currentStep.id] = { integrated: true };
            
            // Move to next step
            if (currentStep.connections && currentStep.connections.length > 0) {
              const nextStepIndex = steps.findIndex(s => s.id === currentStep!.connections[0]);
              currentStepIndex = nextStepIndex >= 0 ? nextStepIndex : -1;
            } else {
              currentStepIndex = -1;
            }
            break;

          default:
            console.warn(`Unknown step type: ${currentStep.type}`);
            currentStepIndex = -1;
        }

        // Update instance progress
        await supabaseClient
          .from('workflow_instances')
          .update({
            current_step: currentStepIndex,
            step_data: stepResults,
          })
          .eq('id', instance.id);

      } catch (stepError: any) {
        console.error(`Error executing step ${currentStep.name}:`, stepError);
        stepResults[currentStep.id] = { error: stepError.message };
        
        // Mark instance as failed
        await supabaseClient
          .from('workflow_instances')
          .update({
            status: 'failed',
            step_data: stepResults,
          })
          .eq('id', instance.id);

        throw stepError;
      }

      // Get next step
      currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    }

    // Mark instance as completed
    await supabaseClient
      .from('workflow_instances')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        step_data: stepResults,
      })
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance_id: instance.id,
        results: stepResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to evaluate conditions
function evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const fieldValue = getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      case 'not_equals':
        return fieldValue != condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'greater_or_equal':
        return Number(fieldValue) >= Number(condition.value);
      case 'less_or_equal':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  });
}

// Helper to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Run validation rules
async function runValidation(config: any, data: any, supabaseClient: any): Promise<any> {
  const results: any = { valid: true, errors: [] };

  // Example validations
  if (config.check_amount && data.amount) {
    if (data.amount < 0) {
      results.valid = false;
      results.errors.push('Amount cannot be negative');
    }
  }

  if (config.check_vendor && data.vendor_name) {
    // Could check against approved vendor list
    if (!data.vendor_name.trim()) {
      results.valid = false;
      results.errors.push('Vendor name is required');
    }
  }

  if (config.check_afe_budget && data.invoice_extractions?.length > 0) {
    const extraction = data.invoice_extractions[0];
    if (extraction.budget_status === 'over_budget') {
      results.valid = false;
      results.errors.push('Invoice exceeds AFE budget');
    }
  }

  return results;
}
