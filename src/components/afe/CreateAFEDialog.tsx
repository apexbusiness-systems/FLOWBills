import { useState } from "react";
import { useAFEs } from "@/hooks/useAFEs";
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
import { Textarea } from "@/components/ui/textarea";

interface CreateAFEDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAFEDialog = ({ open, onOpenChange }: CreateAFEDialogProps) => {
  const { createAFE } = useAFEs();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    afe_number: "",
    description: "",
    budget_amount: "",
    well_name: "",
    project_type: "",
    approval_date: "",
    expiry_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createAFE({
        afe_number: formData.afe_number,
        description: formData.description || undefined,
        budget_amount: parseFloat(formData.budget_amount),
        well_name: formData.well_name || undefined,
        project_type: formData.project_type || undefined,
        approval_date: formData.approval_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      });

      // Reset form
      setFormData({
        afe_number: "",
        description: "",
        budget_amount: "",
        well_name: "",
        project_type: "",
        approval_date: "",
        expiry_date: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating AFE:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New AFE</DialogTitle>
          <DialogDescription>
            Create a new Authorization for Expenditure to track project budgets
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="afe_number">AFE Number *</Label>
              <Input
                id="afe_number"
                placeholder="AFE-2024-001"
                value={formData.afe_number}
                onChange={(e) => setFormData({ ...formData, afe_number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_amount">Budget Amount *</Label>
              <Input
                id="budget_amount"
                type="number"
                step="0.01"
                placeholder="100000.00"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="well_name">Well Name</Label>
              <Input
                id="well_name"
                placeholder="Well XYZ-123"
                value={formData.well_name}
                onChange={(e) => setFormData({ ...formData, well_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                placeholder="Drilling, Completion, etc."
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="approval_date">Approval Date</Label>
              <Input
                id="approval_date"
                type="date"
                value={formData.approval_date}
                onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create AFE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
