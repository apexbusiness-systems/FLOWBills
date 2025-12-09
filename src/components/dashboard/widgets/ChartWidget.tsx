import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DateRange } from "react-day-picker";
import { isWithinInterval, subDays } from "date-fns";

// Mock data generators with dates
const generateInvoiceTrends = (dateRange?: DateRange) => {
  const today = new Date();
  const days = 180; // Generate 6 months of data
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date,
      month: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      invoices: Math.floor(Math.random() * 30) + 20,
      amount: Math.floor(Math.random() * 15000) + 5000,
    });
  }

  // Filter by date range if provided
  if (dateRange?.from && dateRange?.to) {
    return data.filter((item) =>
      isWithinInterval(item.date, { start: dateRange.from!, end: dateRange.to! })
    );
  }

  return data;
};

const generatePaymentAnalytics = () => {
  return [
    { status: "Paid", count: 145, amount: 425000 },
    { status: "Pending", count: 32, amount: 95000 },
    { status: "Overdue", count: 8, amount: 22000 },
    { status: "Processing", count: 15, amount: 45000 },
  ];
};

const generateProcessingMetrics = (dateRange?: DateRange) => {
  const today = new Date();
  const days = 30; // Generate 30 days of data
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date,
      day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      automated: Math.floor(Math.random() * 40) + 60,
      manual: Math.floor(Math.random() * 20) + 10,
    });
  }

  // Filter by date range if provided
  if (dateRange?.from && dateRange?.to) {
    return data.filter((item) =>
      isWithinInterval(item.date, { start: dateRange.from!, end: dateRange.to! })
    );
  }

  return data;
};

interface ChartWidgetProps {
  title: string;
  size?: "small" | "medium" | "large";
}

export const ChartWidget = ({ title, size = "medium" }: ChartWidgetProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const invoiceData = generateInvoiceTrends(dateRange);
  const paymentData = generatePaymentAnalytics();
  const processingData = generateProcessingMetrics(dateRange);

  const chartHeight = size === "small" ? 200 : size === "large" ? 400 : 300;

  return (
    <Card className="card-enterprise h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>Interactive data visualization</CardDescription>
          </div>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-4">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={invoiceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="invoices"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                  name="Invoice Count"
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                  activeDot={{ r: 6 }}
                  name="Amount ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="status"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
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
          </TabsContent>

          <TabsContent value="processing" className="mt-4">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={processingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="automated"
                  stackId="1"
                  stroke="hsl(var(--chart-4))"
                  fill="hsl(var(--chart-4))"
                  name="Automated (%)"
                />
                <Area
                  type="monotone"
                  dataKey="manual"
                  stackId="1"
                  stroke="hsl(var(--chart-5))"
                  fill="hsl(var(--chart-5))"
                  name="Manual (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
