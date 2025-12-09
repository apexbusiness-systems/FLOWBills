import { LucideIcon, DollarSign, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import AnimatedCounter from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
  title: string;
  size?: "small" | "medium" | "large";
}

const getStatConfig = (
  title: string,
  stats: any
): { value: number; label: string; icon: LucideIcon; change: string } => {
  switch (title) {
    case "Monthly Volume":
      return {
        value: stats.totalAmount,
        label: `$${(stats.totalAmount / 1000000).toFixed(1)}M`,
        icon: DollarSign,
        change: `${stats.totalCount} invoices`,
      };
    case "Active Invoices":
      return {
        value: stats.totalCount,
        label: stats.totalCount.toString(),
        icon: FileText,
        change: `${stats.pendingCount} pending`,
      };
    case "Processing Rate":
      const rate =
        stats.totalCount > 0
          ? ((stats.approvedCount + stats.paidCount) / stats.totalCount) * 100
          : 94.2;
      return {
        value: rate,
        label: `${rate.toFixed(1)}%`,
        icon: TrendingUp,
        change: `${stats.approvedCount} approved`,
      };
    case "Exception Queue":
      return {
        value: stats.rejectedCount + stats.pendingCount,
        label: (stats.rejectedCount + stats.pendingCount).toString(),
        icon: AlertCircle,
        change: `${stats.rejectedCount} need attention`,
      };
    default:
      return {
        value: 0,
        label: "0",
        icon: FileText,
        change: "",
      };
  }
};

export const StatsWidget = ({ title, size = "small" }: StatsWidgetProps) => {
  const { getInvoicesStats } = useInvoices();
  const stats = getInvoicesStats;
  const config = getStatConfig(title, stats);
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "card-enterprise p-6 hover-lift cursor-pointer transition-all",
        size === "large" && "col-span-full md:col-span-2",
        size === "medium" && "col-span-full md:col-span-1"
      )}
      data-tour="stats-widget"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={config.value}
              className="text-3xl font-bold text-foreground"
              formatter={(val) =>
                config.label.includes("$") || config.label.includes("%")
                  ? config.label
                  : Math.round(val).toString()
              }
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{config.change}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
};
