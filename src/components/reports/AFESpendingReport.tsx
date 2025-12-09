import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useReports, AFESpendingReport } from "@/hooks/useReports";
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

export const AFESpendingReportComponent = () => {
  const [data, setData] = useState<AFESpendingReport[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("");
  const { loading, getAFESpendingReport, exportToCSV } = useReports();

  const loadReport = async () => {
    const report = await getAFESpendingReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || undefined,
    });
    setData(report);
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExport = () => {
    exportToCSV(data, "afe_spending_report");
  };

  const chartData = data.slice(0, 10).map((afe) => ({
    name: afe.afe_number,
    budget: afe.budget_amount,
    spent: afe.spent_amount,
    remaining: afe.remaining,
  }));

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "hsl(var(--primary))",
    },
    spent: {
      label: "Spent",
      color: "hsl(var(--destructive))",
    },
    remaining: {
      label: "Remaining",
      color: "hsl(var(--success))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AFE Spending Report</CardTitle>
        <CardDescription>Analyze budget utilization across all AFEs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="budget" fill="var(--color-budget)" />
                    <Bar dataKey="spent" fill="var(--color-spent)" />
                    <Bar dataKey="remaining" fill="var(--color-remaining)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AFE Number</TableHead>
                    <TableHead>Well Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((afe) => (
                    <TableRow key={afe.afe_number}>
                      <TableCell className="font-medium">{afe.afe_number}</TableCell>
                      <TableCell>{afe.well_name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            afe.status === "active"
                              ? "bg-success/20 text-success"
                              : afe.status === "completed"
                                ? "bg-muted text-muted-foreground"
                                : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {afe.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${afe.budget_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${afe.spent_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={afe.remaining < 0 ? "text-destructive font-semibold" : ""}>
                          ${afe.remaining.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={afe.utilization > 100 ? "text-destructive font-semibold" : ""}
                        >
                          {afe.utilization.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No AFE data available. Try adjusting your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
