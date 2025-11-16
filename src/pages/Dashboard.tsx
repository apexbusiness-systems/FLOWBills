import { useState } from 'react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceUpload from '@/components/dashboard/InvoiceUpload';
import { EditInvoiceDialog } from '@/components/invoices/EditInvoiceDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload } from 'lucide-react';

export default function Dashboard() {
  const { invoices, loading, updateInvoice, deleteInvoice } = useInvoices();
  const [activeTab, setActiveTab] = useState('list');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Invoice>) => {
    await updateInvoice(id, updates);
  };

  const handleCreate = () => {
    setActiveTab('upload');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Invoice Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <InvoiceList
            invoices={invoices}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteInvoice}
            onCreate={handleCreate}
          />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-6">
          <InvoiceUpload />
        </TabsContent>
      </Tabs>

      <EditInvoiceDialog
        invoice={editingInvoice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
