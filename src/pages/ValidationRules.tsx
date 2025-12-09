import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useValidationRules } from "@/hooks/useValidationRules";
import ValidationRulesList from "@/components/validation/ValidationRulesList";
import CreateValidationRuleDialog from "@/components/validation/CreateValidationRuleDialog";
import { Shield, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

const ValidationRules = () => {
  const { getRuleStats } = useValidationRules();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getRuleStats().then(setStats);
  }, [getRuleStats]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <BreadcrumbNav className="mb-2" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validation Rules</h1>
          <p className="text-muted-foreground">
            Manage automated invoice validation and quality controls
          </p>
        </div>
        <CreateValidationRuleDialog />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Configured rules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently enforced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Rules</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Not active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rule Types</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.by_type || {}).length}</div>
              <p className="text-xs text-muted-foreground">Different types</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rule Type Breakdown */}
      {stats && stats.by_type && Object.keys(stats.by_type).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rule Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_type).map(([type, count]: [string, any]) => (
                <Badge key={type} variant="secondary" className="px-3 py-1">
                  {type.replace("_", " ")}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Rules List */}
      <ValidationRulesList />
    </div>
  );
};

export default ValidationRules;
