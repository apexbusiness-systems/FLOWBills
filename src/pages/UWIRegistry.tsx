import { UWIRegistry as UWIRegistryComponent } from '@/components/uwi/UWIRegistry';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ContextualTooltip } from '@/components/help/ContextualTooltip';

const UWIRegistry = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <ContextualTooltip
          id="uwi-registry"
          title="UWI Registry Management"
          description="Manage Unique Well Identifiers (UWI) to organize invoices by well location. Track operator, province, spud dates, and well completion status."
          helpArticleId="uwi-management"
          tourId="invoice-workflow"
          placement="bottom"
        >
          <div>
            <UWIRegistryComponent />
          </div>
        </ContextualTooltip>
      </main>
    </div>
  );
};

export default UWIRegistry;