import { Link, LinkProps, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

/**
 * Enhanced Link component with active route highlighting
 * Provides visual feedback for current navigation state
 */
export const NavLink = ({ 
  to, 
  className, 
  activeClassName = "text-primary font-semibold border-b-2 border-primary",
  end = false,
  children,
  ...props 
}: NavLinkProps) => {
  const location = useLocation();
  const toPath = typeof to === 'string' ? to : to.pathname || '';
  
  const isActive = end 
    ? location.pathname === toPath
    : location.pathname.startsWith(toPath);

  return (
    <Link
      to={to}
      className={cn(
        "transition-colors duration-200",
        className,
        isActive && activeClassName
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </Link>
  );
};
