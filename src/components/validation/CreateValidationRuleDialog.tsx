import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useValidationRules } from '@/hooks/useValidationRules';
import { Plus, Shield, X } from 'lucide-react';

interface CreateValidationRuleDialogProps {
  trigger?: React.ReactNode;
}

const CreateValidationRuleDialog = ({ trigger }: CreateValidationRuleDialogProps) => {
  const { createRule } = useValidationRules();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: '',
    priority: 5,
    is_active: true,
    rule_config: {} as Record<string, any>
  });

  const ruleTypes = [
    { value: 'amount_range', label: 'Amount Range', icon: '💰' },
    { value: 'required_fields', label: 'Required Fields', icon: '📝' },
    { value: 'date_validation', label: 'Date Validation', icon: '📅' },
    { value: 'vendor_validation', label: 'Vendor Validation', icon: '🏢' },
    { value: 'duplicate_check', label: 'Duplicate Check', icon: '🔍' },
    { value: 'format_validation', label: 'Format Validation', icon: '📋' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rule_name || !formData.rule_type) {
      return;
    }

    const success = await createRule({
      rule_name: formData.rule_name,
      rule_type: formData.rule_type,
      rule_config: formData.rule_config,
      priority: formData.priority,
      is_active: formData.is_active
    });

    if (success) {
      setOpen(false);
      setFormData({
        rule_name: '',
        rule_type: '',
        priority: 5,
        is_active: true,
        rule_config: {}
      });
    }
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rule_config: {
        ...prev.rule_config,
        [key]: value
      }
    }));
  };

  const renderRuleTypeConfig = () => {
    switch (formData.rule_type) {
      case 'amount_range':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_amount">Minimum Amount ($)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.rule_config.min_amount || ''}
                  onChange={(e) => updateConfig('min_amount', parseFloat(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="max_amount">Maximum Amount ($)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={formData.rule_config.max_amount || ''}
                  onChange={(e) => updateConfig('max_amount', parseFloat(e.target.value) || undefined)}
                />
              </div>
            </div>
          </div>
        );

      case 'required_fields':
        return (
          <div className="space-y-4">
            <div>
              <Label>Required Fields</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['invoice_number', 'vendor_name', 'amount', 'invoice_date', 'due_date', 'notes'].map(field => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.rule_config.required_fields || []).includes(field)}
                      onChange={(e) => {
                        const current = formData.rule_config.required_fields || [];
                        const updated = e.target.checked
                          ? [...current, field]
                          : current.filter((f: string) => f !== field);
                        updateConfig('required_fields', updated);
                      }}
                    />
                    <span className="text-sm">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'date_validation':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.rule_config.check_future_dates || false}
                onCheckedChange={(checked) => updateConfig('check_future_dates', checked)}
              />
              <Label>Reject future dates</Label>
            </div>
            <div>
              <Label htmlFor="max_days_old">Maximum days old (optional)</Label>
              <Input
                id="max_days_old"
                type="number"
                placeholder="90"
                value={formData.rule_config.max_days_old || ''}
                onChange={(e) => updateConfig('max_days_old', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        );

      case 'vendor_validation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="approved_vendors">Approved Vendors (one per line)</Label>
              <textarea
                id="approved_vendors"
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Acme Oil Services&#10;Global Energy Corp"
                value={(formData.rule_config.approved_vendors || []).join('\n')}
                onChange={(e) => updateConfig('approved_vendors', 
                  e.target.value.split('\n').filter(v => v.trim()))}
              />
            </div>
            <div>
              <Label htmlFor="blocked_vendors">Blocked Vendors (one per line)</Label>
              <textarea
                id="blocked_vendors"
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Blacklisted Corp&#10;Suspended Services"
                value={(formData.rule_config.blocked_vendors || []).join('\n')}
                onChange={(e) => updateConfig('blocked_vendors', 
                  e.target.value.split('\n').filter(v => v.trim()))}
              />
            </div>
          </div>
        );

      case 'duplicate_check':
        return (
          <div className="space-y-4">
            <div>
              <Label>Check for duplicates based on:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['invoice_number', 'vendor_name', 'amount', 'invoice_date'].map(field => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.rule_config.check_fields || ['invoice_number']).includes(field)}
                      onChange={(e) => {
                        const current = formData.rule_config.check_fields || ['invoice_number'];
                        const updated = e.target.checked
                          ? [...current, field]
                          : current.filter((f: string) => f !== field);
                        updateConfig('check_fields', updated);
                      }}
                    />
                    <span className="text-sm">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'format_validation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice_pattern">Invoice Number Pattern (Regex)</Label>
              <Input
                id="invoice_pattern"
                placeholder="^INV-\d{4}-\d{3}$"
                value={formData.rule_config.invoice_number_pattern || ''}
                onChange={(e) => updateConfig('invoice_number_pattern', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Example: ^INV-\d{4}-\d{3}$ for INV-2024-001</p>
            </div>
            <div>
              <Label htmlFor="vendor_pattern">Vendor Name Pattern (Regex, optional)</Label>
              <Input
                id="vendor_pattern"
                placeholder="^[A-Za-z\s]+$"
                value={formData.rule_config.vendor_name_pattern || ''}
                onChange={(e) => updateConfig('vendor_name_pattern', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Rule
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Validation Rule
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule_name">Rule Name</Label>
              <Input
                id="rule_name"
                placeholder="Amount threshold check"
                value={formData.rule_name}
                onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="rule_type">Rule Type</Label>
              <Select 
                value={formData.rule_type} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  rule_type: value, 
                  rule_config: {} 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority Level: {formData.priority}</Label>
                <Slider
                  value={[formData.priority]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, priority: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
                {formData.is_active && <Badge variant="default">Enabled</Badge>}
              </div>
            </div>
          </div>

          {/* Rule-specific Configuration */}
          {formData.rule_type && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Rule Configuration</h3>
              {renderRuleTypeConfig()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.rule_name || !formData.rule_type}
            >
              Create Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateValidationRuleDialog;