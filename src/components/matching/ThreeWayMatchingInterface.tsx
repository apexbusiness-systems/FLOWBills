import { useState } from 'react';
import { useThreeWayMatching } from '@/hooks/useThreeWayMatching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, AlertCircle, Search, Filter, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const ThreeWayMatchingInterface = () => {
  const { matchedSets, loading, fetchMatchedSets, approveMatch, rejectMatch, getMatchStats } = useThreeWayMatching();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const stats = getMatchStats();

  const filteredSets = matchedSets.filter(set => {
    const matchesSearch = search === '' || 
      set.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      set.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
      set.afe_number?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || set.match_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'partial': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'mismatch': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'perfect': return <CheckCircle2 className="h-4 w-4" />;
      case 'partial': return <AlertCircle className="h-4 w-4" />;
      case 'mismatch': return <XCircle className="h-4 w-4" />;
    }
  };

  const handleApprove = async (matchId: string) => {
    await approveMatch(matchId);
  };

  const handleReject = async (matchId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      await rejectMatch(matchId, reason);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Matches</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Perfect Matches</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.perfect}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partial Matches</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.partial}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Avg Confidence
              </div>
            </CardDescription>
            <CardTitle className="text-3xl">{stats.avgConfidence.toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Three-Way Matching</CardTitle>
          <CardDescription>
            Automatically match invoices with field tickets and AFEs for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice, vendor, or AFE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="perfect">Perfect Match</SelectItem>
                <SelectItem value="partial">Partial Match</SelectItem>
                <SelectItem value="mismatch">Mismatch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matched Sets */}
      <div className="space-y-4">
        {filteredSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No matches found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSets.map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">Invoice {set.invoice_number}</CardTitle>
                      <Badge className={getStatusColor(set.match_status)}>
                        {getStatusIcon(set.match_status)}
                        <span className="ml-1">{set.match_status}</span>
                      </Badge>
                      <Badge variant="outline">{set.match_confidence}% confidence</Badge>
                    </div>
                    <CardDescription>
                      {set.vendor_name} • {new Date(set.invoice_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(set.id)}
                      disabled={set.match_status === 'mismatch'}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(set.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Issues */}
                {set.issues.length > 0 && (
                  <Alert variant={set.match_status === 'mismatch' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {set.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Matching Details */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Invoice */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Invoice</h4>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-medium">{set.invoice_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">${set.invoice_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* AFE */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">AFE</h4>
                    <Separator />
                    {set.afe_number ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Number:</span>
                          <span className="font-medium">{set.afe_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">${set.afe_budget?.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No AFE match</p>
                    )}
                  </div>

                  {/* Field Tickets */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Field Tickets</h4>
                    <Separator />
                    {set.field_tickets.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Count:</span>
                          <span className="font-medium">{set.field_tickets.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium">${set.total_ticket_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Variance:</span>
                          <span className={`font-medium ${Math.abs(set.amount_variance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${set.amount_variance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tickets found</p>
                    )}
                  </div>
                </div>

                {/* Field Ticket Details */}
                {set.field_tickets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Ticket Details</h4>
                    <div className="grid gap-2">
                      {set.field_tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-sm">{ticket.ticket_number}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(ticket.service_date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="font-medium">${ticket.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
