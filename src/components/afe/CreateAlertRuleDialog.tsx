import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAlertRules } from "@/hooks/useAlertRules";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CreateAlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAlertRuleDialog = ({ open, onOpenChange }: CreateAlertRuleDialogProps) => {
  const { createRule } = useAlertRules();
  const [formData, setFormData] = useState({
    rule_name: "",
    alert_type: "percentage" as "threshold" | "percentage",
    threshold_value: "",
    email_recipients: [] as string[],
    email_input: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email_recipients.length === 0) {
      return;
    }

    const result = await createRule({
      rule_name: formData.rule_name,
      alert_type: formData.alert_type,
      threshold_value: parseFloat(formData.threshold_value),
      email_recipients: formData.email_recipients,
    });

    if (result) {
      setFormData({
        rule_name: "",
        alert_type: "percentage",
        threshold_value: "",
        email_recipients: [],
        email_input: "",
      });
      onOpenChange(false);
    }
  };

  const addEmail = () => {
    const email = formData.email_input.trim();
    if (email && !formData.email_recipients.includes(email)) {
      setFormData({
        ...formData,
        email_recipients: [...formData.email_recipients, email],
        email_input: "",
      });
    }
  };

  const removeEmail = (email: string) => {
    setFormData({
      ...formData,
      email_recipients: formData.email_recipients.filter((e) => e !== email),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Budget Alert Rule</DialogTitle>
          <DialogDescription>
            Set up automatic notifications when AFE budgets reach specified thresholds
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rule_name">Rule Name</Label>
            <Input
              id="rule_name"
              placeholder="e.g., High Budget Utilization Alert"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Alert Type</Label>
            <RadioGroup
              value={formData.alert_type}
              onValueChange={(value: "threshold" | "percentage") =>
                setFormData({ ...formData, alert_type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentage of Budget (e.g., alert when 80% spent)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="threshold" id="threshold" />
                <Label htmlFor="threshold" className="font-normal cursor-pointer">
                  Dollar Amount Remaining (e.g., alert when $10,000 remaining)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold_value">
              {formData.alert_type === "percentage" ? "Percentage Threshold" : "Dollar Threshold"}
            </Label>
            <div className="flex items-center gap-2">
              {formData.alert_type === "threshold" && (
                <span className="text-muted-foreground">$</span>
              )}
              <Input
                id="threshold_value"
                type="number"
                step={formData.alert_type === "percentage" ? "1" : "0.01"}
                min="0"
                max={formData.alert_type === "percentage" ? "100" : undefined}
                placeholder={formData.alert_type === "percentage" ? "80" : "10000"}
                value={formData.threshold_value}
                onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                required
              />
              {formData.alert_type === "percentage" && (
                <span className="text-muted-foreground">%</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.alert_type === "percentage"
                ? "Alert will trigger when budget utilization reaches this percentage"
                : "Alert will trigger when remaining budget falls below this amount"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_input">Email Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="email_input"
                type="email"
                placeholder="email@example.com"
                value={formData.email_input}
                onChange={(e) => setFormData({ ...formData, email_input: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEmail}>
                Add
              </Button>
            </div>
            {formData.email_recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.email_recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add one or more email addresses to receive notifications
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formData.email_recipients.length === 0}>
              Create Alert Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
