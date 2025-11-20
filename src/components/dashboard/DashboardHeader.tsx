import { Building2, Bell, User, LogOut, Shield, Settings, Home, ArrowLeft } from "lucide-react";
import companyLogo from "@/assets/company-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import SmartSearch from "@/components/ui/smart-search";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { PerformanceIndicator } from "@/components/ui/performance-indicator";

const DashboardHeader = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';
  
  const handleSearch = (query: string) => {
    if (import.meta.env.DEV) {
      console.log("Searching for:", query);
    }
    // Implement actual search logic
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'operator': return 'default';
      case 'viewer': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string | null) => {
    if (role === 'admin') return <Shield className="h-3 w-3" />;
    return null;
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            aria-label="Go to homepage"
          >
            <img
              src={companyLogo}
              alt="FLOWBills.ca Logo"
              className="h-8 w-8 object-contain"
            />
          </button>
          <div className="hidden sm:block">
            <button
              onClick={() => navigate('/')}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <p className="text-xs text-muted-foreground">Welcome back, {getDisplayName()}!</p>
              <h1 className="text-lg font-semibold text-foreground">Oil & Gas Billing Platform</h1>
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 ml-4">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 hover:bg-primary/10"
              aria-label="Back to dashboard"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          )}
          
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2 hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Back</span>
            </Button>
          )}
        </div>

        {/* Smart Search */}
        <div className="mx-4 flex-1 max-w-md">
          <SmartSearch
            placeholder="Search invoices, vendors, POs..."
            onSearch={handleSearch}
            onSelect={(result) => {/* Handle search result selection */}}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* System Performance Indicator */}
          <PerformanceIndicator />
          
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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover-scale flex items-center gap-2 h-9 px-3"
                aria-label="User menu"
              >
                <User className="h-4 w-4" />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{getDisplayName()}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                      {getRoleIcon(userRole)}
                      {userRole?.toUpperCase() || 'LOADING...'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;