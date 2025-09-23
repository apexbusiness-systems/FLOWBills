import { PasswordChangeDialog } from "@/components/auth/PasswordChangeDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet } from "lucide-react";

const PasswordChange = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <Droplet className="h-8 w-8 text-black fill-black" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FLOW Bills
            </h1>
          </div>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Password Management</CardTitle>
            <CardDescription>
              Change your account password securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordChangeDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordChange;