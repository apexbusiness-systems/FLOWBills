import { FileText, CheckCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActivityWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

const activities = [
  {
    id: 1,
    type: 'invoice_received',
    title: 'Invoice INV-2024-0847 received',
    description: 'Husky Energy - $45,250.00',
    timestamp: '2 minutes ago',
    status: 'processing',
    icon: FileText,
  },
  {
    id: 2,
    type: 'payment_approved',
    title: 'Payment batch PB-240315 approved',
    description: '15 invoices - $127,830.45 total',
    timestamp: '1 hour ago',
    status: 'approved',
    icon: CheckCircle,
  },
  {
    id: 3,
    type: 'matching_issue',
    title: 'PO matching failed',
    description: 'Invoice INV-2024-0845 - No matching PO found',
    timestamp: '3 hours ago',
    status: 'rejected',
    icon: AlertTriangle,
  },
];

export const ActivityWidget = ({ size = 'medium' }: ActivityWidgetProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="status-processing">Processing</Badge>;
      case 'approved':
        return <Badge className="status-approved">Completed</Badge>;
      case 'rejected':
        return <Badge className="status-rejected">Attention</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const itemsToShow = size === 'large' ? 5 : 3;

  return (
    <Card 
      className={cn(
        'card-enterprise',
        size === 'large' && 'col-span-full'
      )}
      data-tour="activity-widget"
    >
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.slice(0, itemsToShow).map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {activity.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        <Button variant="ghost" size="sm" className="w-full">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
};
