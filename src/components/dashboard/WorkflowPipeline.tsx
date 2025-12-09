import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Users,
  CreditCard,
  Send,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WorkflowCounts {
  inbox: number;
  validated: number;
  matched: number;
  pending_approval: number;
  approved: number;
  paid: number;
}

const getWorkflowSteps = (counts: WorkflowCounts) => [
  {
    id: "inbox",
    title: "Inbox",
    description: "Invoice ingestion and validation",
    icon: FileText,
    count: counts.inbox,
    status: counts.inbox > 20 ? "attention" : "active",
    color: "bg-status-processing",
  },
  {
    id: "validate",
    title: "Validate",
    description: "Data validation and mapping",
    icon: CheckCircle,
    count: counts.validated,
    status: "active",
    color: "bg-status-pending",
  },
  {
    id: "match",
    title: "Match",
    description: "PO and field ticket matching",
    icon: Users,
    count: counts.matched,
    status: counts.matched > 10 ? "attention" : "active",
    color: counts.matched > 10 ? "bg-destructive" : "bg-primary",
  },
  {
    id: "approve",
    title: "Approve",
    description: "Review and approval workflow",
    icon: CheckCircle,
    count: counts.pending_approval,
    status: "active",
    color: "bg-amber-500",
  },
  {
    id: "pay",
    title: "Pay",
    description: "Payment processing and batching",
    icon: CreditCard,
    count: counts.approved,
    status: "completed",
    color: "bg-status-approved",
  },
  {
    id: "remit",
    title: "Remit",
    description: "Remittance and reconciliation",
    icon: Send,
    count: counts.paid,
    status: "completed",
    color: "bg-status-approved",
  },
];

const WorkflowPipeline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState<WorkflowCounts>({
    inbox: 0,
    validated: 0,
    matched: 0,
    pending_approval: 0,
    approved: 0,
    paid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalInvoices, setTotalInvoices] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        // Fetch invoice counts by status
        const { data: invoices, error } = await supabase
          .from("invoices")
          .select("status")
          .eq("user_id", user.id);

        if (error) throw error;

        const statusCounts = {
          inbox: 0,
          validated: 0,
          matched: 0,
          pending_approval: 0,
          approved: 0,
          paid: 0,
        };

        invoices?.forEach((invoice) => {
          switch (invoice.status) {
            case "pending":
            case "processing":
              statusCounts.inbox++;
              break;
            case "extracted":
            case "validated":
              statusCounts.validated++;
              break;
            case "matched":
              statusCounts.matched++;
              break;
            case "pending_approval":
              statusCounts.pending_approval++;
              break;
            case "approved":
            case "approved_auto":
              statusCounts.approved++;
              break;
            case "paid":
              statusCounts.paid++;
              break;
          }
        });

        setCounts(statusCounts);
        setTotalInvoices(invoices?.length || 0);
      } catch (error) {
        console.error("Error fetching workflow counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("invoice-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const workflowSteps = getWorkflowSteps(counts);
  const completionRate =
    totalInvoices > 0 ? Math.round(((counts.approved + counts.paid) / totalInvoices) * 100) : 0;

  if (loading) {
    return (
      <div className="card-enterprise">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-enterprise">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Invoice Processing Pipeline</h3>
        <p className="text-sm text-muted-foreground">
          Track invoices through the complete billing workflow
        </p>
        <Progress value={completionRate} className="mt-3" />
        <p className="text-xs text-muted-foreground mt-1">
          {completionRate}% of invoices processed successfully ({totalInvoices} total)
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
                  <div
                    className={`h-6 w-6 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {step.count}
                  </div>
                </div>

                <div className="text-left w-full">
                  <h4 className="font-medium text-sm text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
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
            Next milestone:{" "}
            <span className="font-medium text-foreground">Monthly JIB reconciliation</span>
          </div>
          <Button
            size="sm"
            className="btn-primary"
            onClick={() => navigate("/invoices?tab=workflow")}
          >
            View Full Pipeline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPipeline;
