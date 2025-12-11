import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InvoiceExtraction {
  id: string;
  invoice_id: string;
  user_id: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  afe_number: string | null;
  afe_id: string | null;
  uwi: string | null;
  uwi_id: string | null;
  field_ticket_refs: string[] | null;
  po_number: string | null;
  service_period_start: string | null;
  service_period_end: string | null;
  line_items: any[];
  extracted_data: any;
  confidence_scores: any;
  validation_results: any;
  budget_status: 'within_budget' | 'over_budget' | 'afe_not_found' | 'no_afe' | null;
  budget_remaining: number | null;
  validation_errors: string[] | null;
  validation_warnings: string[] | null;
  extracted_at: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractionResult {
  success: boolean;
  extraction_id?: string;
  extracted_data?: any;
  budget_status?: string;
  budget_remaining?: number | null;
  validation_errors?: string[];
  validation_warnings?: string[];
  error?: string;
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result); // Returns data URL format
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useInvoiceExtraction = () => {
  const [extracting, setExtracting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const extractInvoiceData = useCallback(async (
    invoiceId: string, 
    fileContent: string | File
  ): Promise<ExtractionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setExtracting(true);
    try {
      // Convert File to base64 if needed
      let content: string;
      let fileType: string | undefined;
      
      if (fileContent instanceof File) {
        content = await fileToBase64(fileContent);
        fileType = fileContent.type;
      } else {
        content = fileContent;
      }

      const { data, error } = await supabase.functions.invoke('invoice-extract', {
        body: {
          invoice_id: invoiceId,
          file_content: content,
          file_type: fileType
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Extraction failed');
      }

      const hasErrors = data.validation_errors?.length > 0;
      const hasWarnings = data.validation_warnings?.length > 0;

      toast({
        title: hasErrors ? "Extraction Complete (with errors)" : "Extraction Complete",
        description: hasErrors 
          ? `Found ${data.validation_errors.length} validation error(s)` 
          : hasWarnings 
            ? `Extracted with ${data.validation_warnings.length} warning(s)`
            : "Invoice data extracted and validated successfully",
        variant: hasErrors ? "destructive" : "default",
      });

      return data as ExtractionResult;
    } catch (error: any) {
      console.error('Error extracting invoice:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to extract invoice data",
        variant: "destructive",
      });
      throw error;
    } finally {
      setExtracting(false);
    }
  }, [user, toast]);

  const getExtractionByInvoiceId = useCallback(async (invoiceId: string): Promise<InvoiceExtraction | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('invoice_extractions')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as InvoiceExtraction;
    } catch (error) {
      console.error('Error fetching extraction:', error);
      return null;
    }
  }, [user]);

  return {
    extracting,
    extractInvoiceData,
    getExtractionByInvoiceId,
  };
};
