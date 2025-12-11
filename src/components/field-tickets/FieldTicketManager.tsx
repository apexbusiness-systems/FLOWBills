import { useState } from 'react';
import { useFieldTickets } from '@/hooks/useFieldTickets';
import { useAFEs } from '@/hooks/useAFEs';
import { useInvoices } from '@/hooks/useInvoices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, MapPin, CheckCircle2, Clock, FileText } from 'lucide-react';
import { CreateFieldTicketDialog } from './CreateFieldTicketDialog';
import { VerifyFieldTicketDialog } from './VerifyFieldTicketDialog';
import { format } from 'date-fns';

export const FieldTicketManager = () => {
  const { fieldTickets, loading, getUnverifiedCount } = useFieldTickets();
  const { afes } = useAFEs();
  const { invoices } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const filteredTickets = fieldTickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && ticket.verified) ||
      (statusFilter === 'unverified' && !ticket.verified);

    return matchesSearch && matchesStatus;
  });

  const handleVerifyClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setVerifyDialogOpen(true);
  };

  const getAFENumber = (afeId: string | null) => {
    if (!afeId) return 'N/A';
    const afe = afes.find(a => a.id === afeId);
    return afe?.afe_number || 'Unknown';
  };

  const getInvoiceNumber = (invoiceId: string | null) => {
    if (!invoiceId) return 'Not Linked';
    const invoice = invoices.find(i => i.id === invoiceId);
    return invoice?.invoice_number || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Field Tickets</h2>
          <p className="text-muted-foreground">
            Manage and verify field tickets with GPS validation
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Field Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fieldTickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fieldTickets.filter(t => t.verified).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUnverifiedCount()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Tickets</CardTitle>
          <CardDescription>
            Create, verify, and link field tickets to invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="unverified">Unverified</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading field tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No field tickets found. Create your first field ticket to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{ticket.ticket_number}</h3>
                          {ticket.verified ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {ticket.gps_coordinates && (
                            <Badge variant="outline">
                              <MapPin className="mr-1 h-3 w-3" />
                              GPS
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Vendor:</span>
                            <p className="font-medium">{ticket.vendor_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Service Date:</span>
                            <p className="font-medium">{format(new Date(ticket.service_date), 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">${ticket.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">AFE:</span>
                            <p className="font-medium">{getAFENumber(ticket.afe_id)}</p>
                          </div>
                        </div>

                        {ticket.service_type && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Service Type:</span>
                            <span className="ml-2">{ticket.service_type}</span>
                          </div>
                        )}

                        {ticket.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="ml-2">{ticket.location}</span>
                          </div>
                        )}

                        <div className="text-sm">
                          <span className="text-muted-foreground">Invoice:</span>
                          <span className="ml-2">{getInvoiceNumber(ticket.invoice_id)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!ticket.verified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyClick(ticket.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFieldTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedTicketId && (
        <VerifyFieldTicketDialog
          open={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          ticketId={selectedTicketId}
        />
      )}
    </div>
  );
};
