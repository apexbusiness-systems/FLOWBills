import { useState } from 'react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

const InvoiceManager = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const {
    invoices,
    loading,
    creating,
    updating,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  } = useInvoices();

  const handleCreate = () => {
    setSelectedInvoice(null);
    setViewMode('create');
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('edit');
  };

  const handleSave = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    let success = false;

    if (viewMode === 'create') {
      success = await createInvoice(invoiceData) !== null;
    } else if (viewMode === 'edit' && selectedInvoice) {
      success = await updateInvoice(selectedInvoice.id, invoiceData) !== null;
    }

    if (success) {
      setViewMode('list');
      setSelectedInvoice(null);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedInvoice(null);
  };

  const handleDelete = async (invoiceId: string) => {
    await deleteInvoice(invoiceId);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
        
        <InvoiceForm
          invoice={selectedInvoice}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={creating || updating}
        />
      </div>
    );
  }

  return (
    <InvoiceList
      invoices={invoices}
      loading={loading}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
  );
};

export default InvoiceManager;