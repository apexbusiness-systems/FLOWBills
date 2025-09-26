import { useState } from "react";
import { useAnalytics, AnalyticsFilters } from "@/hooks/useAnalytics";
import KPICards from "./KPICards";
import ChartsSection from "./ChartsSection";
import DateRangeFilter from "./DateRangeFilter";
import ExportControls from "./ExportControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";

const AnalyticsDashboard = () => {
  const [currentFilters, setCurrentFilters] = useState<AnalyticsFilters>();
  const { metrics, chartData, loading, fetchAnalytics, exportData } = useAnalytics();

  const handleFilterChange = (filters: AnalyticsFilters) => {
    setCurrentFilters(filters);
    fetchAnalytics({ start: filters.startDate, end: filters.endDate });
  };

  const handleRefresh = () => {
    if (currentFilters) {
      fetchAnalytics({ start: currentFilters.startDate, end: currentFilters.endDate });
    }
  };

  const formatDateRange = () => {
    if (currentFilters?.startDate && currentFilters?.endDate) {
      const startDate = new Date(currentFilters.startDate).toLocaleDateString();
      const endDate = new Date(currentFilters.endDate).toLocaleDateString();
      return `${startDate} - ${endDate}`;
    }
    return "Last 30 days";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics for your oil & gas operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <TrendingUp className="h-3 w-3" />
            {formatDateRange()}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <ExportControls
            onExport={exportData}
            loading={loading}
            currentFilters={currentFilters}
          />
        </div>
      </div>

      {/* Filters */}
      <DateRangeFilter 
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Real-time Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-status-approved animate-pulse" />
              <span className="text-sm text-foreground">Real-time updates active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Key Performance Indicators
        </h3>
        <KPICards metrics={metrics} loading={loading} />
      </div>

      {/* Charts */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Analytics & Trends
        </h3>
        <ChartsSection chartData={chartData} loading={loading} />
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">Invoice Processing</h4>
              <p className="text-sm text-muted-foreground">
                {metrics.approvedInvoices > metrics.pendingInvoices 
                  ? "Processing is ahead of incoming invoices"
                  : "Processing backlog detected - consider workflow optimization"
                }
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-medium text-foreground mb-2">Exception Management</h4>
              <p className="text-sm text-muted-foreground">
                {metrics.efficiencyRate > 90 
                  ? "Exception rate is within acceptable range"
                  : "High exception rate - review validation rules"
                }
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-status-approved/5 border border-status-approved/20">
              <h4 className="font-medium text-foreground mb-2">Compliance Status</h4>
              <p className="text-sm text-muted-foreground">
                {metrics.complianceScore >= 90 
                  ? "Excellent compliance score maintained"
                  : "Compliance attention needed - review overdue items"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;