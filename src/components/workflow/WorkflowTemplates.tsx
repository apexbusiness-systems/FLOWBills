import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Clock,
  Users,
  Settings
} from 'lucide-react';
import { WorkflowStep } from '@/hooks/useWorkflows';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  steps: WorkflowStep[];
  estimatedTime: string;
  complexity: 'Simple' | 'Medium' | 'Advanced';
}

interface WorkflowTemplatesProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const templates: WorkflowTemplate[] = [
  {
    id: 'invoice-approval',
    name: 'Invoice Approval Workflow',
    description: 'Standard invoice processing with validation and approval steps',
    category: 'Invoice Processing',
    icon: FileText,
    estimatedTime: '2-5 minutes',
    complexity: 'Simple',
    steps: [
      {
        id: 'validate-invoice',
        type: 'validation',
        name: 'Validate Invoice Data',
        config: { rules: ['amount_check', 'vendor_verification'] },
        position: { x: 100, y: 100 },
        connections: ['approve-invoice'],
      },
      {
        id: 'approve-invoice',
        type: 'approval',
        name: 'Manager Approval',
        config: { approver_role: 'manager', threshold: 10000 },
        position: { x: 300, y: 100 },
        connections: ['send-notification'],
      },
      {
        id: 'send-notification',
        type: 'notification',
        name: 'Approval Notification',
        config: { template: 'invoice_approved', recipients: ['finance'] },
        position: { x: 500, y: 100 },
        connections: [],
      },
    ],
  },
  {
    id: 'exception-handling',
    name: 'Exception Resolution',
    description: 'Automated exception detection and resolution workflow',
    category: 'Exception Management',
    icon: AlertTriangle,
    estimatedTime: '1-3 minutes',
    complexity: 'Medium',
    steps: [
      {
        id: 'detect-exception',
        type: 'validation',
        name: 'Exception Detection',
        config: { auto_detect: true, severity_threshold: 'medium' },
        position: { x: 100, y: 100 },
        connections: ['categorize-exception'],
      },
      {
        id: 'categorize-exception',
        type: 'validation',
        name: 'Categorize Exception',
        config: { categories: ['data_mismatch', 'missing_po', 'validation_error'] },
        position: { x: 300, y: 100 },
        connections: ['auto-resolve'],
      },
      {
        id: 'auto-resolve',
        type: 'integration',
        name: 'Auto Resolution',
        config: { resolution_rules: 'standard', fallback_to_manual: true },
        position: { x: 500, y: 100 },
        connections: ['notify-resolution'],
      },
      {
        id: 'notify-resolution',
        type: 'notification',
        name: 'Resolution Notice',
        config: { template: 'exception_resolved' },
        position: { x: 700, y: 100 },
        connections: [],
      },
    ],
  },
  {
    id: 'compliance-check',
    name: 'Compliance Verification',
    description: 'Automated compliance checking with reporting',
    category: 'Compliance',
    icon: CheckCircle,
    estimatedTime: '3-7 minutes',
    complexity: 'Advanced',
    steps: [
      {
        id: 'collect-documents',
        type: 'integration',
        name: 'Document Collection',
        config: { sources: ['nov_api', 'jib_system'], document_types: ['permits', 'certificates'] },
        position: { x: 100, y: 100 },
        connections: ['verify-compliance'],
      },
      {
        id: 'verify-compliance',
        type: 'validation',
        name: 'Compliance Check',
        config: { standards: ['railroad_commission', 'environmental'], strict_mode: true },
        position: { x: 300, y: 100 },
        connections: ['generate-report'],
      },
      {
        id: 'generate-report',
        type: 'integration',
        name: 'Generate Report',
        config: { format: 'pdf', include_recommendations: true },
        position: { x: 500, y: 100 },
        connections: ['review-approval'],
      },
      {
        id: 'review-approval',
        type: 'approval',
        name: 'Compliance Review',
        config: { approver_role: 'compliance_officer' },
        position: { x: 700, y: 100 },
        connections: [],
      },
    ],
  },
  {
    id: 'integration-sync',
    name: 'System Integration Sync',
    description: 'Automated data synchronization between systems',
    category: 'Integration',
    icon: Zap,
    estimatedTime: '5-10 minutes',
    complexity: 'Advanced',
    steps: [
      {
        id: 'fetch-data',
        type: 'integration',
        name: 'Fetch External Data',
        config: { sources: ['nov_api'], batch_size: 100 },
        position: { x: 100, y: 100 },
        connections: ['validate-data'],
      },
      {
        id: 'validate-data',
        type: 'validation',
        name: 'Data Validation',
        config: { schema_validation: true, duplicate_check: true },
        position: { x: 300, y: 100 },
        connections: ['transform-data'],
      },
      {
        id: 'transform-data',
        type: 'integration',
        name: 'Data Transformation',
        config: { mapping_rules: 'standard', normalize: true },
        position: { x: 500, y: 100 },
        connections: ['sync-complete'],
      },
      {
        id: 'sync-complete',
        type: 'notification',
        name: 'Sync Notification',
        config: { template: 'sync_complete', include_stats: true },
        position: { x: 700, y: 100 },
        connections: [],
      },
    ],
  },
];

const WorkflowTemplates = ({ onSelectTemplate }: WorkflowTemplatesProps) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-status-approved';
      case 'Medium': return 'bg-status-pending';
      case 'Advanced': return 'bg-status-processing';
      default: return 'bg-secondary';
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Workflow Templates</h2>
        <p className="text-muted-foreground">
          Start with pre-built templates or create your own custom workflow
        </p>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 text-foreground">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter(template => template.category === category)
              .map(template => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge 
                              variant="secondary"
                              className={`mt-1 text-white ${getComplexityColor(template.complexity)}`}
                            >
                              {template.complexity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {template.estimatedTime}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Settings className="h-4 w-4" />
                            {template.steps.length} steps
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {template.steps.slice(0, 3).map((step, index) => (
                            <Badge key={step.id} variant="outline" className="text-xs">
                              {step.name}
                            </Badge>
                          ))}
                          {template.steps.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.steps.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => onSelectTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowTemplates;