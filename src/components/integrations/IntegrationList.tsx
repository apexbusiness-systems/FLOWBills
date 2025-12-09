import {
  Database,
  FileText,
  Network,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Integration } from "@/hooks/useIntegrations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IntegrationListProps {
  integrations: Integration[];
  loading: boolean;
  onTest: (integrationId: string) => Promise<void>;
  onSync: (integrationId: string) => Promise<void>;
  onToggleStatus: (integration: Integration) => Promise<void>;
  onDelete: (integrationId: string) => Promise<void>;
}

const IntegrationList = ({
  integrations,
  loading,
  onTest,
  onSync,
  onToggleStatus,
  onDelete,
}: IntegrationListProps) => {
  const getIntegrationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "portal access":
        return Network;
      case "erp integration":
        return Database;
      case "electronic data interchange":
        return FileText;
      default:
        return Database;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "processing":
        return <Clock className="h-4 w-4 text-status-processing" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="status-approved">Connected</Badge>;
      case "processing":
        return <Badge className="status-processing">Processing</Badge>;
      case "error":
        return <Badge className="status-rejected">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return "Never";

    const now = new Date();
    const syncTime = new Date(lastSyncAt);
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Integrations Found</h3>
        <p className="text-muted-foreground">
          Get started by adding your first NOV or system integration
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {integrations.map((integration) => {
        const Icon = getIntegrationIcon(integration.integration_type);

        return (
          <Card key={integration.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {integration.integration_name}
                    </h3>
                    {getStatusIcon(integration.status)}
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    {integration.integration_type}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Last sync: {formatLastSync(integration.last_sync)}</span>
                    <span>Type: {integration.integration_type}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(integration.status)}

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTest(integration.id)}
                    disabled={integration.status === "processing"}
                    className="gap-2"
                  >
                    <Settings className="h-3 w-3" />
                    Test
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSync(integration.id)}
                    disabled={
                      integration.status === "processing" || integration.status === "disconnected"
                    }
                    className="gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sync
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleStatus(integration)}
                    disabled={integration.status === "processing"}
                    className="gap-2"
                  >
                    {integration.status === "connected" ? (
                      <>
                        <Pause className="h-3 w-3" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Connect
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{integration.integration_name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(integration.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default IntegrationList;
