import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadWidgetProps {
  size?: 'small' | 'medium' | 'large';
  onUploadClick?: () => void;
}

export const UploadWidget = ({ size = 'medium', onUploadClick }: UploadWidgetProps) => {
  return (
    <Card className={cn(
      'card-enterprise',
      size === 'large' && 'col-span-full md:col-span-2'
    )}>
      <CardHeader>
        <CardTitle className="text-lg">Quick Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground mb-2">
            Drop invoices here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports PDF, PNG, JPG • Max 10MB per file
          </p>
          <Button size="sm" onClick={onUploadClick}>
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            Select Files
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <FolderOpen className="h-4 w-4 mr-2" aria-hidden="true" />
            Batch Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
