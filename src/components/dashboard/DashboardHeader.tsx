import { Building2, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SmartSearch from "@/components/ui/smart-search";

const DashboardHeader = () => {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implement actual search logic
  };

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">OilField Billing</h1>
            <p className="text-xs text-muted-foreground">Enterprise Payment Platform</p>
          </div>
        </div>

        {/* Smart Search */}
        <div className="mx-4 flex-1 max-w-md">
          <SmartSearch
            placeholder="Search invoices, vendors, POs..."
            onSearch={handleSearch}
            onSelect={(result) => console.log("Selected:", result)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative hover-scale"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center animate-bounce-subtle">
              3
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover-scale"
            aria-label="User menu"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;