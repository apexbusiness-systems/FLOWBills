import { FieldTicketManager } from '@/components/field-tickets/FieldTicketManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ContextualTooltip } from '@/components/help/ContextualTooltip';

const FieldTickets = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <ContextualTooltip
          id="field-ticket-manager"
          title="Field Ticket Verification"
          description="Verify field service tickets and link them to invoices. Track GPS coordinates, service hours, equipment, and personnel for accurate billing validation."
          helpArticleId="field-tickets"
          tourId="invoice-workflow"
          placement="bottom"
        >
          <div>
            <FieldTicketManager />
          </div>
        </ContextualTooltip>
      </main>
    </div>
  );
};

export default FieldTickets;
