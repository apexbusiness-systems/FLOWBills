import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RotateCw, 
  Maximize2, 
  X,
  FileText,
  Loader2
} from "lucide-react";
import { InvoiceDocument } from "@/hooks/useFileUpload";

interface DocumentPreviewDialogProps {
  document: InvoiceDocument | null;
  previewUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: InvoiceDocument) => void;
}

const DocumentPreviewDialog = ({
  document,
  previewUrl,
  open,
  onOpenChange,
  onDownload,
}: DocumentPreviewDialogProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reset state when document changes
  useEffect(() => {
    if (document) {
      setZoom(100);
      setRotation(0);
      setLoading(true);
    }
  }, [document?.id]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const isImage = document?.file_type?.startsWith("image/");
  const isPdf = document?.file_type === "application/pdf";
  const canPreviewInline = isImage || isPdf;

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-semibold truncate max-w-md">
                {document.file_name}
              </DialogTitle>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              {canPreviewInline && (
                <>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleZoomOut}
                      disabled={zoom <= 25}
                      className="h-8 w-8 p-0"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 min-w-[50px] text-center">
                      {zoom}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleZoomIn}
                      disabled={zoom >= 300}
                      className="h-8 w-8 p-0"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isImage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRotate}
                      className="h-8 w-8 p-0"
                      title="Rotate 90°"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetView}
                    className="h-8"
                    title="Reset view"
                  >
                    Reset
                  </Button>
                </>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInNewTab}
                className="h-8 w-8 p-0"
                title="Open in new tab"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="default"
                onClick={() => onDownload(document)}
                className="h-8 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-muted/50 relative">
          {loading && previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading preview...</span>
              </div>
            </div>
          )}
          
          {previewUrl ? (
            <div className="flex items-center justify-center min-h-full p-4">
              {isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[70vh] rounded-lg border border-border bg-white"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                  }}
                  onLoad={() => setLoading(false)}
                  title={document.file_name}
                />
              ) : isImage ? (
                <img
                  src={previewUrl}
                  alt={document.file_name}
                  className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-24 w-24 text-muted-foreground mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Preview not available
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    This file type ({document.file_type}) cannot be previewed inline.
                    Download the file to view its contents.
                  </p>
                  <Button onClick={() => onDownload(document)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading document...</p>
            </div>
          )}
        </div>

        {/* Footer with file info */}
        <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Type: {document.file_type} • Size: {formatFileSize(document.file_size)}
          </span>
          <span>
            Uploaded: {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default DocumentPreviewDialog;
