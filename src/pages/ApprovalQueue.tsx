import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

interface ReviewQueueItem {
  id: string;
  invoice_id: string;
  priority: number;
  reason: string;
  confidence_score: number;
  flagged_fields: string[];
  created_at: string;
  invoice: {
    invoice_number: string;
    vendor_name: string;
    amount: number;
    invoice_date: string;
  };
}

const ApprovalQueue = () => {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { user } = useAuth();

  const fetchQueue = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_queue')
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            vendor_name,
            amount,
            invoice_date
          )
        `)
        .eq('user_id', user.id)
        .is('reviewed_at', null)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching approval queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('review-queue-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'review_queue',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleApprove = async (item: ReviewQueueItem) => {
    if (!user) return;

    setProcessing(item.id);
    try {
      // Create approval record
      await supabase.from('approvals').insert({
        invoice_id: item.invoice_id,
        user_id: user.id,
        status: 'approved',
        amount_approved: item.invoice.amount,
        approval_date: new Date().toISOString(),
        approved_by: user.id,
        comments: 'Manually approved from review queue',
        auto_approved: false
      });

      // Update invoice status
      await supabase
        .from('invoices')
        .update({ status: 'approved' })
        .eq('id', item.invoice_id);

      // Mark as reviewed
      await supabase
        .from('review_queue')
        .update({
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_decision: 'approved'
        })
        .eq('id', item.id);

      // Refresh queue
      fetchQueue();
    } catch (error) {
      console.error('Error approving invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: ReviewQueueItem) => {
    if (!user) return;

    setProcessing(item.id);
    try {
      // Update invoice status
      await supabase
        .from('invoices')
        .update({ status: 'rejected' })
        .eq('id', item.invoice_id);

      // Mark as reviewed
      await supabase
        .from('review_queue')
        .update({
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_decision: 'rejected'
        })
        .eq('id', item.id);

      // Refresh queue
      fetchQueue();
    } catch (error) {
      console.error('Error rejecting invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="destructive">High Priority</Badge>;
    if (priority === 2) return <Badge variant="default">Medium Priority</Badge>;
    return <Badge variant="secondary">Low Priority</Badge>;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter items based on search and priority
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || item.priority.toString() === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const highPriority = filteredItems.filter(i => i.priority === 1);
  const mediumPriority = filteredItems.filter(i => i.priority === 2);
  const lowPriority = filteredItems.filter(i => i.priority === 3);

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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by vendor, invoice number, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
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
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="high">High Priority ({highPriority.length})</TabsTrigger>
          <TabsTrigger value="medium">Medium ({mediumPriority.length})</TabsTrigger>
          <TabsTrigger value="low">Low ({lowPriority.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
                <p className="text-muted-foreground">No invoices require review at this time.</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {item.invoice.vendor_name} • ${item.invoice.amount.toLocaleString()}
                      </CardTitle>
                      <CardDescription>
                        Invoice #{item.invoice.invoice_number} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Review Reason</p>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  </div>

                  {item.confidence_score && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Confidence Score: <span className={getConfidenceColor(item.confidence_score)}>
                          {item.confidence_score.toFixed(1)}%
                        </span>
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${item.confidence_score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.flagged_fields && item.flagged_fields.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Flagged Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {item.flagged_fields.map(field => (
                          <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(item)}
                      disabled={processing === item.id}
                      className="flex-1"
                    >
                      {processing === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(item)}
                      disabled={processing === item.id}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/invoices?id=${item.invoice_id}`}>View Details</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4 mt-6">
          {highPriority.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {item.invoice.vendor_name} • ${item.invoice.amount.toLocaleString()}
                    </CardTitle>
                    <CardDescription>
                      Invoice #{item.invoice.invoice_number} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Review Reason</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                </div>

                {item.confidence_score && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Confidence Score: <span className={getConfidenceColor(item.confidence_score)}>
                        {item.confidence_score.toFixed(1)}%
                      </span>
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.confidence_score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    {processing === item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/invoices?id=${item.invoice_id}`}>View Details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4 mt-6">
          {mediumPriority.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {item.invoice.vendor_name} • ${item.invoice.amount.toLocaleString()}
                    </CardTitle>
                    <CardDescription>
                      Invoice #{item.invoice.invoice_number} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Review Reason</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                </div>

                {item.confidence_score && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Confidence Score: <span className={getConfidenceColor(item.confidence_score)}>
                        {item.confidence_score.toFixed(1)}%
                      </span>
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.confidence_score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    {processing === item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/invoices?id=${item.invoice_id}`}>View Details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="low" className="space-y-4 mt-6">
          {lowPriority.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {item.invoice.vendor_name} • ${item.invoice.amount.toLocaleString()}
                    </CardTitle>
                    <CardDescription>
                      Invoice #{item.invoice.invoice_number} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Review Reason</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                </div>

                {item.confidence_score && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Confidence Score: <span className={getConfidenceColor(item.confidence_score)}>
                        {item.confidence_score.toFixed(1)}%
                      </span>
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.confidence_score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    {processing === item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(item)}
                    disabled={processing === item.id}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/invoices?id=${item.invoice_id}`}>View Details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalQueue;