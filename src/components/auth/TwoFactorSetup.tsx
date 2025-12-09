import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Smartphone, Key, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const TwoFactorSetup = ({ isEnabled, onToggle }: TwoFactorSetupProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"setup" | "verify" | "backup-codes">("setup");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const generateTwoFactorSecret = async () => {
    try {
      setLoading(true);
      setError("");

      // Generate a secret key (in production, this would be done server-side)
      const secretKey = generateSecretKey();
      setSecret(secretKey);

      // Generate QR code URL for authenticator apps
      const qrCodeUrl = `otpauth://totp/FlowAi:${user?.email}?secret=${secretKey}&issuer=FlowAi`;
      setQrCode(qrCodeUrl);

      setStep("verify");
    } catch (err) {
      setError("Failed to generate 2FA setup. Please try again.");
      console.error("2FA setup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorCode = async () => {
    try {
      setLoading(true);
      setError("");

      // Verify the code (in production, this would be done server-side)
      const isValid = verifyTOTPCode(secret, verificationCode);

      if (!isValid) {
        setError("Invalid verification code. Please try again.");
        return;
      }

      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      // Store 2FA settings (in production, this would be encrypted server-side)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          two_factor_enabled: true,
          two_factor_secret: secret, // In production, this would be encrypted
        },
      });

      if (updateError) throw updateError;

      setStep("backup-codes");
      onToggle(true);

      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with 2FA",
      });
    } catch (err) {
      setError("Failed to enable 2FA. Please try again.");
      console.error("2FA verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          two_factor_enabled: false,
          two_factor_secret: null,
        },
      });

      if (error) throw error;

      setIsOpen(false);
      onToggle(false);

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "2FA has been removed from your account",
        variant: "destructive",
      });
    } catch (err) {
      setError("Failed to disable 2FA. Please try again.");
      console.error("2FA disable error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Backup Code Copied",
      description: "Backup code has been copied to clipboard",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("setup");
    setVerificationCode("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isEnabled ? "secondary" : "outline"} size="sm">
          <Shield className="h-4 w-4 mr-2" />
          {isEnabled ? "Manage 2FA" : "Enable 2FA"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {isEnabled
              ? "Manage your two-factor authentication settings"
              : "Add an extra layer of security to your account"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isEnabled ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently enabled for your account.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={disableTwoFactor}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {step === "setup" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Authenticator App Required
                    </CardTitle>
                    <CardDescription className="text-xs">
                      You'll need an authenticator app like Google Authenticator, Authy, or
                      1Password.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Button onClick={generateTwoFactorSecret} disabled={loading} className="w-full">
                  {loading ? "Setting up..." : "Setup 2FA"}
                </Button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <div className="text-xs text-muted-foreground mb-2">Scan this QR code:</div>
                    <div className="font-mono text-xs bg-muted p-2 rounded">{qrCode}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">Enter 6-digit code from your app</Label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={verifyTwoFactorCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify & Enable 2FA"}
                </Button>
              </div>
            )}

            {step === "backup-codes" && (
              <div className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Save these backup codes in a secure location. You can use them to access your
                    account if you lose your device.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted p-2 rounded text-sm font-mono"
                    >
                      <span>{code}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyBackupCode(code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={handleClose} className="w-full">
                  I've Saved My Backup Codes
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper functions (in production, these would be server-side)
const generateSecretKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateBackupCodes = (): string[] => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

const verifyTOTPCode = (secret: string, code: string): boolean => {
  // In production, this would use a proper TOTP library
  // This is a simplified mock verification
  return code.length === 6 && /^\d{6}$/.test(code);
};
