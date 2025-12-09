import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, CheckCircle2, Settings } from "lucide-react";
import { WorkflowStep } from "@/hooks/useWorkflows";

interface ApprovalWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  steps: WorkflowStep[];
  complexity: "Simple" | "Medium" | "Advanced";
}

interface ApprovalWorkflowTemplatesProps {
  onSelectTemplate: (template: ApprovalWorkflowTemplate) => void;
}

const approvalTemplates: ApprovalWorkflowTemplate[] = [
  {
    id: "amount-based-approval",
    name: "Amount-Based Approval",
    description: "Route invoices to different approvers based on invoice amount thresholds",
    icon: DollarSign,
    complexity: "Simple",
    steps: [
      {
        id: "check-amount",
        type: "condition",
        name: "Check Invoice Amount",
        config: {},
        conditions: [{ field: "amount", operator: "greater_than", value: 10000 }],
        position: { x: 100, y: 100 },
        connections: [],
        true_connection: "high-amount-approval",
        false_connection: "low-amount-approval",
      },
      {
        id: "high-amount-approval",
        type: "approval",
        name: "Director Approval",
        config: { approver_role: "director", threshold: 10000 },
        position: { x: 300, y: 50 },
        connections: ["send-notification"],
      },
      {
        id: "low-amount-approval",
        type: "approval",
        name: "Manager Approval",
        config: { approver_role: "manager", threshold: 10000 },
        position: { x: 300, y: 150 },
        connections: ["send-notification"],
      },
      {
        id: "send-notification",
        type: "notification",
        name: "Approval Notification",
        config: { template: "invoice_approved" },
        position: { x: 500, y: 100 },
        connections: [],
      },
    ],
  },
  {
    id: "afe-budget-check",
    name: "AFE Budget Validation",
    description: "Validate invoice against AFE budget and route based on budget status",
    icon: TrendingUp,
    complexity: "Medium",
    steps: [
      {
        id: "check-afe-status",
        type: "condition",
        name: "Check AFE Budget Status",
        config: {},
        conditions: [
          { field: "invoice_extractions.budget_status", operator: "equals", value: "over_budget" },
        ],
        position: { x: 100, y: 100 },
        connections: [],
        true_connection: "budget-exception",
        false_connection: "normal-approval",
      },
      {
        id: "budget-exception",
        type: "approval",
        name: "Budget Exception Approval",
        config: { approver_role: "cfo", reason: "over_budget" },
        position: { x: 300, y: 50 },
        connections: ["exception-notification"],
      },
      {
        id: "normal-approval",
        type: "approval",
        name: "Standard Approval",
        config: { approver_role: "manager" },
        position: { x: 300, y: 150 },
        connections: ["standard-notification"],
      },
      {
        id: "exception-notification",
        type: "notification",
        name: "Budget Exception Alert",
        config: { template: "budget_exception", recipients: ["finance", "project_manager"] },
        position: { x: 500, y: 50 },
        connections: [],
      },
      {
        id: "standard-notification",
        type: "notification",
        name: "Standard Notification",
        config: { template: "invoice_approved" },
        position: { x: 500, y: 150 },
        connections: [],
      },
    ],
  },
  {
    id: "vendor-type-routing",
    name: "Vendor Type Routing",
    description: "Route invoices to specialized approvers based on vendor type",
    icon: Users,
    complexity: "Simple",
    steps: [
      {
        id: "check-vendor-type",
        type: "condition",
        name: "Identify Vendor Type",
        config: {},
        conditions: [{ field: "vendor_name", operator: "contains", value: "drilling" }],
        position: { x: 100, y: 100 },
        connections: [],
        true_connection: "drilling-approval",
        false_connection: "general-approval",
      },
      {
        id: "drilling-approval",
        type: "approval",
        name: "Drilling Operations Approval",
        config: { approver_role: "drilling_manager" },
        position: { x: 300, y: 50 },
        connections: ["send-notification"],
      },
      {
        id: "general-approval",
        type: "approval",
        name: "General Approval",
        config: { approver_role: "manager" },
        position: { x: 300, y: 150 },
        connections: ["send-notification"],
      },
      {
        id: "send-notification",
        type: "notification",
        name: "Approval Complete",
        config: { template: "invoice_approved" },
        position: { x: 500, y: 100 },
        connections: [],
      },
    ],
  },
  {
    id: "multi-condition-approval",
    name: "Multi-Condition Approval",
    description: "Complex approval routing based on amount, AFE budget, and vendor",
    icon: Settings,
    complexity: "Advanced",
    steps: [
      {
        id: "check-high-amount",
        type: "condition",
        name: "Check High Amount",
        config: {},
        conditions: [{ field: "amount", operator: "greater_than", value: 50000 }],
        position: { x: 100, y: 100 },
        connections: [],
        true_connection: "executive-approval",
        false_connection: "check-afe-budget",
      },
      {
        id: "check-afe-budget",
        type: "condition",
        name: "Check AFE Budget",
        config: {},
        conditions: [
          { field: "invoice_extractions.budget_status", operator: "equals", value: "over_budget" },
        ],
        position: { x: 300, y: 150 },
        connections: [],
        true_connection: "budget-approval",
        false_connection: "standard-approval",
      },
      {
        id: "executive-approval",
        type: "approval",
        name: "Executive Approval",
        config: { approver_role: "cfo", reason: "high_amount" },
        position: { x: 500, y: 50 },
        connections: ["final-notification"],
      },
      {
        id: "budget-approval",
        type: "approval",
        name: "Budget Exception Approval",
        config: { approver_role: "director", reason: "over_budget" },
        position: { x: 500, y: 120 },
        connections: ["final-notification"],
      },
      {
        id: "standard-approval",
        type: "approval",
        name: "Standard Approval",
        config: { approver_role: "manager" },
        position: { x: 500, y: 190 },
        connections: ["final-notification"],
      },
      {
        id: "final-notification",
        type: "notification",
        name: "Send Final Notification",
        config: { template: "invoice_processed", include_summary: true },
        position: { x: 700, y: 120 },
        connections: [],
      },
    ],
  },
  {
    id: "auto-approve-within-budget",
    name: "Auto-Approve Within Budget",
    description: "Automatically approve invoices within AFE budget, manual approval for exceptions",
    icon: CheckCircle2,
    complexity: "Medium",
    steps: [
      {
        id: "check-budget-and-amount",
        type: "condition",
        name: "Check Budget & Amount",
        config: {},
        conditions: [
          {
            field: "invoice_extractions.budget_status",
            operator: "equals",
            value: "within_budget",
          },
          { field: "amount", operator: "less_or_equal", value: 5000 },
        ],
        position: { x: 100, y: 100 },
        connections: [],
        true_connection: "auto-approve",
        false_connection: "manual-approval",
      },
      {
        id: "auto-approve",
        type: "integration",
        name: "Auto-Approve Invoice",
        config: { action: "approve", update_status: "approved" },
        position: { x: 300, y: 50 },
        connections: ["auto-approve-notification"],
      },
      {
        id: "manual-approval",
        type: "approval",
        name: "Manual Approval Required",
        config: { approver_role: "manager" },
        position: { x: 300, y: 150 },
        connections: ["manual-notification"],
      },
      {
        id: "auto-approve-notification",
        type: "notification",
        name: "Auto-Approval Notice",
        config: { template: "auto_approved" },
        position: { x: 500, y: 50 },
        connections: [],
      },
      {
        id: "manual-notification",
        type: "notification",
        name: "Manual Approval Notice",
        config: { template: "manual_approval_required" },
        position: { x: 500, y: 150 },
        connections: [],
      },
    ],
  },
];

const ApprovalWorkflowTemplates = ({ onSelectTemplate }: ApprovalWorkflowTemplatesProps) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Simple":
        return "bg-status-approved";
      case "Medium":
        return "bg-status-pending";
      case "Advanced":
        return "bg-status-processing";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Invoice Approval Workflow Templates
        </h2>
        <p className="text-muted-foreground">
          Pre-configured workflows for automated invoice approval based on amount, AFE budget, and
          vendor type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {approvalTemplates.map((template) => {
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
                <CardDescription className="mt-2">{template.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      {template.steps.length} steps
                    </div>
                    <div className="flex items-center gap-1">
                      {template.steps.filter((s) => s.type === "condition").length > 0 && (
                        <span className="text-xs">Conditional</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.steps.slice(0, 3).map((step) => (
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

                  <Button className="w-full" onClick={() => onSelectTemplate(template)}>
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalWorkflowTemplates;
