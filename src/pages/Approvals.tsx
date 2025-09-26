import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Approval {
  id: string;
  invoice_id: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
  amount_approved?: number;
  approval_date?: string;
  comments?: string;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  invoice?: {
    invoice_number: string;
    amount: number;
    vendor_name?: string;
    invoice_date: string;
    due_date?: string;
    confidence_score?: number;
  };
}

interface ApprovalStats {
  pending_approvals: number;
  approved_today: number;
  rejected_today: number;
  auto_approved_rate: number;
  average_approval_time: number;
}

const Approvals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const fetchApprovals = async (status?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch approvals with invoice details
      let query = supabase
        .from('approvals')
        .select(`
          *,
          invoices:invoice_id (
            invoice_number,
            amount,
            invoice_date,
            due_date,
            confidence_score,
            vendors:vendor_id (
              vendor_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Flatten the data structure
      const formattedApprovals = (data || []).map(approval => ({
        ...approval,
        invoice: {
          invoice_number: approval.invoices?.invoice_number,
          amount: approval.invoices?.amount,
          vendor_name: approval.invoices?.vendors?.vendor_name,
          invoice_date: approval.invoices?.invoice_date,
          due_date: approval.invoices?.due_date,
          confidence_score: approval.invoices?.confidence_score,
        }
      }));

      setApprovals(formattedApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch approvals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch pending approvals
      const { data: pendingApprovals } = await supabase
        .from('approvals')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      // Fetch today's approvals/rejections
      const { data: todayApproved } = await supabase
        .from('approvals')
        .select('id', { count: 'exact' })
        .eq('status', 'approved')
        .gte('approval_date', todayStart.toISOString());

      const { data: todayRejected } = await supabase
        .from('approvals')
        .select('id', { count: 'exact' })
        .eq('status', 'rejected')
        .gte('approval_date', todayStart.toISOString());

      // Fetch auto-approval rate (last 30 days)
      const { data: totalApprovals } = await supabase
        .from('approvals')
        .select('auto_approved', { count: 'exact' })
        .gte('created_at', last30Days.toISOString());

      const { data: autoApprovals } = await supabase
        .from('approvals')
        .select('id', { count: 'exact' })
        .eq('auto_approved', true)
        .gte('created_at', last30Days.toISOString());

      // Calculate auto-approval rate
      const totalCount = totalApprovals?.count || 0;
      const autoCount = autoApprovals?.count || 0;
      const autoApprovalRate = totalCount > 0 ? (autoCount / totalCount) * 100 : 0;

      setStats({
        pending_approvals: pendingApprovals?.count || 0,
        approved_today: todayApproved?.count || 0,
        rejected_today: todayRejected?.count || 0,
        auto_approved_rate: autoApprovalRate,
        average_approval_time: 2.5, // Mock data - would calculate from actual approval times
      });

    } catch (error) {
      console.error('Error fetching approval stats:', error);
    }
  };

  const handleApprovalAction = async (approval: Approval, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approver_id: user.id,
        approval_date: new Date().toISOString(),
        comments: comments || null,
      };

      const { error } = await supabase
        .from('approvals')
        .update(updateData)
        .eq('id', approval.id);

      if (error) throw error;

      // If approved at final level, update invoice status
      if (action === 'approve') {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({ status: 'approved' })
          .eq('id', approval.invoice_id);

        if (invoiceError) throw invoiceError;
      }

      // Log audit event
      await supabase.from('audit_logs').insert({
        action: `INVOICE_${action.toUpperCase()}ED`,
        entity_type: 'approval',
        entity_id: approval.id,
        user_id: user.id,
        new_values: { 
          invoice_id: approval.invoice_id,
          action,
          comments: comments 
        }
      });

      toast({
        title: 'Success',
        description: `Invoice ${action}ed successfully`,
      });

      // Reset state and refresh data
      setActionDialogOpen(false);
      setSelectedApproval(null);
      setComments('');
      fetchApprovals();
      fetchStats();

    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} invoice`,
        variant: 'destructive',
      });
    }
  };

  const openActionDialog = (approval: Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(action);
    setActionDialogOpen(true);
  };

  useEffect(() => {
    if (user) {
      fetchApprovals();
      fetchStats();
    }
  }, [user]);

  return (
    <ProtectedRoute requiredRole="operator">
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Invoice Approvals
            </h1>
            <p className="text-muted-foreground">
              Review and approve invoices based on policy requirements
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending_approvals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.approved_today}</div>
                  <p className="text-xs text-muted-foreground">Processed today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Auto-Approval Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.auto_approved_rate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Approval Time</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.average_approval_time}h</div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Approval Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading approvals...</p>
                  </div>
                ) : approvals.filter(a => a.status === 'pending').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-2">All caught up!</p>
                      <p className="text-muted-foreground">No pending approvals at the moment</p>
                    </CardContent>
                  </Card>
                ) : (
                  approvals
                    .filter(approval => approval.status === 'pending')
                    .map((approval) => (
                      <Card key={approval.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-3">
                                <FileText className="h-5 w-5" />
                                {approval.invoice?.invoice_number}
                                <Badge variant="outline">Level {approval.approval_level}</Badge>
                                {approval.invoice?.confidence_score && approval.invoice.confidence_score < 80 && (
                                  <Badge variant="destructive">Low Confidence</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {approval.invoice?.vendor_name} • 
                                {new Date(approval.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => openActionDialog(approval, 'reject')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => openActionDialog(approval, 'approve')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium">Amount:</span>
                                <p className="text-muted-foreground">
                                  ${approval.invoice?.amount?.toLocaleString()} CAD
                                </p>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Invoice Date:</span>
                              <p className="text-muted-foreground">
                                {approval.invoice?.invoice_date ? 
                                  new Date(approval.invoice.invoice_date).toLocaleDateString() : 
                                  'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Due Date:</span>
                              <p className="text-muted-foreground">
                                {approval.invoice?.due_date ? 
                                  new Date(approval.invoice.due_date).toLocaleDateString() : 
                                  'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Confidence:</span>
                              <p className="text-muted-foreground">
                                {approval.invoice?.confidence_score || 0}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <div className="space-y-4">
                {approvals
                  .filter(approval => approval.status === 'approved')
                  .map((approval) => (
                    <Card key={approval.id} className="border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          {approval.invoice?.invoice_number}
                          <Badge variant="secondary">Approved</Badge>
                        </CardTitle>
                        <CardDescription>
                          Approved on {approval.approval_date ? 
                            new Date(approval.approval_date).toLocaleDateString() : 
                            'Unknown date'
                          }
                        </CardDescription>
                      </CardHeader>
                      {approval.comments && (
                        <CardContent>
                          <div className="text-sm">
                            <span className="font-medium">Comments:</span>
                            <p className="text-muted-foreground mt-1">{approval.comments}</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="space-y-4">
                {approvals
                  .filter(approval => approval.status === 'rejected')
                  .map((approval) => (
                    <Card key={approval.id} className="border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          {approval.invoice?.invoice_number}
                          <Badge variant="destructive">Rejected</Badge>
                        </CardTitle>
                        <CardDescription>
                          Rejected on {approval.approval_date ? 
                            new Date(approval.approval_date).toLocaleDateString() : 
                            'Unknown date'
                          }
                        </CardDescription>
                      </CardHeader>
                      {approval.comments && (
                        <CardContent>
                          <div className="text-sm">
                            <span className="font-medium">Reason:</span>
                            <p className="text-muted-foreground mt-1">{approval.comments}</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Dialog */}
          <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' ? 'Approve' : 'Reject'} Invoice
                </DialogTitle>
              </DialogHeader>
              
              {selectedApproval && (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      You are about to {actionType} invoice{' '}
                      <strong>{selectedApproval.invoice?.invoice_number}</strong>{' '}
                      for ${selectedApproval.invoice?.amount?.toLocaleString()} CAD
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="comments">
                      Comments {actionType === 'reject' && <span className="text-red-500">*</span>}
                    </Label>
                    <Textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={
                        actionType === 'approve' 
                          ? 'Optional approval comments...' 
                          : 'Please provide reason for rejection...'
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleApprovalAction(selectedApproval, actionType)}
                      disabled={actionType === 'reject' && !comments.trim()}
                      variant={actionType === 'approve' ? 'default' : 'destructive'}
                    >
                      {actionType === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Approvals;