import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
  AlertCircle,
  TrendingUp
} from "lucide-react";

export default function SupplierPortal() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Supplier Portal</h1>
              <p className="text-muted-foreground mt-1">
                Track your invoices and payments
              </p>
            </div>
            <Badge variant="outline" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active Supplier
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">
                Under review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">19</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$127,450</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 90 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit Invoice</TabsTrigger>
            <TabsTrigger value="track">Track Invoices</TabsTrigger>
            <TabsTrigger value="payment">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit New Invoice</CardTitle>
                <CardDescription>
                  Upload your invoice documents for processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Drop your invoice here
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse (PDF, PNG, JPG)
                  </p>
                  <Button>Select Files</Button>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Invoice Requirements
                      </p>
                      <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                        <li>• Include PO number if applicable</li>
                        <li>• Ensure all line items are clearly visible</li>
                        <li>• Invoice date must be within last 90 days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Tracking</CardTitle>
                <CardDescription>
                  Monitor the status of your submitted invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 'INV-2025-001', status: 'approved', amount: 15750, date: '2025-01-15' },
                    { id: 'INV-2025-002', status: 'pending', amount: 8200, date: '2025-01-18' },
                    { id: 'INV-2025-003', status: 'processing', amount: 12300, date: '2025-01-20' },
                  ].map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <FileText className="h-10 w-10 p-2 rounded-lg bg-primary/10 text-primary" />
                        <div>
                          <p className="font-semibold">{invoice.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {invoice.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-mono font-semibold">
                            ${invoice.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            invoice.status === 'approved' ? 'approved' :
                            invoice.status === 'pending' ? 'pending' : 'default'
                          }
                        >
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View your completed payments and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Projected Payment (Next 30 days)
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        $45,250
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { date: '2025-01-10', amount: 15750, invoice: 'INV-2024-098' },
                    { date: '2025-01-05', amount: 22100, invoice: 'INV-2024-095' },
                    { date: '2024-12-28', amount: 8900, invoice: 'INV-2024-089' },
                  ].map((payment, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{payment.invoice}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid on {payment.date}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono font-semibold text-green-600 dark:text-green-400">
                        +${payment.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
