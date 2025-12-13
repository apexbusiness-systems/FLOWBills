import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  File, 
  Calendar,
  User,
  HardDrive,
  GripVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload, InvoiceDocument } from '@/hooks/useFileUpload';
import { format } from 'date-fns';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  invoiceId: string;
  onDocumentsChange?: (documents: InvoiceDocument[]) => void;
}

const DocumentList = ({ invoiceId, onDocumentsChange }: DocumentListProps) => {
  const [localDocuments, setLocalDocuments] = useState<InvoiceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<InvoiceDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<InvoiceDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { hasRole } = useAuth();
  const { documents, fetchDocuments, deleteDocument, downloadDocument, getFilePreviewUrl } = useFileUpload();

  const canDelete = hasRole('operator') || hasRole('admin');

  useEffect(() => {
    loadDocuments();
  }, [invoiceId]);

  // Sync local state with hook state
  useEffect(() => {
    setLocalDocuments(documents);
    onDocumentsChange?.(documents);
  }, [documents, onDocumentsChange]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      await fetchDocuments(invoiceId);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(localDocuments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalDocuments(items);
    onDocumentsChange?.(items);
  }, [localDocuments, onDocumentsChange]);

  const handleDeleteClick = (doc: InvoiceDocument) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    const success = await deleteDocument(documentToDelete.id);
    if (success) {
      await loadDocuments();
    }
    
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleDownload = async (doc: InvoiceDocument) => {
    await downloadDocument(doc.id);
  };

  const handlePreview = async (doc: InvoiceDocument) => {
    setPreviewDocument(doc);
    setPreviewOpen(true);
    const url = await getFilePreviewUrl(doc.id);
    setPreviewUrl(url);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (fileType === 'text/csv') {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType.startsWith("image/")) {
      return <File className="h-4 w-4 text-purple-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const getFileTypeBadge = (fileType: string) => {
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    if (fileType === 'text/csv') return 'CSV';
    if (fileType.includes('xml')) return 'XML';
    if (fileType.startsWith('image/')) return 'Image';
    return 'File';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy • HH:mm');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          Loading documents...
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (localDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No documents attached</h3>
        <p className="text-muted-foreground text-sm">
          Upload supporting documents like invoices, receipts, or contracts to keep everything organized.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <HardDrive className="h-4 w-4" />
          {localDocuments.length} Document{localDocuments.length > 1 ? 's' : ''} Attached
          <span className="text-xs">(drag to reorder)</span>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="documents-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {localDocuments.map((doc, index) => (
                  <Draggable key={doc.id} draggableId={doc.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-4 p-4 border border-border rounded-lg bg-card transition-all",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                        )}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.file_type)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {doc.file_name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getFileTypeBadge(doc.file_type)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(doc.file_size)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(doc.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Uploaded by user
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(doc)}
                            title="Preview document"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc)}
                            title="Download document"
                          >
                            <Download className="h-3 w-3" />
                          </Button>

                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(doc)}
                              title="Delete document"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDocument}
        previewUrl={previewUrl}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? 
              This action cannot be undone and the file will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentList;