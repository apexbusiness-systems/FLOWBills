import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "emergency";
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

const FloatingActionButton = ({
  children,
  onClick,
  className,
  variant = "primary",
  size = "md",
  ariaLabel,
}: FloatingActionButtonProps) => {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-14 w-14", 
    lg: "h-16 w-16"
  };

  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl",
    secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl",
    emergency: "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl animate-pulse-glow"
  };

  return (
    <Button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-6 right-6 rounded-full p-0 transition-all duration-300 hover:scale-110 z-50",
        sizeClasses[size],
        variantClasses[variant],
        "shadow-[0_8px_25px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </Button>
  );
};

export default FloatingActionButton;