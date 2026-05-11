import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface ReviewQueueItem {
  id: string;
  invoice_id: string;
  priority: number;
  reason: string;
  confidence_score: number;
  flagged_fields: string[];
  created_at: string;
  invoice: {
    invoice_number: string;
    vendor_name: string;
    amount: number;
    invoice_date: string;
  };
}

interface ApprovalCardProps {
  item: ReviewQueueItem;
  processing: string | null;
  onApprove: (item: ReviewQueueItem) => void;
  onReject: (item: ReviewQueueItem) => void;
}

function getPriorityBadge(priority: number) {
  if (priority === 1) return <Badge variant="destructive">High Priority</Badge>;
  if (priority === 2) return <Badge variant="default">Medium Priority</Badge>;
  return <Badge variant="secondary">Low Priority</Badge>;
}

function getConfidenceColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export const ApprovalCard = memo(function ApprovalCard({
  item, processing, onApprove, onReject,
}: ApprovalCardProps) {
  const isProcessing = processing === item.id;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {item.invoice.vendor_name} &bull; ${item.invoice.amount.toLocaleString()}
            </CardTitle>
            <CardDescription>
              Invoice #{item.invoice.invoice_number} &bull;{' '}
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          {getPriorityBadge(item.priority)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Review Reason</p>
            <p className="text-sm text-muted-foreground">{item.reason}</p>
          </div>
        </div>
        {item.confidence_score > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Confidence Score:{' '}
              <span className={getConfidenceColor(item.confidence_score)}>
                {item.confidence_score.toFixed(1)}%
              </span>
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${item.confidence_score}%` }}
              />
            </div>
          </div>
        )}
        {item.flagged_fields.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Flagged Fields</p>
            <div className="flex flex-wrap gap-2">
              {item.flagged_fields.map(field => (
                <Badge key={field} variant="outline">{field}</Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => onApprove(item)}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReject(item)}
            disabled={isProcessing}
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />Reject
          </Button>
          <Button variant="outline" asChild>
            <a href={`/invoices?id=${item.invoice_id}`}>View Details</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
