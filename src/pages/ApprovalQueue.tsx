import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";

interface ApprovalItem {
  id: string;
  invoice_id: string;
  approval_status: string;
  approval_method: string | null;
  notes: string | null;
  created_at: string;
  invoice: {
    invoice_number: string;
    vendor_name: string;
    amount: number;
    invoice_date: string;
    status: string;
  };
}

const ApprovalQueue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchApprovals();

    // Set up real-time subscription
    const channel = supabase
      .channel("approvals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "approvals",
        },
        () => {
          fetchApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchApprovals = async () => {
    if (!user) return;

    try {
      // Fetch approvals with invoice details
      const { data, error } = await supabase
        .from("approvals")
        .select(
          `
          *,
          invoices (
            invoice_number,
            vendor_name,
            amount,
            invoice_date,
            status
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApprovals((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching approvals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, invoiceId: string) => {
    if (!user) return;

    setProcessing(approvalId);
    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from("approvals")
        .update({
          approval_status: "approved",
          approved_by: user.id,
          approval_date: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (approvalError) throw approvalError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "approved" })
        .eq("id", invoiceId);

      if (invoiceError) throw invoiceError;

      toast({
        title: "Invoice Approved",
        description: "The invoice has been approved successfully",
      });

      fetchApprovals();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve invoice",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId: string, invoiceId: string) => {
    if (!user) return;

    setProcessing(approvalId);
    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from("approvals")
        .update({
          approval_status: "rejected",
          approved_by: user.id,
          approval_date: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (approvalError) throw approvalError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "rejected" })
        .eq("id", invoiceId);

      if (invoiceError) throw invoiceError;

      toast({
        title: "Invoice Rejected",
        description: "The invoice has been rejected",
      });

      fetchApprovals();
    } catch (error: any) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject invoice",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getApprovalLevelBadge = (method: string | null) => {
    if (!method) return null;

    if (method === "manager_approval") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Manager
        </Badge>
      );
    } else if (method === "cfo_approval") {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          CFO
        </Badge>
      );
    }
    return <Badge variant="outline">Standard</Badge>;
  };

  const pendingApprovals = approvals.filter((a) => a.approval_status === "pending");
  const approvedApprovals = approvals.filter((a) => a.approval_status === "approved");
  const rejectedApprovals = approvals.filter((a) => a.approval_status === "rejected");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve invoices pending your approval
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApprovals.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedApprovals.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedApprovals.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApprovals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No invoices pending approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            {approval.invoice?.invoice_number || "N/A"}
                          </CardTitle>
                          <CardDescription>
                            {approval.invoice?.vendor_name || "Unknown Vendor"}
                          </CardDescription>
                        </div>
                      </div>
                      {getApprovalLevelBadge(approval.approval_method)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          <DollarSign className="h-5 w-5" />
                          {approval.invoice?.amount?.toLocaleString("en-CA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Invoice Date</p>
                        <p className="text-lg font-medium">
                          {approval.invoice?.invoice_date
                            ? new Date(approval.invoice.invoice_date).toLocaleDateString("en-CA")
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {approval.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{approval.notes}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Submitted{" "}
                        {formatDistance(new Date(approval.created_at), new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleReject(approval.id, approval.invoice_id)}
                          disabled={processing === approval.id}
                        >
                          {processing === approval.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(approval.id, approval.invoice_id)}
                          disabled={processing === approval.id}
                        >
                          {processing === approval.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved invoices yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedApprovals.map((approval) => (
                <Card key={approval.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <CardTitle className="text-lg">
                            {approval.invoice?.invoice_number || "N/A"}
                          </CardTitle>
                          <CardDescription>
                            {approval.invoice?.vendor_name || "Unknown Vendor"} • $
                            {approval.invoice?.amount?.toLocaleString("en-CA") || "0.00"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected invoices</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedApprovals.map((approval) => (
                <Card key={approval.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <CardTitle className="text-lg">
                            {approval.invoice?.invoice_number || "N/A"}
                          </CardTitle>
                          <CardDescription>
                            {approval.invoice?.vendor_name || "Unknown Vendor"} • $
                            {approval.invoice?.amount?.toLocaleString("en-CA") || "0.00"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalQueue;
