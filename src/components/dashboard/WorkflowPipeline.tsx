import { 
  FileText, 
  CheckCircle, 
  Users, 
  CreditCard, 
  Send,
  ArrowRight,
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const workflowSteps = [
  {
    id: "inbox",
    title: "Inbox",
    description: "Invoice ingestion and validation",
    icon: FileText,
    count: 24,
    status: "active",
    color: "bg-status-processing"
  },
  {
    id: "validate",
    title: "Validate",
    description: "Data validation and mapping",
    icon: CheckCircle,
    count: 8,
    status: "active", 
    color: "bg-status-pending"
  },
  {
    id: "match",
    title: "Match",
    description: "PO and field ticket matching",
    icon: Users,
    count: 12,
    status: "attention",
    color: "bg-destructive"
  },
  {
    id: "approve",
    title: "Approve",
    description: "Review and approval workflow",
    icon: CheckCircle,
    count: 6,
    status: "active",
    color: "bg-status-approved"
  },
  {
    id: "pay",
    title: "Pay",
    description: "Payment processing and batching",
    icon: CreditCard,
    count: 18,
    status: "completed",
    color: "bg-status-approved"
  },
  {
    id: "remit",
    title: "Remit",
    description: "Remittance and reconciliation",
    icon: Send,
    count: 15,
    status: "completed",
    color: "bg-status-approved"
  }
];

const WorkflowPipeline = () => {
  const navigate = useNavigate();

  return (
    <div className="card-enterprise">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Invoice Processing Pipeline
        </h3>
        <p className="text-sm text-muted-foreground">
          Track invoices through the complete billing workflow
        </p>
        <Progress value={72} className="mt-3" />
        <p className="text-xs text-muted-foreground mt-1">
          72% of invoices processed successfully this period
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === workflowSteps.length - 1;
          
          return (
            <div key={step.id} className="relative">
              <Button
                variant="ghost"
                className="h-auto w-full flex-col gap-3 p-4 border border-border hover:border-primary/50 group"
                aria-label={`${step.title}: ${step.description}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    {step.status === "attention" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className={`h-6 w-6 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {step.count}
                  </div>
                </div>
                
                <div className="text-left w-full">
                  <h4 className="font-medium text-sm text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </Button>
              
              {!isLast && (
                <ArrowRight className="absolute top-1/2 -right-2 h-4 w-4 text-muted-foreground transform -translate-y-1/2 hidden xl:block" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Next milestone: <span className="font-medium text-foreground">Monthly JIB reconciliation</span>
          </div>
          <Button size="sm" className="btn-primary" onClick={() => navigate('/invoices?tab=workflow')}>
            View Full Pipeline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPipeline;