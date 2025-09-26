import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflows, Workflow } from '@/hooks/useWorkflows';
import WorkflowList from '@/components/workflow/WorkflowList';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import WorkflowTemplates from '@/components/workflow/WorkflowTemplates';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'list' | 'builder' | 'templates';

const Workflows = () => {
  const { workflows, instances, loading, createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflows();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setViewMode('builder');
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setViewMode('builder');
  };

  const handleSaveWorkflow = async (workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingWorkflow) {
        await updateWorkflow(editingWorkflow.id, workflowData);
      } else {
        await createWorkflow(workflowData);
      }
      setViewMode('list');
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(id);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateWorkflow(id, { is_active: isActive });
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    // For demo purposes, we'll use a dummy entity
    await executeWorkflow(workflowId, 'invoice', 'demo-entity-id');
  };

  const handleSelectTemplate = (template: any) => {
    setEditingWorkflow({
      id: '',
      name: template.name,
      description: template.description,
      workflow_type: 'invoice_processing',
      steps: template.steps,
      is_active: true,
      created_at: '',
      updated_at: '',
    });
    setViewMode('builder');
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingWorkflow(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'builder') {
    return (
      <div className="h-screen">
        <WorkflowBuilder
          workflow={editingWorkflow || undefined}
          onSave={handleSaveWorkflow}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === 'templates') {
    return (
      <div className="container mx-auto p-6">
        <WorkflowTemplates onSelectTemplate={handleSelectTemplate} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates" onClick={() => setViewMode('templates')}>Templates</TabsTrigger>
          <TabsTrigger value="instances">Running Instances</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowList
            workflows={workflows}
            instances={instances}
            onEdit={handleEditWorkflow}
            onDelete={handleDeleteWorkflow}
            onToggleActive={handleToggleActive}
            onExecute={handleExecuteWorkflow}
            onCreate={handleCreateWorkflow}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <WorkflowTemplates onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="instances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map(instance => (
              <div key={instance.id} className="card-enterprise p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Instance {instance.id.slice(0, 8)}</h3>
                  <span className={`px-2 py-1 rounded text-xs text-white ${
                    instance.status === 'running' ? 'bg-status-processing' :
                    instance.status === 'completed' ? 'bg-status-approved' :
                    instance.status === 'failed' ? 'bg-destructive' : 'bg-status-pending'
                  }`}>
                    {instance.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Step {instance.current_step + 1}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started {new Date(instance.started_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Workflows;