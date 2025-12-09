import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceDocument {
  id: string;
  invoice_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<InvoiceDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFile = useCallback(
    async (file: File, invoiceId?: string) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to upload files",
          variant: "destructive",
        });
        return null;
      }

      try {
        setUploading(true);

        // Generate unique file path
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${invoiceId || "temp"}/${timestamp}_${sanitizedFileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("invoice-documents")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Create database record
        const { data: document, error: dbError } = await supabase
          .from("invoice_documents")
          .insert({
            invoice_id: invoiceId || null,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage.from("invoice-documents").remove([uploadData.path]);

          throw new Error(`Database error: ${dbError.message}`);
        }

        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded successfully`,
        });

        return document as InvoiceDocument;
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, toast]
  );

  const fetchDocuments = useCallback(
    async (invoiceId?: string) => {
      if (!user) return;

      try {
        let query = supabase
          .from("invoice_documents")
          .select("*")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false });

        if (invoiceId) {
          query = query.eq("invoice_id", invoiceId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setDocuments(data as InvoiceDocument[]);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user) return false;

      try {
        // Get document details first
        const { data: document, error: fetchError } = await supabase
          .from("invoice_documents")
          .select("file_path")
          .eq("id", documentId)
          .eq("uploaded_by", user.id)
          .single();

        if (fetchError || !document) {
          throw new Error("Document not found");
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from("invoice-documents")
          .remove([document.file_path]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from("invoice_documents")
          .delete()
          .eq("id", documentId)
          .eq("uploaded_by", user.id);

        if (dbError) {
          throw dbError;
        }

        toast({
          title: "Document Deleted",
          description: "Document has been deleted successfully",
        });

        return true;
      } catch (error: any) {
        console.error("Delete error:", error);
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete document",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast]
  );

  const getDocuments = useCallback(
    async (invoiceId?: string) => {
      return fetchDocuments(invoiceId);
    },
    [fetchDocuments]
  );

  const downloadDocument = useCallback(
    async (documentId: string) => {
      if (!user) return null;

      try {
        // Get document details
        const { data: document, error: fetchError } = await supabase
          .from("invoice_documents")
          .select("file_path, file_name")
          .eq("id", documentId)
          .eq("uploaded_by", user.id)
          .single();

        if (fetchError || !document) {
          throw new Error("Document not found");
        }

        // Get signed URL for download
        const { data: urlData, error: urlError } = await supabase.storage
          .from("invoice-documents")
          .createSignedUrl(document.file_path, 60); // 60 seconds expiry

        if (urlError || !urlData) {
          throw new Error("Failed to generate download URL");
        }

        // Trigger download
        const anchor = window.document.createElement("a");
        anchor.href = urlData.signedUrl;
        anchor.download = document.file_name;
        window.document.body.appendChild(anchor);
        anchor.click();
        window.document.body.removeChild(anchor);

        return urlData.signedUrl;
      } catch (error: any) {
        console.error("Download error:", error);
        toast({
          title: "Download Failed",
          description: error.message || "Failed to download document",
          variant: "destructive",
        });
        return null;
      }
    },
    [user, toast]
  );

  const getFilePreviewUrl = useCallback(
    async (documentId: string) => {
      if (!user) return "/placeholder.svg";

      try {
        // Get document details
        const { data: document, error: fetchError } = await supabase
          .from("invoice_documents")
          .select("file_path")
          .eq("id", documentId)
          .eq("uploaded_by", user.id)
          .single();

        if (fetchError || !document) {
          return "/placeholder.svg";
        }

        // Get signed URL for preview
        const { data: urlData, error: urlError } = await supabase.storage
          .from("invoice-documents")
          .createSignedUrl(document.file_path, 3600); // 1 hour expiry

        if (urlError || !urlData) {
          return "/placeholder.svg";
        }

        return urlData.signedUrl;
      } catch (error) {
        console.error("Preview URL error:", error);
        return "/placeholder.svg";
      }
    },
    [user]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[], invoiceId?: string) => {
      if (!user) return [];

      setUploading(true);
      const results: (InvoiceDocument | null)[] = [];

      try {
        for (const file of files) {
          // Initialize progress tracking
          setUploadProgress((prev) => [...prev, { fileName: file.name, progress: 0 }]);

          // Update progress to show start
          setUploadProgress((prev) =>
            prev.map((p) => (p.fileName === file.name ? { ...p, progress: 30 } : p))
          );

          // Upload file
          const result = await uploadFile(file, invoiceId);

          // Update progress to complete
          setUploadProgress((prev) =>
            prev.map((p) => (p.fileName === file.name ? { ...p, progress: 100 } : p))
          );

          results.push(result);
        }

        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress([]);
        }, 1000);
      } catch (error) {
        console.error("Multi-upload error:", error);
      } finally {
        setUploading(false);
      }

      return results.filter(Boolean) as InvoiceDocument[];
    },
    [user, uploadFile]
  );

  return {
    uploading,
    documents,
    uploadProgress,
    uploadFile,
    fetchDocuments,
    deleteDocument,
    getDocuments,
    downloadDocument,
    getFilePreviewUrl,
    uploadMultipleFiles,
  };
};
