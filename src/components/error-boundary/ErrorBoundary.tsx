import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount(): void {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a config error that should show ConfigErrorBoundary
    const isConfigError = error.message.includes('Missing required') || 
                         error.message.includes('FATAL') ||
                         error.message.includes('environment variables');
    
    if (isConfigError && import.meta.env.DEV) {
      console.error('[ErrorBoundary] Config error detected - should be handled by ConfigErrorBoundary');
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('============================================');
    console.error('[FlowBills ErrorBoundary] Caught an error!');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('URL:', window.location.href);
    console.error('User agent:', navigator.userAgent);
    console.error('============================================');

    // Store error in localStorage for debugging
    try {
      const errorReport = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      const existingErrors = JSON.parse(localStorage.getItem('error_boundary_logs') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('error_boundary_logs', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.error('Failed to store error in localStorage:', storageError);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGlobalError = (event: ErrorEvent) => {
    if (this.state.hasError) return;
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    this.setState({ hasError: true, error });
  };

  handleGlobalRejection = (event: PromiseRejectionEvent) => {
    if (this.state.hasError) return;
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.setState({ hasError: true, error });
  };

  handleClearSiteData = async () => {
    const clearSiteData = (window as any).flowbillsClearSiteData as (() => Promise<void>) | undefined;
    if (clearSiteData) {
      await clearSiteData();
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('[FlowBills] Clear site data failed:', error);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const bootStage = window.__FLOWBILLS_BOOT__?.stage ?? 'unknown';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Error code: APP_ERROR_BOUNDARY · Stage: {bootStage}
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              <Button
                onClick={this.handleClearSiteData}
                variant="secondary"
                className="w-full"
              >
                Clear Site Data
              </Button>
              <p className="text-xs text-muted-foreground">
                Clearing site data removes cached assets and local storage. You may need to sign in again.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
