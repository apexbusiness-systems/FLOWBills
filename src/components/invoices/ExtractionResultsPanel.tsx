import { useEffect, useState } from "react";
import { useInvoiceExtraction } from "@/hooks/useInvoiceExtraction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExtractionResultsPanelProps {
  invoiceId: string;
}

export const ExtractionResultsPanel = ({ invoiceId }: ExtractionResultsPanelProps) => {
  const { getExtractionByInvoiceId } = useInvoiceExtraction();
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExtraction = async () => {
      setLoading(true);
      const data = await getExtractionByInvoiceId(invoiceId);
      setExtraction(data);
      setLoading(false);
    };

    fetchExtraction();
  }, [invoiceId, getExtractionByInvoiceId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!extraction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Extraction</CardTitle>
          <CardDescription>No extraction data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case "within_budget":
        return "bg-green-500";
      case "over_budget":
        return "bg-red-500";
      case "afe_not_found":
        return "bg-yellow-500";
      case "no_afe":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getBudgetStatusLabel = (status: string) => {
    switch (status) {
      case "within_budget":
        return "Within Budget";
      case "over_budget":
        return "Over Budget";
      case "afe_not_found":
        return "AFE Not Found";
      case "no_afe":
        return "No AFE";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Extraction Results
          </CardTitle>
          <CardDescription>Automatically extracted data and validation status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Extraction Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Extraction Status</span>
            <Badge variant={extraction.extraction_status === "completed" ? "default" : "secondary"}>
              {extraction.extraction_status}
            </Badge>
          </div>

          {/* Budget Status */}
          {extraction.budget_status && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Budget Status</span>
              <Badge className={getBudgetStatusColor(extraction.budget_status)}>
                {getBudgetStatusLabel(extraction.budget_status)}
              </Badge>
            </div>
          )}

          {/* Extracted Fields */}
          <div className="grid grid-cols-2 gap-4">
            {extraction.afe_number && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AFE Number</p>
                <p className="text-sm font-medium">{extraction.afe_number}</p>
                {extraction.confidence_scores?.afe_number && (
                  <p className="text-xs text-muted-foreground">
                    Confidence: {(extraction.confidence_scores.afe_number * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {extraction.uwi && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">UWI</p>
                <p className="text-sm font-medium">{extraction.uwi}</p>
                {extraction.confidence_scores?.uwi && (
                  <p className="text-xs text-muted-foreground">
                    Confidence: {(extraction.confidence_scores.uwi * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {extraction.po_number && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">PO Number</p>
                <p className="text-sm font-medium">{extraction.po_number}</p>
              </div>
            )}

            {extraction.budget_remaining !== null && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Budget Remaining</p>
                <p
                  className={`text-sm font-medium flex items-center gap-1 ${extraction.budget_remaining < 0 ? "text-destructive" : ""}`}
                >
                  <TrendingUp className="w-3 h-3" />${extraction.budget_remaining.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Field Tickets */}
          {extraction.field_ticket_refs && extraction.field_ticket_refs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Field Ticket References</p>
              <div className="flex flex-wrap gap-2">
                {extraction.field_ticket_refs.map((ticket: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {ticket}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Service Period */}
          {(extraction.service_period_start || extraction.service_period_end) && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Service Period</p>
              <p className="text-sm font-medium">
                {extraction.service_period_start} → {extraction.service_period_end}
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {extraction.validation_errors && extraction.validation_errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {extraction.validation_errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {extraction.validation_warnings && extraction.validation_warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {extraction.validation_warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-sm">
                      {warning}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {extraction.extraction_status === "completed" &&
            (!extraction.validation_errors || extraction.validation_errors.length === 0) && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Invoice data extracted and validated successfully
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>
    </div>
  );
};
