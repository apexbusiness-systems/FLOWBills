import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "healthy" | "warning" | "error" | "processing" | "offline";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const StatusIndicator = ({
  status,
  size = "md",
  animated = true,
  className,
}: StatusIndicatorProps) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const statusClasses = {
    healthy: "bg-status-approved",
    warning: "bg-status-pending",
    error: "bg-destructive",
    processing: "bg-status-processing",
    offline: "bg-muted-foreground",
  };

  const pulseClass =
    animated && (status === "processing" || status === "error") ? "animate-pulse" : "";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full",
          sizeClasses[size],
          statusClasses[status],
          pulseClass,
          className
        )}
        aria-label={`Status: ${status}`}
      />
    </div>
  );
};

export default StatusIndicator;
