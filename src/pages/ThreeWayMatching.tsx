import { ThreeWayMatchingInterface } from "@/components/matching/ThreeWayMatchingInterface";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ContextualTooltip } from "@/components/help/ContextualTooltip";

const ThreeWayMatching = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <ContextualTooltip
          id="three-way-matching"
          title="Automated Three-Way Matching"
          description="Automatically match invoices against purchase orders and field tickets. The system validates amounts, quantities, and line items to reduce manual verification time."
          helpArticleId="three-way-matching"
          tourId="invoice-workflow"
          placement="bottom"
        >
          <div>
            <ThreeWayMatchingInterface />
          </div>
        </ContextualTooltip>
      </main>
    </div>
  );
};

export default ThreeWayMatching;
