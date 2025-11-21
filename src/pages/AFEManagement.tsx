import { useState } from 'react';
import { AFEManager } from '@/components/afe/AFEManager';
import { BudgetAlertRulesManager } from '@/components/afe/BudgetAlertRulesManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AFEManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="afes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="afes">AFE Management</TabsTrigger>
            <TabsTrigger value="alerts">Budget Alerts</TabsTrigger>
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
