import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useValidationRules, ValidationRule } from '@/hooks/useValidationRules';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Settings
} from 'lucide-react';

const ValidationRulesList = () => {
  const { rules, loading, fetchRules, updateRule, deleteRule } = useValidationRules();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const filters: any = {};
    if (typeFilter !== 'all') filters.rule_type = typeFilter;
    if (statusFilter !== 'all') filters.is_active = statusFilter === 'active';
    
    fetchRules(filters);
  }, [fetchRules, typeFilter, statusFilter]);

  const filteredRules = rules.filter(rule =>
    rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.rule_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'amount_range': 'Amount Range',
      'required_fields': 'Required Fields',
      'date_validation': 'Date Validation',
      'vendor_validation': 'Vendor Validation',
      'duplicate_check': 'Duplicate Check',
      'format_validation': 'Format Validation'
    };
    return labels[type] || type;
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'amount_range': return '💰';
      case 'required_fields': return '📝';
      case 'date_validation': return '📅';
      case 'vendor_validation': return '🏢';
      case 'duplicate_check': return '🔍';
      case 'format_validation': return '📋';
      default: return '⚙️';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'destructive';
    if (priority >= 5) return 'secondary';
    return 'outline';
  };

  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    await updateRule(ruleId, { is_active: !currentStatus });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this validation rule?')) {
      await deleteRule(ruleId);
    }
  };

  if (loading) {
    return <LoadingSkeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Validation Rules</h2>
          <p className="text-muted-foreground">Manage automated invoice validation rules</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="amount_range">Amount Range</SelectItem>
              <SelectItem value="required_fields">Required Fields</SelectItem>
              <SelectItem value="date_validation">Date Validation</SelectItem>
              <SelectItem value="vendor_validation">Vendor Validation</SelectItem>
              <SelectItem value="duplicate_check">Duplicate Check</SelectItem>
              <SelectItem value="format_validation">Format Validation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4">
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Validation Rules Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No rules match your current filters.'
                  : 'Create your first validation rule to start automating invoice checks.'}
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRuleTypeIcon(rule.rule_type)}</span>
                      <div>
                        <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{getRuleTypeLabel(rule.rule_type)}</Badge>
                          <Badge variant={getPriorityColor(rule.priority)}>
                            Priority {rule.priority}
                          </Badge>
                          {rule.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Rule Configuration Preview */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-foreground mb-2">Configuration</h4>
                  <div className="text-sm text-muted-foreground">
                    {rule.rule_type === 'amount_range' && (
                      <div>
                        {rule.rule_config.min_amount && <span>Min: ${String(rule.rule_config.min_amount)} </span>}
                        {rule.rule_config.max_amount && <span>Max: ${String(rule.rule_config.max_amount)}</span>}
                      </div>
                    )}
                    {rule.rule_type === 'required_fields' && (
                      <div>
                        Required: {(Array.isArray(rule.rule_config.required_fields) ? rule.rule_config.required_fields : []).join(', ')}
                      </div>
                    )}
                    {rule.rule_type === 'date_validation' && (
                      <div>
                        {rule.rule_config.check_future_dates && <span>No future dates </span>}
                        {rule.rule_config.max_days_old && <span>Max age: {String(rule.rule_config.max_days_old)} days</span>}
                      </div>
                    )}
                    {rule.rule_type === 'vendor_validation' && (
                      <div>
                        {Array.isArray(rule.rule_config.approved_vendors) && (
                          <span>Approved: {rule.rule_config.approved_vendors.length} vendors </span>
                        )}
                        {Array.isArray(rule.rule_config.blocked_vendors) && (
                          <span>Blocked: {rule.rule_config.blocked_vendors.length} vendors</span>
                        )}
                      </div>
                    )}
                    {rule.rule_type === 'duplicate_check' && (
                      <div>
                        Check fields: {(Array.isArray(rule.rule_config.check_fields) ? rule.rule_config.check_fields : ['invoice_number']).join(', ')}
                      </div>
                    )}
                    {rule.rule_type === 'format_validation' && (
                      <div>
                        {rule.rule_config.invoice_number_pattern && <span>Invoice format check </span>}
                        {rule.rule_config.vendor_name_pattern && <span>Vendor format check</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ValidationRulesList;