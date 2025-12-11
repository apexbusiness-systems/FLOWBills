import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { DateRange } from "react-day-picker";
import { subDays, format, parseISO, startOfDay, eachDayOfInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InvoiceTrendData {
  date: string;
  month: string;
  invoices: number;
  amount: number;
}

interface PaymentAnalyticsData {
  status: string;
  count: number;
  amount: number;
}

interface ProcessingMetricsData {
  date: string;
  day: string;
  automated: number;
  manual: number;
}

interface ChartWidgetProps {
  title: string;
  size?: 'small' | 'medium' | 'large';
}

export const ChartWidget = ({ title, size = 'medium' }: ChartWidgetProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [invoiceData, setInvoiceData] = useState<InvoiceTrendData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentAnalyticsData[]>([]);
  const [processingData, setProcessingData] = useState<ProcessingMetricsData[]>([]);

  const chartHeight = size === 'small' ? 200 : size === 'large' ? 400 : 300;

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user || !dateRange?.from || !dateRange?.to) return;

      setLoading(true);
      try {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        const toDate = format(dateRange.to, 'yyyy-MM-dd');

        // Fetch invoice trends - grouped by date
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('created_at, amount, status')
          .eq('user_id', user.id)
          .gte('created_at', fromDate)
          .lte('created_at', `${toDate}T23:59:59`);

        if (invoicesError) throw invoicesError;

        // Generate date range for chart
        const dateInterval = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to,
        });

        // Aggregate invoice data by day
        const invoicesByDay = new Map<string, { count: number; amount: number }>();
        dateInterval.forEach(date => {
          const key = format(date, 'yyyy-MM-dd');
          invoicesByDay.set(key, { count: 0, amount: 0 });
        });

        (invoices || []).forEach(inv => {
          const dateKey = format(parseISO(inv.created_at || new Date().toISOString()), 'yyyy-MM-dd');
          const existing = invoicesByDay.get(dateKey);
          if (existing) {
            existing.count += 1;
            existing.amount += inv.amount || 0;
          }
        });

        const trendData: InvoiceTrendData[] = Array.from(invoicesByDay.entries()).map(([date, data]) => ({
          date,
          month: format(parseISO(date), 'MMM d'),
          invoices: data.count,
          amount: Math.round(data.amount),
        }));

        setInvoiceData(trendData);

        // Aggregate payment analytics by status
        const statusMap = new Map<string, { count: number; amount: number }>();
        (invoices || []).forEach(inv => {
          const status = inv.status || 'pending';
          const displayStatus = formatStatus(status);
          const existing = statusMap.get(displayStatus) || { count: 0, amount: 0 };
          existing.count += 1;
          existing.amount += inv.amount || 0;
          statusMap.set(displayStatus, existing);
        });

        const paymentAnalytics: PaymentAnalyticsData[] = Array.from(statusMap.entries()).map(([status, data]) => ({
          status,
          count: data.count,
          amount: Math.round(data.amount),
        }));

        // Ensure we have at least some data points for the chart
        if (paymentAnalytics.length === 0) {
          paymentAnalytics.push(
            { status: 'Pending', count: 0, amount: 0 },
            { status: 'Approved', count: 0, amount: 0 },
            { status: 'Paid', count: 0, amount: 0 }
          );
        }

        setPaymentData(paymentAnalytics);

        // Fetch processing metrics from approvals
        const { data: approvals, error: approvalsError } = await supabase
          .from('approvals')
          .select('created_at, auto_approved')
          .eq('user_id', user.id)
          .gte('created_at', fromDate)
          .lte('created_at', `${toDate}T23:59:59`);

        if (approvalsError) throw approvalsError;

        // Aggregate by day
        const processingByDay = new Map<string, { automated: number; manual: number }>();
        dateInterval.forEach(date => {
          const key = format(date, 'yyyy-MM-dd');
          processingByDay.set(key, { automated: 0, manual: 0 });
        });

        (approvals || []).forEach(approval => {
          const dateKey = format(parseISO(approval.created_at), 'yyyy-MM-dd');
          const existing = processingByDay.get(dateKey);
          if (existing) {
            if (approval.auto_approved) {
              existing.automated += 1;
            } else {
              existing.manual += 1;
            }
          }
        });

        const processingMetrics: ProcessingMetricsData[] = Array.from(processingByDay.entries()).map(([date, data]) => ({
          date,
          day: format(parseISO(date), 'MMM d'),
          automated: data.automated,
          manual: data.manual,
        }));

        setProcessingData(processingMetrics);

      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set empty data on error
        setInvoiceData([]);
        setPaymentData([]);
        setProcessingData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user, dateRange]);

  // Helper to format status for display
  function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Approved',
      'approved_auto': 'Auto-Approved',
      'paid': 'Paid',
      'rejected': 'Rejected',
      'duplicate_suspected': 'Duplicate',
      'exception': 'Exception',
      'inbox': 'Inbox',
      'extracted': 'Extracted',
      'validated': 'Validated',
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  const hasNoData = invoiceData.length === 0 && !loading;

  return (
    <Card className="card-enterprise h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {hasNoData ? 'No invoice data available' : 'Real-time invoice analytics'}
            </CardDescription>
          </div>
          <DateRangePicker 
            date={dateRange} 
            onDateChange={setDateRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-4">
              {invoiceData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No invoice data for selected date range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={invoiceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'amount' ? `$${value.toLocaleString()}` : value,
                        name === 'amount' ? 'Total Amount' : 'Invoice Count'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="invoices" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6 }}
                      name="Invoice Count"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                      activeDot={{ r: 6 }}
                      name="Amount ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {paymentData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No payment data for selected date range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="status" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'amount' ? `$${value.toLocaleString()}` : value,
                        name === 'amount' ? 'Total Amount' : 'Invoice Count'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-1))"
                      radius={[8, 8, 0, 0]}
                      name="Invoice Count"
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--chart-3))"
                      radius={[8, 8, 0, 0]}
                      name="Amount ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>

            <TabsContent value="processing" className="mt-4">
              {processingData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No processing data for selected date range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={processingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="automated" 
                      stackId="1"
                      stroke="hsl(var(--chart-4))" 
                      fill="hsl(var(--chart-4))"
                      name="Auto-Approved"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="manual" 
                      stackId="1"
                      stroke="hsl(var(--chart-5))" 
                      fill="hsl(var(--chart-5))"
                      name="Manual Review"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
