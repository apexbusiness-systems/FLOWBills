import { useState } from 'react';
import { AFEManager } from '@/components/afe/AFEManager';
import { BudgetAlertRulesManager } from '@/components/afe/BudgetAlertRulesManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContextualTooltip } from '@/components/help/ContextualTooltip';

const AFEManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="afes" className="space-y-6">
          <TabsList>
            <ContextualTooltip
              id="afe-management-tab"
              title="AFE Management"
              description="Create and track Authorization for Expenditure (AFE) budgets. Monitor spending, set expiry dates, and link invoices to AFEs for accurate budget tracking."
              helpArticleId="afe-management"
              placement="bottom"
            >
              <TabsTrigger value="afes">AFE Management</TabsTrigger>
            </ContextualTooltip>
            <ContextualTooltip
              id="budget-alerts-tab"
              title="Budget Alert Rules"
              description="Set up automated alerts when AFE budgets reach specified thresholds. Get notified via email or in-app when spending approaches limits."
              helpArticleId="budget-alerts"
              placement="bottom"
            >
              <TabsTrigger value="alerts">Budget Alerts</TabsTrigger>
            </ContextualTooltip>
          </TabsList>
          <TabsContent value="afes">
            <AFEManager />
          </TabsContent>
          <TabsContent value="alerts">
            <BudgetAlertRulesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AFEManagement;