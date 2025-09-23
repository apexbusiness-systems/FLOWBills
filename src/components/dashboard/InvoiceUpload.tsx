import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  type: "invoice" | "po" | "edi" | "csv";
}

const InvoiceUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const simulateFileProcessing = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: "completed", progress: 100 }
            : f
        ));
        toast({
          title: "File processed successfully",
          description: "Invoice has been validated and added to the processing queue.",
        });
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress, status: progress < 50 ? "uploading" : "processing" }
            : f
        ));
      }
    }, 500);
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
    
    // Simulate file processing
    newFiles.forEach(file => {
      setTimeout(() => simulateFileProcessing(file.id), 100);
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;