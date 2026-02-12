import { useState } from 'react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import InvoiceList from '@/components/invoices/InvoiceList';
import { EditInvoiceDialog } from '@/components/invoices/EditInvoiceDialog';
import FileUploadZone from '@/components/invoices/FileUploadZone';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useInvoiceExtraction } from '@/hooks/useInvoiceExtraction';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, List, Workflow } from 'lucide-react';
import WorkflowPipeline from '@/components/dashboard/WorkflowPipeline';
import { supabase } from '@/integrations/supabase/client';

const Invoices = () => {
  const { invoices, loading, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { extractInvoiceData } = useInvoiceExtraction();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingInvoice(null);
    setEditDialogOpen(true);
  };

  const handleSave = async (id: string, updates: Partial<Invoice>) => {
    if (editingInvoice) {
      await updateInvoice(id, updates);
    } else {
      // For new invoices, the id parameter is ignored
      await createInvoice(updates as any);
    }
    setEditDialogOpen(false);
  };

  const handleUploadComplete = async (documents: any[]) => {
    // Create a new invoice for the uploaded documents
    try {
      const newInvoice = await createInvoice({
        vendor_name: 'Unknown Vendor',
        amount: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });

      if (newInvoice && newInvoice.id) {
        // Move documents to the new invoice
        if (documents.length > 0) {
          const docIds = documents.map((doc) => doc.id);
          await supabase
            .from('invoice_documents')
            .update({ invoice_id: newInvoice.id })
            .in('id', docIds);
        }

        // Trigger extraction for each document
        await Promise.all(
          documents.map(async (doc) => {
            try {
              // Get the file content from storage
              const { data: fileBlob, error: downloadError } = await supabase.storage
                .from('invoice-documents')
                .download(doc.file_path);

              if (downloadError) {
                console.error('Error downloading file for extraction:', downloadError);
                return;
              }

              // Convert blob to base64
              const reader = new FileReader();
              const fileContent = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(fileBlob);
              });

              // Trigger extraction
              await extractInvoiceData(newInvoice.id, fileContent);
            } catch (error) {
              console.error(`Failed to extract data from ${doc.file_name}:`, error);
            }
          })
        );
      }
    } catch (error) {
      console.error('Error creating invoice for uploaded documents:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNav className="mb-4" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-muted-foreground">
          Upload, process, and manage invoices through the complete billing workflow
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Invoice List
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Processing Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <FileUploadZone
            onUploadComplete={handleUploadComplete}
            allowUploadWithoutInvoice={true}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <InvoiceList
            invoices={invoices}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteInvoice}
            onCreate={handleCreate}
          />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <WorkflowPipeline />
        </TabsContent>
      </Tabs>

      <EditInvoiceDialog
        invoice={editingInvoice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default Invoices;
