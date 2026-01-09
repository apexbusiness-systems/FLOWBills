import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ApiErrorBoundaryProps {
  error: Error;
}

/**
 * Renders a user-friendly error screen when the API/Supabase is unreachable.
 * Provides retry functionality and prevents infinite spinner.
 */
export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({ error }) => {
  const isApiError = error.message.includes('API unreachable') ||
                     error.message.includes('Supabase unavailable') ||
                     error.message.includes('Network Error') ||
                     error.name === 'ApiError';

  if (!isApiError) {
    // Re-throw if it's not an API error
    throw error;
  }

  const handleRetry = () => {
    // Force page reload to retry the API check
    window.location.reload();
  };

  const handleHardReload = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name))).then(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-500/10 rounded-full w-fit">
            <WifiOff className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle>Service Unavailable</CardTitle>
          <CardDescription>
            Our servers are temporarily unreachable. This may be due to network issues or maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Connection Details:</p>
            <pre className="text-xs whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What to try:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Try the retry button below</li>
              <li>If the problem persists, try the hard reload option</li>
              <li>Contact support if issues continue</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRetry}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            <Button
              onClick={handleHardReload}
              variant="outline"
              className="flex-1"
            >
              Hard Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};