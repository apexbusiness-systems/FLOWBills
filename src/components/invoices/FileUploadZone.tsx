import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  X, 
  AlertCircle, 
  CheckCircle,
  File,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload, UploadProgress } from '@/hooks/useFileUpload';
import { validateFile } from '@/lib/security';

interface FileUploadZoneProps {
  invoiceId?: string;
  onUploadComplete?: (documents: any[]) => void;
  disabled?: boolean;
  className?: string;
}

interface FileWithId extends File {
  id: string;
}

const FileUploadZone = ({ 
  invoiceId, 
  onUploadComplete, 
  disabled = false, 
  className 
}: FileUploadZoneProps) => {
  const [pendingFiles, setPendingFiles] = useState<FileWithId[]>([]);
  const { uploading, uploadProgress, uploadMultipleFiles } = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!invoiceId) return;

    // Add IDs to files for tracking
    const filesWithIds: FileWithId[] = acceptedFiles.map(file => 
      Object.assign(file, { id: `${Date.now()}-${Math.random()}` })
    );

    setPendingFiles(filesWithIds);
  }, [invoiceId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || !invoiceId || uploading,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10
  });

  const handleUpload = async () => {
    if (!invoiceId || pendingFiles.length === 0) return;

    try {
      const results = await uploadMultipleFiles(pendingFiles, invoiceId);
      
      if (results.length > 0) {
        onUploadComplete?.(results);
        setPendingFiles([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const removeFile = (fileId: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) 
      return <FileText className="h-4 w-4 text-green-500" />;
    if (file.type === 'text/csv') return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileValidation = (file: File) => {
    return validateFile(file);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled || !invoiceId ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isDragActive ? 'Drop files here' : 'Upload Invoice Documents'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, Excel, CSV, XML • Max 20MB per file • Up to 10 files
            </p>
          </div>

          {!disabled && invoiceId && (
            <Button variant="outline" size="sm" type="button">
              <Upload className="mr-2 h-4 w-4" />
              Select Files
            </Button>
          )}
        </div>
      </div>

      {/* Pending Files List */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Files to Upload</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading || !invoiceId}
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {pendingFiles.map((file) => {
              const validation = getFileValidation(file);
              const progress = uploadProgress[file.id];
              
              return (
                <div 
                  key={file.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
                >
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </span>
                      {!validation.valid && (
                        <Badge variant="destructive" className="text-xs">
                          Invalid
                        </Badge>
                      )}
                      {progress && (
                        <Badge 
                          variant={
                            progress.status === 'completed' ? 'default' :
                            progress.status === 'error' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {progress.status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type || 'Unknown type'}</span>
                    </div>

                    {!validation.valid && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {validation.error}
                      </div>
                    )}

                    {progress && progress.status === 'uploading' && (
                      <Progress value={progress.progress} className="mt-2 h-1" />
                    )}

                    {progress && progress.status === 'error' && progress.error && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {progress.error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {progress?.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {progress?.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    {!progress && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;