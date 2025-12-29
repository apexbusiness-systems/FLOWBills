import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigErrorBoundaryProps {
  error: Error;
}

/**
 * Renders a fatal configuration error screen when required env vars are missing.
 * This prevents blank white screen and provides actionable feedback.
 */
export const ConfigErrorBoundary: React.FC<ConfigErrorBoundaryProps> = ({ error }) => {
  const isConfigError = error.message.includes('Missing required') || 
                       error.message.includes('environment variables') ||
                       error.message.includes('FATAL');

  if (!isConfigError) {
    // Re-throw if it's not a config error
    throw error;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Configuration Error</CardTitle>
          <CardDescription>
            The application is missing required configuration. This is a deployment issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Error Details:</p>
            <pre className="text-xs whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">How to Fix:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Ensure <code className="bg-background px-1 rounded">VITE_SUPABASE_URL</code> is set in your environment</li>
              <li>Ensure <code className="bg-background px-1 rounded">VITE_SUPABASE_ANON_KEY</code> is set in your environment</li>
              <li>For Vite builds, these must be available at <strong>build time</strong> (not runtime)</li>
              <li>Check your deployment platform's environment variable configuration</li>
              <li>Verify your <code className="bg-background px-1 rounded">.env</code> file (if using local development)</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

