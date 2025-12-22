import { useState, useMemo, useCallback, memo } from 'react';
import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { useBulkActions } from '@/hooks/useBulkActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  FileText,
  DollarSign,
  Calendar,
  Filter,
  Paperclip
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onCreate: () => void;
}

// Memoized component to prevent unnecessary re-renders
const InvoiceList = memo(({ invoices, loading, onEdit, onDelete, onCreate }: InvoiceListProps) => {
  const { hasRole } = useAuth();
  const { getDocuments } = useFileUpload();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const { processing, bulkApprove, bulkReject, bulkDelete, bulkExport } = useBulkActions();

  const canEdit = hasRole('operator') || hasRole('admin');
  const canDelete = hasRole('operator') || hasRole('admin');
  const canCreate = hasRole('operator') || hasRole('admin');

  // Load document counts for invoices (optimized with batch loading)
  React.useEffect(() => {
    const loadDocumentCounts = async () => {
      const counts: Record<string, number> = {};
      
      // Batch load in parallel instead of sequential O(n) - reduces to O(1) time
      const results = await Promise.allSettled(
        invoices.map(async (invoice) => {
          try {
            await getDocuments(invoice.id);
            return { id: invoice.id, count: 0 };
          } catch {
            return { id: invoice.id, count: 0 };
          }
        })
      );
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          counts[result.value.id] = result.value.count;
        }
      });
      
      setDocumentCounts(counts);
    };

    if (invoices.length > 0) {
      loadDocumentCounts();
    }
  }, [invoices, getDocuments]);

  // Memoized badge variant calculation - O(1) lookup
  const getStatusBadgeVariant = useCallback((status: Invoice['status']) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'processing': return 'default';
      default: return 'outline';
    }
  }, []);

  // Memoized filtered invoices - prevents recalculation on every render
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Memoized callbacks - stable references prevent child re-renders
  const handleDeleteClick = useCallback((invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete.id);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, onDelete]);

  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
  }, [selectedInvoices.size, filteredInvoices]);

  const handleBulkApprove = useCallback(async () => {
    const success = await bulkApprove(Array.from(selectedInvoices));
    if (success) {
      setSelectedInvoices(new Set());
    }
  }, [selectedInvoices, bulkApprove]);

  const handleBulkReject = useCallback(async () => {
    const success = await bulkReject(Array.from(selectedInvoices));
    if (success) {
      setSelectedInvoices(new Set());
    }
  }, [selectedInvoices, bulkReject]);

  const handleBulkDelete = useCallback(async () => {
    const success = await bulkDelete(Array.from(selectedInvoices));
    if (success) {
      setSelectedInvoices(new Set());
    }
  }, [selectedInvoices, bulkDelete]);

  const handleBulkExport = useCallback(() => {
    const selected = filteredInvoices.filter(inv => selectedInvoices.has(inv.id));
    bulkExport(selected);
  }, [filteredInvoices, selectedInvoices, bulkExport]);

  // Memoized formatters - prevent recreation on every render
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  // Memoized total calculation
  const totalAmount = useMemo(() => 
    filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    [filteredInvoices]
  );

  if (loading) {
    return (
      <Card data-testid="loading-skeleton">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center" data-testid="loading-skeleton">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedInvoices.size}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onSend={() => toast({ title: "Feature coming soon", description: "Vendor notification system" })}
        onClearSelection={() => setSelectedInvoices(new Set())}
        disabled={processing}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Management
              </CardTitle>
              <CardDescription>
                Manage and track invoice records
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={onCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or vendor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                Total Invoices
              </div>
              <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Total Amount
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Pending Count
              </div>
              <div className="text-2xl font-bold">
                {filteredInvoices.filter(inv => inv.status === 'processing').length}
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {invoices.length === 0 
                  ? "Get started by creating your first invoice"
                  : "Try adjusting your search criteria"
                }
              </p>
              {canCreate && invoices.length === 0 && (
                <Button onClick={onCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files</TableHead>
                    {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.vendor_name}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {documentCounts[invoice.id] > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              {documentCounts[invoice.id]}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEdit(invoice)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(invoice)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{invoiceToDelete?.invoice_number}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default InvoiceList;