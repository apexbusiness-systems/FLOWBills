import { memo, useCallback } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const activities = [
  {
    id: 1,
    type: "invoice_received",
    title: "Invoice INV-2024-0847 received",
    description: "Husky Energy - $45,250.00",
    timestamp: "2 minutes ago",
    status: "processing",
    icon: FileText
  },
  {
    id: 2,
    type: "payment_approved",
    title: "Payment batch PB-240315 approved",
    description: "15 invoices - $127,830.45 total",
    timestamp: "1 hour ago", 
    status: "approved",
    icon: CheckCircle
  },
  {
    id: 3,
    type: "matching_issue",
    title: "PO matching failed",
    description: "Invoice INV-2024-0845 - No matching PO found",
    timestamp: "3 hours ago",
    status: "rejected", 
    icon: AlertTriangle
  },
  {
    id: 4,
    type: "remittance_sent",
    title: "EDI 820 remittance sent",
    description: "Suncor Energy - 8 invoices remitted",
    timestamp: "4 hours ago",
    status: "approved",
    icon: DollarSign
  },
  {
    id: 5,
    type: "jib_generated",
    title: "JIB summary generated",
    description: "Well ABC-123 - March 2024 allocation",
    timestamp: "6 hours ago",
    status: "approved",
    icon: FileText
  }
];

// Memoized component for performance - static data doesn't need re-render
const RecentActivity = memo(() => {
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "processing":
        return <Badge className="status-processing">Processing</Badge>;
      case "approved":
        return <Badge className="status-approved">Completed</Badge>;
      case "rejected":
        return <Badge className="status-rejected">Attention Required</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  }, []);

  return (
    <div className="card-enterprise">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${activity.title} - ${activity.description}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </h4>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Showing last 5 activities • 
          <Button variant="link" size="sm" className="p-0 h-auto text-xs">
            View audit log
          </Button>
        </p>
      </div>
    </div>
  );
});

export default RecentActivity;