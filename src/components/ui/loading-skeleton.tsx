import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "button";
  animated?: boolean;
}

const LoadingSkeleton = ({ 
  className, 
  variant = "card", 
  animated = true 
}: LoadingSkeletonProps) => {
  const baseClasses = "bg-muted rounded-md";
  const animationClass = animated ? "loading-shimmer" : "";
  
  const variantClasses = {
    card: "h-32 w-full",
    text: "h-4 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClass,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSkeleton;