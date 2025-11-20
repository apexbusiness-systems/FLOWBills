import { Home, FileText, Settings, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/ui/NavLink";
import { cn } from "@/lib/utils";

/**
 * Mobile-optimized bottom navigation
 * Fixed bottom bar with touch-friendly tap targets
 */
export const MobileBottomNav = () => {
  const navItems = [
    { icon: Home, label: "Home", to: "/dashboard", ariaLabel: "Go to dashboard home" },
    { icon: FileText, label: "Invoices", to: "/dashboard", ariaLabel: "View invoices" },
    { icon: BarChart3, label: "Reports", to: "/dashboard", ariaLabel: "View reports" },
    { icon: Settings, label: "Settings", to: "/profile", ariaLabel: "Go to settings" },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              activeClassName="text-primary"
              aria-label={item.ariaLabel}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
