import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  Smile, 
  User,
  Home,
  FileText,
  BarChart,
  Shield,
  Globe,
  CheckCircle,
  AlertTriangle,
  Search,
  Upload,
  Building,
  Workflow
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 hidden md:block">
        <kbd className="pointer-events-none inline-flex h-8 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hover:opacity-75 transition-opacity">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleNavigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard")}>
              <BarChart className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/invoices")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Invoices</span>
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/approvals")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Approvals</span>
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/analytics")}>
              <BarChart className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/workflows")}>
              <Workflow className="mr-2 h-4 w-4" />
              <span>Workflows</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => handleNavigate("/invoices?action=upload")}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Upload Invoice</span>
              <CommandShortcut>⌘U</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/invoices?action=create")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Create Invoice</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/vendors")}>
              <Building className="mr-2 h-4 w-4" />
              <span>Manage Vendors</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/search")}>
              <Search className="mr-2 h-4 w-4" />
              <span>Advanced Search</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="System">
            <CommandItem onSelect={() => handleNavigate("/security")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/compliance")}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Compliance</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/integrations")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Integrations</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
