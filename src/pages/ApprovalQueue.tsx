import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ApprovalCard, ReviewQueueItem } from '@/components/invoices/ApprovalCard';
import { CheckCircle2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const ApprovalQueue = () => {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { user } = useAuth();

  const fetchQueue = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_queue')
        .select(`*, invoice:invoices(invoice_number,vendor_name,amount,invoice_date)`)
        .eq('user_id', user.id)
        .is('reviewed_at', null)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data || []).map((item: any) => ({
        ...item,
        priority: item.priority ?? 0,
        flagged_fields: item.flagged_fields ?? [],
        confidence_score: item.confidence_score ?? 0,
      })));
    } catch (error) {
      console.error('Error fetching approval queue:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel('review-queue-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'review_queue', filter: `user_id=eq.${user?.id}` },
        () => { fetchQueue(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchQueue]);

  const handleApprove = useCallback(async (item: ReviewQueueItem) => {
    if (!user) return;
    setProcessing(item.id);
    try {
      const [a, b, c] = await Promise.all([
        supabase.from('approvals').insert({
          invoice_id: item.invoice_id,
          user_id: user.id,
          status: 'approved',
          amount_approved: item.invoice.amount,
          approval_date: new Date().toISOString(),
          approved_by: user.id,
          comments: 'Manually approved from review queue',
          auto_approved: false,
        }),
        supabase.from('invoices').update({ status: 'approved' }).eq('id', item.invoice_id),
        supabase.from('review_queue').update({
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_decision: 'approved',
        }).eq('id', item.id),
      ]);
      const err = a.error || b.error || c.error;
      if (err) throw err;
      toast.success(`Invoice #${item.invoice.invoice_number} approved`);
    } catch (error) {
      console.error('Error approving invoice:', error);
      toast.error('Failed to approve invoice. Please try again.');
    } finally {
      setProcessing(null);
    }
  }, [user]);

  const handleReject = useCallback(async (item: ReviewQueueItem) => {
    if (!user) return;
    setProcessing(item.id);
    try {
      const [a, b] = await Promise.all([
        supabase.from('invoices').update({ status: 'rejected' }).eq('id', item.invoice_id),
        supabase.from('review_queue').update({
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_decision: 'rejected',
        }).eq('id', item.id),
      ]);
      const err = a.error || b.error;
      if (err) throw err;
      toast.success(`Invoice #${item.invoice.invoice_number} rejected`);
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      toast.error('Failed to reject invoice. Please try again.');
    } finally {
      setProcessing(null);
    }
  }, [user]);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      searchTerm === '' ||
      item.invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === 'all' || item.priority.toString() === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const byPriority = {
    all: filteredItems,
    high: filteredItems.filter(i => i.priority === 1),
    medium: filteredItems.filter(i => i.priority === 2),
    low: filteredItems.filter(i => i.priority === 3),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNav className="mb-4" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Approval Queue</h1>
        <p className="text-muted-foreground">
          {items.length} invoice{items.length !== 1 ? 's' : ''} requiring review
        </p>
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by vendor, invoice number, or reason..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="2">Medium Priority</SelectItem>
                  <SelectItem value="3">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({byPriority.all.length})</TabsTrigger>
          <TabsTrigger value="high">High ({byPriority.high.length})</TabsTrigger>
          <TabsTrigger value="medium">Medium ({byPriority.medium.length})</TabsTrigger>
          <TabsTrigger value="low">Low ({byPriority.low.length})</TabsTrigger>
        </TabsList>
        {(['all', 'high', 'medium', 'low'] as const).map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
            {byPriority[tab].length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No invoices require review at this time.</p>
                </CardContent>
              </Card>
            ) : (
              byPriority[tab].map(item => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  processing={processing}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ApprovalQueue;
