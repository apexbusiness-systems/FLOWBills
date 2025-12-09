import { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  status: string;
  created_at: string;
  invoice_date: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
    case "approved_auto":
    case "paid":
      return <CheckCircle className="h-4 w-4 text-status-approved" />;
    case "pending":
    case "processing":
    case "extracted":
      return <Clock className="h-4 w-4 text-status-processing" />;
    case "pending_approval":
    case "matched":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "rejected":
    case "exception":
    case "duplicate_suspected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: any; label: string }> = {
    pending: { variant: "processing", label: "Pending" },
    processing: { variant: "processing", label: "Processing" },
    extracted: { variant: "pending", label: "Extracted" },
    validated: { variant: "pending", label: "Validated" },
    matched: { variant: "pending", label: "Matched" },
    pending_approval: { variant: "pending", label: "Awaiting Approval" },
    approved: { variant: "approved", label: "Approved" },
    approved_auto: { variant: "approved", label: "Auto-Approved" },
    paid: { variant: "approved", label: "Paid" },
    rejected: { variant: "rejected", label: "Rejected" },
    exception: { variant: "rejected", label: "Exception" },
    duplicate_suspected: { variant: "rejected", label: "Duplicate" },
  };

  const { variant, label } = statusMap[status] || { variant: "outline", label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

export const InvoiceStatusTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRecentInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("id, invoice_number, vendor_name, amount, status, created_at, invoice_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentInvoices(data || []);
      } catch (error) {
        console.error("Error fetching recent invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvoices();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("recent-invoices")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRecentInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoice Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoice Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No invoices yet</p>
            <Button onClick={() => navigate("/invoices")}>Upload Your First Invoice</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Invoice Activity</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/invoices?id=${invoice.id}`)}
            >
              {getStatusIcon(invoice.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {invoice.invoice_number}
                  </h4>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="truncate">{invoice.vendor_name}</span>
                  <span>${invoice.amount.toLocaleString()}</span>
                  <span>{format(new Date(invoice.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
