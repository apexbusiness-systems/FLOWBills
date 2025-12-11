import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInvoiceExtraction, ExtractionResult } from '@/hooks/useInvoiceExtraction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  invoiceId: string;
  fileName: string;
  status: 'uploading' | 'extracting' | 'completed' | 'failed';
  extraction?: ExtractionResult;
  error?: string;
  duration?: number;
}

export default function ExtractionTestPage() {
  const { user } = useAuth();
  const { extractInvoiceData, extracting } = useInvoiceExtraction();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File): Promise<TestResult> => {
    const startTime = Date.now();
    const result: TestResult = {
      invoiceId: '',
      fileName: file.name,
      status: 'uploading'
    };

    try {
      // Create invoice record first
      const { data: invoice, error: createError } = await supabase
        .from('invoices')
        .insert({
          user_id: user!.id,
          invoice_number: `TEST-${Date.now()}`,
          vendor_name: 'Pending Extraction',
          amount: 0,
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'processing',
          file_name: file.name
        })
        .select()
        .single();

      if (createError) throw createError;
      result.invoiceId = invoice.id;

      // Upload file to storage
      const filePath = `${user!.id}/${invoice.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('invoice-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.warn('Storage upload failed (may not exist):', uploadError);
      }

      // Update status to extracting
      result.status = 'extracting';
      setTestResults(prev => prev.map(r => r.fileName === file.name ? { ...result } : r));

      // Run extraction
      const extraction = await extractInvoiceData(invoice.id, file);
      
      result.status = 'completed';
      result.extraction = extraction;
      result.duration = Date.now() - startTime;

    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      result.duration = Date.now() - startTime;
    }

    return result;
  }, [user, extractInvoiceData]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Please sign in to test extraction');
      return;
    }

    setIsProcessing(true);
    
    // Add placeholder results
    const placeholders: TestResult[] = acceptedFiles.map(f => ({
      invoiceId: '',
      fileName: f.name,
      status: 'uploading'
    }));
    setTestResults(prev => [...placeholders, ...prev]);

    // Process files sequentially to avoid rate limits
    for (const file of acceptedFiles) {
      const result = await processFile(file);
      setTestResults(prev => prev.map(r => r.fileName === file.name ? result : r));
    }

    setIsProcessing(false);
  }, [user, processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    },
    disabled: isProcessing
  });

  const clearResults = () => setTestResults([]);

  const retryExtraction = async (result: TestResult) => {
    if (!result.invoiceId) return;
    
    setTestResults(prev => prev.map(r => 
      r.invoiceId === result.invoiceId ? { ...r, status: 'extracting' as const } : r
    ));

    try {
      // For retry, we'd need the original file - skip for now
      toast.info('Re-extraction requires re-uploading the file');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'uploading':
      case 'extracting':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoice Extraction Test Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Upload invoice images or PDFs to test AI-powered data extraction
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Test Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop files here...</p>
              ) : (
                <>
                  <p className="font-medium">Drag & drop invoice files here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to select (PNG, JPG, PDF)
                  </p>
                </>
              )}
            </div>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing documents...
                </div>
                <Progress className="mt-2" value={undefined} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{testResults.length}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.filter(r => r.extraction?.validation_warnings?.length).length}
                </div>
                <div className="text-sm text-muted-foreground">With Warnings</div>
              </div>
            </div>

            {testResults.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={clearResults}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Extraction Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {testResults.map((result, idx) => (
                  <div 
                    key={`${result.fileName}-${idx}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.fileName}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.duration && `${(result.duration / 1000).toFixed(1)}s`}
                            {result.invoiceId && ` • ID: ${result.invoiceId.slice(0, 8)}...`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        result.status === 'completed' ? 'default' :
                        result.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {result.status}
                      </Badge>
                    </div>

                    {result.error && (
                      <div className="mt-3 p-3 bg-destructive/10 rounded text-sm text-destructive">
                        {result.error}
                      </div>
                    )}

                    {result.extraction?.extracted_data && (
                      <>
                        <Separator className="my-3" />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                          {result.extraction.extracted_data.vendor_name && (
                            <div>
                              <span className="text-muted-foreground">Vendor:</span>{' '}
                              <span className="font-medium">{result.extraction.extracted_data.vendor_name}</span>
                            </div>
                          )}
                          {result.extraction.extracted_data.invoice_number && (
                            <div>
                              <span className="text-muted-foreground">Invoice #:</span>{' '}
                              <span className="font-medium">{result.extraction.extracted_data.invoice_number}</span>
                            </div>
                          )}
                          {result.extraction.extracted_data.amount && (
                            <div>
                              <span className="text-muted-foreground">Amount:</span>{' '}
                              <span className="font-medium">
                                ${result.extraction.extracted_data.amount.toLocaleString()} {result.extraction.extracted_data.currency || 'CAD'}
                              </span>
                            </div>
                          )}
                          {result.extraction.extracted_data.afe_number && (
                            <div>
                              <span className="text-muted-foreground">AFE:</span>{' '}
                              <span className="font-medium">{result.extraction.extracted_data.afe_number}</span>
                            </div>
                          )}
                          {result.extraction.extracted_data.uwi && (
                            <div>
                              <span className="text-muted-foreground">UWI:</span>{' '}
                              <span className="font-medium font-mono text-xs">{result.extraction.extracted_data.uwi}</span>
                            </div>
                          )}
                          {result.extraction.extracted_data.po_number && (
                            <div>
                              <span className="text-muted-foreground">PO:</span>{' '}
                              <span className="font-medium">{result.extraction.extracted_data.po_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Confidence Scores */}
                        {result.extraction.extracted_data.confidence_scores && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(result.extraction.extracted_data.confidence_scores).map(([key, value]) => (
                              <Badge 
                                key={key} 
                                variant="outline"
                                className={getConfidenceColor(value as number)}
                              >
                                {key}: {((value as number) * 100).toFixed(0)}%
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Validation Results */}
                        {(result.extraction.validation_errors?.length || result.extraction.validation_warnings?.length) && (
                          <div className="mt-3 space-y-2">
                            {result.extraction.validation_errors?.map((err, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {err}
                              </div>
                            ))}
                            {result.extraction.validation_warnings?.map((warn, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                {warn}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Budget Status */}
                        {result.extraction.budget_status && result.extraction.budget_status !== 'no_afe' && (
                          <div className="mt-3">
                            <Badge variant={
                              result.extraction.budget_status === 'within_budget' ? 'default' :
                              result.extraction.budget_status === 'over_budget' ? 'destructive' : 'secondary'
                            }>
                              Budget: {result.extraction.budget_status.replace('_', ' ')}
                              {result.extraction.budget_remaining !== null && 
                                ` ($${result.extraction.budget_remaining.toLocaleString()} remaining)`
                              }
                            </Badge>
                          </div>
                        )}

                        {/* Line Items */}
                        {result.extraction.extracted_data.line_items?.length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                              {result.extraction.extracted_data.line_items.length} line item(s)
                            </summary>
                            <div className="mt-2 text-xs bg-muted rounded p-2 overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-left text-muted-foreground">
                                    <th className="pb-1">Description</th>
                                    <th className="pb-1">Qty</th>
                                    <th className="pb-1">Price</th>
                                    <th className="pb-1">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.extraction.extracted_data.line_items.map((item: any, i: number) => (
                                    <tr key={i}>
                                      <td className="py-1">{item.description}</td>
                                      <td>{item.quantity}</td>
                                      <td>${item.unit_price}</td>
                                      <td>${item.amount}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
