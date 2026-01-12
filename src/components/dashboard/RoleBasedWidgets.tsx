import { memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Settings, 
  AlertTriangle, 
  Activity, 
  Eye,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RoleBasedWidgetsProps {
  className?: string;
}

// Admin-only widgets
const AdminWidgets = memo(() => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Overview</CardTitle>
          <Shield className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Protected</div>
          <p className="text-xs text-muted-foreground mt-1">
            All systems secure • RLS enabled
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
            onClick={() => navigate('/csp-monitoring')}
          >
            View Security Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">User Management</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Role-Based</div>
          <p className="text-xs text-muted-foreground mt-1">
            Admin • Operator • Viewer
          </p>
          <div className="flex gap-1 mt-3">
            <Badge variant="default">Admin</Badge>
            <Badge variant="secondary">Operator</Badge>
            <Badge variant="outline">Viewer</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Configuration</CardTitle>
          <Settings className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Active</div>
          <p className="text-xs text-muted-foreground mt-1">
            Workflows • Integrations • Rules
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/workflows')}
            >
              Workflows
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/integrations')}
            >
              Integrations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
AdminWidgets.displayName = 'AdminWidgets';

// Operator-only widgets
const OperatorWidgets = memo(() => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">
            Awaiting your review
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/approval-queue')}
          >
            View Queue →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Validation Rules</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">
            Active rules configured
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/validation-rules')}
          >
            Manage Rules →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Errors</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">3</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/invoices')}
          >
            Review Errors →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Country Packs</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5</div>
          <p className="text-xs text-muted-foreground">
            E-invoicing enabled
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/country-packs')}
          >
            Configure →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});
OperatorWidgets.displayName = 'OperatorWidgets';

// Viewer-only widgets (read-only summaries)
const ViewerWidgets = memo(() => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">156</div>
          <p className="text-xs text-muted-foreground">
            Processed this month
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/invoices')}
          >
            View All →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">67%</div>
          <p className="text-xs text-muted-foreground">
            Of allocated AFE budget
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/reports')}
          >
            View Reports →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analytics</CardTitle>
          <BarChart3 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Live</div>
          <p className="text-xs text-muted-foreground">
            Real-time dashboards
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="px-0 mt-2"
            onClick={() => navigate('/reports')}
          >
            Open Analytics →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});
ViewerWidgets.displayName = 'ViewerWidgets';

// Role indicator badge
const RoleBadge = memo(({ role }: { role: string | null }) => {
  const roleConfig = {
    admin: { label: 'Administrator', variant: 'default' as const, icon: Shield },
    operator: { label: 'Operator', variant: 'secondary' as const, icon: Settings },
    viewer: { label: 'Viewer', variant: 'outline' as const, icon: Eye },
  };

  const config = role ? roleConfig[role as keyof typeof roleConfig] : null;
  
  if (!config) {
    return (
      <Badge variant="outline" className="gap-1">
        <Eye className="h-3 w-3" />
        Guest
      </Badge>
    );
  }

  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
});
RoleBadge.displayName = 'RoleBadge';

export const RoleBasedWidgets = memo(({ className }: RoleBasedWidgetsProps) => {
  const { userRole, hasRole } = useAuth();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Role Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Your Dashboard</h2>
          <RoleBadge role={userRole} />
        </div>
        {userRole && (
          <p className="text-sm text-muted-foreground">
            Showing content for your access level
          </p>
        )}
      </div>

      {/* Admin Section - Only visible to admins */}
      {hasRole('admin') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Admin Controls
            </h3>
          </div>
          <AdminWidgets />
        </div>
      )}

      {/* Operator Section - Visible to admins and operators */}
      {hasRole('operator') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Operations Management
            </h3>
          </div>
          <OperatorWidgets />
        </div>
      )}

      {/* Viewer Section - Visible to all authenticated users */}
      {hasRole('viewer') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Overview & Reports
            </h3>
          </div>
          <ViewerWidgets />
        </div>
      )}

      {/* Fallback for users without roles */}
      {!userRole && (
        <Card className="border-warning/50 bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Limited Access
            </CardTitle>
            <CardDescription>
              Your account doesn't have an assigned role yet. Contact your administrator 
              to get access to more features.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
});

RoleBasedWidgets.displayName = 'RoleBasedWidgets';
