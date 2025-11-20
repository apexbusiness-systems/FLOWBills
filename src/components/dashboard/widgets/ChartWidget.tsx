import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

// Mock data generators
const generateInvoiceTrends = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    invoices: Math.floor(Math.random() * 100) + 50,
    amount: Math.floor(Math.random() * 50000) + 20000,
  }));
};

const generatePaymentAnalytics = () => {
  return [
    { status: 'Paid', count: 145, amount: 425000 },
    { status: 'Pending', count: 32, amount: 95000 },
    { status: 'Overdue', count: 8, amount: 22000 },
    { status: 'Processing', count: 15, amount: 45000 },
  ];
};

const generateProcessingMetrics = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    automated: Math.floor(Math.random() * 40) + 60,
    manual: Math.floor(Math.random() * 20) + 10,
  }));
};

interface ChartWidgetProps {
  title: string;
  size?: 'small' | 'medium' | 'large';
}

export const ChartWidget = ({ title, size = 'medium' }: ChartWidgetProps) => {
  const invoiceData = generateInvoiceTrends();
  const paymentData = generatePaymentAnalytics();
  const processingData = generateProcessingMetrics();

  const chartHeight = size === 'small' ? 200 : size === 'large' ? 400 : 300;

  return (
    <Card className="card-enterprise h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Interactive data visualization</CardDescription>
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
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
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
