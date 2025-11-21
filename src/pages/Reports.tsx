import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AFESpendingReportComponent } from '@/components/reports/AFESpendingReport';
import { FieldTicketReportComponent } from '@/components/reports/FieldTicketReport';
import { UWIReportComponent } from '@/components/reports/UWIReport';
import { BarChart3, FileText, MapPin } from 'lucide-react';

const Reports = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reporting across AFE spending, field tickets, and UWI production data
          </p>
        </div>

        <Tabs defaultValue="afe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="afe" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AFE Spending
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Field Tickets
            </TabsTrigger>
            <TabsTrigger value="uwi" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              UWI Production
            </TabsTrigger>
          </TabsList>

          <TabsContent value="afe">
            <AFESpendingReportComponent />
          </TabsContent>

          <TabsContent value="tickets">
            <FieldTicketReportComponent />
          </TabsContent>

          <TabsContent value="uwi">
            <UWIReportComponent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;
