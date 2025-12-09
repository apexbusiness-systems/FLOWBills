import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import AnimatedCounter from "@/components/ui/animated-counter";
import StatusIndicator from "@/components/ui/status-indicator";

interface StatusCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  status?: "pending" | "approved" | "rejected" | "processing";
  description?: string;
  onClick?: () => void;
}

const StatusCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  status,
  description,
  onClick,
}: StatusCardProps) => {
  const navigate = useNavigate();
  const { getInvoicesStats } = useInvoices();
  const stats = getInvoicesStats;

  // Use real data for invoice-related metrics
  const getRealValue = (): string | number => {
    switch (title) {
      case "Monthly Volume":
        return `$${(stats.totalAmount / 1000000).toFixed(1)}M`;
      case "Active Invoices":
        return stats.totalCount;
      case "Processing Rate": {
        const rate =
          stats.totalCount > 0
            ? ((stats.approvedCount + stats.paidCount) / stats.totalCount) * 100
            : 94.2; // Default rate
        return `${rate.toFixed(1)}%`;
      }
      case "Exception Queue":
        return stats.rejectedCount + stats.pendingCount;
      default:
        return value;
    }
  };

  const getRealChange = (): string => {
    switch (title) {
      case "Monthly Volume":
        return `${stats.totalCount} invoices total`;
      case "Active Invoices":
        return `${stats.pendingCount} pending approval`;
      case "Processing Rate":
        return `${stats.approvedCount} approved`;
      case "Exception Queue":
        return `${stats.rejectedCount} rejected`;
      default:
        return change || "";
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (
      title.includes("Invoice") ||
      title.includes("Volume") ||
      title.includes("Exception") ||
      title.includes("Processing")
    ) {
      navigate("/invoices");
    }
  };

  const getStatusBadgeClass = () => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "processing":
        return "status-processing";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getChangeClass = () => {
    switch (changeType) {
      case "increase":
        return "text-status-approved";
      case "decrease":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return val;
    }
    // Extract numeric value from strings like "$2.4M" or "94.2%"
    const numMatch = val.match(/[\d,.]+/);
    return numMatch ? parseFloat(numMatch[0].replace(/,/g, "")) : 0;
  };

  const formatDisplay = (val: number, original: string | number) => {
    if (typeof original === "number") {
      return Math.round(val).toString();
    }
    // Preserve formatting for currency and percentages
    if (typeof original === "string") {
      if (original.includes("$")) {
        return `$${(val / 1000000).toFixed(1)}M`;
      }
      if (original.includes("%")) {
        return `${val.toFixed(1)}%`;
      }
    }
    return Math.round(val).toString();
  };

  const displayValue = getRealValue();
  const displayChange = getRealChange();

  return (
    <div className="metric-card group hover-lift cursor-pointer" onClick={handleClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">
              <AnimatedCounter
                value={formatValue(displayValue)}
                formatter={(val) => formatDisplay(val, displayValue)}
                duration={1500}
              />
            </p>
          </div>
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <StatusIndicator
              status={
                status === "pending"
                  ? "warning"
                  : status === "approved"
                    ? "healthy"
                    : status === "rejected"
                      ? "error"
                      : "processing"
              }
            />
            <Badge className={`${getStatusBadgeClass()} capitalize animate-fade-in`}>
              {status}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {displayChange && (
          <span className={`text-sm font-medium ${getChangeClass()} flex items-center gap-1`}>
            {changeType === "increase" && "↗"}
            {changeType === "decrease" && "↘"}
            {displayChange}
          </span>
        )}
        {description && (
          <p className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
            {description || "Click to view details"}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
