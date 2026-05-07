import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  FileText,
  Upload,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  Shield,
  FilePlus,
  Home
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => navigate("/invoices?upload=true"))}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Upload Invoice</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/invoices?create=true"))}>
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Create Invoice Manually</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/invoices"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Invoices</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/workflows"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Workflows</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/pricing"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Pricing</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/contact"))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>Contact Us</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Settings & Support">
            <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/help"))}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help Center</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/security"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(async () => {
              await signOut();
              navigate("/");
            })}>
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
