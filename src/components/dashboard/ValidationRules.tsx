import { useState } from "react";
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ValidationRule {
  id: string;
  name: string;
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "not_empty";
  value: string;
  severity: "error" | "warning" | "info";
  active: boolean;
  description: string;
}

const defaultRules: ValidationRule[] = [
  {
    id: "1",
    name: "PO Number Required",
    field: "po_number",
    operator: "not_empty",
    value: "",
    severity: "error",
    active: true,
    description: "Purchase Order number must be present"
  },
  {
    id: "2", 
    name: "Amount Validation",
    field: "amount",
    operator: "greater_than",
    value: "0",
    severity: "error",
    active: true,
    description: "Invoice amount must be greater than zero"
  },
  {
    id: "3",
    name: "Vendor Code Format",
    field: "vendor_code",
    operator: "contains",
    value: "CA-",
    severity: "warning",
    active: true,
    description: "Canadian vendor codes should contain CA- prefix"
  },
  {
    id: "4",
    name: "GST/HST Check",
    field: "tax_amount", 
    operator: "not_empty",
    value: "",
    severity: "warning",
    active: true,
    description: "Tax amount should be specified for Canadian invoices"
  }
];

const ValidationRules = () => {
  const [rules, setRules] = useState<ValidationRule[]>(defaultRules);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState<Partial<ValidationRule>>({
    name: "",
    field: "",
    operator: "not_empty",
    value: "",
    severity: "error",
    active: true,
    description: ""
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="rejected">Error</Badge>;
      case "warning":
        return <Badge variant="pending">Warning</Badge>;
      case "info":
        return <Badge variant="processing">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const toggleRuleActive = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    ));
    toast({
      title: "Rule updated",
      description: "Validation rule status has been changed.",
    });
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: "Rule deleted",
      description: "Validation rule has been removed.",
    });
  };

  const addRule = () => {
    if (!newRule.name || !newRule.field) {
      toast({
        title: "Validation failed",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const rule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      name: newRule.name!,
      field: newRule.field!,
      operator: newRule.operator!,
      value: newRule.value || "",
      severity: newRule.severity!,
      active: newRule.active!,
      description: newRule.description || ""
    };

    setRules(prev => [...prev, rule]);
    setNewRule({
      name: "",
      field: "",
      operator: "not_empty",
      value: "",
      severity: "error", 
      active: true,
      description: ""
    });
    setShowAddForm(false);
    
    toast({
      title: "Rule added",
      description: "New validation rule has been created.",
    });
  };

  const activeRules = rules.filter(rule => rule.active).length;
  const errorRules = rules.filter(rule => rule.severity === "error" && rule.active).length;

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Validation Rules
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="approved">{activeRules} Active</Badge>
            <Badge variant="rejected">{errorRules} Critical</Badge>
            <Button 
              size="sm" 
              variant="enterprise"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure validation rules for invoice processing and data quality
        </p>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="border border-border rounded-lg p-4 mb-4 bg-muted/50">
          <h4 className="text-md font-medium text-foreground mb-3">Add New Rule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                value={newRule.name || ""}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Amount Validation"
              />
            </div>
            <div>
              <Label htmlFor="rule-field">Field *</Label>
              <Input
                id="rule-field"
                value={newRule.field || ""}
                onChange={(e) => setNewRule(prev => ({ ...prev, field: e.target.value }))}
                placeholder="e.g., amount, po_number"
              />
            </div>
            <div>
              <Label htmlFor="rule-operator">Operator</Label>
              <select
                id="rule-operator"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newRule.operator}
                onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value as any }))}
              >
                <option value="not_empty">Not Empty</option>
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
              </select>
            </div>
            <div>
              <Label htmlFor="rule-value">Value</Label>
              <Input
                id="rule-value"
                value={newRule.value || ""}
                onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Comparison value"
              />
            </div>
            <div>
              <Label htmlFor="rule-severity">Severity</Label>
              <select
                id="rule-severity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newRule.severity}
                onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value as any }))}
              >
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="rule-description">Description</Label>
              <Input
                id="rule-description"
                value={newRule.description || ""}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the validation rule"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button variant="enterprise" onClick={addRule}>
              <Save className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div 
            key={rule.id}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              rule.active ? "border-border bg-background" : "border-border bg-muted/30 opacity-75"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                {rule.active ? (
                  <CheckCircle className="h-4 w-4 text-status-approved" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                )}
                {getSeverityBadge(rule.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">
                  {rule.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Field: <span className="font-mono">{rule.field}</span> • 
                  Operator: <span className="capitalize">{rule.operator.replace('_', ' ')}</span>
                  {rule.value && (
                    <> • Value: <span className="font-mono">{rule.value}</span></>
                  )}
                </p>
                {rule.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRuleActive(rule.id)}
                aria-label={rule.active ? "Disable rule" : "Enable rule"}
              >
                {rule.active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRule(rule.id)}
                aria-label="Edit rule"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteRule(rule.id)}
                aria-label="Delete rule"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Validation rules are applied during invoice ingestion and processing. 
          Error-level rules will block invoice progression until resolved.
        </p>
      </div>
    </div>
  );
};

export default ValidationRules;