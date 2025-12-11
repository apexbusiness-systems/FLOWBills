import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import FileUploadZone from '@/components/invoices/FileUploadZone';

const QuickUpload = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const canUpload = hasRole('operator') || hasRole('admin');

  const handleCreateInvoice = () => {
    navigate('/invoices');
  };

  const handleUploadComplete = () => {
    setUploadDialogOpen(false);
    // Could show a success message or redirect
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Fast access to common invoice operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start gap-2" 
            variant="outline"
            onClick={handleCreateInvoice}
          >
            <Plus className="h-4 w-4" />
            Create New Invoice
          </Button>
          
          {canUpload && (
            <Button 
              className="w-full justify-start gap-2" 
              variant="outline"
              onClick={() => setUploadDialogOpen(true)}
            >
              <FileText className="h-4 w-4" />
              Upload Documents
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Invoice Documents</DialogTitle>
            <DialogDescription>
              Upload documents to attach to existing invoices. 
              Create an invoice first if you need to attach documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Note: To upload documents, you need to first create or edit an invoice. 
              Documents are attached to specific invoice records.
            </p>
            
            <Button 
              onClick={handleCreateInvoice}
              className="w-full"
            >
              Go to Invoice Management
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickUpload;