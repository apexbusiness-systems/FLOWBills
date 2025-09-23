import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useCompliance } from '@/hooks/useCompliance';
import ComplianceList from '@/components/compliance/ComplianceList';
import CreateComplianceDialog from '@/components/compliance/CreateComplianceDialog';
import { FileText, TrendingUp, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

const Compliance = () => {
  const { getComplianceStats } = useCompliance();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getComplianceStats().then(setStats);
  }, [getComplianceStats]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance Management</h1>
          <p className="text-muted-foreground">Track and manage regulatory compliance requirements</p>
        </div>
        <CreateComplianceDialog />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All compliance items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Items</CardTitle>
              <Clock className="h-4 w-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending + stats.in_progress}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pending} pending, {stats.in_progress} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.due_soon > 0 && `${stats.due_soon} due soon`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Level Breakdown */}
      {stats && stats.by_risk_level && Object.keys(stats.by_risk_level).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_risk_level).map(([risk, count]: [string, any]) => {
                const variant = risk === 'critical' || risk === 'high' ? 'destructive' : 
                             risk === 'medium' ? 'secondary' : 'outline';
                return (
                  <Badge key={risk} variant={variant} className="px-3 py-1">
                    {risk.charAt(0).toUpperCase() + risk.slice(1)}: {count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Type Breakdown */}
      {stats && stats.by_type && Object.keys(stats.by_type).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.by_type).map(([type, count]: [string, any]) => (
                <div key={type} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgent Alerts */}
      {stats && stats.overdue > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Urgent: Overdue Compliance Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{stats.overdue} Overdue</Badge>
              <span className="text-sm text-muted-foreground">
                These items are past their due dates and require immediate attention.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Soon Alert */}
      {stats && stats.due_soon > 0 && (
        <Card className="border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary-foreground">
              <Calendar className="h-5 w-5" />
              Due Soon: Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.due_soon} Due Within 7 Days</Badge>
              <span className="text-sm text-muted-foreground">
                Plan ahead to meet these upcoming compliance deadlines.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance List */}
      <ComplianceList />
    </div>
  );
};

export default Compliance;