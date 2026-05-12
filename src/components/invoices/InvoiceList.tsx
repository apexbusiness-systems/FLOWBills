import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from "@/components/ui/alert-dialog";
import { Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';
import { 
  FileText,
  Search, 
  Filter,
  Plus, 
  Trash2,
  Edit,
  File,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

// Memoized row component for performance
const InvoiceRow = memo(({
  invoice,
  isSelected,
  canEdit,
  canDelete,
  onToggleSelect,
  onEdit,
  onDelete: handleDeleteClick,
  documentCount,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant
}: {
  invoice: Invoice;
  isSelected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  documentCount: number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | null) => string;
  getStatusBadgeVariant: (status: string) => "default" | "destructive" | "outline" | "secondary" | "pending" | "approved" | "rejected";
}) => {
  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(invoice.id)}
          aria-label={`Select invoice ${invoice.invoice_number}`}
        />
      </TableCell>
      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {invoice.vendor_name}
          {invoice.duplicate_hash && (
            <AlertTriangle className="h-4 w-4 text-amber-500" title="Potential Duplicate" />
          )}
        </div>
      </TableCell>
      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
      <TableCell>{formatDate(invoice.due_date)}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(invoice.status)}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        {documentCount > 0 ? (
          <div className="flex items-center text-xs text-muted-foreground">
            <File className="h-3 w-3 mr-1" />
            {documentCount} file{documentCount !== 1 ? 's' : ''}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      {(canEdit || canDelete) && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(invoice); }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(invoice); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});

InvoiceRow.displayName = 'InvoiceRow';

const InvoiceList = ({ invoices, loading, onEdit, onDelete, onCreate, fetchNextPage, hasNextPage, isFetchingNextPage }: InvoiceListProps) => {
  const { hasRole } = useAuth();
  const { getDocumentCounts } = useFileUpload();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(() => {
    const fromUrl = searchParams.get('search');
    return fromUrl || localStorage.getItem('flowbills.invoices.search') || '';
  });

  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const fromUrl = searchParams.get('status');
    return fromUrl || localStorage.getItem('flowbills.invoices.status') || 'all';
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const { processing, bulkApprove, bulkReject, bulkDelete, bulkExport } = useBulkActions();

  const canEdit = hasRole('operator') || hasRole('admin');
  const canDelete = hasRole('operator') || hasRole('admin');
  const canCreate = hasRole('operator') || hasRole('admin');

  // Update URL and localStorage when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('flowbills.invoices.search', searchTerm);
      localStorage.setItem('flowbills.invoices.status', statusFilter);
      
      setSearchParams(prev => {
        if (searchTerm) prev.set('search', searchTerm);
        else prev.delete('search');

        if (statusFilter && statusFilter !== 'all') prev.set('status', statusFilter);
        else prev.delete('status');

        return prev;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, setSearchParams]);

  // Load document counts efficiently
  useEffect(() => {
    let isMounted = true;

    const loadDocumentCounts = async () => {
      if (invoices.length === 0) return;
      const ids = invoices.map(i => i.id);
      const counts = await getDocumentCounts(ids);
      if (isMounted) {
        setDocumentCounts(counts);
      }
    };

    loadDocumentCounts();

    return () => { isMounted = false; };
  }, [invoices, getDocumentCounts]);

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

  const getStatusBadgeVariant = useCallback((status: Invoice['status']) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'processing': return 'default';
      default: return 'outline';
    }
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const toggleInvoiceSelection = useCallback((id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  }, [selectedInvoices]);

  const toggleSelectAll = useCallback(() => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
  }, [selectedInvoices.size, filteredInvoices]);

  const handleBulkApprove = useCallback(async () => {
    const success = await bulkApprove(Array.from(selectedInvoices));
    if (success) setSelectedInvoices(new Set());
  }, [selectedInvoices, bulkApprove]);

  const handleBulkReject = useCallback(async () => {
    const success = await bulkReject(Array.from(selectedInvoices));
    if (success) setSelectedInvoices(new Set());
  }, [selectedInvoices, bulkReject]);

  const handleBulkDelete = useCallback(async () => {
    const success = await bulkDelete(Array.from(selectedInvoices));
    if (success) setSelectedInvoices(new Set());
  }, [selectedInvoices, bulkDelete]);

  const handleBulkExport = useCallback(() => {
    const selected = filteredInvoices.filter(inv => selectedInvoices.has(inv.id));
    bulkExport(selected);
  }, [filteredInvoices, selectedInvoices, bulkExport]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
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
        onSend={() => toast({ title: "Notification sent", description: `${selectedInvoices.size} invoice(s) queued for vendor notification` })}
        onClearSelection={() => setSelectedInvoices(new Set())}
        disabled={processing}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice List
              </CardTitle>
              <CardDescription>
                Manage and process incoming invoices
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

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
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
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit || canDelete ? 9 : 8} className="text-center h-32 text-muted-foreground">
                      No invoices found.
                      {invoices.length === 0 && canCreate ? " Create one to get started." : " Try adjusting your search filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      isSelected={selectedInvoices.has(invoice.id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onToggleSelect={toggleInvoiceSelection}
                      onEdit={onEdit}
                      onDelete={handleDeleteClick}
                      documentCount={documentCounts[invoice.id] || 0}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusBadgeVariant={getStatusBadgeVariant}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage?.()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                  : 'Load More Invoices'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceList;
