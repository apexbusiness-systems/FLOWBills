import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import IntegrationManager from '@/components/integrations/IntegrationManager';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ContextualTooltip } from '@/components/help/ContextualTooltip';

const Integrations = () => {
  return (
    <ProtectedRoute requiredRole="operator">
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto px-6 py-8">
          <BreadcrumbNav className="mb-4" />
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              System Integrations
            </h1>
            <p className="text-muted-foreground">
              Manage NOV and third-party system integrations for your oil & gas operations
            </p>
          </div>
          
          <ContextualTooltip
            id="integration-manager"
            title="System Integrations"
            description="Connect FLOWBills to external systems like NOV, ERPs, and accounting software. Configure API credentials, sync schedules, and monitor integration health."
            helpArticleId="integrations"
            placement="bottom"
          >
            <div>
              <IntegrationManager />
            </div>
          </ContextualTooltip>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Integrations;