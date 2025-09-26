import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, DollarSign, FileText, Save, X, Upload, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Invoice } from '@/hooks/useInvoices';
import { useValidationRules, InvoiceValidationResult } from '@/hooks/useValidationRules';
import FileUploadZone from './FileUploadZone';
import DocumentList from './DocumentList';
import CreateExceptionDialog from '@/components/exceptions/CreateExceptionDialog';
import ValidationResultsPanel from '@/components/validation/ValidationResultsPanel';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const InvoiceForm = ({ invoice, onSave, onCancel, loading = false }: InvoiceFormProps) => {
  const { hasRole } = useAuth();
  const { validateInvoice } = useValidationRules();
  const [formData, setFormData] = useState({
    invoice_number: invoice?.invoice_number || '',
    vendor_name: invoice?.vendor_name || '',
    amount: invoice?.amount || 0,
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    status: invoice?.status || 'pending' as const,
    description: invoice?.description || '',
    file_url: invoice?.file_url || ''
  });

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [validationResult, setValidationResult] = useState<InvoiceValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const canUpload = hasRole('operator') || hasRole('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.invoice_number.trim()) {
      alert('Invoice number is required');
      return;
    }
    if (!formData.vendor_name.trim()) {
      alert('Vendor name is required');
      return;
    }
    if (formData.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    // Run validation rules before saving
    await runValidation();

    onSave(formData);
  };

  const runValidation = async () => {
    if (!formData.invoice_number || !formData.vendor_name || !formData.amount) {
      return;
    }

    setValidating(true);
    try {
      const result = await validateInvoice(formData);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined, field: 'invoice_date' | 'due_date') => {
    if (date) {
      handleInputChange(field, date.toISOString().split('T')[0]);
    }
    if (field === 'invoice_date') {
      setInvoiceDateOpen(false);
    } else {
      setDueDateOpen(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Pick a date';
    return format(new Date(dateString), 'PPP');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
        <CardDescription>
          {invoice ? 'Update invoice information' : 'Enter invoice details to create a new record'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Invoice Details</TabsTrigger>
            <TabsTrigger value="validation">
              <Shield className="mr-2 h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!invoice}>
              <Upload className="mr-2 h-4 w-4" />
              Documents {invoice && `(${invoice.id ? 'Available' : 'Save first'})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number *</Label>
                  <Input
                    id="invoice_number"
                    placeholder="INV-2024-001"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    required
                  />
                </div>

                {/* Vendor Name */}
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    placeholder="Acme Oil Services"
                    value={formData.vendor_name}
                    onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                    required
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-10"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Date */}
                <div className="space-y-2">
                  <Label>Invoice Date *</Label>
                  <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.invoice_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateForDisplay(formData.invoice_date)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.invoice_date ? new Date(formData.invoice_date) : undefined}
                        onSelect={(date) => handleDateChange(date, 'invoice_date')}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? formatDateForDisplay(formData.due_date) : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date ? new Date(formData.due_date) : undefined}
                        onSelect={(date) => handleDateChange(date, 'due_date')}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional description or comments..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />}
                  <Save className="mr-2 h-4 w-4" />
                  {invoice ? 'Update' : 'Create'} Invoice
                </Button>
                {invoice && (
                  <CreateExceptionDialog 
                    invoiceId={invoice.id}
                    trigger={
                      <Button type="button" variant="outline">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Report Issue
                      </Button>
                    }
                  />
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Invoice Validation</h3>
                  <p className="text-muted-foreground">
                    Run validation rules to check for issues before processing
                  </p>
                </div>
                <Button
                  onClick={runValidation}
                  disabled={validating || !formData.invoice_number}
                  variant="outline"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {validating ? 'Validating...' : 'Run Validation'}
                </Button>
              </div>
              
              <ValidationResultsPanel
                validationResult={validationResult}
                loading={validating}
                onRevalidate={runValidation}
              />
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6 mt-6">
            {invoice ? (
              <div className="space-y-6">
                {canUpload && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Upload Documents</h3>
                    <FileUploadZone 
                      invoiceId={invoice.id}
                      onUploadComplete={() => {
                        // Refresh document list - will be handled by DocumentList component
                      }}
                    />
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Attached Documents</h3>
                  <DocumentList invoiceId={invoice.id} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Save Invoice First</h3>
                <p className="text-muted-foreground">
                  Please save the invoice details before uploading documents.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;