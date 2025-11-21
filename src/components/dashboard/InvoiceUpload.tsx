import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/useInvoices";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useInvoiceExtraction } from "@/hooks/useInvoiceExtraction";
import { ExtractionResultsPanel } from "@/components/invoices/ExtractionResultsPanel";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "extracting" | "completed" | "error";
  progress: number;
  type: "invoice" | "po" | "edi" | "csv";
  invoiceId?: string;
  errorMessage?: string;
}

const InvoiceUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedInvoiceForResults, setSelectedInvoiceForResults] = useState<string | null>(null);
  const { toast } = useToast();
  const { createInvoice } = useInvoices();
  const { uploadFile } = useFileUpload();
  const { extractInvoiceData } = useInvoiceExtraction();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = async (file: File, fileId: string) => {
    try {
      // Step 1: Create invoice record
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "uploading", progress: 20 } : f
      ));

      const invoiceData = {
        invoice_number: `INV-${Date.now()}`,
        vendor_name: "Auto-Generated",
        amount: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'pending' as const
      };

      const invoice = await createInvoice(invoiceData);
      
      if (!invoice) {
        throw new Error("Failed to create invoice record");
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, invoiceId: invoice.id, progress: 40 } : f
      ));

      // Step 2: Upload file
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "processing", progress: 50 } : f
      ));

      const document = await uploadFile(file, invoice.id);
      
      if (!document) {
        throw new Error("Failed to upload file");
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 70 } : f
      ));

      // Step 3: Read file content for extraction
      const fileContent = await readFileAsBase64(file);

      // Step 4: Trigger AI extraction
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "extracting", progress: 80 } : f
      ));

      await extractInvoiceData(invoice.id, fileContent);

      // Step 5: Complete
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: "completed", progress: 100 } : f
      ));

      toast({
        title: "Invoice processed successfully",
        description: "AI extraction completed. Click 'View Results' to see extracted data.",
      });

    } catch (error: any) {
      console.error('Error processing file:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: "error", errorMessage: error.message || "Processing failed" } 
          : f
      ));
      
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process invoice",
        variant: "destructive",
      });
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (uploadedFiles: FileList) => {
    const newFiles: UploadedFile[] = Array.from(uploadedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
      type: file.name.includes('.xml') ? 'edi' : 
            file.name.includes('.csv') ? 'csv' :
            file.name.includes('PO') ? 'po' : 'invoice'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Process each file
    Array.from(uploadedFiles).forEach((file, index) => {
      processFile(file, newFiles[index].id);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploading":
        return <Badge variant="processing">Uploading</Badge>;
      case "processing":
        return <Badge variant="pending">Processing</Badge>;
      case "extracting":
        return (
          <Badge variant="pending" className="gap-1">
            <Brain className="h-3 w-3" />
            AI Extracting
          </Badge>
        );
      case "completed":
        return <Badge variant="approved">Complete</Badge>;
      case "error":
        return <Badge variant="rejected">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card-enterprise">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Invoice Upload & Processing
      </h3>
      
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h4 className="text-lg font-medium text-foreground mb-2">
          Upload Invoices & Documents
        </h4>
        <p className="text-muted-foreground mb-4">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports: PDF, Excel, CSV, EDI X12, XML
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.xml,.edi"
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload"
          aria-label="Upload invoice files"
        />
        <label htmlFor="file-upload">
          <Button variant="enterprise" className="cursor-pointer">
            Select Files
          </Button>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-foreground mb-3">
            Processing Queue ({files.length} files)
          </h4>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-3 border border-border rounded-lg"
              >
                {getStatusIcon(file.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </h5>
                    {getStatusBadge(file.status)}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {file.type}
                    </span>
                  </div>
                  {file.status !== "completed" && file.status !== "error" && (
                    <Progress value={file.progress} className="mt-2 h-2" />
                  )}
                  {file.errorMessage && (
                    <p className="text-xs text-destructive mt-1">{file.errorMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "completed" && file.invoiceId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoiceForResults(file.invoiceId!)}
                    >
                      View Results
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    aria-label={`Remove ${file.name}`}
                    disabled={file.status === "uploading" || file.status === "processing" || file.status === "extracting"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extraction Results Panel */}
      {selectedInvoiceForResults && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-foreground">AI Extraction Results</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoiceForResults(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ExtractionResultsPanel invoiceId={selectedInvoiceForResults} />
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;