import {
  Building2,
  Bell,
  User,
  LogOut,
  Shield,
  Settings,
  Home,
  ArrowLeft,
  Palette,
} from "lucide-react";
import companyLogo from "@/assets/company-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SmartSearch from "@/components/ui/smart-search";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { PerformanceIndicator } from "@/components/ui/performance-indicator";
import { NotificationBell } from "./NotificationBell";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

const DashboardHeader = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the homepage
  const isHomePage = location.pathname === "/";

  const handleSearch = (query: string) => {
    if (import.meta.env.DEV) {
      console.log("Searching for:", query);
    }
    // Implement actual search logic
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "operator":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string | null) => {
    if (role === "admin") return <Shield className="h-3 w-3" />;
    return null;
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split("@")[0] || "User";
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            aria-label="Go to homepage"
          >
            <img src={companyLogo} alt="FLOWBills.ca Logo" className="h-8 w-8 object-contain" />
          </button>
          <div className="hidden sm:block">
            <button
              onClick={() => navigate("/")}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <h1 className="text-lg font-semibold text-foreground">Flow Billing</h1>
              <p className="text-xs text-muted-foreground">Oil & Gas Payment Platform</p>
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 ml-4">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
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
            onSelect={(result) => {
              /* Handle search result selection */
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* System Performance Indicator */}
          <PerformanceIndicator />

          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2.5 h-10 px-3 hover:bg-muted/80 transition-colors"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {getInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold leading-none">{getDisplayName()}</div>
                  <div className="text-xs text-muted-foreground mt-1">{user?.email}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="flex items-start gap-3 px-2 py-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs font-medium">
                      {getRoleIcon(userRole)}
                      <span className="ml-1">{userRole?.toUpperCase() || "LOADING..."}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer rounded-md px-3 py-2.5 hover:bg-muted"
              >
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer rounded-md px-3 py-2.5 hover:bg-muted"
              >
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <ThemeSwitcher variant="inline" />
              </div>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer rounded-md px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
