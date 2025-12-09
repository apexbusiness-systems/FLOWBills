import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Filter } from "lucide-react";
import { useReports, UWIProductionData } from "@/hooks/useReports";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const UWIReportComponent = () => {
  const [data, setData] = useState<UWIProductionData[]>([]);
  const [province, setProvince] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { loading, getUWIProductionData, exportToCSV } = useReports();

  const loadReport = async () => {
    const report = await getUWIProductionData({
      province: province || undefined,
      status: status || undefined,
    });
    setData(report);
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExport = () => {
    exportToCSV(data, "uwi_production_data");
  };

  const chartData = data.slice(0, 10).map((uwi) => ({
    name: uwi.uwi.slice(-8),
    invoices: uwi.total_invoices,
    amount: uwi.total_amount,
    tickets: uwi.total_field_tickets,
  }));

  const chartConfig = {
    invoices: {
      label: "Invoices",
      color: "hsl(var(--primary))",
    },
    tickets: {
      label: "Field Tickets",
      color: "hsl(var(--secondary))",
    },
  };

  const totals = data.reduce(
    (acc, uwi) => ({
      total_uwis: acc.total_uwis + 1,
      total_invoices: acc.total_invoices + uwi.total_invoices,
      total_amount: acc.total_amount + uwi.total_amount,
      total_field_tickets: acc.total_field_tickets + uwi.total_field_tickets,
    }),
    { total_uwis: 0, total_invoices: 0, total_amount: 0, total_field_tickets: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>UWI Production Data</CardTitle>
        <CardDescription>Analyze well activity, invoices, and field tickets by UWI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="province-filter">Province</Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger id="province-filter">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Provinces</SelectItem>
                <SelectItem value="AB">Alberta</SelectItem>
                <SelectItem value="BC">British Columbia</SelectItem>
                <SelectItem value="SK">Saskatchewan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="drilling">Drilling</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
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
                  <CardDescription>Total UWIs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.total_uwis}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.total_invoices}</div>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Field Tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.total_field_tickets}</div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="invoices" fill="var(--color-invoices)" />
                    <Bar dataKey="tickets" fill="var(--color-tickets)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UWI</TableHead>
                    <TableHead>Well Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Field Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((uwi) => (
                    <TableRow key={uwi.uwi}>
                      <TableCell className="font-mono text-xs">{uwi.uwi}</TableCell>
                      <TableCell>{uwi.well_name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            uwi.status === "active"
                              ? "bg-success/20 text-success"
                              : uwi.status === "drilling"
                                ? "bg-primary/20 text-primary"
                                : uwi.status === "completed"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-warning/20 text-warning"
                          }`}
                        >
                          {uwi.status}
                        </span>
                      </TableCell>
                      <TableCell>{uwi.province || "-"}</TableCell>
                      <TableCell>{uwi.operator || "-"}</TableCell>
                      <TableCell className="text-right">{uwi.total_invoices}</TableCell>
                      <TableCell className="text-right">
                        ${uwi.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{uwi.total_field_tickets}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No UWI data available. Try adjusting your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
