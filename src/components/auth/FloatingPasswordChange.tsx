import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Mail, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FloatingPasswordChange = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "Flow143",
    confirmPassword: "Flow143"
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      // First sign in with current credentials to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        setError("Current email or password is incorrect");
        setIsLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      toast({
        title: "Password changed to Flow143!",
        description: "You can now sign in with your new password.",
        variant: "default",
      });
      
      setIsOpen(false);
      setFormData({ email: "", currentPassword: "", newPassword: "Flow143", confirmPassword: "Flow143" });
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password to Flow143</DialogTitle>
            <DialogDescription>
              Enter your current email and password to change it to "Flow143"
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@company.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  className="pl-10"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">New password will be set to:</p>
              <p className="font-mono font-bold">Flow143</p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change to Flow143
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};