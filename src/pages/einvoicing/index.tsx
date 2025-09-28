import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function EInvoicing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an XML file",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    setUploading(true);
    
    try {
      const xmlContent = await file.text();
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Detect format based on content
      let format = 'bis30';
      if (xmlContent.includes('CrossIndustryInvoice')) format = 'xrechnung';
      else if (xmlContent.includes('CrossIndustryDocument')) format = 'facturx';
      
      // Store document
      const { error } = await supabase
        .from('einvoice_documents')
        .insert({
          document_id: documentId,
          format: format as 'bis30' | 'xrechnung' | 'facturx',
          xml_content: xmlContent,
          status: 'pending' as const,
          tenant_id: user?.id || ''
        });
        
      if (error) throw error;
      
      toast({
        title: "Document uploaded",
        description: "E-Invoice document uploaded successfully"
      });
      
      await fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const validateDocument = async (documentId: string, format: string, xmlContent: string) => {
    setValidating(true);
    try {
      const { error } = await supabase.functions.invoke('einvoice_validate', {
        body: {
          document_id: documentId,
          xml_content: xmlContent,
          format,
          tenant_id: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Validation completed",
        description: "Document validation completed"
      });
      
      await fetchDocuments();
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation failed",
        description: "Failed to validate document",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const sendDocument = async (documentId: string) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('einvoice_send', {
        body: {
          document_id: documentId,
          sender_participant_id: '0088:1234567890123',
          receiver_participant_id: '0088:0987654321098',
          tenant_id: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Document sent",
        description: "E-Invoice sent via Peppol network"
      });
      
      await fetchDocuments();
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: "Send failed", 
        description: "Failed to send document",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('einvoice_documents')
        .select('*')
        .eq('tenant_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">E-Invoicing</h1>
        <p className="text-muted-foreground">Upload, validate, and send electronic invoices via Peppol network</p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload E-Invoice
            </CardTitle>
            <CardDescription>
              Support for BIS 3.0, XRechnung, Factur-X, and EN 16931 formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload XML file'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Supports BIS 3.0, XRechnung, Factur-X formats
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>E-Invoice Documents</CardTitle>
            <CardDescription>Manage your electronic invoice documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium">{doc.document_id}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{doc.format.toUpperCase()}</Badge>
                        <span>•</span>
                        <span>{doc.total_amount ? `${doc.total_amount} ${doc.currency}` : 'No amount'}</span>
                        <span>•</span>
                        <span>Confidence: {doc.confidence_score}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => validateDocument(doc.document_id, doc.format, doc.xml_content)}
                        disabled={validating}
                      >
                        {validating ? 'Validating...' : 'Validate'}
                      </Button>
                    )}
                    {doc.status === 'validated' && (
                      <Button
                        size="sm"
                        onClick={() => sendDocument(doc.document_id)}
                        disabled={sending}
                      >
                        {sending ? 'Sending...' : 'Send via AP'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}