import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AFESpendingReportComponent } from '@/components/reports/AFESpendingReport';
import { FieldTicketReportComponent } from '@/components/reports/FieldTicketReport';
import { UWIReportComponent } from '@/components/reports/UWIReport';
import { BarChart3, FileText, MapPin } from 'lucide-react';
import { ContextualTooltip } from '@/components/help/ContextualTooltip';

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
            <ContextualTooltip
              id="afe-spending-report"
              title="AFE Spending Reports"
              description="Analyze AFE budget utilization, spending trends, and variances. Export detailed reports for financial analysis and audits."
              helpArticleId="afe-reports"
              placement="bottom"
            >
              <TabsTrigger value="afe" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                AFE Spending
              </TabsTrigger>
            </ContextualTooltip>
            <ContextualTooltip
              id="field-ticket-report"
              title="Field Ticket Reports"
              description="Review field service activity, hours tracked, equipment usage, and service costs across all well sites."
              helpArticleId="field-ticket-reports"
              placement="bottom"
            >
              <TabsTrigger value="tickets" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Field Tickets
              </TabsTrigger>
            </ContextualTooltip>
            <ContextualTooltip
              id="uwi-production-report"
              title="UWI Production Reports"
              description="Track production data, operational costs, and performance metrics by well. Identify high-performing and underperforming assets."
              helpArticleId="uwi-reports"
              placement="bottom"
            >
              <TabsTrigger value="uwi" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                UWI Production
              </TabsTrigger>
            </ContextualTooltip>
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
