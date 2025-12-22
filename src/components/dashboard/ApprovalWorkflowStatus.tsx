import { useEffect, useState } from "react";
import { Clock, User, UserCheck, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Approval {
  id: string;
  invoice_id: string;
  approval_status: string;
  approval_method: string | null;
  amount_approved: number | null;
  created_at: string;
  notes: string | null;
  invoices: {
    invoice_number: string;
    vendor_name: string;
    amount: number;
  };
}

const getApprovalLevelBadge = (method: string | null) => {
  switch (method) {
    case 'auto_approval':
      return <Badge variant="approved">Auto-Approved</Badge>;
    case 'manager_approval':
      return <Badge variant="pending">Manager Review</Badge>;
    case 'cfo_approval':
      return <Badge variant="pending">CFO Review</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

const getApprovalIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-status-approved" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <User className="h-4 w-4 text-muted-foreground" />;
  }
};

export const ApprovalWorkflowStatus = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPendingApprovals = async () => {
      try {
        const query = supabase
          .from('approvals')
          .select(`
            id,
            invoice_id,
            approval_status,
            approval_method,
            amount_approved,
            created_at,
            notes,
            invoices (
              invoice_number,
              vendor_name,
              amount
            )
          `)
          .eq('user_id', user.id)
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        const { data, error } = await query;

        if (error) throw error;
        setPendingApprovals(data || []);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('approval-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approvals',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchPendingApprovals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending approvals</p>
            {(userRole === 'admin' || userRole === 'operator') && (
              <p className="text-sm text-muted-foreground mt-2">
                All invoices have been processed
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Approvals</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate('/approval-queue')}>
          View All ({pendingApprovals.length})
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingApprovals.map((approval) => (
            <div
              key={approval.id}
              className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/approval-queue?id=${approval.invoice_id}`)}
            >
              {getApprovalIcon(approval.approval_status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {approval.invoices?.invoice_number || 'Invoice'}
                  </h4>
                  {getApprovalLevelBadge(approval.approval_method)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="truncate">{approval.invoices?.vendor_name}</span>
                  <span className="font-medium">
                    ${(approval.amount_approved || approval.invoices?.amount || 0).toLocaleString()}
                  </span>
                  <span>{format(new Date(approval.created_at), 'MMM d, h:mm a')}</span>
                </div>
                {approval.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {approval.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
