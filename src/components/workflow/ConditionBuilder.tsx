import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { WorkflowCondition } from '@/hooks/useWorkflows';

interface ConditionBuilderProps {
  conditions: WorkflowCondition[];
  onChange: (conditions: WorkflowCondition[]) => void;
}

const fieldOptions = [
  { value: 'amount', label: 'Invoice Amount', type: 'number' },
  { value: 'vendor_name', label: 'Vendor Name', type: 'string' },
  { value: 'status', label: 'Invoice Status', type: 'string' },
  { value: 'invoice_extractions.budget_status', label: 'AFE Budget Status', type: 'string' },
  { value: 'invoice_extractions.budget_remaining', label: 'AFE Budget Remaining', type: 'number' },
  { value: 'invoice_extractions.afe_number', label: 'AFE Number', type: 'string' },
  { value: 'invoice_date', label: 'Invoice Date', type: 'date' },
  { value: 'due_date', label: 'Due Date', type: 'date' },
];

const operatorOptions = [
  { value: 'equals', label: 'Equals', types: ['string', 'number', 'date'] },
  { value: 'not_equals', label: 'Not Equals', types: ['string', 'number', 'date'] },
  { value: 'greater_than', label: 'Greater Than', types: ['number', 'date'] },
  { value: 'less_than', label: 'Less Than', types: ['number', 'date'] },
  { value: 'greater_or_equal', label: 'Greater or Equal', types: ['number', 'date'] },
  { value: 'less_or_equal', label: 'Less or Equal', types: ['number', 'date'] },
  { value: 'contains', label: 'Contains', types: ['string'] },
  { value: 'in', label: 'In List', types: ['string'] },
];

const ConditionBuilder = ({ conditions, onChange }: ConditionBuilderProps) => {
  const addCondition = () => {
    onChange([
      ...conditions,
      { field: 'amount', operator: 'greater_than', value: '' }
    ]);
  };

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const getFieldType = (field: string): string => {
    return fieldOptions.find(f => f.value === field)?.type || 'string';
  };

  const getAvailableOperators = (fieldType: string) => {
    return operatorOptions.filter(op => op.types.includes(fieldType));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Conditions</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={addCondition}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            No conditions defined. Add a condition to start routing logic.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const fieldType = getFieldType(condition.field);
            const availableOperators = getAvailableOperators(fieldType);

            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs mb-1">Field</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          const newFieldType = getFieldType(value);
                          const newOperators = getAvailableOperators(newFieldType);
                          updateCondition(index, {
                            field: value,
                            operator: newOperators[0]?.value as any || 'equals'
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1">Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1">Value</Label>
                      <Input
                        type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="Enter value..."
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCondition(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        All conditions must be met (AND logic) for the workflow to proceed through this path.
      </p>
    </div>
  );
};

export default ConditionBuilder;
