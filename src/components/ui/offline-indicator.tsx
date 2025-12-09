import { WifiOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function OfflineIndicator() {
  const { isOnline, queueSize, syncing, processQueue } = useOfflineSync();

  if (isOnline && queueSize === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={isOnline ? "default" : "destructive"}>
        <WifiOff className="h-4 w-4" />
        <AlertTitle>{isOnline ? "Syncing Changes" : "You are offline"}</AlertTitle>
        <AlertDescription className="mt-2">
          {isOnline ? (
            <div className="flex items-center justify-between">
              <span>
                {queueSize} operation{queueSize > 1 ? "s" : ""} pending
              </span>
              <Button size="sm" variant="outline" onClick={processQueue} disabled={syncing}>
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync Now"
                )}
              </Button>
            </div>
          ) : (
            <p>Changes will be saved locally and synced when connection is restored.</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
