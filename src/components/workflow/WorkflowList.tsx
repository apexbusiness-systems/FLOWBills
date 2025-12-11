import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Search,
  Plus,
  Activity,
  Clock
} from 'lucide-react';
import { Workflow, WorkflowInstance } from '@/hooks/useWorkflows';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowListProps {
  workflows: Workflow[];
  instances: WorkflowInstance[];
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onExecute: (workflowId: string) => void;
  onCreate: () => void;
}

const WorkflowList = ({ 
  workflows, 
  instances, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onExecute,
  onCreate 
}: WorkflowListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || workflow.workflow_type === filterType;
    return matchesSearch && matchesType;
  });

  const getWorkflowInstances = (workflowId: string) => {
    return instances.filter(instance => instance.workflow_id === workflowId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-status-processing';
      case 'completed': return 'bg-status-approved';
      case 'failed': return 'bg-destructive';
      case 'paused': return 'bg-status-pending';
      default: return 'bg-secondary';
    }
  };

  const workflowTypes = [...new Set(workflows.map(w => w.workflow_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workflows</h2>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows
          </p>
        </div>
        <Button onClick={onCreate} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {filterType === 'all' ? 'All Types' : filterType.replace('_', ' ')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              All Types
            </DropdownMenuItem>
            {workflowTypes.map(type => (
              <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                {type.replace('_', ' ')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={onCreate}>
                  Create Workflow
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map(workflow => {
            const workflowInstances = getWorkflowInstances(workflow.id);
            const runningInstances = workflowInstances.filter(i => i.status === 'running').length;
            const completedInstances = workflowInstances.filter(i => i.status === 'completed').length;
            const lastRun = workflowInstances[0]?.started_at;

            return (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <Badge 
                          variant={workflow.is_active ? "default" : "secondary"}
                          className={workflow.is_active ? "bg-status-approved" : ""}
                        >
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {workflow.description || 'No description'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {workflow.workflow_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(workflow)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onToggleActive(workflow.id, !workflow.is_active)}
                        >
                          {workflow.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(workflow.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Steps</div>
                        <div className="font-semibold">{workflow.steps.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Runs</div>
                        <div className="font-semibold">{workflowInstances.length}</div>
                      </div>
                    </div>

                    {/* Instance Status */}
                    {workflowInstances.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <div className="flex gap-1">
                            {runningInstances > 0 && (
                              <Badge className="bg-status-processing text-white text-xs">
                                {runningInstances} running
                              </Badge>
                            )}
                            {completedInstances > 0 && (
                              <Badge className="bg-status-approved text-white text-xs">
                                {completedInstances} completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        {lastRun && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Last run {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onEdit(workflow)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => onExecute(workflow.id)}
                        disabled={!workflow.is_active}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;