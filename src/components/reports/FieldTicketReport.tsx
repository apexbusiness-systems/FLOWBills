import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter } from 'lucide-react';
import { useReports, FieldTicketSummary } from '@/hooks/useReports';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export const FieldTicketReportComponent = () => {
  const [data, setData] = useState<FieldTicketSummary[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { loading, getFieldTicketSummary, exportToCSV } = useReports();

  const loadReport = async () => {
    const report = await getFieldTicketSummary({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setData(report);
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExport = () => {
    exportToCSV(data, 'field_ticket_summary');
  };

  const chartData = data.slice(0, 30).reverse().map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: day.total_tickets,
    verified: day.verified_tickets,
    unverified: day.unverified_tickets,
  }));

  const chartConfig = {
    total: {
      label: "Total Tickets",
      color: "hsl(var(--primary))",
    },
    verified: {
      label: "Verified",
      color: "hsl(var(--success))",
    },
    unverified: {
      label: "Unverified",
      color: "hsl(var(--warning))",
    },
  };

  const totals = data.reduce((acc, day) => ({
    total_tickets: acc.total_tickets + day.total_tickets,
    verified_tickets: acc.verified_tickets + day.verified_tickets,
    unverified_tickets: acc.unverified_tickets + day.unverified_tickets,
    total_amount: acc.total_amount + day.total_amount,
  }), { total_tickets: 0, verified_tickets: 0, unverified_tickets: 0, total_amount: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Ticket Summary</CardTitle>
        <CardDescription>Track field ticket verification and amounts over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="start-date-ft">Start Date</Label>
            <Input
              id="start-date-ft"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date-ft">End Date</Label>
            <Input
              id="end-date-ft"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={data.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.total_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Verified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{totals.verified_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unverified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{totals.unverified_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totals.total_amount.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} />
                    <Line type="monotone" dataKey="verified" stroke="var(--color-verified)" strokeWidth={2} />
                    <Line type="monotone" dataKey="unverified" stroke="var(--color-unverified)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Tickets</TableHead>
                    <TableHead className="text-right">Verified</TableHead>
                    <TableHead className="text-right">Unverified</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Avg Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell className="text-right">{day.total_tickets}</TableCell>
                      <TableCell className="text-right text-success">{day.verified_tickets}</TableCell>
                      <TableCell className="text-right text-warning">{day.unverified_tickets}</TableCell>
                      <TableCell className="text-right">${day.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${day.average_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No field ticket data available. Try adjusting your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
